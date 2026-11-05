import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import vm from 'node:vm';
import net from 'node:net';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const policy = require('../../service/vendor/torrent-stream/lib/stream-policy.cjs');
const fixture = new URL('./fixtures/network-node4.cjs', import.meta.url);

test('loopback network fixture: fake-gateway UPnP, PEX, uTP fallback and an incoming peer into the built engine', () => {
  const out = execFileSync(process.execPath, ['--no-deprecation', fixture.pathname.replace(/^\/([A-Za-z]:)/, '$1')], { encoding: 'utf8', timeout: 60000 });
  const result = JSON.parse(out.trim().split('\n').pop());
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(result.upnp.mapped, ['TCP', 'UDP']);
  assert.equal(result.utpFallback.transport, 'utp');
  assert.equal(result.incoming.incoming, 1);
  assert.equal(result.pex.connects, 2);
});

test('snub (libtorrent piece_timeout): a peer silent for 20 s with requests is snubbed only while another peer delivers', () => {
  const wire = (o) => Object.assign({ requests: [], peerChoking: false, snubbed: false }, o);
  const silent = wire({ requests: [{ piece: 1 }], lastPieceAt: 0 });
  const busy = wire({ requests: [{ piece: 2 }], lastPieceAt: 29000 });
  assert.deepEqual(policy.snubCandidates([silent, busy], 10000), [], 'waiting starts now');
  assert.deepEqual(policy.snubCandidates([silent, busy], 31000), [silent]);
  const lonely = wire({ requests: [{ piece: 1 }], lastPieceAt: 0 });
  policy.snubCandidates([lonely], 1000);
  assert.deepEqual(policy.snubCandidates([lonely], 60000), [], 'the only source is never snubbed');
  const idle = wire({ requests: [] });
  assert.deepEqual(policy.snubCandidates([idle, busy], 31000), [], 'no requests, nothing to time out');
});

test('a snubbed peer gets one request and no playhead blocks', () => {
  const source = fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs', import.meta.url), 'utf8');
  const remaining = { 10: 256, 11: 256 };
  const context = { streamPolicy: policy, swarm: { downloaded: 0, downloadSpeed: () => 0 }, engine: { _flood: 0, _pulse: Number.MAX_SAFE_INTEGER,
    selection: [{ from: 10, to: 10, offset: 0, priority: 2 }, { from: 11, to: 11, offset: 0, priority: 1 }] }, critical: { 10: true },
    speedRanker: () => () => true, shufflePriority() {}, onrequest(wire, j) { if (!remaining[j]) return false; remaining[j]--; wire.requests.push({ piece: j }); return true; } };
  vm.runInNewContext(source.slice(source.indexOf('var select = function'), source.indexOf('var onupdatewire =')), context);
  const snubbed = { downloadSpeed: () => 1e6, requests: [], peerPieces: { 10: true, 11: true }, snubbed: true };
  context.select(snubbed, false);
  assert.deepEqual(snubbed.requests.map((r) => r.piece), [11]);
});

test('one DHT is shared by all engines and seeded with saved nodes plus the public routers', () => {
  const made = [];
  class DHT extends EventEmitter { constructor(opts) { super(); this.opts = opts; this.destroyed = false; made.push(this); } listen() { this.listening = true; }
    toArray() { return [{ host: '1.2.3.4', port: 6881 }, { host: 'bad host', port: 1 }]; } }
  const context = { require: (id) => (id === 'crypto' ? { randomBytes: () => Buffer.alloc(8) } : {}), setInterval() {}, Buffer, TorrentEngine: { DHT } };
  vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js', import.meta.url), 'utf8').replace('supported: supported,', 'dhtNodes: dhtNodes, supported: supported,'), context);
  const a = context.TV_TORRENT.dhtFor(['5.6.7.8:6881', 'not a node', '9.9.9.9:1']);
  const b = context.TV_TORRENT.dhtFor(['ignored:1']);
  assert.equal(a, b, 'same instance for later engines');
  assert.equal(made.length, 1);
  assert.deepEqual(a.opts.bootstrap.slice(0, 2), ['5.6.7.8:6881', '9.9.9.9:1']);
  assert.ok(a.opts.bootstrap.includes('router.bittorrent.com:6881'));
  assert.equal(a.listening, true);
  assert.deepEqual([...context.TV_TORRENT.dhtNodes()], ['1.2.3.4:6881']);
});

test('vendored swarm forgets a failed connection attempt so it can be tried again (upstream kept it forever)', async () => {
  const pws = require('../../service/vendor/torrent-stream/lib/peer-wire-swarm.cjs');
  const closed = net.createServer();
  await new Promise((r) => closed.listen(0, '127.0.0.1', r));
  const port = closed.address().port;
  await new Promise((r) => closed.close(r));
  const swarm = pws(crypto.randomBytes(20), Buffer.from('-KT0001-test00000000'), { size: 5, connectTimeout: 2000 });
  swarm.add('127.0.0.1:' + port);
  assert.ok(swarm._peers['127.0.0.1:' + port]);
  for (let i = 0; i < 50 && swarm._peers['127.0.0.1:' + port]; i++) await new Promise((r) => setTimeout(r, 40));
  assert.equal(swarm._peers['127.0.0.1:' + port], undefined, 'refused peer removed from the swarm');
  swarm.destroy();
});


