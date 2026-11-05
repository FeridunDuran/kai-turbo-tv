// Header proxy that runs on the TV itself, inside the TizenBrew service
// (service/remote-service.js, port 8095). The TV's <video> element cannot send
// Referer/User-Agent/Cookie, so the service fetches the stream and adds them.
// Nothing runs on a PC and no separate proxy app is needed.
import { log } from '../lib/log.js';

const PORT = 8095;
const BASE = 'http://127.0.0.1:' + PORT;
const TTL_MS = 30000;

let status = { ok: false, checkedAt: 0 };

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
export function check() {
  if (status.ok && Date.now() - status.checkedAt < TTL_MS) return Promise.resolve(status);
  return request(BASE + '/api/info', 2500)
    .then((r) => {
      status = { ok: !!(r && r.proxy), checkedAt: Date.now() };
      return status;
    })
    .catch(() => {
      status = { ok: false, checkedAt: Date.now() };
      return status;
    });
}

export function ensure() {
  if (status.ok) return Promise.resolve(true);
  return check().then((s) => s.ok);
}

export function isAvailable() {
  return status.ok;
}

export function lastStatus() {
  return status;
}

// Build the URL the <video> element opens. Request headers go in the query; they can be
// long (Cookie), but the service and the URL both live in the TV's memory only.
export function proxyUrl(streamUrl, requestHeaders, responseHeaders) {
  if (!status.ok) return null;
  const request = cleanHeaders(requestHeaders);
  if (!request) return null;
  const response = cleanHeaders(responseHeaders);
  let url = BASE + '/proxy?u=' + encodeURIComponent(streamUrl);
  url += '&h=' + encodeURIComponent(JSON.stringify(request));
  if (response) url += '&r=' + encodeURIComponent(JSON.stringify(response));
  log.info('TV proxy', streamUrl);
  return url;
}
