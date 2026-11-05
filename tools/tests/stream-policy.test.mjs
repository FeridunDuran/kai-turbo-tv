import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';import vm from 'node:vm';
const require=createRequire(import.meta.url),policy=require('../../service/vendor/torrent-stream/lib/stream-policy.cjs');
const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs',import.meta.url),'utf8');
function peer(speed,pieces={10:true}){return {downloadSpeed:()=>speed,requests:[],peerPieces:pieces,peerChoking:false};}
test('pipeline adapts to throughput and remains bounded',()=>{assert.equal(policy.pipeline(0),5);assert.equal(policy.pipeline(16384),5);assert.equal(policy.pipeline(131072),26);assert.equal(policy.pipeline(1e9),64);assert.equal(policy.pipeline(Infinity),5);assert.equal(policy.pipeline(1e9,40),40,'peer reqq is honoured');assert.equal(policy.pipeline(16384,0),5,'invalid reqq ignored');});
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
 const Piece=require('torrent-piece'),pending=[],activeRequests=[],context={pieces:[Piece(4194304)],activeRequests,MAX_ACTIVE_BLOCKS:256,reservations:[[]],retriedBlocks:{},Date,onupdatetick(){}};
 vm.runInNewContext(source.slice(source.indexOf('var onrequest = function'),source.indexOf('var onvalidatewire =')),context);
 const wire={request(i,offset,size,cb){pending.push(cb);}};for(let i=0;i<256;i++)assert.equal(context.onrequest(wire,0,false),true);
 assert.equal(context.onrequest(wire,0,false),false);assert.equal(activeRequests.length,256);pending[0](new Error('cancelled'));assert.equal(activeRequests.length,255);assert.equal(context.onrequest(wire,0,false),true);assert.equal(activeRequests.length,256);
});
test('engine recovery cancels the old request before reserving it on the alternative peer',()=>{
 const old=peer(4096),fast=peer(131072),request={wire:old,index:10,offset:0,size:16384,at:0},events=[],activeRequests=[request];
 old.cancel=()=>{events.push('cancel');activeRequests.length=0;};let tick;
 const context={engine:{selection:[{from:10,to:10,priority:2}],emit:()=>events.push('event')},streamPolicy:policy,activeRequests,wires:[old,fast],retriedBlocks:{},criticalRetries:0,Date:{now:()=>20000},setInterval(fn){tick=fn;return 1;},onrequest(wire,index){assert.equal(wire,fast);assert.equal(index,10);events.push('request');}};
 const start=source.indexOf('recoveryIntervalId = setInterval('),end=source.indexOf('}, 1000)',start)+8;vm.runInNewContext('var '+source.slice(start,end),context);tick();assert.deepEqual(events,['cancel','request','event']);assert.equal(context.retriedBlocks['10:0'],true);
});

test('a late cancellation cannot cancel a block reservation already handed to another peer',()=>{
 const Piece=require('torrent-piece'),p=Piece(32768),pending=[],context={pieces:[p],activeRequests:[],MAX_ACTIVE_BLOCKS:256,reservations:[[]],retriedBlocks:{},Date,onupdatetick(){}};
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
