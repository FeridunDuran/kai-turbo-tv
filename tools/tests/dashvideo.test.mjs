import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from 'acorn';
import { dashSource, isDash, startDash } from '../../src/js/lib/dashvideo.js';
import { createHlsVideo } from '../../src/js/lib/hlsvideo.js';

const original = 'https://media.invalid/show/manifest.mpd?signature=example';
const proxy = 'http://127.0.0.1:8097/proxy?u=' + encodeURIComponent(original) + '&h=' + encodeURIComponent('{"Referer":"https://example.invalid/"}');

test('proxied MPDs are detected and child requests keep the header proxy', () => {
  assert.equal(isDash(proxy), true);
  assert.equal(dashSource(proxy).url, original);
  const child = new URL('video/chunk-2.m4s', original).href;
  const wire = new URL(dashSource(proxy).requestUrl(child));
  assert.equal(wire.hostname, '127.0.0.1');
  assert.equal(wire.searchParams.get('u'), child);
  assert.deepEqual(JSON.parse(wire.searchParams.get('h')), { Referer: 'https://example.invalid/' });
  assert.equal(isDash('https://example.invalid/file.mp4'), false);
});

function fakeDash() {
  const instances = [];
  function MediaPlayer() { return { create() {
    const player = { events: {},
      extend(name, factory) { this.modifier = factory(); }, updateSettings() {},
      on(name, fn) { this.events[name] = fn; },
      initialize(video) { this.video = video; video.src = ''; video.src = 'blob:dash'; },
      reset() { this.video.autoplay = false; this.video.removeAttribute('src'); this.resets = (this.resets || 0) + 1; },
      getTracksFor: () => [{ index: 2, lang: 'und', codec: 'audio/mp4;codecs="mp4a.40.2"' }],
      getCurrentTrackFor: () => ({ index: 2 }), setCurrentTrack() {},
    };
    instances.push(player); return player;
  } }; }
  MediaPlayer.events = { ERROR: 'error' };
  return { lib: { MediaPlayer }, instances };
}

test('DASH uses the real MPD response URL as the base for relative segments', () => {
  const f = fakeDash();
  const player = startDash(f.lib, { autoplay: true }, proxy, () => {});
  const wire = player.modifier.modifyRequestURL(original);
  const xhr = { responseURL: wire };
  player.modifier.modifyRequestHeader(xhr, { url: wire });
  assert.equal(xhr.responseURL, original);
  assert.equal(new URL('init.mp4', xhr.responseURL).hostname, 'media.invalid');
});

test('DASH cleanup preserves autoplay for MP4 switching and errors do not recurse', async () => {
  const previous = globalThis.window;
  class Media {
    constructor() { this.handlers = []; this.autoplay = true; }
    get src() { return this.nativeSrc || ''; } set src(value) { this.nativeSrc = value; }
    get error() { return null; }
    removeAttribute() { this.nativeSrc = ''; }
    dispatchEvent(ev) { this.handlers.forEach((fn) => fn(ev)); }
  }
  const f = fakeDash();
  globalThis.window = { HTMLMediaElement: Media, MediaSource: {}, dashjs: f.lib };
  try {
    const doc = { createElement: () => new Media(), createEvent: () => ({ initEvent(type) { this.type = type; } }) };
    const video = createHlsVideo(doc);
    video.src = proxy; await Promise.resolve();
    assert.equal(video.playbackEngine, 'dash.js');
    assert.equal(video.audioTracks[0].enabled, true);
    let count = 0;
    video.handlers.push(() => { count++; f.instances[0].events.error({ error: { code: 28 } }); });
    f.instances[0].events.error({ error: { code: 28 } });
    assert.equal(count, 1);
    video.src = 'https://media.invalid/video.mp4';
    assert.equal(video.autoplay, true);
    assert.equal(video.nativeSrc, 'https://media.invalid/video.mp4');
    assert.equal(f.instances[0].resets, 1);
  } finally { globalThis.window = previous; }
});

test('generic Content-Type does not diagnose an unsupported codec', async () => {
  const source = fs.readFileSync(new URL('../../src/js/lib/mediaerror.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function ');
  const context = { Promise, t: (key, args) => key.replace('{type}', args?.type || ''), XMLHttpRequest: class {
    open() {} getResponseHeader() { return 'application/octet-stream'; }
    send() { this.status = 200; queueMicrotask(() => this.onload()); }
  } };
  vm.runInNewContext(source, context);
  const result = await context.explainVideoError(4, 'https://media.invalid/manifest.mpd');
  assert.match(result.title, /fonte respondeu/);
  assert.match(result.hint, /genérico/);
  assert.doesNotMatch(result.title, /não reconhece o formato/);
});

test('bundled DASH player uses ES5 syntax', () => {
  parse(fs.readFileSync(new URL('../../src/static/vendor/dash.all.min.js', import.meta.url), 'utf8'), { ecmaVersion: 5 });
});
