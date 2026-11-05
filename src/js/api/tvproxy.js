// Header proxy that runs on the TV itself, inside the TizenBrew service
// (service/remote-service.js, ports 8095/8096/8097). The TV's <video> element cannot send
// Referer/User-Agent/Cookie, so the service fetches the stream and adds them.
// Nothing runs on a PC and no separate proxy app is needed.
import { log } from '../lib/log.js';

const TTL_MS = 30000;
let base = 'http://127.0.0.1:8097';
let checking = null;
let launch = null;

let status = { ok: false, torrent: false, checkedAt: 0 };

function request(url, timeout) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.timeout = timeout;
    x.onload = () => {
      try {
        resolve(x.status === 200 ? JSON.parse(x.responseText) : null);
      } catch (e) {
        reject(e);
      }
    };
    x.onerror = x.ontimeout = () => reject(new Error('TV proxy unreachable'));
    x.send();
  });
}

// Header names that must stay under the proxy's control (framing, host, cookies we do not own).
function cleanHeaders(headers) {
  if (!headers || typeof headers !== 'object') return null;
  const out = {};
  Object.keys(headers).forEach((name) => {
    if (!name || /^(host|connection|content-length|transfer-encoding|upgrade|keep-alive)$/i.test(name)) return;
    const value = headers[name];
    if (value === null || value === undefined) return;
    const text = String(value);
    if (!text) return;
    out[name] = text;
  });
  return Object.keys(out).length ? out : null;
}

// The service is local; a failed check is cheap. Cache it briefly so opening a source
// list does not probe the service for every row.
function probe(port) {
  const url = 'http://127.0.0.1:' + port;
  return request(url + '/api/info', 600).then((r) => r && r.proxy ? { url, torrent: !!r.torrent } : null).catch(() => null);
}

function waitForTorrent(fallback) {
  const startedAt = Date.now();
  function poll() {
    return probe(8097).then((result) => {
      if (result && result.torrent) return result;
      if (Date.now() - startedAt >= 10000) return result || fallback;
      return new Promise((resolve) => setTimeout(resolve, 500)).then(poll);
    });
  }
  return poll();
}

// Pin the service to the SAME commit as app.js, bypassing TizenBrew's stale
// unversioned service cache. This is a local TizenBrew command, never a PC service.
function startPlayerService() {
  if (launch) return launch;
  const m = (window.__KAI_BASE__ || '').match(/\/gh\/(FeridunDuran\/stremio-kai-tizen)@([a-f0-9]{40})\/dist\/$/);
  if (!m || !/\/module\//.test(location.pathname) || typeof WebSocket === 'undefined') return Promise.resolve(false);
  launch = new Promise((resolve) => {
    let done = false;
    let ws;
    const end = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (ws) { ws.onopen = null; try { ws.close(); } catch (e) { /* not open */ } }
      resolve(ok);
    };
    const timer = setTimeout(() => end(false), 1200);
    try {
      ws = new WebSocket('ws://127.0.0.1:8081');
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 6, payload: {
          fullName: 'gh/' + m[1] + '@' + m[2], serviceFile: 'dist/player-service.js',
        } }));
        end(true);
      };
      ws.onerror = () => end(false);
    } catch (e) { end(false); }
  });
  return launch;
}

export function check(force) {
  if (!force && status.checkedAt && Date.now() - status.checkedAt < (status.ok ? TTL_MS : 5000)) return Promise.resolve(status);
  if (checking) return checking;
  // Launch all probes together, but a ready player must not wait for legacy ports.
  const playerProbe = probe(8097);
  const legacyProbes = Promise.all([probe(8096), probe(8095)]);
  checking = playerProbe.then((player) => {
    if (player && player.torrent) return player;
    // Starting the player and collecting legacy fallbacks are independent.
    const started = startPlayerService();
    return started.then((ok) => {
      if (!ok) return legacyProbes.then((urls) => player || urls[0] || urls[1]);
      // Do not let slow legacy ports delay discovery of the newly started player.
      return waitForTorrent(player).then((result) => result && result.torrent ? result
        : legacyProbes.then((urls) => result || player || urls[0] || urls[1]));
    });
  }).then((url) => {
    if (url) base = url.url;
    status = { ok: !!url, torrent: !!(url && url.torrent), checkedAt: Date.now() };
    checking = null;
    return status;
  }, () => {
    checking = null;
    status = { ok: false, torrent: false, checkedAt: Date.now() };
    return status;
  });
  return checking;
}

export function ensure() {
  if (status.ok) return Promise.resolve(true);
  return check().then((s) => s.ok);
}

export function ensureTorrent() {
  if (status.torrent) return Promise.resolve(true);
  return check(true).then((s) => s.torrent);
}

export function isAvailable() {
  return status.ok;
}

export function isTorrentAvailable() {
  return status.torrent;
}

export function lastStatus() {
  return status;
}

export function torrentStats(url) {
  const match = /^(http:\/\/127\.0\.0\.1:8097)\/torrent\/([a-f0-9]{16})$/.exec(url || '');
  return match ? request(match[1] + '/torrent-status/' + match[2], 2500).catch(() => null) : Promise.resolve(null);
}

export function openTorrent(args) {
  return ensureTorrent().then((ok) => {
    if (!ok) throw new Error('TV torrent engine unavailable');
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', base + '/torrent/open', true);
      x.timeout = 0; // The service enforces inactivity, not a total metadata deadline.
      // TizenBrew's page and this service have different ports/origins. JSON
      // Content-Type triggers a preflight that older services do not support.
      // The endpoint parses the body as JSON regardless of its media type.
      x.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
      x.onload = () => {
        let result;
        try { result = JSON.parse(x.responseText); } catch (e) { result = null; }
        if (x.status === 200 && result && result.url) resolve(result);
        else {
          const error = new Error(result && result.error || 'Could not open TV torrent');
          error.torrentOpen = true;
          reject(error);
        }
      };
      const disconnected = (message) => {
        status = { ok: false, torrent: false, checkedAt: 0 };
        reject(new Error(message));
      };
      x.onerror = () => disconnected('TV torrent service unreachable');
      x.ontimeout = () => disconnected('TV torrent service did not respond within 25 seconds');
      x.send(JSON.stringify(args || {}));
    });
  });
}

// Build the URL the <video> element opens. Request headers go in the query; they can be
// long (Cookie), but the service and the URL both live in the TV's memory only.
export function proxyUrl(streamUrl, requestHeaders, responseHeaders) {
  if (!status.ok) return null;
  const request = cleanHeaders(requestHeaders);
  if (!request) return null;
  const response = cleanHeaders(responseHeaders);
  const path = /\.m3u8(\?|#|$)/i.test(streamUrl) ? '/proxy/stream.m3u8' : '/proxy';
  let url = base + path + '?u=' + encodeURIComponent(streamUrl);
  url += '&h=' + encodeURIComponent(JSON.stringify(request));
  if (response) url += '&r=' + encodeURIComponent(JSON.stringify(response));
  log.info('TV proxy enabled');
  return url;
}
