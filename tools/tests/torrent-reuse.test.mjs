import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import {EventEmitter} from 'node:events';
test('next episode in the same torrent preserves engine peers and detaches the old session',()=>{
 let engines=[],ids=0,destroyed=0;
 const context={Buffer,process,setTimeout,clearTimeout,setInterval(){},require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8,++ids)}:{},TorrentEngine:function(magnet){
 const e=new EventEmitter();Object.assign(e,{infoHash:/btih:([a-f0-9]+)/.exec(magnet)[1],torrent:{pieceLength:4},files:[{name:'S01E01.mp4',offset:0,length:4},{name:'S01E02.mp4',offset:4,length:4}],store:{store:{present:[],bytes:0}},swarm:{downloaded:0,wires:[{},{}]},select(){},deselect(){},destroy(cb){destroyed++;if(cb)cb();}});engines.push(e);return e;}};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8'),context);
 let first,second;context.TV_TORRENT.create({infoHash:'a'.repeat(40),fileIdx:0},(err,r)=>{assert.ifError(err);first=r;});engines[0].emit('ready');
 context.TV_TORRENT.create({infoHash:'a'.repeat(40),fileIdx:1},(err,r)=>{assert.ifError(err);second=r;});
 assert.equal(engines.length,1);assert.equal(destroyed,0);assert.equal(second.fileIdx,1);assert.notEqual(first.id,second.id);assert.equal(context.TV_TORRENT.stats(first.id),null);assert.equal(context.TV_TORRENT.stats(second.id).peers,2);assert.equal(engines[0].listenerCount('download'),1);
 let third;context.TV_TORRENT.create({infoHash:'b'.repeat(40),fileIdx:0},(err,r)=>{assert.ifError(err);third=r;});
 assert.equal(engines.length,2);assert.equal(destroyed,1);engines[1].emit('ready');assert.equal(third.fileIdx,0);
 context.TV_TORRENT.destroyAll();assert.equal(destroyed,2);
});
