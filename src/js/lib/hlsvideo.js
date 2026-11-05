// TizenBrew serves normal HTTP pages: Samsung's privileged AVPlay is generally
// absent. Use MSE for HLS instead of relying on the browser's native HLS parser.
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
  let engine = null, requested = '', generation = 0, destroying = false, error = null, audioInfo = null;
  function reset() {
    generation++;
    const old = engine;
    engine = null;
    audioInfo = null;
    if (old) { destroying = true; try { old.destroy(); } finally { destroying = false; } }
  }
  function fail(code, message) {
    error = { code, message };
    const event = doc.createEvent('Event');
    event.initEvent('error', false, false);
    video.dispatchEvent(event);
  }
  function setSource(url) {
    // hls.js owns the temporary blob URL and removes it during detach/destroy.
    if (destroying || /^blob:/.test(url || '')) { src.set.call(video, url); return; }
    reset();
    requested = url || '';
    error = null;
    if (!/\.m3u8(?:[?#]|$)/i.test(requested) || !(window.MediaSource || window.WebKitMediaSource)) {
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
    currentSrc: { get: () => engine ? requested : src.get.call(video) },
    error: { get: () => error || nativeError.get.call(video) },
    playbackEngine: { get: () => engine ? 'hls.js' : 'html' },
    audioTracks: { get: () => {
      if (!engine) return nativeAudio ? nativeAudio.get.call(video) : [];
      if (engine.audioTracks.length) return engine.audioTracks.map((tr, i) => ({
        language: tr.lang || '', label: tr.name || tr.audioCodec || '', enabled: engine.audioTrack === i,
      }));
      // Multiplexed fMP4 carries audio in the same segments. It is not an
      // alternate audio rendition, but still has a real codec and channel count.
      return audioInfo ? [{ language: '', label: audioInfo.codec || '', enabled: true }] : [];
    } },
    selectAudio: { get: () => engine ? (index) => {
      if (engine.audioTracks.length) engine.audioTrack = index;
    } : undefined },
  });
  video.removeAttribute = (name) => {
    if (name === 'src' && !destroying) { reset(); requested = ''; error = null; }
    remove(name);
  };
  video.dispose = reset;
  return video;
}
