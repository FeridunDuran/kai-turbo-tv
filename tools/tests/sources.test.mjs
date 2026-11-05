import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const t = (text, args = {}) => text.replace(/\{(\w+)\}/g, (_, key) => args[key] ?? '');
function evaluate(path, mocks = {}) {
  const source = read(path)
    .replace(/^import \* as (\w+) from '[^']*\/([^/]+)\.js';/gm, 'const $1 = mocks["$2"];')
    .replace(/^import \{ ([^}]+) \} from '[^']*\/([^/]+)\.js';/gm, 'const { $1 } = mocks["$2"];')
    .replace(/export (function|const|let) /g, '$1 ');
  const context = { mocks, Promise, Date, setTimeout, clearTimeout };
  vm.runInNewContext(source, context);
  return context;
}

class Element {
  constructor(tag, classes = []) {
    this.tag = tag; this.children = []; this.style = {}; this.attrs = {}; this.classes = new Set(classes); this.value = '';
    this.classList = { add: (...names) => names.forEach((n) => this.classes.add(n)),
      remove: (...names) => names.forEach((n) => this.classes.delete(n)), contains: (name) => this.classes.has(name) };
  }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this.value + this.children.map((c) => c.textContent).join(''); }
  set textContent(value) { this.value = String(value); this.children = []; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key]; }
  get offsetParent() { for (let p = this; p; p = p.parentNode) if (p.style.display === 'none') return null; return this.parentNode; }
  querySelectorAll(selector) {
    const names = selector.split(',').map((s) => s.trim().slice(1));
    const out = [];
    const visit = (node) => node.children.forEach((child) => { if (names.some((n) => child.classes.has(n))) out.push(child); visit(child); });
    visit(this); return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function h(tag, props, children) {
  const parts = tag.split('.'), el = new Element(parts.shift(), parts);
  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === 'text') el.textContent = value;
    else if (key === 'cls') String(value).split(' ').filter(Boolean).forEach((n) => el.classes.add(n));
    else if (key === 'onSelect') el.__select = value;
    else el.setAttribute(key, value);
  });
  const append = (child) => {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) return child.forEach(append);
    if (typeof child !== 'object') { const node = new Element('text'); node.textContent = child; child = node; }
    el.appendChild(child);
  };
  append(children); return el;
}
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); el.value = ''; };

async function sourceFixture(ready = true, initialStreams = null, options = {}) {
  const requested = [];
  let releaseCheck = null;
  const deferredCheck = options.deferCheck ? new Promise((resolve) => { releaseCheck = () => resolve({ ok: true, torrent: ready }); }) : null;
  const installed = ['Torrentio', 'Comet ELF', 'Direct addon'].map((name, i) => ({
    transportUrl: 'https://fixture.invalid/' + i + '/manifest.json', manifest: { name, resources: ['stream'], types: ['series'], idPrefixes: ['tt'] },
  }));
  const streams = initialStreams || [
    [{ infoHash: 'a'.repeat(40), fileIdx: 0, name: '1080p hash' }, { url: 'magnet:?xt=urn:btih:' + 'b'.repeat(40), name: '720p magnet' }],
    [{ infoHash: 'c'.repeat(40), fileIdx: 1, name: '1080p hash' }],
    [{ url: 'https://fixture.invalid/video.mp4', name: 'Direct video' }],
  ];
  const addonApi = evaluate('src/js/api/addons.js', {
    http: { getJSON: (url) => { requested.push(url); return Promise.resolve({ streams: streams[Number(new URL(url).pathname.split('/')[1])] }); } },
    stremio: { isLoggedIn: () => true, cachedAddons: () => null, getAddonCollection: () => Promise.resolve(installed) },
    store: {}, log: { log: { warn() {} } }, i18n: { t },
  });
  await addonApi.load(true);
  let checked = !deferredCheck;
  const tvproxy = { isAvailable: () => checked, isTorrentAvailable: () => checked && ready,
    check: () => deferredCheck ? deferredCheck.then((r) => { checked = true; return r; }) : Promise.resolve({ ok: true, torrent: ready }) };
  const server = evaluate('src/js/api/server.js', { http: {}, store: { settings: () => ({}) }, luna: {}, i18n: { t }, tvproxy });
  let focused, view, played;
  const addonMocks = { ...addonApi, fetchMeta: () => Promise.resolve({ id: 'tt0460649', type: 'series', name: 'HIMYM',
    videos: [{ id: 'tt0460649:1:1', season: 1, episode: 1, name: 'Pilot' }] }) };
  const ctx = evaluate('src/js/views/details.js', {
    dom: { h, clear, loadVisibleImages() {} },
    nav: { current: () => focused, focus: (el) => { focused = el; }, focusFirst() {} },
    addons: addonMocks, stremio: { libraryItem: () => null, isInLibrary: () => false },
    store: { settings: () => ({ smartChoice: false }) }, server, tvproxy,
    hero: { logo: () => '', background: () => '' }, ui: { spinnerLine: () => h('div.loading-line'), toast() {} },
    router: { push: (v) => { view = v; } }, player: { openPlayer: (opts) => { played = opts; } }, person: {}, watched: { isWatched: () => false, progress: () => 0 },
    trailer: { trailerIds: () => [] }, extras: { ratings: () => Promise.resolve([]), hasTmdb: () => false },
    img: {}, skip: { isAnime: () => false }, i18n: { t, epLabel: () => 'S1E1' },
  });
  ctx.openDetails('series', 'tt0460649', { videoId: 'tt0460649:1:1', autoStreams: true });
  await new Promise(setImmediate);
  return { root: view.el, addonApi, requested, releaseCheck, get played() { return played; }, get focused() { return focused; }, view, selectTorrent: () => {
    const torrentChip = view.el.querySelectorAll('.chip').find((chip) => /^Torrent/.test(chip.textContent));
    torrentChip.__select();
    const torrent = view.el.querySelectorAll('.stream')[0];
    torrent.parentNode.style.display = '';
    torrent.__select();
  } };
}

