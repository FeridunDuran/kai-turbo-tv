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
