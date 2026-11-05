// Bounded per-swarm history. Repeated discovery offers cannot reset failure cooldowns.
function Policy(limit) { this.limit = limit || 512; this.entries = {}; this.evictions = 0; }
Policy.prototype.get = function (addr, now) {
  var e = this.entries[addr];
  if (e && now - e.at > 1800000) { delete this.entries[addr]; return null; }
  return e || null;
};
Policy.prototype.put = function (addr, entry) {
  this.entries[addr] = entry;
  var keys = Object.keys(this.entries), self = this;
  if (keys.length > this.limit) {
    keys.sort(function (a, b) { return self.entries[a].at - self.entries[b].at; });
    delete this.entries[keys[0]]; this.evictions++;
  }
};
Policy.prototype.wait = function (addr, now) {
  var e = this.get(addr, now);
  return e ? Math.max(0, e.until - now) : 0;
};
Policy.prototype.failed = function (addr, now) {
  var old = this.get(addr, now), failures = old ? old.failures + 1 : 1;
  var delays = [15000, 45000, 120000, 300000];
  this.put(addr, { at: now, failures: failures, good: !!(old && old.good), until: now + delays[Math.min(failures - 1, delays.length - 1)] });
};
Policy.prototype.success = function (addr, now) {
  this.put(addr, { at: now, failures: 0, good: true, until: 0 });
};
Policy.prototype.tier = function (addr, source, now) {
  var e = this.get(addr, now);
  if (e && e.failures > 1) return 0;
  if (source === 'hint' || (e && e.good)) return 3;
  return e && e.failures ? 0 : 1;
};
module.exports = Policy;
