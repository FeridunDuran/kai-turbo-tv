// Bounded streaming policy; ES5 for the TV Node 4 runtime.
// Outstanding 16 KiB block requests per peer: three seconds of measured throughput (libtorrent's
// default request_queue_time) plus two blocks, as in WebTorrent's getBlockPipelineLength. Without
// that slack a peer with a long round trip is held to the rate its own small queue allows and
// never grows (the previous 0.75 s formula fell back to 2 blocks above 0.75 s RTT). The per-peer
// cap is 250 blocks; the engine-wide MAX_ACTIVE_BLOCKS cap still bounds the total. A
// peer's advertised reqq (BEP 10 extended handshake) is honoured when it is lower.
// TV trace: one fast peer delivered nearly all data and sat at exactly 64 outstanding blocks
// (1 MiB), which at a 0.4 s round trip caps it near 2.5 MB/s, about the file's bitrate, so every
// dip became a rebuffer. libtorrent allows 500 (max_out_request_queue) and WebTorrent only the
// peer's reqq. Outstanding requests allocate nothing; RAM is bounded by the piece window.
exports.MAX_PEER_BLOCKS = 250;
exports.pipeline = function (speed, reqq) {
  var length = (!(speed > 0) || !isFinite(speed)) ? 5 : Math.min(exports.MAX_PEER_BLOCKS, 2 + Math.ceil(speed * 3 / 16384));
  if (typeof reqq === 'number' && reqq > 0) length = Math.min(length, reqq);
  return Math.max(1, length);
};
exports.recovery = function (requests, wires, urgent, now, finishing) {
  for (var i = 0; i < requests.length; i++) {
    var request = requests[i];
    if (!urgent[request.index] || request.retried) continue;
    var oldSpeed = request.wire.downloadSpeed() || 0;
    var nearEnd = finishing && finishing[request.index];
    var deadline = nearEnd ? 2000 : Math.max(4000, Math.min(15000, 2 * 16384 / Math.max(1, oldSpeed) * 1000));
    if (now - request.at < deadline) continue;
    var best = null, bestTime = Infinity;
    var oldTime = exports.deliveryTime(request.wire, request);
    for (var j = 0; j < wires.length; j++) {
      var wire = wires[j], speed = wire.downloadSpeed() || 0;
      if (wire === request.wire || !exports.available(wire, request.index) || speed < 16384) continue;
      if (wire.requests.some(function (r) { return r.piece === request.index && r.offset === request.offset; })) continue;
      var time = exports.deliveryTime(wire);
      if (time + 0.25 >= oldTime || time >= bestTime) continue;
      best = wire; bestTime = time;
    }
    if (best) return { request: request, wire: best, finishing: !!nearEnd };
  }
  return null;
};

// Blocks of time-critical (playhead) pieces one peer may hold. libtorrent stops queueing a
// time-critical request on a peer whose estimated queue time exceeds two seconds, so a slow peer
// cannot hold the blocks that decide when the playhead piece completes. Its remaining pipeline
// still serves read-ahead pieces. Before a rate is known the normal starting pipeline applies.
exports.criticalLimit = function (speed, reqq) {
  var pipeline = exports.pipeline(speed, reqq);
  if (!(speed > 0) || !isFinite(speed)) return pipeline;
  return Math.max(2, Math.min(pipeline, Math.ceil(speed * 2 / 16384)));
};
exports.criticalCount = function (requests, critical) {
  var count = 0;
  for (var i = 0; i < requests.length; i++) if (critical[requests[i].piece]) count++;
  return count;
};

// libtorrent snubs a peer whose requested blocks have produced no payload for piece_timeout
// (20 s): its queue is cancelled and re-requested elsewhere, and it gets one request at a time.
// Here a peer is only snubbed while another unchoked peer delivered payload in that time, so a
// torrent with a single slow source is not cut off from it.
exports.SNUB_MS = 20000;
exports.snubCandidates = function (wires, now) {
  var active = false;
  var out = [];
  for (var i = 0; i < wires.length; i++) {
    var w = wires[i];
    if (!w.requests.length) { w.waitSince = 0; continue; }
    if (!w.waitSince) w.waitSince = now;
  }
  for (i = 0; i < wires.length; i++) {
    var other = wires[i];
    if (!other.snubbed && !other.peerChoking && other.lastPieceAt && now - other.lastPieceAt < exports.SNUB_MS) active = true;
  }
  if (!active) return out;
  for (i = 0; i < wires.length; i++) {
    var wire = wires[i];
    if (wire.snubbed || wire.peerChoking || !wire.requests.length) continue;
    var since = Math.max(wire.lastPieceAt || 0, wire.waitSince || now);
    if (now - since > exports.SNUB_MS) out.push(wire);
  }
  return out;
};



// Speculative priority-zero work must not fill a peer queue ahead of the playhead.
exports.prefetchAllowed = function (active, selections, index, wire) {
  var priority = -1;
  for (var i = 0; i < selections.length; i++) {
    var s = selections[i];
    if (index >= s.from && index <= s.to) priority = Math.max(priority, s.priority);
  }
  if (priority !== 0) return true;
  var total = 0, held = 0;
  for (i = 0; i < active.length; i++) {
    var r = active[i];
    if (r.index !== index) continue;
    total++;
    if (r.wire === wire) held++;
  }
  return held < 2 && total < 16;
};


exports.rotationCandidate = function (wires, queued, size, now) {
  if (!queued || wires.length < size - 2) return null;
  var candidate = null;
  for (var i = 0; i < wires.length; i++) {
    var w = wires[i];
    // Never evict a peer that has delivered payload, or interrupt pending requests.
    if (w.lastPieceAt || !w.peerChoking || (w.requests || []).length || !w.kaiConnectedAt) continue;
    if (now - w.kaiConnectedAt < 90000) continue;
    if (!candidate || w.kaiConnectedAt < candidate.kaiConnectedAt) candidate = w;
  }
  return candidate;
};


// Estimate next-block delivery using queued bytes and the peer's best observed response time.
// Unknown peers keep a conservative estimate and are still given one validation block.
exports.deliveryTime = function (wire, request) {
  if (wire.peerChoking || wire.snubbed) return Infinity;
  var speed = wire.downloadSpeed() || 65536;
  var bytes = 16384;
  var requests = wire.requests || [];
  for (var i = 0; i < requests.length; i++) {
    var r = requests[i];
    if (request && r.piece === request.index && r.offset === request.offset) break;
    bytes += r.length || 16384;
  }
  return bytes / Math.max(1, speed) + (wire.kaiLatencyMs || 0) / 1000;
};
exports.available = function (wire, index) {
  return !wire.peerChoking && !wire.snubbed && wire.peerPieces[index] &&
    wire.requests.length < exports.pipeline(wire.downloadSpeed(), wire.peerReqq);
};
exports.preferCurrent = function (wire, index, wires, missing) {
  var speed = wire.downloadSpeed() || 0;
  var current = exports.deliveryTime(wire);
  for (var i = 0; i < wires.length; i++) {
    var other = wires[i], otherSpeed = other.downloadSpeed() || 0;
    if (other === wire || !exports.available(other, index) || otherSpeed <= speed) continue;
    // Reserve a small remainder for a genuinely available peer, not a blocked historical speed.
    if (otherSpeed * 2 >= missing && exports.deliveryTime(other) + 0.1 < current) return false;
  }
  return true;
};
