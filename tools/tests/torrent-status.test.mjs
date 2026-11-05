import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {once} from 'node:events';
test('local torrent diagnostics report range progress and reject invalid IDs and mutations',async()=>{
 const context={PLAYER_SERVICE:true,require:createRequire(import.meta.url),Buffer,setTimeout,clearTimeout,console,TV_TORRENT:{stats:id=>id==='a'.repeat(16)?{downloaded:4096,ranges:[{start:0,end:99,sent:100}]}:null}};
 const source=fs.readFileSync(new URL('../../service/remote-service.js',import.meta.url),'utf8').replace(/var PORT = [^;]+;/,'var PORT = 0;');vm.runInNewContext(source,context);
 const server=context.server;if(!server.listening)await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 try{const r=await fetch(base+'/torrent-status/'+'a'.repeat(16));assert.equal(r.status,200);assert.equal((await r.json()).ranges[0].sent,100);assert.equal((await fetch(base+'/torrent-status/invalid')).status,404);assert.equal((await fetch(base+'/torrent-status/'+'a'.repeat(16),{method:'POST'})).status,405);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