test('timeout uTP probes are rate limited and never retry an established TCP connection',()=>{
 const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/lib/peer-wire-swarm.cjs',import.meta.url),'utf8');
 const begin=source.indexOf('var onend = function()'),end=source.indexOf("wire.on('end', onend)",begin);
 let now=100000,repushed=0,removed=0;const self={_peers:{},utpFallback:true,emit(){},_remove(){removed++;}};
 function attempt(opened=false){const peer={triedUtp:false},wire={};self._peers.fixture=peer;const c={ended:false,self,peer,wire,addr:'fixture',opened,tcpRefused:false,tcpTimedOut:true,viaUtp:false,Date:{now:()=>now},repush(){repushed++;},RECONNECT_WAIT:[],setTimeout(){}};vm.runInNewContext(source.slice(begin,end),c);c.onend();return peer;}
 assert.equal(attempt().useUtp,true);assert.equal(repushed,1);now+=1000;assert.equal(attempt().useUtp,undefined);assert.equal(repushed,1);
 now+=15000;assert.equal(attempt(true).useUtp,undefined);assert.equal(repushed,1);assert.equal(attempt().useUtp,true);assert.equal(repushed,2);assert.ok(removed>=2);
});


test('a recently productive choked peer is not discarded while alternatives wait',()=>{
 const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs',import.meta.url),'utf8');const begin=source.indexOf('var onchoketimeout = function'),end=source.indexOf("wire.on('close'",begin);
 let closed=0,scheduled=0;const wire={amInterested:true,lastPieceAt:10000,destroy(){closed++;}};
 const c={wire,swarm:{queued:100,size:55,wires:Array(55)},Date:{now:()=>20000},timeout:15000,setTimeout(){scheduled++;return 1;}};
 vm.runInNewContext(source.slice(begin,end),c);c.onchoketimeout();assert.equal(closed,0);assert.equal(scheduled,1);
 wire.lastPieceAt=0;c.onchoketimeout();assert.equal(closed,1);
});


test('discovery funnel distinguishes offers, accepted peers, transport queue and productive sources without addresses',()=>{
 const debug=require('../../service/vendor/torrent-stream/lib/discovery-debug.cjs');const engine=new EventEmitter(),discovery=new EventEmitter(),dht=new EventEmitter();
 discovery.dht=dht;discovery._createTracker=function(){this.tracker=new EventEmitter();};
 const swarm={size:5,queued:2,connections:[{},{}],_peers:{'SECRET-IP':{timeout:1}},kaiNetwork:{attempts:4,refused:2},wires:[{kaiSource:'pex',lastPieceAt:Date.now(),peerChoking:false,requests:[]},{kaiSource:'hint',kaiConnectedAt:Date.now()-5000,peerChoking:true,requests:[{}]}]};
 const debugState=debug(engine,discovery,swarm,'a'.repeat(40));discovery._createTracker();discovery.tracker.emit('peer','SECRET-PEER');dht.emit('peer',{host:'SECRET'},Buffer.from('a'.repeat(40),'hex'));dht.emit('peer',{},Buffer.from('b'.repeat(40),'hex'));
 discovery.emit('trackerAnnounce',{announce:'https://SECRET-TOKEN'});discovery.emit('warning',new Error('SECRET-CREDENTIAL'));
 debugState.offer('pex',true);debugState.offer('pex',false);debugState.offer('hint',true);
 const s=debugState.snapshot();assert.equal(s.sources.trackerSignals,1);assert.equal(s.sources.dhtSignals,1);assert.equal(s.sources.trackerAnnounces,1);assert.equal(s.sources.warnings,1);
 assert.equal(s.offers.pex,2);assert.equal(s.accepted.pex,1);assert.equal(s.bySource.pex.active5s,1);assert.equal(s.bySource.hint.everSent,0);
 assert.equal(s.queue.freeSlots,3);assert.equal(s.queue.reason,'queue-has-free-slots');assert.equal(s.queue.retryBackoff,1);assert.equal(s.payload.neverSent,1);assert.ok(!JSON.stringify(s).includes('SECRET'));
 swarm.connections=Array(5);assert.equal(debugState.snapshot().queue.reason,'connection-limit');swarm.paused=true;assert.equal(debugState.snapshot().queue.reason,'paused');
 assert.equal(dht.listenerCount('peer'),1);debugState.close();assert.equal(dht.listenerCount('peer'),0,'shared DHT debug listeners do not leak');
});


test('connect and handshake timeouts have separate transport counters',()=>{
 const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/lib/peer-wire-swarm.cjs',import.meta.url),'utf8');
 function fixture(){const timers=[],wire=new EventEmitter(),connection=new EventEmitter(),swarm={kaiNetwork:{connectTimeouts:0,handshakeTimeouts:0},connectTimeout:5000,handshakeTimeout:25000};
 wire.pipe=()=>connection;wire.destroy=()=>{};connection.pipe=()=>wire;connection.destroy=()=>connection.emit('close');
 const c={peerWireProtocol:()=>wire,setTimeout(fn,ms){const timer={fn,ms,unref(){}};timers.push(timer);return timer;},clearTimeout(t){if(t)t.cleared=true;}};
 vm.runInNewContext(source.slice(source.indexOf('var onwire = function'),source.indexOf('var pools =')),c);c.onwire(swarm,connection,()=>{},false);return {timers,connection,swarm};}
 const a=fixture();a.timers.find(t=>t.ms===5000).fn();assert.equal(a.swarm.kaiNetwork.connectTimeouts,1);assert.equal(a.swarm.kaiNetwork.handshakeTimeouts,0);
 const b=fixture();b.connection.emit('connect');assert.equal(b.timers.find(t=>t.ms===5000).cleared,true);b.timers.find(t=>t.ms===25000).fn();assert.equal(b.swarm.kaiNetwork.connectTimeouts,0);assert.equal(b.swarm.kaiNetwork.handshakeTimeouts,1);
});
