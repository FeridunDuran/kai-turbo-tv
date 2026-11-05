import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const flush = () => new Promise(setImmediate);
const KEY = { BACK: 10009, ESC: 27, BACKSPACE: 8, ENTER: 13, PLAY: 415, PAUSE: 19, LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40 };

// Player fixture with controllable clock, torrent statistics and media events.
async function fixture({ torrent = true, startTime = 0, statsSeq = [], fail = false, holdOpen = false } = {}) {
  const nodes = [], events = {}, intervals = new Map(), timers = new Map(), lookups = [], plays = [], toasts = [], logs = [];
  let id = 0, view, focused, popped = 0, playCalls = 0, now = 1000000, statsCalls = 0;
  function h(tag, props = {}, children = []) {
    const node = { tag, children: [], style: {}, textContent: '', html: '', classList: { add() {}, remove() {}, contains() { return false; } },
      setAttribute() {}, removeAttribute() {}, appendChild(child) { this.children.push(child); return child; },
      contains(child) { return this === child || this.children.some((n) => n && n.contains && n.contains(child)); } };
    Object.assign(node, { textContent: (props && props.text) || '', __select: props && props.onSelect });
    Object.defineProperty(node, 'innerHTML', { get() { return this.html; }, set(v) { this.html = v; } });
    node.html = (props && props.html) || '';
    node.children = (Array.isArray(children) ? children : [children]).filter(Boolean);
    nodes.push(node); return node;
  }
  const video = Object.assign(h('video'), { duration: NaN, currentTime: 0, paused: true, seeking: false, ended: false, readyState: 0, networkState: 2,
    buffered: { length: 0 }, addEventListener(name, fn) { (events[name] ||= []).push(fn); }, emit(name) { for (const fn of events[name] || []) fn(); },
    pause() { this.paused = true; this.emit('pause'); }, play() { playCalls++; this.paused = false; return Promise.resolve(); },
    removeAttribute() { this.src = ''; }, load() {} });
  const episode1 = { id: 'tt:1:1', season: 1, episode: 1 }, episode2 = { id: 'tt:1:2', season: 1, episode: 2 };
  const current = torrent ? { infoHash: 'a'.repeat(40), fileIdx: 0, name: 'current', addon: 'Torrentio', behaviorHints: { bingeGroup: 'same' } }
    : { url: 'https://fixture/current', name: 'current' };
  const settings = { skipMode: 'off', audioLangs: [], subtitleLangs: [], subtitlesAuto: false };
  class FakeDate extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const mocks = {
    dom: { h, clear: (n) => { n.children = []; n.textContent = ''; } },
    nav: { KEY, focus: (n) => { focused = n; }, current: () => focused, topLayer: () => ({ root: view && view.el }) },
    luna: { closeHeavyBackgroundApps: () => Promise.resolve([]) },
    subs: { Renderer: () => ({ clear() {}, update() {}, setOffset() {}, set() {}, offset: () => 0 }) }, substyle: { apply() {} },
    store: { settings: () => settings, saveSettings: (patch) => Object.assign(settings, patch), get: () => ({}), set() {} }, log: { log: { info: (...a) => logs.push(a), warn() {} } }, http: {}, mediaerror: {},
    server: { isTorrent: (s) => !!s.infoHash, isPlayableType: (s) => !!(s.infoHash || s.url), isAvailable: () => false,
      toPlayable(s, series) { plays.push({ s, series, startTime: null }); if (holdOpen) return new Promise(() => {}); return fail && plays.length === 1 ? Promise.reject(new Error('open failed')) : Promise.resolve({ url: 'http://127.0.0.1:8097/torrent/' + String(plays.length).repeat(16) }); } },
    tvproxy: { isTorrentAvailable: () => true, torrentStats: () => { statsCalls++; return Promise.resolve(statsSeq.length ? statsSeq.shift() : null); } },
    addons: { fetchStreams(type, episode, callback) { return new Promise((resolve, reject) => lookups.push({ episode, callback, resolve, reject })); }, fetchSubtitles: () => Promise.resolve([]) },
    stremio: { saveProgress() {} }, skip: {},
    ui: { toast: (s) => toasts.push(s), menu() {}, fmtTime: (s) => 't' + Math.round(s), timeHM: () => '' },
    router: { push(v) { view = v; v.onShow(); }, pop() { popped++; }, tabView() {} },
    details: { sortedVideos: (m) => m.videos.slice(), openDetails() {} },
    i18n: { t: (s, args) => s.replace(/\{(\w+)\}/g, (_, k) => (args && args[k] !== undefined ? args[k] : '')), epLabel: (s, e) => s + ':' + e },
    watched: { record() {} }, phone: { onSeek() {}, nowPlaying() {} }, tizenvideo: { createVideo: () => video },
  };
  const context = { mocks, Promise, Date: FakeDate, __KAI_DEVLOG__: '', document: { createTextNode: (text) => ({ textContent: text }) },
    setTimeout(fn, ms) { timers.set(++id, { fn, ms }); return id; }, clearTimeout: (t) => timers.delete(t),
    setInterval(fn, ms) { intervals.set(++id, { fn, ms }); return id; }, clearInterval: (t) => intervals.delete(t) };
  const source = fs.readFileSync(new URL('../../src/js/views/player.js', import.meta.url), 'utf8')
    .replace(/^import \* as (\w+) from '[^']*\/([^/]+)\.js';/gm, 'const $1=mocks["$2"];')
    .replace(/^import \{ ([^}]+) \} from '[^']*\/([^/]+)\.js';/gm, 'const {$1}=mocks["$2"];')
    .replace(/export function /g, 'function ');
  vm.runInNewContext(source, context);
  let changed = null;
  context.openPlayer({ meta: { id: 'tt', type: 'series', name: 'Test', videos: [episode1, episode2] }, video: episode1, stream: current,
    streams: [current], fallbacks: [], isSeries: true, startTime, onVideoChange: (v) => { changed = v; } });
  await flush();
  const byHtml = (text) => nodes.find((n) => n.html.includes(text));
  const tick = () => [...intervals.values()].find((t) => t.ms === 250).fn();
  const watchdog = () => [...intervals.values()].find((t) => t.ms === 2000).fn();
  return { video, nodes, lookups, plays, toasts, logs, view, tick, watchdog, byHtml,
    key: (k) => view.onKey({ keyCode: k }), advance: (ms) => { now += ms; },
    get popped() { return popped; }, get playCalls() { return playCalls; }, get statsCalls() { return statsCalls; }, get changed() { return changed; },
    stageText: () => nodes.filter((n) => n.tag === 'div.p-stage-title' || n.tag === 'div.p-stage-detail').map((n) => n.textContent).join(' | '),
    close: () => view.destroy() };
}

