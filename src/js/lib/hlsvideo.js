// TizenBrew serves normal HTTP pages: Samsung's privileged AVPlay is generally
// absent. Use MSE for HLS instead of relying on the browser's native HLS parser.
import { loadDash, isDash, startDash, dashSource } from './dashvideo.js';
let loading = null;
export function loadHls(doc) {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    const timer = setTimeout(() => end(new Error('HLS player could not load')), 10000);
    let done = false;
    function end(error) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) { loading = null; reject(error); }
      else resolve(window.Hls);
    }
    script.src = (window.__KAI_BASE__ || '') + 'vendor/hls.min.js';
    script.onload = () => end(window.Hls ? null : new Error('HLS player unavailable'));
    script.onerror = () => end(new Error('HLS player could not load'));
    doc.head.appendChild(script);
  });
  return loading;
}

export function createHlsVideo(doc, getHls) {
  const video = doc.createElement('video');
  const proto = typeof window !== 'undefined' && window.HTMLMediaElement && window.HTMLMediaElement.prototype;
  if (!proto) return video;
  const src = Object.getOwnPropertyDescriptor(proto, 'src');
  const nativeError = Object.getOwnPropertyDescriptor(proto, 'error');
  const nativeAudio = Object.getOwnPropertyDescriptor(proto, 'audioTracks');
  const remove = video.removeAttribute.bind(video);
  let engine = null, dash = null, startingDash = false, requested = '', generation = 0, destroying = false, error = null, audioInfo = null;
  function reset() {
    generation++;
    const old = engine;
    const oldDash = dash;
    engine = null;
    dash = null;
    audioInfo = null;
    if (old) { destroying = true; try { old.destroy(); } finally { destroying = false; } }
    if (oldDash) { destroying = true; try { oldDash.reset(); } finally { destroying = false; } }
  }
  function fail(code, message) {
    if (error) return; // DASH also listens to media errors; do not echo our own event.
    error = { code, message };
    const event = doc.createEvent('Event');
    event.initEvent('error', false, false);
    video.dispatchEvent(event);
  }
  function setSource(url) {
    // hls.js owns the temporary blob URL and removes it during detach/destroy.
    if (destroying || /^blob:/.test(url || '') || (startingDash && !url)) { src.set.call(video, url); return; }
    const autoplay = video.autoplay;
    reset();
    video.autoplay = autoplay;
    requested = url || '';
    error = null;
    if (isDash(requested) && (window.MediaSource || window.WebKitMediaSource)) {
      const token = generation;
      remove('src');
      loadDash(doc).then((lib) => {
        if (token !== generation) return;
        startingDash = true;
        try {
          dash = startDash(lib, video, requested, (code, message) => {
            if (token === generation) fail(code, message);
          });
        } finally { startingDash = false; }
      }).catch((e) => { if (token === generation) fail(4, e.message); });
      return;
    }
    if (!/\.m3u8(?:[?#]|$)/i.test(dashSource(requested).url) || !(window.MediaSource || window.WebKitMediaSource)) {
      src.set.call(video, requested);
      return;
    }
    const token = generation;
    remove('src');
    (getHls || loadHls)(doc).then((Hls) => {
      if (token !== generation) return;
      if (!Hls || !Hls.isSupported()) { src.set.call(video, requested); return; }
      const hls = engine = new Hls({
        enableWorker: false, // old Tizen workers and remote module origins are unreliable
        startFragPrefetch: true, maxBufferLength: 12, maxMaxBufferLength: 24,
        maxBufferSize: 24 * 1024 * 1024,
        backBufferLength: 20, manifestLoadingTimeOut: 20000,
        fragLoadingTimeOut: 30000, enableWebVTT: false,
      });
      let recovered = false, loaded = false;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (token === generation && !loaded) { loaded = true; hls.loadSource(requested); }
      });
      hls.on(Hls.Events.BUFFER_CODECS, (event, data) => {
        if (token !== generation) return;
        if (data.audio) audioInfo = data.audio;
        else if (data.audiovideo) {
          const codec = String(data.audiovideo.codec || '').split(',').find((c) => /^(mp4a|ac-3|ec-3|opus)/i.test(c.trim()));
          if (codec) audioInfo = { codec: codec.trim() };
        }
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (token !== generation || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
          recovered = true;
          destroying = true;
          try { hls.recoverMediaError(); } finally { destroying = false; }
          return;
        }
        fail(data.type === Hls.ErrorTypes.NETWORK_ERROR ? 2 : 3, data.details || 'HLS error');
      });
      hls.attachMedia(video);
    }).catch((e) => { if (token === generation) fail(4, e.message); });
  }
  Object.defineProperties(video, {
    src: { get: () => requested || src.get.call(video), set: setSource },
    currentSrc: { get: () => engine || dash ? requested : src.get.call(video) },
    error: { get: () => error || nativeError.get.call(video) },
    playbackEngine: { get: () => dash ? 'dash.js' : engine ? 'hls.js' : 'html' },
    audioTracks: { get: () => {
      if (dash) {
        try {
          const current = dash.getCurrentTrackFor('audio');
          return dash.getTracksFor('audio').map((tr) => ({ language: tr.lang || '', label: tr.codec || '', enabled: !!current && tr.index === current.index }));
        } catch (e) { return []; }
      }
      if (!engine) return nativeAudio ? nativeAudio.get.call(video) : [];
      if (engine.audioTracks.length) return engine.audioTracks.map((tr, i) => ({
        language: tr.lang || '', label: tr.name || tr.audioCodec || '', enabled: engine.audioTrack === i,
      }));
      // Multiplexed fMP4 carries audio in the same segments. It is not an
      // alternate audio rendition, but still has a real codec and channel count.
      return audioInfo ? [{ language: '', label: audioInfo.codec || '', enabled: true }] : [];
    } },
    selectAudio: { get: () => dash ? (index) => {
      const tracks = dash.getTracksFor('audio');
      if (tracks[index]) dash.setCurrentTrack(tracks[index]);
    } : engine ? (index) => {
      if (engine.audioTracks.length) engine.audioTrack = index;
    } : undefined },
  });
  video.removeAttribute = (name) => {
    if (name === 'src' && !destroying && !dash && !startingDash) { reset(); requested = ''; error = null; }
    remove(name);
  };
  video.dispose = reset;
  video.clearSource = () => { reset(); requested = ''; error = null; remove('src'); };
  return video;
}
