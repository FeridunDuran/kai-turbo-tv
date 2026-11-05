import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
test('closing an old Range response cannot cancel the replacement video request',()=>{
 const session={file:{name:'episode.mp4',length:10000},open(){
   if(this.reader)this.reader.destroy();
   const reader={destroyed:false,destroy(){this.destroyed=true;}};this.reader=reader;return reader;
 }};
 const context={require:()=>({}),fixtureSessions:{fixture:session},setInterval(){}};
 const source=fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('var sessions = {};','var sessions = fixtureSessions;');
 vm.runInNewContext(source,context);
 const response=()=>Object.assign(new EventEmitter(),{writeHead(){},end(){}});
 const first=response(),second=response();
 context.TV_TORRENT.serve({method:'GET',headers:{range:'bytes=0-99'}},first,'fixture');
 const old=session.reader;
 context.TV_TORRENT.serve({method:'GET',headers:{range:'bytes=9900-9999'}},second,'fixture');
 assert.equal(old.destroyed,true);
 const current=session.reader;first.emit('close');assert.equal(current.destroyed,false);
 second.emit('close');assert.equal(current.destroyed,true);
});
