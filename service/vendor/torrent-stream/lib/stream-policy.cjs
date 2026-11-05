// Bounded streaming policy; ES5 for the TV Node 4 runtime.
// Outstanding 16 KiB block requests per peer: three seconds of measured throughput (libtorrent's
// default request_queue_time) plus two blocks, as in WebTorrent's getBlockPipelineLength. Without
// that slack a peer with a long round trip is held to the rate its own small queue allows and
// never grows (the previous 0.75 s formula fell back to 2 blocks above 0.75 s RTT). The per-peer
// cap is 64 blocks (1 MiB); the engine-wide MAX_ACTIVE_BLOCKS cap still bounds the total. A
// peer's advertised reqq (BEP 10 extended handshake) is honoured when it is lower.
exports.MAX_PEER_BLOCKS = 64;
exports.pipeline = function (speed, reqq) {
  var length = (!(speed > 0) || !isFinite(speed)) ? 5 : Math.min(exports.MAX_PEER_BLOCKS, 2 + Math.ceil(speed * 3 / 16384));
  if (typeof reqq === 'number' && reqq > 0) length = Math.min(length, reqq);
  return Math.max(1, length);
};
exports.recovery = function (requests, wires, urgent, now) {
  for (var i = 0; i < requests.length; i++) {
    var request = requests[i];
    if (!urgent[request.index] || request.retried) continue;
    var oldSpeed = request.wire.downloadSpeed() || 0;
    var deadline = Math.max(4000, Math.min(15000, 2 * 16384 / Math.max(1, oldSpeed) * 1000));
    if (now - request.at < deadline) continue;
    var best = null;
    for (var j = 0; j < wires.length; j++) {
      var wire = wires[j], speed = wire.downloadSpeed() || 0;
      if (wire === request.wire || wire.peerChoking || !wire.peerPieces[request.index]) continue;
      if (speed <= Math.max(16384, oldSpeed * 1.5) || wire.requests.length >= exports.pipeline(speed, wire.peerReqq)) continue;
      if (wire.requests.some(function (r) { return r.piece === request.index && r.offset === request.offset; })) continue;
      if (!best || speed > best.downloadSpeed()) best = wire;
    }
    if (best) return { request: request, wire: best };
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
