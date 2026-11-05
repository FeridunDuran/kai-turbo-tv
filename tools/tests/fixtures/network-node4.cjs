// Loopback network checks for the TV player service. Run with Node 4.4.3 (the TV's runtime) and
// with the current Node through tools/tests/network.test.mjs. No public network, no real router:
// UPnP is tested against a fake gateway on 127.0.0.1.
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
var net = require('net'), http = require('http'), dgram = require('dgram');
var bencode = require('bencode'), protocol = require('peer-wire-protocol'), utp = require('utp');
var root = path.resolve(__dirname, '../../..');
var results = {};
var started = Date.now();

function done(err) {
  results.ok = !err;
  if (err) results.error = err.message;
  results.elapsedMs = Date.now() - started;
  console.log(JSON.stringify(results));
  setTimeout(function () { process.exit(err ? 1 : 0); }, 50);
}
setTimeout(function () { done(new Error('network fixture timeout')); }, 30000);

function check(cond, message) { if (!cond) throw new Error(message); }

// ---------- 1. UPnP against a fake Internet Gateway Device ----------
function testUpnp(cb) {
  var actions = [];
  var httpServer = http.createServer(function (req, res) {
    if (req.method === 'GET' && req.url === '/desc.xml') {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end('<?xml version="1.0"?><root><device><serviceList>' +
        '<service><serviceType>urn:schemas-upnp-org:service:Layer3Forwarding:1</serviceType><controlURL>/l3f</controlURL></service>' +
        '<service><serviceType>urn:schemas-upnp-org:service:WANIPConnection:1</serviceType><controlURL>/ctl/IPConn</controlURL></service>' +
        '</serviceList></device></root>');
    }
    var body = '';
    req.on('data', function (d) { body += d; });
    req.on('end', function () {
      var action = /#(\w+)"/.exec(req.headers.soapaction || '')[1];
      actions.push({ action: action, path: req.url, body: body });
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end('<s:Envelope><s:Body><u:' + action + 'Response>' +
        (action === 'GetExternalIPAddress' ? '<NewExternalIPAddress>203.0.113.7</NewExternalIPAddress>' : '') +
        '</u:' + action + 'Response></s:Body></s:Envelope>');
    });
  });
  httpServer.listen(0, '127.0.0.1', function () {
    var ssdp = dgram.createSocket('udp4');
    var searches = 0;
    ssdp.on('message', function (msg, rinfo) {
      if (!/^M-SEARCH/.test(msg.toString())) return;
      searches++;
      var answer = new Buffer('HTTP/1.1 200 OK\r\nST: urn:schemas-upnp-org:service:WANIPConnection:1\r\nLOCATION: http://127.0.0.1:' +
        httpServer.address().port + '/desc.xml\r\n\r\n');
      ssdp.send(answer, 0, answer.length, rinfo.port, rinfo.address);
    });
    ssdp.bind(0, '127.0.0.1', function () {
      var context = { require: require, process: process, Buffer: Buffer, setTimeout: setTimeout, clearTimeout: clearTimeout, console: console };
      vm.runInNewContext(fs.readFileSync(path.join(root, 'service/upnp.js'), 'utf8'), context);
      var upnp = context.TV_UPNP;
      upnp.configure({ ssdpHost: '127.0.0.1', ssdpPort: ssdp.address().port, timeout: 1500 });
      upnp.map(6881, ['TCP', 'UDP'], 3600, 'Kai Turbo TV test', function (err, mapping) {
        if (err) return cb(err);
        try {
          check(searches >= 1, 'no SSDP search received');
          var adds = actions.filter(function (a) { return a.action === 'AddPortMapping'; });
          check(adds.length === 2, 'expected TCP and UDP mappings');
          check(adds.every(function (a) { return a.path === '/ctl/IPConn'; }), 'wrong control URL');
          check(/<NewProtocol>TCP<\/NewProtocol>/.test(adds[0].body) && /<NewProtocol>UDP<\/NewProtocol>/.test(adds[1].body), 'protocols');
          check(/<NewExternalPort>6881<\/NewExternalPort>/.test(adds[0].body) && /<NewInternalPort>6881<\/NewInternalPort>/.test(adds[0].body), 'ports');
          check(/<NewLeaseDuration>3600<\/NewLeaseDuration>/.test(adds[0].body), 'lease');
          check(/<NewInternalClient>\d+\.\d+\.\d+\.\d+<\/NewInternalClient>/.test(adds[0].body), 'internal client');
        } catch (e) { return cb(e); }
        upnp.externalIp(function (err2, ip) {
          if (err2) return cb(err2);
          upnp.unmap(6881, ['TCP', 'UDP'], function () {
            try {
              check(ip === '203.0.113.7', 'external IP');
              check(actions.filter(function (a) { return a.action === 'DeletePortMapping'; }).length === 2, 'unmap');
            } catch (e) { return cb(e); }
            results.upnp = { mapped: mapping.protocols, client: !!mapping.client, externalIp: ip };
            // No gateway at all: a clear error within the timeout, no hang.
            upnp.configure({ ssdpHost: '127.0.0.1', ssdpPort: 9, timeout: 300 });
            upnp.map(6881, ['TCP'], 60, 'x', function (err3) {
              try { check(err3 && /no UPnP gateway/.test(err3.message), 'missing-gateway error'); } catch (e) { return cb(e); }
              ssdp.close(); httpServer.close(); cb();
            });
          });
        });
      });
    });
  });
}

