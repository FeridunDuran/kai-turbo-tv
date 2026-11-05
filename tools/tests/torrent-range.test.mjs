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

test('active torrent blocks may take over a minute; twenty seconds without bytes stops the reader',()=>{
 let now=0,id=0,closed=0;const timers=new Map(),swarm=new EventEmitter();
 const context={require:()=>({}),setInterval(){},setTimeout(fn,ms){const token=++id;timers.set(token,{fn,at:now+ms});return token;},clearTimeout(token){timers.delete(token);}};
 const source=fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Reader: Reader, supported: supported,');vm.runInNewContext(source,context);
 function advance(ms){const target=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=target;}
 const reader=new context.TV_TORRENT.Reader({engine:{swarm}},0,100,{destroy(){closed++;}});reader._next=()=>{};reader.start();
 for(let i=0;i<6;i++){advance(10000);swarm.emit('download',16384);}
 assert.equal(now,60000);assert.equal(closed,0);advance(19999);assert.equal(closed,0);advance(1);assert.equal(closed,1);assert.equal(swarm.listenerCount('download'),0);
});
