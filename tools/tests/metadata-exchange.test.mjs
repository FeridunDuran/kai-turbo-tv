import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const bn=require('bncode');
const exchange=require('../../service/vendor/torrent-stream/lib/exchange-metadata.cjs');
function fixture(failInitialization = false) {
  const data=Buffer.alloc(20000,65);
  const engine=new EventEmitter(); engine.infoHash=crypto.createHash('sha1').update(data).digest('hex');
  let result; const connect=exchange(engine, value=>{if(failInitialization)throw new Error('fixture initialization failure');result=value;});
  function peer() {
    const wire=new EventEmitter();wire.peerExtensions={extended:true};wire.sent=[];
    wire.extended=(channel,message)=>wire.sent.push({channel,message});
    connect(wire);wire.emit('extended',0,bn.encode({m:{ut_metadata:3},metadata_size:data.length}));
    return wire;
  }
  function block(wire,index,corrupt=false) {
    const bytes=Buffer.from(data.subarray(index*16384,(index+1)*16384));if(corrupt)bytes[0]^=1;
    wire.emit('extended',1,Buffer.concat([bn.encode({msg_type:1,piece:index}),bytes]));
  }
  return {engine,data,peer,block,get result(){return result;}};
}
test('metadata blocks from different peers cannot contaminate each other',()=>{
  const f=fixture(),bad=f.peer(),good=f.peer();
  f.block(bad,0,true);f.block(good,1);f.block(good,0);
  assert.deepEqual(f.result,f.data);
});
test('complementary valid metadata blocks from two peers complete without waiting for either peer',()=>{
  const f=fixture(),first=f.peer(),second=f.peer();
  f.block(first,0);assert.equal(f.result,undefined);
  f.block(second,1);assert.deepEqual(f.result,f.data);
});
test('verified metadata initialization failure is reported immediately with its original cause',()=>{
  const f=fixture(true),peer=f.peer();let error;
  f.engine.on('error',value=>{error=value;});
  f.block(peer,0);f.block(peer,1);
  assert.match(error.message,/metadata verified, but file initialization failed: fixture initialization failure/);
  assert.deepEqual(f.engine.metadata,f.data);
});
test('hash rejection retries metadata on the same peer instead of waiting until timeout',()=>{
  const f=fixture(),peer=f.peer();let failures=0;f.engine.on('metadata-invalid',()=>failures++);
  f.block(peer,0,true);f.block(peer,1);
  assert.equal(failures,1);assert.equal(peer.sent.filter(x=>x.message.msg_type===0).length,4);
  f.block(peer,0);f.block(peer,1);assert.deepEqual(f.result,f.data);
});
