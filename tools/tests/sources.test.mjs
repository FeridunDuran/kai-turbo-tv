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

async function sourceFixture(ready = true, initialStreams = null) {
  const installed = ['Torrentio', 'Comet ELF', 'Direct addon'].map((name, i) => ({
    transportUrl: 'https://fixture.invalid/' + i + '/manifest.json', manifest: { name, resources: ['stream'], types: ['series'], idPrefixes: ['tt'] },
  }));
  const streams = initialStreams || [
    [{ infoHash: 'a'.repeat(40), fileIdx: 0, name: '1080p hash' }, { url: 'magnet:?xt=urn:btih:' + 'b'.repeat(40), name: '720p magnet' }],
    [{ infoHash: 'c'.repeat(40), fileIdx: 1, name: '1080p hash' }],
    [{ url: 'https://fixture.invalid/video.mp4', name: 'Direct video' }],
  ];
  const addonApi = evaluate('src/js/api/addons.js', {
    http: { getJSON: (url) => Promise.resolve({ streams: streams[Number(new URL(url).pathname.split('/')[1])] }) },
    stremio: { isLoggedIn: () => true, cachedAddons: () => null, getAddonCollection: () => Promise.resolve(installed) },
    store: {}, log: { log: { warn() {} } }, i18n: { t },
  });
  await addonApi.load(true);
  const tvproxy = { isAvailable: () => true, isTorrentAvailable: () => ready,
    check: () => Promise.resolve({ ok: true, torrent: ready }) };
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
    router: { push: (v) => { view = v; } }, player: { openPlayer: (opts) => { played = opts; } }, person: {}, watched: {},
    trailer: { trailerIds: () => [] }, extras: { ratings: () => Promise.resolve([]), hasTmdb: () => false },
    img: {}, skip: { isAnime: () => false }, i18n: { t, epLabel: () => 'S1E1' },
  });
  ctx.openDetails('series', 'tt0460649', { videoId: 'tt0460649:1:1', autoStreams: true });
  await new Promise(setImmediate);
  return { root: view.el, addonApi, get played() { return played; }, view, selectTorrent: () => view.el.querySelectorAll('.stream')[0].__select() };
}

test('ready TV engine retains Torrentio infoHash/magnet and Comet sources in closed groups', async () => {
  const f = await sourceFixture();
  const groups = f.root.querySelectorAll('.stream-group');
  assert.equal(f.root.querySelectorAll('.stream').length, 4);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups.map((g) => g.querySelector('.stream-group-count').textContent), ['2', '1', '1']);
  groups.forEach((g) => {
    assert.equal(g.style.display, '');
    assert.equal(g.querySelector('.stream-group-head').getAttribute('aria-expanded'), 'false');
    assert.equal(g.querySelector('.stream-group-body').style.display, 'none');
  });
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
  f.view.reportTorrentError(Object.assign(new Error('torrent metadata timeout after 120 seconds: peers connected but did not supply complete metadata'), { torrentOpen: true }));
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
