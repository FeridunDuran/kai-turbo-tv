import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.attrs = {}; this.scrollTop = 0; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  get firstChild() { return this.children[0]; }
  get lastChild() { return this.children.at(-1); }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }
  contains(child) { return this === child || this.children.some((c) => c.contains(child)); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  querySelectorAll(selector) { return this.children.flatMap((c) => [c, ...c.querySelectorAll(selector)]).filter((c) => c.tag.includes(selector)); }
}
function fixture() {
  let items = Array.from({ length: 30 }, (_, i) => ({ _id: 'tt' + i, name: 'Movie ' + String(i).padStart(2, '0'), type: 'movie' }));
  const requests = [], focuses = [];
  let current = new Node('header');
  const h = (tag, props) => { const el = new Node(tag); if (props?.onSelect) el.__select = props.onSelect; return el; };
  const mocks = {
    dom: { h, clear: (el) => { while (el.firstChild) el.removeChild(el.firstChild); }, loadVisibleImages() {} },
    nav: { current: () => current, focus: (el, options) => { current = el; focuses.push({ el, options }); } },
    stremio: { cachedLibrary: () => items.slice(), isLoggedIn: () => true,
      getLibrary: () => new Promise((resolve) => requests.push(resolve)) },
    addons: {}, store: { get: (key) => key === 'librarySort' ? 'name' : {}, set() {} },
    ui: { topbar: () => new Node('header'), spinnerLine: () => new Node('spinner'),
      card: (item, opts) => h('card', { onSelect: opts.onSelect }) },
    router: {}, details: { openDetails: () => { current = new Node('details'); } }, i18n: { t: (s) => s },
  };
  const source = fs.readFileSync(new URL('../../src/js/views/library.js', import.meta.url), 'utf8')
    .replace(/^import \* as (\w+) from '[^']*\/([^/]+)\.js';/gm, 'const $1 = mocks["$2"];')
    .replace(/^import \{ ([^}]+) \} from '[^']*\/([^/]+)\.js';/gm, 'const { $1 } = mocks["$2"];')
    .replace(/export function /g, 'function ');
  const context = { mocks, Promise, Date, setTimeout, clearTimeout };
  vm.runInNewContext(source, context);
  const view = context.LibraryView();
  const scroller = view.el.children[0], grid = scroller.children[3];
  return { view, scroller, grid, requests, focuses,
    get current() { return current; }, set current(el) { current = el; },
    remove(id) { items = items.filter((item) => item._id !== id); } };
}

test('back from details restores the same film after a hidden library refresh', async () => {
  const f = fixture();
  f.view.onShow();
  const selected = f.grid.children[20];
  f.current = selected; f.scroller.scrollTop = 1400;
  selected.__select();
  f.requests.shift()(); await new Promise(setImmediate); // refresh destroys old DOM while details is shown
  f.current = new Node('header'); // router cannot reuse the detached old card
  f.view.onShow();
  assert.equal(f.current.getAttribute('data-library-id'), 'tt20');
  assert.equal(f.scroller.scrollTop, 1400);
  f.requests.shift()(); await new Promise(setImmediate);
  assert.equal(f.current.getAttribute('data-library-id'), 'tt20');
  assert.equal(f.focuses.at(-1).options.noScroll, true);
});

test('async refresh does not steal focus from library filters', async () => {
  const f = fixture(); f.view.onShow();
  const filter = new Node('filter'); f.current = filter;
  f.requests.shift()(); await new Promise(setImmediate);
  assert.equal(f.current, filter);
});

test('a removed film falls back to the nearest remaining card', async () => {
  const f = fixture(); f.view.onShow();
  const selected = f.grid.children[20];
  f.current = selected; selected.__select(); f.remove('tt20');
  f.current = new Node('header'); f.view.onShow();
  assert.equal(f.current.getAttribute('data-library-id'), 'tt21');
});
