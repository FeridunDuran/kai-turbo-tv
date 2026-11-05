let loading = null;
export function loadDash(doc) {
  if (window.dashjs) return Promise.resolve(window.dashjs);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    let done = false;
    const timer = setTimeout(() => end(new Error('DASH player could not load')), 10000);
    function end(error) {
      if (done) return;
      done = true; clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) { loading = null; reject(error); } else resolve(window.dashjs);
    }
    script.src = (window.__KAI_BASE__ || '') + 'vendor/dash.all.min.js';
    script.onload = () => end(window.dashjs ? null : new Error('DASH player unavailable'));
    script.onerror = () => end(new Error('DASH player could not load'));
    doc.head.appendChild(script);
  });
  return loading;
}

// Keep the MPD's original base URL for SegmentTemplate/BaseURL resolution, but
// route every actual manifest, init and media request through the TV proxy.
// Merely proxying the MPD leaves its video/audio segments without their headers.
export function dashSource(url) {
  const match = url.match(/^(http:\/\/127\.0\.0\.1:\d+\/proxy)(?:\/[^?]*)?\?(.+)$/);
  if (!match) return { url, requestUrl: (value) => value };
  const params = {};
  match[2].split('&').forEach((part) => {
    const at = part.indexOf('=');
    if (at > 0) { try { params[part.slice(0, at)] = decodeURIComponent(part.slice(at + 1)); } catch (e) { /* malformed */ } }
  });
  if (!/^https?:\/\//i.test(params.u || '')) return { url, requestUrl: (value) => value };
  return { url: params.u, requestUrl: (value) => {
    let result = match[1] + '?u=' + encodeURIComponent(value);
    if (params.h) result += '&h=' + encodeURIComponent(params.h);
    if (params.r) result += '&r=' + encodeURIComponent(params.r);
    return result;
  } };
}

export function isDash(url) { return /\.mpd(?:[?#]|$)/i.test(dashSource(url).url); }

export function startDash(dashjs, video, url, onError) {
  const source = dashSource(url);
  const player = dashjs.MediaPlayer().create();
  player.extend('RequestModifier', function () {
    return { modifyRequestURL: source.requestUrl, modifyRequestHeader: (xhr, info) => {
      const original = info && dashSource(info.url).url;
      // dash.js resolves relative templates against XHR.responseURL. The wire
      // response comes from localhost; retain the actual MPD/segment base URL.
      if (original && original !== info.url) {
        Object.defineProperty(xhr, 'responseURL', { configurable: true, get: () => original });
      }
      return xhr;
    } };
  }, true);
  player.updateSettings({ debug: { logLevel: 0 }, streaming: {
    text: { defaultEnabled: false },
    buffer: { stableBufferTime: 8, bufferTimeAtTopQuality: 12, bufferTimeAtTopQualityLongForm: 12 },
  } });
  player.on(dashjs.MediaPlayer.events.ERROR, (event) => {
    const code = event && event.error && event.error.code;
    onError(4, 'DASH playback failed' + (typeof code === 'number' ? ' (' + code + ')' : ''));
  });
  try { player.initialize(video, source.url, video.autoplay); }
  catch (e) { player.reset(); throw e; }
  return player;
}
