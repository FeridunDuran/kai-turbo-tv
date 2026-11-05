import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { createTizenVideo, createVideo } from '../../src/js/lib/tizenvideo.js';

function fakeDocument() {
  return {
    createElement(tag) {
      const el = new EventTarget();
      el.tagName = tag; el.style = {};
      el.removeAttribute = () => {};
      return el;
    },
    createEvent() { return { initEvent(name) { this.type = name; } }; },
  };
}
function nativeFixture() {
  const doc = fakeDocument();
  doc.createEvent = () => ({ initEvent(name) { this.name = name; } });
  const create = doc.createElement;
  doc.createElement = (tag) => {
    const el = create(tag);
    const events = {};
    el.addEventListener = (name, fn) => { (events[name] ||= []).push(fn); };
    el.dispatchEvent = (ev) => { (events[ev.name] || []).forEach((fn) => fn()); };
    return el;
  };
  const calls = [], prepares = [], listeners = [];
  let selected = 3;
  const api = {
    close() { calls.push(['close']); }, open(url) { calls.push(['open', url]); },
    setDisplayRect() {}, setDisplayMethod() {},
    setBufferingParam(...args) { calls.push(args); }, setTimeoutForBuffering() {},
    setListener(cb) { listeners.push(cb); }, prepareAsync(ok, fail) { prepares.push({ ok, fail }); },
    getDuration: () => 120000, setSilentSubtitle() {},
    getCurrentStreamInfo: () => [{ type: 'AUDIO', index: selected }],
    getTotalTrackInfo: () => [
      { type: 'VIDEO', index: 0 },
      { type: 'AUDIO', index: 3, extra_info: '{"language":"en","fourCC":"AACL","channels":"2"}' },
      { type: 'AUDIO', index: 7, extra_info: '{}' },
    ],
    play() { calls.push(['play']); }, pause() {},
    seekTo(ms, ok) { calls.push(['seek', ms]); ok(); },
    setSelectTrack(kind, index) { selected = index; calls.push([kind, index]); },
  };
  return { el: createTizenVideo(api, doc), calls, prepares, listeners };
}

test('native playback opens once; preserves real audio indices, seek and pause', () => {
  const { el, calls, prepares, listeners } = nativeFixture();
  let playing = 0;
  el.addEventListener('playing', () => playing++);
  el.autoplay = true;
  el.src = 'https://example.test/master.m3u8'; el.load();
  prepares[0].ok();
  listeners[0].oncurrentplaytime(2000);
  listeners[0].oncurrentplaytime(2500);
  assert.equal(playing, 1);
  assert.equal(el.currentTime, 2.5);
  assert.equal(el.duration, 120);
  assert.equal(el.paused, false);
  assert.equal(calls.filter((c) => c[0] === 'open').length, 1);
  assert.equal(el.audioTracks[0].language, 'en');
  assert.match(el.audioTracks[0].label, /AACL/);
  el.selectAudio(1);
  assert.deepEqual(calls.at(-1), ['AUDIO', 7]);
  assert.equal(el.audioTracks[1].enabled, true);
  el.currentTime = 20;
  assert.equal(el.currentTime, 20);
  assert.equal(el.seeking, false);
  el.pause(); assert.equal(el.paused, true);
  el.dispose();
});

test('late native prepare/error/time callbacks cannot revive a replaced or disposed stream', () => {
  const { el, calls, prepares, listeners } = nativeFixture();
  let errors = 0;
  el.addEventListener('error', () => errors++);
  el.autoplay = true;
  el.src = 'https://example.test/old';
  el.src = 'https://example.test/new';
  prepares[0].ok(); listeners[0].onerror('PLAYER_ERROR_CONNECTION_FAILED');
  assert.equal(errors, 0);
  assert.equal(calls.filter((c) => c[0] === 'play').length, 0);
  prepares[1].ok();
  el.removeAttribute('src'); el.load();
  listeners[1].oncurrentplaytime(99000);
  assert.equal(el.currentTime, 0);
  assert.equal(el.paused, true);
});

