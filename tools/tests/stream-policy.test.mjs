import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';import vm from 'node:vm';
const require=createRequire(import.meta.url),policy=require('../../service/vendor/torrent-stream/lib/stream-policy.cjs');
const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs',import.meta.url),'utf8');
function peer(speed,pieces={10:true}){return {downloadSpeed:()=>speed,requests:[],peerPieces:pieces,peerChoking:false};}
test('pipeline adapts to throughput and remains bounded',()=>{assert.equal(policy.pipeline(0),5);assert.equal(policy.pipeline(16384),5);assert.equal(policy.pipeline(131072),26);assert.equal(policy.pipeline(1e9),250);assert.equal(policy.pipeline(Infinity),5);assert.equal(policy.pipeline(1e9,40),40,'peer reqq is honoured');assert.equal(policy.pipeline(16384,0),5,'invalid reqq ignored');});
test('a peer with a long round trip can grow its queue instead of staying at the rate its queue allows',()=>{
 // Throughput limited by the queue: speed = blocks * 16 KiB / rtt. Iterate the policy as the engine does.
 for(const rtt of [0.3,1,2.5]){let blocks=policy.pipeline(0);for(let i=0;i<20;i++)blocks=policy.pipeline(blocks*16384/rtt);assert.ok(blocks>=40,'rtt '+rtt+'s grew to '+blocks);}
});
test('critical recovery waits, chooses a faster eligible peer, and rejects redundant retries',()=>{
 const old=peer(4096),fast=peer(131072),request={wire:old,index:10,offset:0,at:0};
 assert.equal(policy.recovery([request],[old,fast],{10:true},1000),null);
 assert.equal(policy.recovery([request],[old,fast],{},20000),null);
 assert.equal(policy.recovery([request],[old,fast],{10:true},20000).wire,fast);
 fast.requests=[{piece:10,offset:0}];assert.equal(policy.recovery([request],[old,fast],{10:true},20000),null);
 fast.requests=[];request.retried=true;assert.equal(policy.recovery([request],[old,fast],{10:true},20000),null);
 request.retried=false;fast.peerChoking=true;assert.equal(policy.recovery([request],[old,fast],{10:true},20000),null);
});
test('actual engine request accounting caps outstanding blocks and releases cancelled capacity',()=>{
 const Piece=require('torrent-piece'),pending=[],activeRequests=[],context={pieces:[Piece(4194304)],activeRequests,MAX_ACTIVE_BLOCKS:256,reservations:[[]],retriedBlocks:{},requestedAt:{},Date,streamPolicy:policy,engine:{selection:[]},onupdatetick(){}};
 vm.runInNewContext(source.slice(source.indexOf('var onrequest = function'),source.indexOf('var onvalidatewire =')),context);
 const wire={request(i,offset,size,cb){pending.push(cb);}};for(let i=0;i<256;i++)assert.equal(context.onrequest(wire,0,false),true);
 assert.equal(context.onrequest(wire,0,false),false);assert.equal(activeRequests.length,256);pending[0](new Error('cancelled'));assert.equal(activeRequests.length,255);assert.equal(context.onrequest(wire,0,false),true);assert.equal(activeRequests.length,256);
});
test('engine recovery cancels the old request before reserving it on the alternative peer',()=>{
 const old=peer(4096),fast=peer(131072),request={wire:old,index:10,offset:0,size:16384,at:0},events=[],activeRequests=[request];
 old.cancel=()=>{events.push('cancel');activeRequests.length=0;};let tick;
 const context={pieces:{10:{missing:1000000}},piece:{BLOCK_LENGTH:16384},lastRotation:0,swarm:{queued:0,size:55},engine:{selection:[{from:10,to:10,priority:2}],emit:()=>events.push('event')},streamPolicy:policy,activeRequests,wires:[old,fast],retriedBlocks:{},criticalRetries:0,Date:{now:()=>20000},setInterval(fn){tick=fn;return 1;},onrequest(wire,index){assert.equal(wire,fast);assert.equal(index,10);events.push('request');}};
 const start=source.indexOf('recoveryIntervalId = setInterval('),end=source.indexOf('}, 1000)',start)+8;vm.runInNewContext('var '+source.slice(start,end),context);tick();assert.deepEqual(events,['cancel','request','event']);assert.equal(context.retriedBlocks['10:0'],true);
});

