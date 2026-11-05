import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';

function runtime() {
  const engines = [], timers = [];
  const context = { process, Buffer, require: (id) => id === 'os' ? { tmpdir: () => '/tmp' } : {},
    setInterval() {}, clearTimeout(timer) { timer.cleared = true; },
    setTimeout(fn, ms) { const timer = { fn, ms }; timers.push(timer); return timer; },
    TorrentEngine: function (magnet, options) {
      const engine = new EventEmitter();
      Object.assign(engine, { magnet, options, peers: [], destroyed: false,
        connect(peer) { this.peers.push(peer); }, destroy() { this.destroyed = true; } });
      engines.push(engine); return engine;
    },
  };
  vm.runInNewContext(fs.readFileSync(new URL('../../service/torrent.js', import.meta.url), 'utf8'), context);
  return { api: context.TV_TORRENT, engines, timers };
}

test('metadata discovery includes HTTP alternatives and preserves addon trackers and peer hints', () => {
  const { api, engines, timers } = runtime();
  api.create({ infoHash: 'a'.repeat(40), sources: ['tracker:https://tracker.example/announce', 'peer:1.2.3.4:6881', 'dht:ignored'] }, () => {});
  const engine = engines[0];
  const trackers = new URL(engine.magnet).searchParams.getAll('tr');
  assert.ok(trackers.some((url) => url.startsWith('http://')));
  assert.ok(trackers.some((url) => url.startsWith('udp://')));
  assert.ok(trackers.includes('https://tracker.example/announce'));
  assert.deepEqual(engine.peers, ['1.2.3.4:6881']);
  assert.equal(timers[0].ms, 120000);
});

test('metadata deadline distinguishes socket attempts from completed handshakes', () => {
  for (const [events, expected] of [
    [[], /no peers found/],
    [['peer', 'wire'], /no BitTorrent handshake/],
    [['peer', 'wire', 'handshake'], /did not supply complete metadata/],
  ]) {
    const { api, engines, timers } = runtime(); let error, calls = 0;
    api.create({ infoHash: 'a'.repeat(40) }, (err) => { error = err; calls++; });
    for (const event of events) {
      if (event === 'wire') {
        const wire = { once(name, callback) { this.handshake = callback; } };
        engines[0].emit('wire', wire);
        engines[0].testWire = wire;
      } else if (event === 'handshake') engines[0].testWire.handshake();
      else engines[0].emit(event);
    }
    timers[0].fn();
    assert.match(error.message, /after 120 seconds/);
    assert.match(error.message, expected);
    assert.equal(engines[0].destroyed, true);
    engines[0].emit('error', new Error('late'));
    assert.equal(calls, 1);
  }
});