test('outside Samsung the native HTML player is preserved', () => {
  assert.equal(createVideo(fakeDocument()).tagName, 'video');
});

function playerFixture(fallbacks = [], torrent = false) {
  const pending = [], rejected = [], menus = [], timers = new Map();
  let pauseCalls = 0;
  let timerId = 0, view;
  const node = () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild() {}, removeAttribute() {}, setAttribute() {}, textContent: '' });
  const video = Object.assign(node(), { paused: true, currentTime: 0, duration: NaN, readyState: 0,
    addEventListener() {}, load() {}, pause() { pauseCalls++; }, removeAttribute() { this.src = ''; } });
  const settings = {};
  const mocks = {
    dom: { h: node, clear() {} }, nav: { KEY: {}, focus() {}, current() {} },
    luna: { closeHeavyBackgroundApps: () => Promise.resolve([]) },
    subs: { Renderer: () => ({ clear() {} }) }, substyle: { apply() {} },
    store: { settings: () => settings }, log: { log: { info() {}, warn() {} } }, http: {}, mediaerror: {},
    server: { isTorrent: () => torrent, toPlayable: () => new Promise((resolve, reject) => { pending.push(resolve); rejected.push(reject); }) },
    tvproxy: { isTorrentAvailable: () => true, torrentStats: () => Promise.resolve(null) },
    addons: { fetchSubtitles: () => Promise.resolve() }, stremio: {}, skip: {},
    ui: { menu: (...args) => menus.push(args), toast() {}, fmtTime: () => '0:00', timeHM: () => '0:00' },
    router: { push(v) { view = v; v.onShow(); }, tabView() {} }, details: {},
    i18n: { t: (text, args) => text.replace('{n}', args && args.n), epLabel() {} }, watched: {},
    phone: { onSeek() {}, nowPlaying() {} }, tizenvideo: { createVideo: () => video },
  };
  const source = fs.readFileSync(new URL('../../src/js/views/player.js', import.meta.url), 'utf8')
    .replace(/^import \* as (\w+) from '[^']*\/([^/]+)\.js';/gm, 'const $1 = mocks["$2"];')
    .replace(/^import \{ ([^}]+) \} from '[^']*\/([^/]+)\.js';/gm, 'const { $1 } = mocks["$2"];')
    .replace(/export function /g, 'function ');
  const context = { mocks, document: { createTextNode() {} }, __KAI_DEVLOG__: '',
    Promise, Date, setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: (id) => timers.delete(id), setInterval: () => 0, clearInterval() {} };
  vm.runInNewContext(source, context);
  context.openPlayer({ meta: { name: 'Test' }, video: { id: 'test' }, stream: { url: 'old' }, fallbacks });
  return { video, pending, rejected, menus, timers, view, get pauseCalls() { return pauseCalls; }, expire() {
    const entry = [...timers.entries()].find(([, timer]) => timer.ms === (torrent ? 30000 : 120000));
    assert.ok(entry, 'HTTP startup deadline is armed');
    timers.delete(entry[0]); entry[1].fn();
  } };
}

test('HTTP startup deadline stops loading and ignores a late resolved URL', async () => {
  const fixture = playerFixture();
  assert.ok([...fixture.timers.values()].some((timer) => timer.ms === 120000));
  assert.ok(![...fixture.timers.values()].some((timer) => timer.ms === 15000));
  fixture.expire();
  assert.equal(fixture.menus.length, 0);
  assert.equal(fixture.video.src, '');
  fixture.pending[0]({ url: 'https://late.invalid/video', viaServer: false });
  await Promise.resolve();
  assert.equal(fixture.video.src, '');
  fixture.view.destroy();
});