test('a late cancellation cannot cancel a block reservation already handed to another peer',()=>{
 const Piece=require('torrent-piece'),p=Piece(32768),pending=[],context={pieces:[p],activeRequests:[],MAX_ACTIVE_BLOCKS:256,reservations:[[]],retriedBlocks:{},requestedAt:{},Date,streamPolicy:policy,engine:{selection:[]},onupdatetick(){}};
 vm.runInNewContext(source.slice(source.indexOf('var onrequest = function'),source.indexOf('var onvalidatewire =')),context);
 const wire={request(i,offset,size,cb){pending.push(cb);}};context.onrequest(wire,0,false);
 p.cancel(0);context.reservations[0][0]=null;pending[0](new Error('hotswap cancelled'));
 assert.equal(p._cancellations.length,1);assert.equal(context.activeRequests.length,0);
});

test('hotswap cancels each actual block offset once and cleans the old wire queue',()=>{
 const cancelled=[],slow=peer(1024),fast=peer(131072);slow.requests=[{piece:0,offset:0,length:16384},{piece:0,offset:16384,length:16384}];slow.cancel=(i,o)=>{const at=slow.requests.findIndex(r=>r.piece===i&&r.offset===o);slow.requests.splice(at,1);};
 const context={opts:{},falsy:()=>false,piece:{BLOCK_LENGTH:16384},reservations:[[slow,slow]],pieces:[{cancel:index=>cancelled.push(index)}],SPEED_THRESHOLD:49152,engine:{emit(){}}};
 vm.runInNewContext(source.slice(source.indexOf('var onhotswap ='),source.indexOf('var onupdatetick =')),context);assert.equal(context.onhotswap(fast,0),true);assert.deepEqual(cancelled,[0,1]);assert.equal(slow.requests.length,0);
});

test('a slow peer holds at most two seconds of playhead blocks; its spare queue serves read-ahead',()=>{
 assert.equal(policy.criticalLimit(0),5,'unknown rate keeps the starting pipeline');
 assert.equal(policy.criticalLimit(50000),7);assert.equal(policy.criticalLimit(1e7),250);assert.equal(policy.criticalLimit(1e7,20),20);
 const remaining={10:256,11:256,12:256};
 const context={streamPolicy:policy,swarm:{downloaded:0,downloadSpeed:()=>0},engine:{_flood:0,_pulse:Number.MAX_SAFE_INTEGER,
  selection:[{from:10,to:10,offset:0,priority:2},{from:11,to:12,offset:0,priority:1}]},critical:{10:true,11:true},
  speedRanker:()=>()=>true,shufflePriority(){},onrequest(wire,j){if(!remaining[j])return false;remaining[j]--;wire.requests.push({piece:j});return true;}};
 vm.runInNewContext(source.slice(source.indexOf('var select = function'),source.indexOf('var onupdatewire =')),context);
 const all={10:true,11:true,12:true},slow=peer(50000,all),fast=peer(1e6,all);
 context.select(slow,false);
 const slowCritical=slow.requests.filter(r=>r.piece===10||r.piece===11).length;
 assert.equal(slow.requests.length,policy.pipeline(50000),'slow peer pipeline still filled');
 assert.equal(slowCritical,7,'only two seconds of critical blocks on the slow peer');
 assert.ok(slow.requests.some(r=>r.piece===12),'remaining capacity goes to read-ahead');
 context.select(fast,false);
 assert.equal(fast.requests.filter(r=>r.piece===10).length,policy.criticalLimit(1e6),'fast peer takes up to two seconds of playhead blocks');
});

test('a fast peer is not capped at 1 MiB in flight (TV trace: the only fast peer sat at 64 blocks)',()=>{
 const speed=2.4*1024*1024;
 assert.equal(policy.pipeline(speed),250,'up to 250 blocks (about 4 MB) in flight at the observed 2.4 MB/s');
 assert.equal(policy.pipeline(speed,100),100,'a peer\'s reqq still limits it');
 assert.ok(/var MAX_ACTIVE_BLOCKS = 512/.test(source),'engine-wide cap leaves room beyond one fast peer');
});



test('speculative tail has at most two requests per peer and sixteen globally; demanded tail bypasses cap',()=>{
 const wire={},other={},selections=[{from:1,to:1,priority:2},{from:99,to:99,priority:0}];
 assert.equal(policy.prefetchAllowed([],selections,99,wire),true);
 const held=[{index:99,wire},{index:99,wire}];assert.equal(policy.prefetchAllowed(held,selections,99,wire),false);
 assert.equal(policy.prefetchAllowed(held,selections,99,other),true);
 const full=Array.from({length:16},()=>({index:99,wire:other}));assert.equal(policy.prefetchAllowed(full,selections,99,wire),false);
 assert.equal(policy.prefetchAllowed(full,selections,1,wire),true);
 selections.unshift({from:99,to:99,priority:2});assert.equal(policy.prefetchAllowed(full,selections,99,wire),true);
 selections.shift();selections[1].priority=1;assert.equal(policy.prefetchAllowed(full,selections,99,wire),true);
});