test('ready TV engine retains Torrentio infoHash/magnet and Comet sources; only the top group opens', async () => {
  const f = await sourceFixture();
  const groups = f.root.querySelectorAll('.stream-group');
  assert.equal(f.root.querySelectorAll('.stream').length, 4);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups.map((g) => g.querySelector('.stream-group-count').textContent), ['2', '1', '1']);
  groups.forEach((g, i) => {
    assert.equal(g.style.display, '');
    assert.equal(g.querySelector('.stream-group-head').getAttribute('aria-expanded'), i === 0 ? 'true' : 'false');
    assert.equal(g.querySelector('.stream-group-body').style.display, i === 0 ? '' : 'none');
  });
  assert.equal(f.focused && f.focused.classes.has('stream'), true, 'focus starts on the best source, not on a group heading');
  const torrentChip = f.root.querySelectorAll('.chip').find((chip) => /^Torrent/.test(chip.textContent));
  assert.match(torrentChip.textContent, /3/);
  torrentChip.__select();
  assert.equal(groups[0].style.display, ''); assert.equal(groups[1].style.display, ''); assert.equal(groups[2].style.display, 'none');
  const comet = groups.find((g) => g.querySelector('.stream-group-name').textContent === 'Comet ELF');
  comet.querySelector('.stream-group-head').__select();
  assert.equal(comet.querySelector('.stream-group-body').style.display, '');
  comet.querySelector('.stream').__select();
  assert.equal(f.played.stream.infoHash, 'c'.repeat(40));
});

test('unavailable TV engine hides torrent rows but retains direct sources', async () => {
  const f = await sourceFixture(false);
  assert.equal(f.root.querySelectorAll('.stream').length, 1);
  assert.match(f.root.querySelector('.stream').textContent, /Direct video/);
});

test('torrent metadata error is stored by details and survives a source status refresh', async () => {
  const f = await sourceFixture();
  f.selectTorrent();
  assert.equal(typeof f.played.onError, 'function');
  f.played.onError(Object.assign(new Error('torrent metadata timeout after 120 seconds: peers connected but did not supply complete metadata'), { torrentOpen: true }));
  assert.match(f.root.textContent, /torrent metadata timeout after 120 seconds/);
  const status = f.root.querySelector('.details-sources-status');
  assert.ok(status);
  assert.equal(status.textContent.includes('peers connected but did not supply complete metadata'), true);
  const filter = f.root.querySelectorAll('.chip')[0];
  filter.__select();
  assert.equal(status.textContent.includes('peers connected but did not supply complete metadata'), true);
});

test('a source-rendering exception is not reported as a second, empty addon response', async () => {
  const f = await sourceFixture();
  let count = 0;
  await assert.rejects(f.addonApi.fetchStreams('series', 'tt0460649:1:1', () => { count++; throw new Error('render failure'); }), /render failure/);
  assert.equal(count, 3, 'one callback for each addon, without a second error callback');
});

