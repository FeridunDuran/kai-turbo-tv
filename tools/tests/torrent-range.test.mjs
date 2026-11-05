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

test('tail seek retains the back cache without downloading pieces before the requested MP4 header',()=>{
 const selected=[],engine=new EventEmitter();const store={present:[],remove(){return false;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select:(from,to)=>selected.push([from,to]),deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 const source=fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session, supported: supported,');vm.runInNewContext(source,context);
 const session=new context.TV_TORRENT.Session(engine,{offset:408*4194304,length:42*4194304},0);
 session.ensureWindow(408);session.ensureWindow(449);
 assert.equal(session.windowFrom,447);assert.equal(session.selFrom,449);assert.deepEqual(selected.at(-1),[449,449]);
});

test('browser Range retries do not restart the no-data deadline',()=>{
 let now=0,token=0,closed=0;const timers=new Map(),swarm=new EventEmitter(),session={engine:{swarm}};
 const context={Date:{now:()=>now},require:()=>({}),setInterval(){},setTimeout(fn,ms){timers.set(++token,{fn,at:now+ms});return token;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Reader: Reader,supported: supported,'),context);
 const make=()=>{const r=new context.TV_TORRENT.Reader(session,0,100,{destroy(){closed++;}});r._next=()=>{};r.start();return r;};
 const first=make();now=10000;first.destroy();make();const deadline=[...timers.values()][0];assert.equal(deadline.at,20000);now=20000;deadline.fn();assert.equal(closed,1);
});

test('MP4 head and tail are prefetched together and remain cached across header seeks within budget',()=>{
 const selected=[],removed=[],store={present:[408,449],remove(i){removed.push(i);return true;}},engine=new EventEmitter();
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select:(a,b,p)=>selected.push([a,b,p]),deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session,supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'episode.mp4',offset:408*4194304,length:42*4194304},0);
 assert.deepEqual(selected,[[408,408,1],[449,449,1]]);s.ensureWindow(408);s.ensureWindow(449);assert.deepEqual(removed,[]);
 for(const index of [408,410,425,449]){s.ensureWindow(index,true);const retained=new Set(s.headerPieces);for(let i=s.windowFrom;i<=s.windowTo;i++)retained.add(i);assert.ok(retained.size*s.pieceLength<=48*1024*1024);}
 for(const size of [16384,1048576,16777216,33554432]){engine.torrent.pieceLength=size;const sample=new context.TV_TORRENT.Session(engine,{name:'episode.mp4',offset:0,length:size*100},0);sample.ensureWindow(50,true);const retained=new Set(sample.headerPieces);for(let i=sample.windowFrom;i<=sample.windowTo;i++)retained.add(i);assert.ok(retained.size*size<=48*1024*1024);}
});


test('cold MKV startup concentrates on the header and pins it across tail and resume seeks',()=>{
 const selected=[],removed=[],store={present:[],remove(i){removed.push(i);return true;}},engine=new EventEmitter();
 Object.assign(engine,{store:{store},torrent:{pieceLength:2097152},select:(a,b,p)=>selected.push([a,b,p]),deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session,supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'episode.mkv',offset:578*2097152,length:200*2097152},0);
 assert.deepEqual(Array.from(s.headerPieces),[578]); // no speculative MKV tail
 s.ensureWindow(578);assert.equal(s.selTo,578);assert.ok(selected.every(([a,b])=>a===578&&b===578));
 store.present.push(578);s._pieceDone(578);assert.equal(s.startupComplete,true);
 s.ensureWindow(777);s.ensureWindow(660);assert.ok(s.selTo>660);assert.deepEqual(removed,[]);
 const warm=new context.TV_TORRENT.Session(engine,{name:'episode.mkv',offset:578*2097152,length:200*2097152},0);warm.ensureWindow(578);assert.ok(warm.selTo>578);
});

test('buffer statistic counts verified RAM pieces contiguous with the reader position only',()=>{
 const engine=new EventEmitter();const store={present:[410,411,413],bytes:0,remove(){return false;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select(){},deselect(){},release(){},swarm:{downloaded:0,wires:[]}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 const source=fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session, aheadBytes: aheadBytes, supported: supported,');vm.runInNewContext(source,context);
 const s=new context.TV_TORRENT.Session(engine,{name:'movie.mkv',offset:408*4194304,length:42*4194304},0);
 assert.equal(context.TV_TORRENT.aheadBytes(s),null,'no reader yet');
 s.reader={pos:2*4194304+1000};
 assert.equal(context.TV_TORRENT.aheadBytes(s),2*4194304-1000,'pieces 410-411; the gap at 412 ends the buffer');
 s.reader={pos:4*4194304};
 assert.equal(context.TV_TORRENT.aheadBytes(s),0,'missing playhead piece means no buffer');
});

test('MP4 probe piece read before the moov tail jump stays in RAM for the return read, within the cache budget',()=>{
 const removed=[],engine=new EventEmitter();
 const store={present:[408,409,449],remove(p){const i=this.present.indexOf(p);if(i<0)return false;this.present.splice(i,1);removed.push(p);return true;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select(){},deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session,supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'movie.mp4',offset:408*4194304,length:42*4194304},0);
 s.ensureWindow(408);s.lastReadIndex=409;           // read 0..~8 MiB
 s.ensureWindow(448,true);s.lastReadIndex=449;      // moov at the end
 assert.equal(removed.includes(409),false,'probe piece kept across the tail jump');
 s.ensureWindow(409);                                // FFmpeg probe re-reads ~6 MiB
 assert.ok(store.present.includes(409),'return read is served from RAM, not downloaded again');
 // A later seek elsewhere releases it again: only one return slot exists.
 store.present.push(430);s.lastReadIndex=430;s.ensureWindow(420,true);s.lastReadIndex=420;s.ensureWindow(440,true);
 const retained=new Set(s.headerPieces);for(let i=s.windowFrom;i<=s.windowTo;i++)retained.add(i);if(s.returnPiece!==null)retained.add(s.returnPiece);
 assert.ok(retained.size*4194304<=48*1024*1024,'header pins + window + return slot fit 48 MiB');
});

test('a session opened for resume downloads only requested start/tail pieces until the resume read',()=>{
 const selected=[],engine=new EventEmitter();const store={present:[408],remove(){return false;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select:(from,to,priority)=>selected.push([from,to,priority]),deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session,supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'movie.mp4',offset:408*4194304,length:200*4194304},0);
 s.resumePending=true;selected.length=0;
 s.ensureWindow(409,true);assert.deepEqual(selected.filter(x=>x[2]===1),[[409,409,1]],'probe read: no start read-ahead');
 selected.length=0;s.ensureWindow(607,true);assert.deepEqual(selected.filter(x=>x[2]===1),[[607,607,1]],'moov tail read: no read-ahead');
 selected.length=0;s.ensureWindow(500,true);
 const window=selected.filter(x=>x[2]===1)[0];assert.equal(window[0],500);assert.ok(window[1]>500,'resume position gets the normal read-ahead');
 assert.equal(s.resumePending,false);
 const plain=new context.TV_TORRENT.Session(engine,{name:'movie.mp4',offset:408*4194304,length:200*4194304},0);
 selected.length=0;plain.ensureWindow(409,true);assert.ok(selected.filter(x=>x[2]===1)[0][1]>409,'without resume, start read-ahead is unchanged');
});

test('engine diagnostics record discovery times, connection lifetimes and piece request-to-verify times without addresses',()=>{
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','attachDiag: attachDiag, wireSummary: wireSummary, supported: supported,'),context);
 const engine=new EventEmitter();engine.pieceRequestedAt={};const d=context.TV_TORRENT.attachDiag(engine);
 engine.emit('peer','10.0.0.1:6881');const wire=new EventEmitter();engine.emit('wire',wire);wire.emit('unchoke');wire.emit('download',16384);wire.emit('download',16384);wire.emit('close');
 engine.pieceRequestedAt[61]=Date.now()-17000;engine.emit('verify',61);engine.emit('invalid-piece',62);engine.emit('timeout',wire);
 assert.equal(d.peersFound,1);assert.notEqual(d.firstPeerMs,null);assert.notEqual(d.firstBlockMs,null);
 assert.equal(d.wiresClosed,1);assert.equal(d.closed[0].kb,32);assert.equal(d.hashFails,1);assert.equal(d.timeouts,1);
 assert.equal(d.pieces[0].i,61);assert.ok(d.pieces[0].ms>=17000);
 assert.equal(JSON.stringify(d).includes('10.0.0.1'),false,'no peer addresses in diagnostics');
 const summary=context.TV_TORRENT.wireSummary({swarm:{wires:[{peerChoking:false,downloadSpeed:()=>102400},{peerChoking:true,downloadSpeed:()=>0}],downloadSpeed:()=>102400}});
 assert.deepEqual(JSON.parse(JSON.stringify(summary)),{connected:2,unchoked:1,topKBs:[100,0],rateKBs:100});
});

test('16 MiB pieces: start piece survives the tail read, and the resume signal opens read-ahead',()=>{
 const removed=[],selected=[],engine=new EventEmitter();
 const store={present:[209],remove(p){const i=this.present.indexOf(p);if(i<0)return false;this.present.splice(i,1);removed.push(p);return true;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:16777216},select:(from,to,priority)=>selected.push([from,to,priority]),deselect(){},release(){}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session,supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'episode.mkv',offset:209*16777216+2282697,length:690305268},0);
 assert.equal(s.returnSlot,1);s.resumePending=true;
 s.ensureWindow(209);s.lastReadIndex=209;
 store.present.push(250);s.ensureWindow(250,true);s.lastReadIndex=250;
 assert.equal(removed.includes(209),false,'start piece kept across the 8.5 KB tail read');
 s.ensureWindow(209);assert.ok(store.present.includes(209),'start re-read served from RAM');
 selected.length=0;s.ensureWindow(211,true);
 assert.deepEqual(selected.filter(x=>x[2]===1),[[211,211,1]],'resume piece only, no read-ahead before the signal');
 const retained=new Set([s.returnPiece]);for(let i=s.windowFrom;i<=s.windowTo;i++)retained.add(i);
 assert.ok(retained.size*16777216<=48*1024*1024,'within the 48 MiB cache');
});

test('resume signal clears the pending state and selects the normal window from the reader position',()=>{
 const selected=[],engine=new EventEmitter();const store={present:[],remove(){return false;}};
 Object.assign(engine,{store:{store},torrent:{pieceLength:4194304},select:(from,to,priority)=>selected.push([from,to,priority]),deselect(){},release(){},swarm:{wires:[]}});
 const context={require:id=>id==='crypto'?{randomBytes:()=>Buffer.alloc(8)}:{},setInterval(){},Buffer};
 vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Session: Session, registerForTest: function (s) { sessions[s.id] = s; }, supported: supported,'),context);
 const s=new context.TV_TORRENT.Session(engine,{name:'movie.mp4',offset:0,length:200*4194304},0);
 s.id='a'.repeat(16);context.TV_TORRENT.registerForTest(s);s.resumePending=true;s.reader={pos:150*4194304,destroyed:false};
 assert.equal(context.TV_TORRENT.resumed('b'.repeat(16)),false);
 selected.length=0;assert.equal(context.TV_TORRENT.resumed(s.id),true);
 assert.equal(s.resumePending,false);const w=selected.filter(x=>x[2]===1)[0];assert.equal(w[0],150);assert.ok(w[1]>150);
});

test('after video was delivered, a data stall keeps the response open instead of signalling end of file',()=>{
 let now=0,id=0,closed=0;const timers=new Map(),swarm=new EventEmitter();
 const context={require:()=>({}),setInterval(){},setTimeout(fn,ms){const token=++id;timers.set(token,{fn,at:now+ms});return token;},clearTimeout(token){timers.delete(token);}};
 const source=fs.readFileSync(new URL('../../service/torrent.js',import.meta.url),'utf8').replace('supported: supported,','Reader: Reader, supported: supported,');vm.runInNewContext(source,context);
 function advance(ms){const target=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=target;}
 const session={engine:{swarm},delivered:120*1048576};
 const reader=new context.TV_TORRENT.Reader(session,0,100,{destroy(){closed++;}});reader._next=()=>{};reader.start();
 advance(120000);
 assert.equal(closed,0,'TV trace: a closed response made the player jump to the end and start the next episode');
 assert.equal(reader.destroyed,false);
 swarm.emit('download',16384);advance(1000);assert.equal(closed,0);
 reader.destroy();assert.equal(swarm.listenerCount('download'),0);
});