test('slow source with playable data starts at canplay instead of waiting for autoplay HAVE_ENOUGH_DATA', async () => {
  const f = await fixture();
  f.video.duration = 6600; f.video.readyState = 3; f.video.emit('loadedmetadata'); f.video.emit('canplay');
  assert.equal(f.playCalls, 1);
  f.close();
});

test('a pause chosen during loading is respected when playable data arrives', async () => {
  const f = await fixture();
  f.key(KEY.PAUSE);
  f.video.duration = 6600; f.video.emit('loadedmetadata'); f.video.emit('canplay');
  assert.equal(f.playCalls, 0);
  f.close();
});

test('startup timeline records the real milestones once, at first playback', async () => {
  const f = await fixture({ startTime: 902000 });
  f.advance(4000); f.video.duration = 1327; f.video.emit('loadedmetadata');
  f.advance(3000); f.video.emit('seeked'); f.video.emit('canplay');
  f.advance(500); f.video.paused = false; f.video.emit('playing'); f.video.emit('playing');
  const timeline = f.logs.filter((l) => l[0] === 'Startup timeline');
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0][1].ms.metadata, 4000);
  assert.equal(timeline[0][1].ms.seeked, 7000);
  assert.equal(timeline[0][1].ms.playing, 7500);
  assert.equal(timeline[0][1].resumed, true);
  f.close();
});

