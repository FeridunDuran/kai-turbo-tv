// Optional stremio-service on port 11470 provides a PC proxy and embedded-track metadata.
// Torrents always run through the TV engine; header-dependent links can use the TV proxy.
import { getJSON } from '../lib/http.js';
import * as store from '../lib/store.js';
import { getTvIp } from '../lib/luna.js';
import { t } from '../lib/i18n.js';
import * as tvproxy from './tvproxy.js';

let status = { ok: false, checkedAt: 0, url: '' };

export function baseUrl() {
  let u = (store.settings().serverUrl || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//.test(u)) u = 'http://' + u;
  if (!/:\d+/.test(u.replace(/^https?:\/\//, ''))) u = u.replace(/\/$/, '') + ':11470';
  return u.replace(/\/$/, '') + '/';
}

export function check(urlOverride) {
  const u = urlOverride || baseUrl();
  if (!u) {
    status = { ok: false, checkedAt: Date.now(), url: '' };
    return Promise.resolve(status);
  }
  return getJSON(u + 'settings', { timeout: 4000, quiet: true })
    .then((r) => {
      status = { ok: true, checkedAt: Date.now(), url: u, version: r && r.values && r.values.serverVersion };
      return status;
    })
    .catch(() => {
      status = { ok: false, checkedAt: Date.now(), url: u };
      return status;
    });
}

export function isAvailable() {
  return status.ok && status.url === baseUrl();
}

export function lastStatus() {
  return status;
}

// Procura o servidor na mesma sub-rede da TV (x.x.x.1–254), em lotes.
export function scan(onProgress) {
  return getTvIp().then((ip) => {
    const prefix = ip.split('.').slice(0, 3).join('.') + '.';
    const hosts = [];
    for (let i = 1; i < 255; i++) if (prefix + i !== ip) hosts.push(prefix + i);
    let found = null;
    let done = 0;
    const batch = 24;
    const runBatch = (start) => {
      if (found || start >= hosts.length) return Promise.resolve(found);
      const slice = hosts.slice(start, start + batch);
      return Promise.all(
        slice.map((h) =>
          getJSON('http://' + h + ':11470/settings', { timeout: 1500, quiet: true })
            .then(() => {
              if (!found) found = h;
            })
            .catch(() => {})
            .then(() => {
              done++;
              if (onProgress) onProgress(done, hosts.length);
            })
        )
      ).then(() => runBatch(start + batch));
    };
    return runBatch(0);
  });
}

function parseMagnet(uri) {
  const m = uri.match(/xt=urn:btih:([a-zA-Z0-9]+)/);
  if (!m) return null;
  let hash = m[1];
  if (hash.length === 32) hash = base32ToHex(hash);
  const trackers = [];
  uri.replace(/[?&]tr=([^&]+)/g, (_, tracker) => {
    trackers.push('tracker:' + decodeURIComponent(tracker));
    return '';
  });
  const nameMatch = uri.match(/[?&]dn=([^&]+)/);
  let name = '';
  if (nameMatch) {
    try { name = decodeURIComponent(nameMatch[1].replace(/\+/g, '%20')); } catch (e) { name = ''; }
  }
  return { infoHash: hash.toLowerCase(), sources: trackers, name };
}

function base32ToHex(s) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  s.toUpperCase()
    .split('')
    .forEach((c) => {
      const v = alphabet.indexOf(c);
      if (v >= 0) bits += ('00000' + v.toString(2)).slice(-5);
    });
  let hex = '';
  for (let i = 0; i + 4 <= bits.length; i += 4) hex += parseInt(bits.substr(i, 4), 2).toString(16);
  return hex;
}

function proxyUrl(base, streamUrl, reqHeaders, resHeaders) {
  // Sem new URL(): o do Chromium 38 é incompleto e o polyfill pesa demais.
  const m = streamUrl.match(/^(https?:\/\/[^/?#]+)([^?#]*)(\?[^#]*)?/);
  if (!m) return streamUrl;
  const parts = ['d=' + encodeURIComponent(m[1])];
  Object.keys(reqHeaders || {}).forEach((k) => parts.push('h=' + encodeURIComponent(k + ':' + reqHeaders[k])));
  Object.keys(resHeaders || {}).forEach((k) => parts.push('r=' + encodeURIComponent(k + ':' + resHeaders[k])));
  return base + 'proxy/' + parts.join('&') + (m[2] || '/') + (m[3] || '');
}

// URL passando pelo proxy do servidor com CORS liberado (para APIs que bloqueiam o app).
export function corsProxyUrl(url) {
  const base = isAvailable() ? baseUrl() : '';
  const m = url.match(/^(https?:\/\/[^/?#]+)(.*)$/);
  if (!base || !m) return null;
  return base + 'proxy/d=' + encodeURIComponent(m[1]) + '&r=' + encodeURIComponent('Access-Control-Allow-Origin:*') + (m[2] || '/');
}

// Tenta direto; se a rede/CORS falhar e houver servidor no PC, tenta pelo proxy.
export function getJSONViaProxy(url, opts) {
  return getJSON(url, Object.assign({ quiet: true }, opts)).catch((e) => {
    const p = corsProxyUrl(url);
    if (!p || (e.status && e.status !== 0)) throw e;
    return getJSON(p, Object.assign({ quiet: true }, opts));
  });
}

// Recognize magnet and infoHash streams handled by the TV torrent engine.
export function isTorrent(stream) {
  if (typeof stream.url === 'string') return stream.url.indexOf('magnet:') === 0;
  return typeof stream.infoHash === 'string';
}

// Link HTTP que pede cabeçalhos de requisição (Referer, User-Agent...) que o <video> da TV não envia.
// Só cabeçalhos de resposta não contam: eles só importam para o proxy, não para o player.
export function needsHeaders(stream) {
  if (typeof stream.url !== 'string' || isTorrent(stream)) return false;
  const ph = stream.behaviorHints && stream.behaviorHints.proxyHeaders;
  const req = ph && ph.request;
  if (!req || typeof req !== 'object') return false;
  return Object.keys(req).some((k) => req[k] != null && String(req[k]).trim() !== '');
}

// Indicates a torrent source or an HTTP source with request headers that need a proxy.
export function needsServer(stream) {
  return isTorrent(stream) || needsHeaders(stream);
}

// Sem servidor só o torrent é impossível; link com cabeçalhos ainda pode ser tentado direto.
export function canTryDirect(stream) {
  return isPlayableType(stream) && !isTorrent(stream);
}

export function isPlayableType(stream) {
  return typeof stream.url === 'string' || typeof stream.infoHash === 'string';
}

// Converte um stream de addon numa URL que o <video> da TV consegue abrir.
export function toPlayable(stream, seriesInfo) {
  const base = baseUrl();
  if (typeof stream.url === 'string') {
    if (stream.url.indexOf('magnet:') === 0) {
      const mg = parseMagnet(stream.url);
      if (!mg) return Promise.reject(new Error(t('Magnet inválido')));
      return tvproxy.openTorrent({ infoHash: mg.infoHash, name: mg.name, sources: mg.sources,
        season: seriesInfo && seriesInfo.season, episode: seriesInfo && seriesInfo.episode });
    }
    const ph = stream.behaviorHints && stream.behaviorHints.proxyHeaders;
    if (ph && needsHeaders(stream)) {
      // Keep the existing PC proxy path for header-dependent HTTP links; otherwise use TV proxy.
      if (isAvailable()) {
        return Promise.resolve({ url: proxyUrl(base, stream.url, ph.request, ph.response), viaServer: true });
      }
      return tvproxy.ensure().then((ok) => {
        const tvUrl = ok ? tvproxy.proxyUrl(stream.url, ph.request, ph.response) : null;
        if (tvUrl) return { url: tvUrl, viaServer: false, viaTvProxy: true };
        return { url: stream.url, viaServer: false };
      });
    }
    return Promise.resolve({ url: stream.url, viaServer: false });
  }
  if (typeof stream.infoHash === 'string') {
    return tvproxy.openTorrent({ infoHash: stream.infoHash.toLowerCase(), fileIdx: stream.fileIdx,
      name: stream.name, sources: stream.sources || [], season: seriesInfo && seriesInfo.season,
      episode: seriesInfo && seriesInfo.episode });
  }
  return Promise.reject(new Error(t('Tipo de link não suportado na TV')));
}

// Faixas embutidas (áudio/legenda) do arquivo, lidas pelo servidor com ffprobe.
export function tracks(mediaUrl) {
  const base = baseUrl();
  if (!base) return Promise.resolve(null);
  return getJSON(base + 'tracks/' + encodeURIComponent(mediaUrl), { timeout: 20000, quiet: true }).then((list) => {
    const arr = Array.isArray(list) ? list : [];
    return {
      audio: arr.filter((tk) => tk && tk.type === 'audio'),
      subs: arr.filter((tk) => tk && tk.type === 'text'),
    };
  });
}

// Quanto do arquivo do torrent já está no PC (0–1). TV torrent URLs do not expose this statistic.
export function streamProgress(mediaUrl) {
  const m = String(mediaUrl || '').match(/\/([a-f0-9]{40})\/(\d+)/i);
  const base = baseUrl();
  if (!m || !base) return Promise.resolve(null);
  return getJSON(base + m[1] + '/' + m[2] + '/stats.json', { timeout: 5000, quiet: true })
    .then((r) => (r && typeof r.streamProgress === 'number' ? r.streamProgress : null))
    .catch(() => null);
}

// Converte legendas externas para VTT pelo servidor (contorna CORS/codificação).
export function subtitlesProxy(subUrl) {
  const base = baseUrl();
  return base ? base + 'subtitles.vtt?from=' + encodeURIComponent(subUrl) : null;
}
