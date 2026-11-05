// Bounded streaming policy; ES5 for the TV Node 4 runtime.
exports.pipeline = function (speed) {
  if (!(speed > 0) || !isFinite(speed)) return 5;
  return Math.max(2, Math.min(16, Math.ceil(speed * 0.75 / 16384)));
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
      if (speed <= Math.max(16384, oldSpeed * 1.5) || wire.requests.length >= exports.pipeline(speed)) continue;
      if (wire.requests.some(function (r) { return r.piece === request.index && r.offset === request.offset; })) continue;
      if (!best || speed > best.downloadSpeed()) best = wire;
    }
    if (best) return { request: request, wire: best };
  }
  return null;
};