test('loading stage reports peers and received data from service statistics without percentages', async () => {
  const pending = await fixture({ holdOpen: true });
  assert.match(pending.stageText(), /Getting the torrent file list/);
  assert.equal(pending.nodes.find((n) => n.tag === 'div.p-stage').style.display, '', 'metadata stage is visible before the URL exists');
  pending.close();
  const f = await fixture({ statsSeq: [{ downloaded: 1048576, peers: 3, length: 1e9, ranges: [] }, { downloaded: 3145728, peers: 5, length: 1e9, ranges: [{ sent: 4096 }] }] });
  assert.match(f.stageText(), /Waiting for video data from peers/);
  assert.equal(f.nodes.find((n) => n.tag === 'div.p-stage').style.display, '', 'stage text is visible from the start');
  f.tick(); await flush();
  f.advance(2000); f.tick(); await flush();
  const text = f.stageText();
  assert.match(text, /Reading the video information/);
  assert.match(text, /5 peers/);
  assert.match(text, /3\.0 MB received/);
  assert.doesNotMatch(text, /%/);
  f.close();
});

test('watchdog does not reopen a torrent that is still receiving data, but recovers when data stops', async () => {
  const stats = [];
  for (let i = 0; i < 20; i++) stats.push({ downloaded: (i + 1) * 65536, peers: 2, length: 1e9, ranges: [] });
  const f = await fixture({ statsSeq: stats });
  f.video.duration = 6600; f.video.emit('loadedmetadata'); f.video.paused = false; f.video.emit('playing');
  f.video.currentTime = 100;
  f.watchdog();
  for (let i = 0; i < 12; i++) { f.advance(2000); f.watchdog(); await flush(); }
  assert.equal(f.toasts.some((s) => /Reconectando/.test(s)), false, 'active transfer is buffering, not a stall');
  // Data stops arriving: the existing stall recovery still applies.
  stats.length = 0;
  for (let i = 0; i < 20; i++) { f.advance(2000); f.watchdog(); await flush(); }
  assert.equal(f.toasts.some((s) => /Reconectando/.test(s)), true);
  f.close();
});

test('Back on a loaded video asks for a second press, playing or paused; loading closes at once', async () => {
  const f = await fixture();
  f.video.duration = 6600; f.video.emit('loadedmetadata'); f.video.paused = false; f.video.emit('playing');
  f.key(KEY.BACK);
  assert.equal(f.popped, 0);
  assert.ok(f.toasts.includes('Press Back again to stop watching'));
  f.advance(1000); f.key(KEY.BACK);
  assert.equal(f.popped, 1);
  const g = await fixture();
  g.video.duration = 6600; g.video.emit('loadedmetadata'); g.video.paused = false; g.video.emit('playing');
  g.key(KEY.PAUSE); g.advance(1000); g.key(KEY.BACK);
  assert.equal(g.popped, 0, 'paused video also asks for confirmation');
  g.advance(1000); g.key(KEY.BACK);
  assert.equal(g.popped, 1);
  const l = await fixture();
  l.key(KEY.BACK);
  assert.equal(l.popped, 1, 'abandoning a slow load needs one press');
  f.close(); g.close(); l.close();
});

test('a duplicated or held Back event does not count as the confirming second press', async () => {
  const f = await fixture();
  f.video.duration = 6600; f.video.emit('loadedmetadata'); f.video.paused = false; f.video.emit('playing');
  f.key(KEY.BACK); f.advance(50); f.key(KEY.BACK);
  f.view.onKey({ keyCode: KEY.BACK, repeat: true });
  assert.equal(f.popped, 0);
  assert.ok(f.logs.some((l) => l[0] === 'Player Back'), 'each Back press is logged for TV diagnosis');
  f.advance(1000); f.key(KEY.BACK);
  assert.equal(f.popped, 1);
  f.close();
});