test('HTTP sources sort by resolution and torrents by reported seeds inside addon groups',async()=>{
 const f=await sourceFixture(true,[[{infoHash:'a'.repeat(40),name:'unknown'},{infoHash:'b'.repeat(40),name:'zero',seeders:0},{infoHash:'c'.repeat(40),title:'1080p 👤 87'},{infoHash:'d'.repeat(40),name:'many',seeders:200}],[],[{url:'https://x/720',name:'720p'},{url:'https://x/4k',name:'4K'},{url:'https://x/unknown',name:'Unknown'},{url:'https://x/1080',name:'1080p'}]]);
 const groups=f.root.querySelectorAll('.stream-group');
 assert.deepEqual(groups[0].querySelectorAll('.s-title').map(n=>n.textContent),['many','1080p 👤 87','zero','unknown']);
 assert.deepEqual(groups[2].querySelectorAll('.s-title').map(n=>n.textContent),['4K','1080p','720p','Unknown']);
 assert.match(groups[0].textContent,/Seeds: 200/);
});

test('add-on stream requests start while TV service discovery is still pending', async () => {
  const f = await sourceFixture(true, null, { deferCheck: true });
  const streamRequests = f.requested.filter((url) => url.includes('/stream/'));
  assert.equal(streamRequests.length, 3, 'all add-ons requested before the service check finished');
  assert.equal(f.root.querySelectorAll('.stream').length, 0, 'torrent visibility waits for the service state');
  f.releaseCheck();
  await new Promise(setImmediate); await new Promise(setImmediate);
  assert.equal(f.root.querySelectorAll('.stream').length, 4, 'queued replies render once the engine state is known');
  assert.equal(f.requested.filter((url) => url.includes('/stream/')).length, 3, 'no duplicate add-on requests');
});

test('returning from a player that moved to the next episode shows that episode instead of stale sources', async () => {
  const f = await sourceFixture();
  f.selectTorrent();
  assert.equal(typeof f.played.onVideoChange, 'function');
  f.played.onVideoChange({ id: 'tt0460649:1:2', season: 1, episode: 2 });
  f.view.onShow();
  assert.equal(f.root.querySelectorAll('.stream').length, 0);
  assert.ok(f.root.querySelectorAll('.episode').length > 0);
  // Same episode: the source list (and its focus) is kept for choosing another source.
  const g = await sourceFixture();
  g.selectTorrent();
  g.view.onShow();
  assert.equal(g.root.querySelectorAll('.stream').length, 4);
});

test('a multi-line torrent diagnosis shows only its reason in the one-line source status', async () => {
  const f = await sourceFixture();
  f.selectTorrent();
  f.played.onError(Object.assign(new Error('torrent metadata transfer stalled for 20 seconds\nPeers were found but no BitTorrent handshake completed; peers may be unreachable.\nPeers discovered: 1309 · sockets opened: 0 · handshakes: 0'), { torrentOpen: true }));
  const status = f.root.querySelector('.details-sources-status').textContent;
  assert.match(status, /no BitTorrent handshake completed/);
  assert.doesNotMatch(status, /Peers discovered|\n/);
});

test('auto-open waits for higher-priority add-ons and stops once the user arranges groups', async () => {
  const f = await sourceFixture(true, [[], [{ infoHash: 'c'.repeat(40), name: 'only comet' }], [{ url: 'https://x/1080', name: '1080p' }]]);
  const groups = f.root.querySelectorAll('.stream-group');
  assert.equal(groups[1].querySelector('.stream-group-head').getAttribute('aria-expanded'), 'true', 'first non-empty group opens');
  assert.equal(groups[2].querySelector('.stream-group-head').getAttribute('aria-expanded'), 'false');
});


test('torrent ordering prefers measured productive sources, then seed hints, while HTTP keeps quality order',()=>{
 const source=read('src/js/views/details.js');const c={server:{isTorrent:s=>!!s.infoHash},tvproxy:{transferRank:s=>s.rank||0}};
 vm.runInNewContext(source.slice(source.indexOf('function sourceQuality'),source.indexOf('// Smart Choice waits')),c);
 const fast={infoHash:'fast',rank:1,seeds:1},unknown={infoHash:'unknown',seeds:100},slow={infoHash:'slow',rank:-1,seeds:1000};
 const h720={url:'720',name:'720p'},h1080={url:'1080',name:'1080p'};
 assert.deepEqual(Array.from(c.orderSources([slow,h720,unknown,h1080,fast])),[fast,h1080,unknown,h720,slow]);
});