test('torrent service failure keeps player controls without an automatic Sources/Back modal', async () => {
  const fixture = playerFixture();
  fixture.rejected[0](new Error('TV torrent service unreachable'));
  await new Promise(setImmediate);
  assert.equal(fixture.menus.length, 0);
  assert.equal(fixture.pauseCalls, 1);
  fixture.view.destroy();
});

test('Smart Choice startup timeout advances once and rejects the previous attempt', async () => {
  const fixture = playerFixture([{ url: 'backup' }]);
  fixture.expire();
  assert.equal(fixture.pending.length, 2);
  fixture.pending[0]({ url: 'https://late.invalid/video' });
  fixture.pending[1]({ url: 'https://backup.invalid/video', viaServer: false });
  await Promise.resolve();
  assert.equal(fixture.video.src, 'https://backup.invalid/video');
  assert.equal(fixture.menus.length, 0);
  fixture.view.destroy();
});

test('proxy bootstrap pins the app revision and coalesces concurrent checks', async () => {
  const commands = [];
  let running = false, probes = 0, engineProbes = 0;
  const context = { store: { get: (k, d) => d, set() {} },
    Promise, Date, encodeURIComponent, log: { info() {} },
    window: { __KAI_BASE__: 'https://cdn.jsdelivr.net/gh/FeridunDuran/stremio-kai-tizen@' + 'a'.repeat(40) + '/dist/' },
    location: { pathname: '/module/gh%2FFeridunDuran%2Fstremio-kai-tizen/dist/index.html' },
    setTimeout: (fn, ms) => setTimeout(fn, ms === 500 ? 0 : ms), clearTimeout,
    XMLHttpRequest: class {
      open(method, url) { this.url = url; }
      send() {
        probes++;
        queueMicrotask(() => {
          this.status = 200;
          // The old proxy still answers on 8096; the new torrent player starts later on 8097.
          const playerPort = this.url.includes(':8097');
          if (playerPort) engineProbes++;
          const ready = playerPort ? running && engineProbes > 1 : this.url.includes(':8096');
          this.responseText = JSON.stringify({ proxy: ready ? 1 : 0, torrent: ready && playerPort ? 1 : 0 });
          this.onload();
        });
      }
    },
    WebSocket: class {
      constructor() { queueMicrotask(() => this.onopen()); }
      send(command) { commands.push(JSON.parse(command)); running = true; }
      close() {}
    },
  };
  const source = fs.readFileSync(new URL('../../src/js/api/tvproxy.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function ');
  vm.runInNewContext(source, context);
  const a = context.check(), b = context.check();
  assert.equal(a, b);
  assert.equal((await a).ok, true);
  assert.equal((await context.lastStatus()).torrent, true);
  assert.equal(commands.length, 1);
  assert.equal(commands[0].payload.fullName, 'gh/FeridunDuran/stremio-kai-tizen@' + 'a'.repeat(40));
  assert.equal(commands[0].payload.serviceFile, 'dist/player-service.js');
  assert.equal(probes, 4);
  await context.ensure();
  assert.equal(probes, 4);
  assert.match(context.proxyUrl('https://test.invalid/video', { Referer: 'https://test.invalid/' }), /^http:\/\/127\.0\.0\.1:8097\/proxy/);
});

test('real local proxy preserves HLS audio/key/map headers even on ranged manifests', async () => {
  const requests = [];
  let segmentFinished = false;
  const upstream = http.createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers });
    if (req.headers.referer !== 'https://required.test/') { res.writeHead(403); res.end(); return; }
    if (req.url === '/slow.ts') {
      res.writeHead(200, { 'Content-Type': 'video/mp2t' });
      res.write('first');
      setTimeout(() => { segmentFinished = true; res.end('last'); }, 250);
    } else if (req.url === '/master.m3u8' || req.url === '/audio.m3u8') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.end(req.url === '/master.m3u8'
        ? '#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",URI="audio.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=5700000,AUDIO="aud"\nvideo.m3u8\n'
        : '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:4,\naudio.aac\n');
    } else {
      res.writeHead(req.headers.range ? 206 : 200, { 'Content-Type': 'audio/aac' }); res.end('bytes');
    }
  });
  upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  const context = { PLAYER_SERVICE: true, require: createRequire(import.meta.url), Buffer, setTimeout, clearTimeout, console };
  const script = fs.readFileSync(new URL('../../service/remote-service.js', import.meta.url), 'utf8');
  vm.runInNewContext(script, context);
  const proxy = context.server;
  try {
    if (!proxy.listening) await once(proxy, 'listening');
    const root = `http://127.0.0.1:${upstream.address().port}/`;
    const url = 'http://127.0.0.1:8097/proxy/stream.m3u8?u=' + encodeURIComponent(root + 'master.m3u8') + '&h=' + encodeURIComponent(JSON.stringify({ Referer: 'https://required.test/' }));
    const master = await (await fetch(url, { headers: { Range: 'bytes=0-100' } })).text();
    assert.match(master, /#EXT-X-STREAM-INF/);
    assert.equal(requests[0].headers.range, undefined);
    const audio = master.match(/URI="([^"]+)"/)[1];
    assert.match(audio, /^http:\/\/127\.0\.0\.1:8097\/proxy\/stream\.m3u8\?/);
    const playlist = await (await fetch(audio, { headers: { Range: 'bytes=0-100' } })).text();
    const key = playlist.match(/URI="([^"]+)"/)[1];
    const segment = playlist.trim().split('\n').at(-1);
    assert.equal((await fetch(key)).status, 200);
    assert.equal((await fetch(segment, { headers: { Range: 'bytes=2-6' } })).status, 206);
    assert.equal(requests.at(-1).headers.range, 'bytes=2-6');
    assert.ok(requests.every((r) => r.headers.referer === 'https://required.test/'));
    // Media must be delivered immediately, without buffering an entire segment
    // in the TV proxy. Only the small manifest needs a complete body for rewriting.
    const slowURL = 'http://127.0.0.1:8097/proxy?u=' + encodeURIComponent(root + 'slow.ts') + '&h=' + encodeURIComponent(JSON.stringify({ Referer: 'https://required.test/' }));
    const response = await fetch(slowURL);
    const reader = response.body.getReader();
    const first = await reader.read();
    assert.equal(Buffer.from(first.value).toString(), 'first');
    assert.equal(segmentFinished, false, 'first bytes arrive before upstream completes');
    while (!(await reader.read()).done) { /* consume remaining bytes */ }
  } finally {
    context.HTTP_AGENT.destroy(); context.HTTPS_AGENT.destroy();
    await Promise.all([new Promise((r) => proxy.close(r)), new Promise((r) => upstream.close(r))]);
  }
});


test("torrent has no absolute startup deadline while service tracks download progress",()=>{const f=playerFixture([],true);assert.equal([...f.timers.values()].some(t=>t.ms===30000||t.ms===120000),false);f.view.destroy();});


test('ready TV torrent service does not wait for unresponsive legacy proxy ports', async () => {
 const pending=[];
 const context={Promise,Date,JSON,Error,log:{info(){},warn(){}},window:{},location:{pathname:'/'},setTimeout,clearTimeout,
 XMLHttpRequest:class {open(method,url){this.url=url;}send(){pending.push(this);}}};
 const source=fs.readFileSync(new URL('../../src/js/api/tvproxy.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');
 vm.runInNewContext(source,context);
 const first=context.check(true),second=context.check(true);assert.equal(first,second);assert.equal(pending.length,3);
 const player=pending.find(x=>x.url.includes(':8097/'));player.status=200;player.responseText=JSON.stringify({proxy:1,torrent:1});player.onload();
 const status=await first;assert.equal(status.torrent,true);assert.equal(status.ok,true);
 // Neither legacy probe has completed; their later failures must not overwrite readiness.
 pending.filter(x=>x!==player).forEach(x=>x.onerror());await Promise.resolve();assert.equal(context.isTorrentAvailable(),true);
});
