// Address-free discovery funnel; ES5 for Node 4. No extra network requests or timers.
module.exports = function (engine, discovery, swarm, infoHash) {
  var started = Date.now();
  var counts = { dhtSignals: 0, trackerSignals: 0, dhtAnnounces: 0, trackerAnnounces: 0,
    warnings: 0, errors: 0, firstDhtMs: null, firstTrackerMs: null };
  var offers = { discovery: 0, pex: 0, hint: 0, retry: 0, external: 0 };
  var accepted = { discovery: 0, pex: 0, hint: 0, retry: 0, external: 0 };
  var tracker = null;
  var failures = { timeout: 0, dns: 0, refused: 0, http4xx: 0, http5xx: 0, other: 0 };
  var trackerProtocols = { udp: 0, http: 0, https: 0, other: 0 };
  var failure = function (err) {
    var text = String(err && (err.code || err.message) || '').toLowerCase();
    var key = /timeout|timed.?out/.test(text) ? 'timeout' : /notfound|eai_again/.test(text) ? 'dns'
      : /refused/.test(text) ? 'refused' : /http.*4[0-9][0-9]/.test(text) ? 'http4xx'
      : /http.*5[0-9][0-9]/.test(text) ? 'http5xx' : 'other';
    failures[key]++;
  };
  var watchTracker = function () {
    var current = discovery.tracker;
    if (!current || typeof current.on !== 'function' || current === tracker) return;
    tracker = current;
    tracker.on('peer', function () {
      counts.trackerSignals++;
      if (counts.firstTrackerMs === null) counts.firstTrackerMs = Date.now() - started;
    });
  };
  var create = discovery._createTracker;
  if (typeof create === 'function') discovery._createTracker = function () {
    var result = create.apply(this, arguments); watchTracker(); return result;
  };
  watchTracker();
  var dht = discovery.dht;
  var onDht = function (peer, hash) {
    if (!hash || hash.toString('hex') !== infoHash) return;
    counts.dhtSignals++;
    if (counts.firstDhtMs === null) counts.firstDhtMs = Date.now() - started;
  };
  if (dht && typeof dht.on === 'function') dht.on('peer', onDht);
  discovery.on('trackerAnnounce', function (data) {
    counts.trackerAnnounces++;
    var protocol = String(data && data.announce || '').split(':')[0];
    if (!Object.prototype.hasOwnProperty.call(trackerProtocols, protocol)) protocol = 'other';
    trackerProtocols[protocol]++;
  });
  discovery.on('dhtAnnounce', function () { counts.dhtAnnounces++; });
  discovery.on('warning', function (err) { counts.warnings++; failure(err); });
  discovery.on('error', function (err) { counts.errors++; failure(err); });
  return {
    offer: function (source, added) {
      if (!Object.prototype.hasOwnProperty.call(offers, source)) source = 'external';
      offers[source]++;
      if (added) accepted[source]++;
    },
    close: function () { if (dht && typeof dht.removeListener === 'function') dht.removeListener('peer', onDht); },
    snapshot: function () {
      var peers = swarm.wires || [], choked = 0, productive = 0, active = 0, waiting = 0;
      var oldestEmptyMs = 0, now = Date.now(), bySource = {};
      ['discovery', 'pex', 'hint', 'retry', 'external', 'incoming'].forEach(function (k) { bySource[k] = { connected: 0, everSent: 0, active5s: 0 }; });
      peers.forEach(function (w) {
        var source = w.incoming ? 'incoming' : w.kaiSource;
        if (!Object.prototype.hasOwnProperty.call(bySource, source)) source = 'external';
        bySource[source].connected++;
        if (w.lastPieceAt) bySource[source].everSent++;
        if (w.lastPieceAt && now - w.lastPieceAt < 5000) bySource[source].active5s++;
        if (w.peerChoking) choked++;
        if (w.lastPieceAt) productive++;
        if (w.lastPieceAt && now - w.lastPieceAt < 5000) active++;
        if (w.requests && w.requests.length && (!w.lastPieceAt || now - w.lastPieceAt >= 5000)) waiting++;
        if (!w.lastPieceAt && w.kaiConnectedAt) oldestEmptyMs = Math.max(oldestEmptyMs, now - w.kaiConnectedAt);
      });
      var queued = swarm.queued || 0, connections = (swarm.connections || []).length;
      var known = Object.keys(swarm._peers || {}), backoff = 0;
      known.forEach(function (addr) { if (swarm._peers[addr].timeout) backoff++; });
      var reason = swarm.paused ? 'paused' : connections >= swarm.size ? 'connection-limit'
        : queued ? 'queue-has-free-slots' : connections > peers.length ? 'awaiting-connection-or-handshake' : 'candidate-queue-empty';
      return { sources: counts, failures: failures, trackerProtocols: trackerProtocols, offers: offers, accepted: accepted, bySource: bySource, transport: swarm.kaiNetwork || null,
        queue: { knownPeers: known.length, retryBackoff: backoff, queued: queued, connections: connections, handshakes: peers.length,
          pending: Math.max(0, connections - peers.length), freeSlots: Math.max(0, swarm.size - connections), reason: reason },
        payload: { choked: choked, everSent: productive, active5s: active, neverSent: peers.length - productive,
          waitingWithoutRecentData: waiting, oldestEmptyMs: oldestEmptyMs } };
    }
  };
};