// ---------- 2. uTP fallback when a peer refuses TCP but speaks uTP ----------
function testUtpFallback(cb) {
  var pws = require(path.join(root, 'service/vendor/torrent-stream/lib/peer-wire-swarm.cjs'));
  var infoHash = crypto.randomBytes(20);
  // A port with nothing on TCP, but a uTP BitTorrent peer on UDP (picked by binding UDP first,
  // since some systems reserve UDP ranges that a TCP probe would not reveal).
  var probe = dgram.createSocket('udp4');
  probe.bind(0, function () {
    var port = probe.address().port;
    probe.close(function () {
      var server = utp.createServer(function (connection) {
        var wire = protocol();
        connection.pipe(wire).pipe(connection);
        wire.on('error', function () {});
        wire.on('handshake', function (hash) { wire.handshake(hash, new Buffer('-KT0001-utp000000000')); });
      });
      server.listen(port, function () {
        var swarm = pws(infoHash, new Buffer('-KT0001-tv0000000000'), { size: 5, utpFallback: true, connectTimeout: 3000 });
        var fallbacks = 0;
        swarm.on('utp-fallback', function () { fallbacks++; });
        swarm.on('wire', function (wire) {
          try {
            check(wire.transport === 'utp', 'expected a uTP wire, got ' + wire.transport);
            check(fallbacks === 1, 'expected one fallback');
            check(swarm.kaiNetwork.tcpAttempts >= 1 && swarm.kaiNetwork.utpAttempts === 1, 'transport attempt counters');
            check(swarm.kaiNetwork.refused >= 1 && swarm.kaiNetwork.handshakes === 1, 'refusal and handshake counters');
          } catch (e) { return cb(e); }
          results.utpFallback = { transport: wire.transport, fallbacks: fallbacks };
          swarm.destroy();
          try { server.close(); } catch (e) { /* closed */ }
          cb();
        });
        swarm.add('127.0.0.1:' + port);
      });
    });
  });
}

