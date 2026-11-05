// A media-element facade over Samsung's native player. Keep the UI, progress and
// subtitle renderer shared with the HTML player used outside Samsung TVs.
export function createTizenVideo(api, doc) {
  const el = doc.createElement('object');
  el.type = 'application/avplayer';
  el.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px';
  let source = '', generation = 0, ready = false, paused = true, ended = false;
  let position = 0, duration = NaN, error = null, seeking = false;
  let tracks = [], bufferedEnd = 0, playing = false;
  function emit(name) {
    const ev = doc.createEvent('Event');
    ev.initEvent(name, false, false);
    el.dispatchEvent(ev);
  }
  function stop() {
    generation++;
    ready = false;
    paused = true;
    playing = false;
    seeking = false;
    try { api.close(); } catch (e) { /* already closed */ }
  }
  function syncTracks() {
    try {
      const current = api.getCurrentStreamInfo().filter((tr) => tr.type === 'AUDIO')[0];
      tracks = api.getTotalTrackInfo().filter((tr) => tr.type === 'AUDIO').map((tr) => {
        let extra = {};
        try { extra = JSON.parse(tr.extra_info || '{}'); } catch (e) { /* missing metadata */ }
        return { index: tr.index, language: extra.language || extra.lang || '',
          label: [extra.codec || extra.fourCC, extra.channels ? extra.channels + ' ch' : ''].filter(Boolean).join(' · '),
          enabled: current ? current.index === tr.index : false };
      });
    } catch (e) { /* not ready yet */ }
    return tracks;
  }
  function fail(reason) {
    ready = false;
    paused = true;
    const name = String(reason && (reason.name || reason.message) || reason || 'AVPlay error');
    error = { code: /CONNECTION/.test(name) ? 2 : /FORMAT|FILE|SUPPORT/.test(name) ? 4 : 3, message: name };
    emit('error');
  }
  function open(url) {
    stop();
    source = url || '';
    position = 0; duration = NaN; error = null; tracks = []; ended = false; bufferedEnd = 0;
    if (!source) return;
    const token = generation;
    const active = (fn) => (...args) => { if (token === generation) fn(...args); };
    try {
      api.open(source);
      api.setDisplayRect(0, 0, 1920, 1080);
      try { api.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX'); } catch (e) { /* optional */ }
      // Samsung requires at least four seconds. Defaults can wait for ten seconds of media.
      try {
        api.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 4);
        api.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 4);
        api.setTimeoutForBuffering(8);
      } catch (e) { /* older firmware */ }
      api.setListener({
        onbufferingstart: active(() => { playing = false; emit('waiting'); }),
        onbufferingcomplete: active(() => {
          bufferedEnd = Math.min(duration, position + 4);
          emit('canplay');
        }),
        oncurrentplaytime: active((ms) => {
          position = ms / 1000;
          if (!paused && !seeking && !playing) { playing = true; emit('playing'); }
          emit('timeupdate');
        }),
        onstreamcompleted: active(() => { ended = true; paused = true; emit('ended'); }),
        onerror: active(fail),
      });
      api.prepareAsync(active(() => {
        ready = true;
        duration = api.getDuration() / 1000;
        syncTracks();
        try { api.setSilentSubtitle(true); } catch (e) { /* optional */ }
        emit('loadedmetadata');
        if (el.autoplay) el.play();
      }), active(fail));
    } catch (e) { fail(e); }
  }
  Object.defineProperties(el, {
    src: { get: () => source, set: open },
    currentSrc: { get: () => source },
    currentTime: { get: () => position, set: (seconds) => {
      if (!ready) return;
      const token = generation;
      seeking = true; emit('seeking');
      api.seekTo(Math.max(0, Math.round(seconds * 1000)), () => {
        if (token !== generation) return;
        position = seconds; seeking = false; emit('seeked');
      }, () => { if (token === generation) { seeking = false; emit('seeked'); } });
    } },
    duration: { get: () => duration }, paused: { get: () => paused },
    ended: { get: () => ended }, seeking: { get: () => seeking },
    error: { get: () => error }, readyState: { get: () => ready ? 3 : 0 },
    networkState: { get: () => source ? 2 : 0 },
    audioTracks: { get: syncTracks },
    buffered: { get: () => ({ length: ready && bufferedEnd > position ? 1 : 0,
      start: () => position, end: () => bufferedEnd }) },
  });
  el.autoplay = false;
  el.play = () => {
    if (ready && paused) {
      try { api.play(); paused = false; emit('play'); } catch (e) { fail(e); }
    }
    return Promise.resolve();
  };
  el.pause = () => {
    if (ready && !paused) {
      try { api.pause(); paused = true; playing = false; emit('pause'); } catch (e) { fail(e); }
    }
  };
  el.load = () => { if (!source) stop(); }; // src already opens once, never double prepare
  const remove = el.removeAttribute.bind(el);
  el.removeAttribute = (name) => { if (name === 'src') { source = ''; stop(); } else remove(name); };
  el.selectAudio = (index) => {
    const tr = syncTracks()[index];
    if (!tr || !ready) return;
    // Samsung only permits AUDIO selection while PLAYING. Restore pause after
    // the native switch if the user opened the menu from a paused video.
    if (paused) {
      api.play();
      try { api.setSelectTrack('AUDIO', tr.index); } finally { api.pause(); }
      return;
    }
    api.setSelectTrack('AUDIO', tr.index);
  };
  el.dispose = stop;
  return el;
}

export function createVideo(doc) {
  const api = typeof window !== 'undefined' && window.webapis && window.webapis.avplay;
  return api ? createTizenVideo(api, doc) : doc.createElement('video');
}
