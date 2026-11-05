// Log no console e, opcionalmente, enviado para o servidor de logs no PC (npm run logs).
let remoteUrl = '';
const buffer = [];
let flushing = false;
let failures = 0;

// Esconde chaves de debrid/API que aparecem nas URLs dos addons (ex.: Torrentio).
function redact(text) {
  // Add-on configuration and signed media paths can contain credentials, not just queries.
  return text.replace(/https?:\/\/[^\s"<>]+/gi, (url) => {
    const origin = url.match(/^(https?:\/\/)(?:[^/@]+@)?([^/?#]+)/i);
    return origin ? origin[1] + origin[2] + '/[redacted]' : '[redacted URL]';
  }).replace(/("?(?:auth_token|access_token|password|authorization|api_key|apikey|token)"?\s*[:=]\s*"?)[^"\s,}]+/gi, '$1***');
}

function send(level, args) {
  const raw = Array.prototype.map
    .call(args, (a) => {
      if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack : '');
      if (typeof a === 'object') {
        try {
          return JSON.stringify(a);
        } catch (e) {
          return String(a);
        }
      }
      return String(a);
    })
    .join(' ');
  const text = redact(raw);
  try {
    (console[level] || console.log).call(console, '[kai] ' + text);
  } catch (e) {
    /* ignore */
  }
  if (!remoteUrl) return;
  buffer.push({ t: Date.now(), level: level, text: text });
  if (buffer.length > 200) buffer.shift();
  flush();
}

function flush() {
  if (flushing || !buffer.length || !remoteUrl) return;
  flushing = true;
  const batch = buffer.splice(0, buffer.length);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', remoteUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = 5000;
  xhr.onloadend = () => {
    flushing = false;
    // A failed or timed-out batch used to be dropped (a TV trace lost 14 s of lines).
    // Put it back in front of newer lines and retry later; the 200-line cap still applies.
    const ok = xhr.status >= 200 && xhr.status < 300;
    if (!ok) {
      Array.prototype.unshift.apply(buffer, batch);
      if (buffer.length > 200) buffer.splice(0, buffer.length - 200);
      failures++;
      setTimeout(flush, Math.min(10000, 1000 * failures));
      return;
    }
    failures = 0;
    if (buffer.length) setTimeout(flush, 200);
  };
  try {
    xhr.send(JSON.stringify(batch));
  } catch (e) {
    flushing = false;
    Array.prototype.unshift.apply(buffer, batch);
  }
}

export const log = {
  debug: function () { if (remoteUrl) send("log", arguments); },
  info: function () {
    send('log', arguments);
  },
  warn: function () {
    send('warn', arguments);
  },
  error: function () {
    send('error', arguments);
  },
  setRemote: function (url) {
    remoteUrl = url || '';
    flush();
  },
};

window.onerror = function (msg, src, line, col, err) {
  log.error('ERRO JS:', msg, (src || '') + ':' + line + ':' + col, err && err.stack ? err.stack : '');
};

window.onunhandledrejection = function (event) {
  log.error('Unhandled promise rejection', event && event.reason || 'Unknown rejection');
};
