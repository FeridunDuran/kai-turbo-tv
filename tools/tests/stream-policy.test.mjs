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
 const context={lastRotation:0,swarm:{queued:0,size:55},engine:{selection:[{from:10,to:10,priority:2}],emit:()=>events.push('event')},streamPolicy:policy,activeRequests,wires:[old,fast],retriedBlocks:{},criticalRetries:0,Date:{now:()=>20000},setInterval(fn){tick=fn;return 1;},onrequest(wire,index){assert.equal(wire,fast);assert.equal(index,10);events.push('request');}};
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