// ---------- 3. Incoming connection into the real engine (listen) ----------
function testIncoming(cb) {
  var pieceLength = 1024 * 1024, count = 4, hashes = [];
  for (var i = 0; i < count; i++) { var block = new Buffer(pieceLength); block.fill(i + 1); hashes.push(crypto.createHash('sha1').update(block).digest()); }
  var info = bencode.encode({ name: new Buffer('incoming.mkv'), length: pieceLength * count, 'piece length': pieceLength, pieces: Buffer.concat(hashes) });
  var hash = crypto.createHash('sha1').update(info).digest('hex');
  var torrent = Buffer.concat([new Buffer('d4:info'), info, new Buffer('e')]);
  var bundle = fs.readFileSync(path.join(root, 'dist/player-service.js'), 'utf8');
  // The bundle targets Node 4; newer Node removed os.tmpDir, so provide it when testing there.
  var os = require('os');
  var osShim = Object.assign({}, os, { tmpDir: os.tmpDir || os.tmpdir });
  var context = { require: function (id) { return id === 'os' ? osShim : require(id); }, process: process, Buffer: Buffer, setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval, console: console };
  vm.runInNewContext(bundle.slice(0, bundle.indexOf('// Phone remote + header proxy')), context);
  context.TV_UPNP.configure({ ssdpHost: '127.0.0.1', ssdpPort: 9, timeout: 200 });
  var original = context.TorrentEngine, engine;
  context.TorrentEngine = function (link, opts) {
    opts.dht = false; opts.tracker = false;
    engine = original(torrent, opts);
    return engine;
  };
  context.TorrentEngine.DHT = original.DHT;
  context.TV_TORRENT.create({ infoHash: hash, fileIdx: 0 }, function (err, result) {
    if (err) return cb(err);
    var wait = setInterval(function () {
      if (!engine.diag.listenPort) return;
      clearInterval(wait);
      var requests = 0;
      var socket = net.connect(engine.diag.listenPort, '127.0.0.1');
      var wire = protocol();
      socket.pipe(wire).pipe(socket);
      wire.on('error', function () {}); socket.on('error', function () {});
      wire.handshake(new Buffer(hash, 'hex'), new Buffer('-KT0001-seed00000000'));
      wire.on('handshake', function () { wire.bitfield({ buffer: new Buffer([0xf0]) }); wire.unchoke(); });
      wire.on('request', function (index, offset, length, reply) { requests++; var data = new Buffer(length); data.fill(index + 1); reply(null, data); });
      var poll = setInterval(function () {
        if (!engine.bitfield.get(0)) return;
        clearInterval(poll);
        var stats = context.TV_TORRENT.stats(result.id);
        try {
          check(stats.diag.incoming >= 1, 'incoming wire not counted');
          check(stats.network.transport.handshakes >= 1, 'debug funnel handshake');
          check(stats.network.bySource.incoming.everSent === 1, 'debug payload source');
          check(stats.diag.listenPort === engine.diag.listenPort, 'listen port');
          check(stats.diag.upnp !== 'mapped', 'UPnP must not reach a router in tests');
          var own = '127.0.0.1:' + engine.diag.listenPort;
          check(stats.goodPeers.indexOf(own) < 0, 'recorded our own listening address as a peer');
          check(stats.goodPeers.length === 1 && /^127\.0\.0\.1:\d+$/.test(stats.goodPeers[0]), 'remote peer address: ' + stats.goodPeers);
        } catch (e) { return cb(e); }
        results.incoming = { listenPort: !!engine.diag.listenPort, incoming: stats.diag.incoming, requests: requests, upnp: stats.diag.upnp };
        socket.destroy();
        context.TV_TORRENT.destroyAll();
        cb();
      }, 20);
    }, 20);
  });
}

// ---------- 4. PEX: peers from a ut_pex message are connected ----------
function testPex(cb) {
  var exchange = require(path.join(root, 'service/vendor/torrent-stream/lib/exchange-metadata.cjs'));
  var EventEmitter = require('events').EventEmitter;
  var engine = new EventEmitter(), connects = [], sent = [];
  engine.connect = function (addr) { connects.push(addr); };
  var wire = new EventEmitter();
  wire.extended = function (id, msg) { sent.push({ id: id, msg: msg }); };
  wire.peerExtensions = { extended: true };
  exchange(engine, function () {})(wire);
  var added = new Buffer([10, 0, 0, 1, 0x1a, 0xe1, 192, 168, 1, 20, 0xc8, 0xd5, 1, 2, 3, 4, 0, 0]);
  wire.emit('extended', 2, bencode.encode({ added: added }));
  wire.emit('extended', 2, new Buffer('not bencode'));
  try {
    check(sent.length === 1 && sent[0].id === 0 && sent[0].msg.m.ut_pex === 2, 'handshake must advertise ut_pex');
    check(connects.join(',') === '10.0.0.1:6881,192.168.1.20:51413', 'pex peers: ' + connects.join(','));
  } catch (e) { return cb(e); }
  results.pex = { connects: connects.length };
  cb();
}

testUpnp(function (e1) {
  if (e1) return done(e1);
  testPex(function (e2) {
    if (e2) return done(e2);
    testUtpFallback(function (e3) {
      if (e3) return done(e3);
      testIncoming(function (e4) { done(e4); });
    });
  });
});
