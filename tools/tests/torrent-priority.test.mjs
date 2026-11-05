import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs',import.meta.url),'utf8');
test('new peers validate the requested piece before distant read-ahead pieces',()=>{
 const requested=[],engine={selection:[{from:408,to:408,offset:0,priority:2},{from:408,to:416,offset:0,priority:1}]};
 const context={engine,onrequest:(wire,index)=>{requested.push(index);return true;}};
 vm.runInNewContext(source.slice(source.indexOf('var onvalidatewire ='),source.indexOf('var speedRanker =')),context);
 const wire={requests:[],peerPieces:{408:true,416:true}};context.onvalidatewire(wire);assert.deepEqual(requested,[408]);
});
test('fairness rotates equal-priority streams without demoting the playhead below prefetch',()=>{
 const urgent={priority:2,id:'playhead'},a={priority:1,id:'a'},b={priority:1,id:'b'},engine={selection:[urgent,a,b]};
 const context={engine};vm.runInNewContext(source.slice(source.indexOf('var shufflePriority ='),source.indexOf('var select = function')),context);
 context.shufflePriority(0);assert.equal(engine.selection[0],urgent);
 context.shufflePriority(1);assert.equal(engine.selection[0],urgent);assert.equal(engine.selection[1],b);
});


test('piece diagnostics expose missing payload and aged requests without peer addresses',()=>{
 const engine={bitfield:{get:i=>i===8}},pieces={7:{length:16777216,missing:8388608}},activeRequests=[{index:7,at:Date.now()-5000},{index:8,at:Date.now()}],wires=[{peerPieces:{7:true},peerChoking:false,address:'SECRET'},{peerPieces:{7:true},peerChoking:true}];
 const context={engine,pieces,activeRequests,wires,Date};const begin=source.indexOf('    engine.pieceStats = function');const end=source.indexOf('    };',begin)+6;
 vm.runInNewContext(source.slice(begin,end),context);const result=engine.pieceStats([7,8,9,10,11]);
 assert.equal(result.length,4);assert.equal(result[0].missing,8388608);assert.equal(result[0].received,8388608);assert.equal(result[0].available,2);assert.equal(result[0].unchoked,1);assert.equal(result[0].active,1);assert.ok(result[0].oldestMs>=5000);assert.equal(result[1].verified,true);assert.ok(!JSON.stringify(result).includes('SECRET'));
});
