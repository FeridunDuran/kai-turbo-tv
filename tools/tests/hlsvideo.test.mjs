import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'acorn';
import { createHlsVideo } from '../../src/js/lib/hlsvideo.js';

function fixture(load) {
  const previous = globalThis.window;
  class Media {
    constructor() { this.handlers = {}; }
    get src() { return this.nativeSrc || ''; }
    set src(value) { this.nativeSrc = value; }
    get error() { return null; }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    dispatchEvent(ev) { this.handlers[ev.type]?.(ev); }
    removeAttribute(name) { if (name === 'src') this.nativeSrc = ''; }
  }
  const instances = [];
  class Hls {
    static Events = { MEDIA_ATTACHED: 'attached', BUFFER_CODECS: 'codecs', ERROR: 'error' };
    static ErrorTypes = { MEDIA_ERROR: 'media', NETWORK_ERROR: 'network' };
    static isSupported() { return true; }
    constructor() { this.handlers = {}; this.audioTracks = []; this.loads = []; instances.push(this); }
    on(name, fn) { this.handlers[name] = fn; }
    emit(name, data) { this.handlers[name]?.(name, data); }
    attachMedia(video) { this.video = video; video.src = 'blob:test'; this.emit('attached'); }
    loadSource(url) { this.loads.push(url); }
    destroy() { this.destroyed = true; this.video.removeAttribute('src'); }
    recoverMediaError() { this.recoveries = (this.recoveries || 0) + 1; this.video.removeAttribute('src'); this.attachMedia(this.video); }
  }
  globalThis.window = { HTMLMediaElement: Media, MediaSource: {} };
  const doc = { createElement: () => new Media(), createEvent: () => ({ initEvent(type) { this.type = type; } }) };
  return { video: createHlsVideo(doc, load || (() => Promise.resolve(Hls))), Hls, instances,
    restore() { globalThis.window = previous; } };
}

test('HLS attaches once, preserves the actual URL and lists multiplexed AAC', async () => {
  const f = fixture();
  try {
    f.video.src = 'https://example.invalid/video.m3u8';
    await Promise.resolve();
    assert.equal(f.video.playbackEngine, 'hls.js');
    assert.equal(f.video.src, 'https://example.invalid/video.m3u8');
    assert.equal(f.video.currentSrc, f.video.src);
    assert.equal(f.video.nativeSrc, 'blob:test');
    assert.deepEqual(f.instances[0].loads, [f.video.src]);
    f.instances[0].emit('codecs', { audiovideo: { codec: 'avc1.640028,mp4a.40.2' } });
    assert.equal(f.video.audioTracks[0].label, 'mp4a.40.2');
    f.video.removeAttribute('src');
    assert.equal(f.instances[0].destroyed, true);
  } finally { f.restore(); }
});

test('late library loading cannot reopen a replaced source', async () => {
  let resolve;
  const f = fixture(() => new Promise((r) => { resolve = r; }));
  try {
    f.video.src = 'https://example.invalid/old.m3u8';
    f.video.src = 'https://example.invalid/new.mp4';
    resolve(f.Hls); await Promise.resolve();
    assert.equal(f.instances.length, 0);
    assert.equal(f.video.nativeSrc, 'https://example.invalid/new.mp4');
  } finally { f.restore(); }
});

test('media recovery does not destroy the engine or reload the source', async () => {
  const f = fixture();
  try {
    let errors = 0;
    f.video.addEventListener('error', () => errors++);
    f.video.src = 'https://example.invalid/video.m3u8'; await Promise.resolve();
    const hls = f.instances[0];
    hls.emit('error', { fatal: true, type: 'media', details: 'decode' });
    assert.equal(hls.recoveries, 1);
    assert.equal(hls.destroyed, undefined);
    assert.equal(hls.loads.length, 1);
    assert.equal(errors, 0);
    hls.emit('error', { fatal: true, type: 'media', details: 'decode' });
    assert.equal(errors, 1);
    assert.equal(f.video.error.code, 3);
  } finally { f.restore(); }
});

test('bundled HLS library has ES5 syntax for old TV browsers', () => {
  parse(fs.readFileSync(new URL('../../src/static/vendor/hls.min.js', import.meta.url), 'utf8'), { ecmaVersion: 5 });
});