test('connection rotation preserves data providers and only replaces old empty choked peers in a full swarm',()=>{
 const idle={kaiConnectedAt:1000,peerChoking:true,requests:[]};
 const peers=[idle,{kaiConnectedAt:500,lastPieceAt:10,peerChoking:true,requests:[]},{kaiConnectedAt:500,peerChoking:false,requests:[]}];
 assert.equal(policy.rotationCandidate(peers,20,5,100000),idle);
 assert.equal(policy.rotationCandidate(peers,0,5,100000),null);
 assert.equal(policy.rotationCandidate(peers,20,55,100000),null);
 assert.equal(policy.rotationCandidate(peers,20,5,50000),null);
 idle.requests=[{}];assert.equal(policy.rotationCandidate(peers,20,5,100000),null);
});


test('a choked, snubbed or queue-full fast peer cannot prevent a slower peer serving the playhead',()=>{
 const slow=peer(4096,{10:true}),fast=peer(1000000,{10:true});
 const c={streamPolicy:policy,wires:[slow,fast],pieces:{10:{missing:65536}},piece:{BLOCK_LENGTH:16384},SPEED_THRESHOLD:49152,thruthy:()=>true};
 vm.runInNewContext(source.slice(source.indexOf('var speedRanker ='),source.indexOf('var shufflePriority =')),c);
 fast.peerChoking=true;assert.equal(c.speedRanker(slow)(10),true,'choked fast peer is unavailable');
 fast.peerChoking=false;fast.snubbed=true;assert.equal(c.speedRanker(slow)(10),true,'snubbed fast peer is unavailable');
 fast.snubbed=false;fast.requests=Array.from({length:250},()=>({piece:10,length:16384}));assert.equal(c.speedRanker(slow)(10),true,'full fast queue is unavailable');
 fast.requests=[];assert.equal(c.speedRanker(slow)(10),false,'idle productive fast peer can finish the small remainder sooner');
});


test('delivery estimates prefer a short responsive queue over raw historical throughput',()=>{
 const fast=peer(1000000,{10:true}),responsive=peer(300000,{10:true});
 fast.requests=Array.from({length:150},()=>({piece:11,length:16384}));fast.kaiLatencyMs=800;responsive.kaiLatencyMs=40;
 assert.ok(policy.deliveryTime(responsive)<policy.deliveryTime(fast));
 fast.peerChoking=true;assert.equal(policy.deliveryTime(fast),Infinity);fast.peerChoking=false;fast.snubbed=true;assert.equal(policy.deliveryTime(fast),Infinity);
 const unknown=peer(0,{10:true});assert.ok(Number.isFinite(policy.deliveryTime(unknown)));assert.equal(policy.pipeline(0),5);
});

test('finishing blocks recover earlier only to a shorter eligible queue and never retry twice',()=>{
 const old=peer(4096,{10:true}),fast=peer(131072,{10:true}),request={wire:old,index:10,offset:0,at:0};
 assert.equal(policy.recovery([request],[old,fast],{10:true},2500),null);
 assert.equal(policy.recovery([request],[old,fast],{10:true},2500,{10:true}).wire,fast);
 assert.equal(policy.recovery([request],[old,fast],{10:true},1900,{10:true}),null);
 request.retried=true;assert.equal(policy.recovery([request],[old,fast],{10:true},2500,{10:true}),null);request.retried=false;
 fast.snubbed=true;assert.equal(policy.recovery([request],[old,fast],{10:true},2500,{10:true}),null);
});

test('new peers probe only one block before a first successful delivery',()=>{
 const requests=[],wire={requests:[],peerPieces:{10:true,11:true}},c={engine:{selection:[{from:10,to:11,offset:0,priority:2}]},onrequest(w,index){requests.push(index);w.requests.push({piece:index});return true;}};
 vm.runInNewContext(source.slice(source.indexOf('var onvalidatewire ='),source.indexOf('var speedRanker =')),c);
 c.onvalidatewire(wire);c.onvalidatewire(wire);assert.deepEqual(requests,[10]);
});


test('actual scheduler visits shorter delivery queues first without changing swarm order',()=>{
 const blocked=peer(1000000),busy=peer(1000000),responsive=peer(300000);blocked.peerChoking=true;busy.requests=Array.from({length:100},()=>({length:16384}));
 const wires=[blocked,busy,responsive],seen=[],c={wires,streamPolicy:policy,onupdatewire:w=>seen.push(w)};
 vm.runInNewContext(source.slice(source.indexOf('var onupdate = function'),source.indexOf('var onwire = function')),c);c.onupdate();
 assert.deepEqual(seen,[responsive,busy,blocked]);assert.deepEqual(wires,[blocked,busy,responsive]);
});