test('failed open offers Try again on the play button and retries the same source', async () => {
  const f = await fixture({ fail: true });
  await flush();
  const retry = f.byHtml('Try again');
  assert.ok(retry, 'play button turns into Try again');
  assert.doesNotMatch(f.nodes.map((n) => n.textContent).join(' '), /H\.264|HEVC|codec/i, 'no codec advice for an open failure');
  retry.__select();
  await flush();
  assert.equal(f.plays.length, 2);
  assert.equal(f.plays[1].s.name, 'current');
  assert.ok(!f.byHtml('Try again'));
  f.close();
});

test('next-episode streams are prefetched near the credits and reused by the countdown', async () => {
  const f = await fixture();
  f.video.duration = 1327; f.video.emit('loadedmetadata'); f.video.paused = false; f.video.emit('playing');
  f.video.currentTime = 1000; f.video.emit('timeupdate');
  assert.equal(f.lookups.length, 0, 'no prefetch long before the credits');
  f.video.currentTime = 1250; f.video.emit('timeupdate');
  assert.equal(f.lookups.length, 1, 'prefetch a minute before the up-next point');
  f.lookups[0].callback({}, [{ infoHash: 'a'.repeat(40), fileIdx: 1, name: 'next', addon: 'Torrentio' }]);
  f.lookups[0].resolve([{ infoHash: 'a'.repeat(40), fileIdx: 1, name: 'next', addon: 'Torrentio' }]);
  await flush();
  f.byHtml('Próximo').__select();
  await flush();
  assert.equal(f.lookups.length, 1, 'Next reuses the prefetched lookup');
  assert.equal(f.plays.length, 2);
  assert.equal(f.plays[1].s.fileIdx, 1);
  assert.equal(f.changed.id, 'tt:1:2', 'details learns which episode is now playing');
  f.close();
});

test('playback stats line shows peers and rates only with controls, and can be hidden', async () => {
  const stats = [];
  for (let i = 0; i < 20; i++) stats.push({ downloaded: (i + 1) * 524288, peers: 7, length: 1320000000, aheadBytes: 8388608, ranges: [{ sent: 1 }] });
  const f = await fixture({ statsSeq: stats });
  f.video.duration = 6600; f.video.videoHeight = 1080; f.video.currentTime = 100;
  f.video.buffered = { length: 1, start: () => 0, end: () => 50 };
  f.video.emit('loadedmetadata'); f.video.paused = false; f.video.emit('playing');
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 8; j++) f.tick(); f.advance(2000); await flush(); }
  for (let j = 0; j < 8; j++) f.tick();
  const line = f.nodes.find((n) => n.tag === 'div.p-stats');
  assert.equal(line.style.display, '');
  assert.match(line.textContent, /7 peers/);
  assert.match(line.textContent, /0\.13 MB\/s/);
  assert.doesNotMatch(line.textContent, /buffer/, 'buffer figure removed on request');
  assert.match(line.textContent, /file average 0\.2 MB\/s/);
  assert.match(line.textContent, /1080p/);
  f.key(KEY.BACK);
  assert.equal(line.style.display, 'none', 'hidden in full-screen viewing');
  f.key(KEY.DOWN);
  for (let j = 0; j < 8; j++) f.tick();
  assert.equal(line.style.display, '');
  f.byHtml('Hide stats').__select();
  assert.equal(line.style.display, 'none');
  f.close();
});

test('startup wait counter keeps counting across stage changes', async () => {
  const f = await fixture({ statsSeq: [{ downloaded: 1048576, peers: 3, length: 1e9, ranges: [{ sent: 4096 }] }] });
  f.advance(10000); f.tick(); await flush();
  assert.match(f.stageText(), /Reading the video information/);
  f.tick();
  assert.match(f.stageText(), /10 s/);
  f.advance(5000); f.video.duration = 6600; f.video.emit('loadedmetadata'); f.tick();
  assert.match(f.stageText(), /Loading the first frames.*15 s/, 'no reset to 0 at the new stage');
  f.close();
});

