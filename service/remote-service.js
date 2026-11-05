// Phone remote + header proxy: a TizenBrew service (Node.js 4 on the TV, so plain ES5).
// - Serves the remote page to phones on the same Wi-Fi at http://<TV IP>:8095
// - Phones send key presses and text, guarded by a 4-digit PIN shown in the app's Settings.
// - The app on the TV long-polls /api/events from 127.0.0.1 and replays them as remote keys.
// - /proxy fetches a stream on the TV and adds request headers (Referer, User-Agent, Cookie...)
//   that the <video> element cannot send. Local only, so it is not an open proxy on the LAN.
'use strict';

var http = require('http');
var https = require('https');
var os = require('os');
var urlLib = require('url');

// The on-demand player service uses a separate loopback port so an old, healthy
// phone service kept alive by TizenBrew cannot prevent the new proxy starting.
var PORT = typeof PLAYER_SERVICE !== 'undefined' && PLAYER_SERVICE ? 8097 : 8095;
var BIND = PORT === 8097 ? '127.0.0.1' : '0.0.0.0';
var HOLD_MS = 25000; // long-poll hold time
var KEEP = 50; // events kept for late pollers
var PIN = String(1000 + Math.floor(Math.random() * 9000));

var events = [];
var browseData = null;
var nowPlaying = null;
var nowPlayingAt = 0;
var nextId = 1;
var waiting = [];

// The address phones reach the TV on: a home-network (private) IPv4 first, any other IPv4 after.
function tvIp() {
  var nets = os.networkInterfaces();
  var names = Object.keys(nets);
  var other = '';
  for (var i = 0; i < names.length; i++) {
    var list = nets[names[i]];
    for (var j = 0; j < list.length; j++) {
      var a = list[j];
      if (a.family !== 'IPv4' || a.internal) continue;
      if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)) return a.address;
      if (!other) other = a.address;
    }
  }
  return other;
}

function isLocal(req) {
  var a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

// ---- Header proxy for the TV player ----
// The <video> element cannot set Referer/User-Agent/Cookie. This service runs on the TV and
// fetches the stream with those headers, so header-requiring links work without a PC.

var PROXY_MAX_REDIRECTS = 5;
var PROXY_TIMEOUT_MS = 30000;
var MAX_PLAYLIST_BYTES = 4 * 1024 * 1024;
var DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
var HTTP_AGENT = new http.Agent({ keepAlive: true, maxSockets: 8 });
var HTTPS_AGENT = new https.Agent({ keepAlive: true, maxSockets: 8 });
var HOP_HEADER = /^(host|connection|proxy-connection|content-length|transfer-encoding|upgrade|keep-alive|te|trailer)$/i;

function hasHeader(headers, name) {
  var lower = String(name).toLowerCase();
  for (var key in headers) {
    if (headers.hasOwnProperty(key) && String(key).toLowerCase() === lower) return true;
  }
  return false;
}

function jsonParam(value) {
  if (Object.prototype.toString.call(value) === '[object Array]') value = value[0];
  if (!value) return {};
  try {
    var parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

// HLS playlists contain relative segment/variant URLs. They must be rewritten through the
// proxy too, otherwise the player would request them from 127.0.0.1 without the headers.
function isPlaylist(target, headers) {
  var type = String((headers && headers['content-type']) || '').toLowerCase();
  return type.indexOf('mpegurl') >= 0 || /\.m3u8(\?|#|$)/i.test(target);
}

function proxyLink(target, headers, extraResponseHeaders) {
  var path = /\.m3u8(\?|#|$)/i.test(target) ? '/proxy/stream.m3u8' : '/proxy';
  var url = 'http://127.0.0.1:' + PORT + path + '?u=' + encodeURIComponent(target);
  if (headers && Object.keys(headers).length) url += '&h=' + encodeURIComponent(JSON.stringify(headers));
  if (extraResponseHeaders && Object.keys(extraResponseHeaders).length) {
    url += '&r=' + encodeURIComponent(JSON.stringify(extraResponseHeaders));
  }
  return url;
}

function rewritePlaylist(text, playlistUrl, headers, extraResponseHeaders) {
  var childHeaders = {};
  for (var key in headers) {
    if (!headers.hasOwnProperty(key)) continue;
    if (/^(range|if-range|if-none-match|if-modified-since)$/i.test(key)) continue;
    childHeaders[key] = headers[key];
  }
  function link(uri) {
    if (!uri) return uri;
    var absolute = urlLib.resolve(playlistUrl, uri);
    if (!/^https?:\/\//i.test(absolute)) return uri;
    return proxyLink(absolute, childHeaders, extraResponseHeaders);
  }

  var lines = String(text).split(/\r?\n/);
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.replace(/^\s+|\s+$/g, '');
    if (!trimmed) {
      out.push(line);
    } else if (trimmed.charAt(0) === '#') {
      // Keys, init segments, audio tracks and preload hints keep their URI in an attribute.
      out.push(line.replace(/URI="([^"]+)"/g, function (all, uri) { return 'URI="' + link(uri) + '"'; }));
    } else {
      out.push(link(trimmed));
    }
  }
  return out.join('\n');
}

function proxy(req, res, q) {
  var target = q.u || q.url;
  if (Object.prototype.toString.call(target) === '[object Array]') target = target[0];
  if (typeof target !== 'string' || !/^https?:\/\//i.test(target)) {
    return send(res, 400, 'invalid url', 'text/plain; charset=utf-8');
  }

  var source = jsonParam(q.h);
  var extraResponseHeaders = jsonParam(q.r);
  var headers = {};
  var key;
  for (key in source) {
    if (!source.hasOwnProperty(key)) continue;
    // Playlists are rewritten as text; ask upstream for the uncompressed body.
    if (/^accept-encoding$/i.test(key)) continue;
    if (HOP_HEADER.test(key) || !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(key)) continue;
    var value = source[key];
    if (value === null || value === undefined) continue;
    value = String(value);
    if (!value || /[\r\n]/.test(value)) continue;
    headers[key] = value;
  }
  if (!hasHeader(headers, 'user-agent')) headers['User-Agent'] = DEFAULT_UA;
  if (!hasHeader(headers, 'accept')) headers['Accept'] = '*/*';

  // Seeking and resume need the player's Range/conditional headers passed through.
  ['range', 'if-range', 'if-none-match', 'if-modified-since'].forEach(function (name) {
    if (req.headers[name] && !hasHeader(headers, name)) headers[name] = req.headers[name];
  });

  // A native player may range-request even a manifest. Rewriting a partial
  // playlist breaks child/audio URLs, so manifests must be fetched in full.
  if (/\.m3u8(\?|#|$)/i.test(target)) {
    Object.keys(headers).forEach(function (name) {
      if (/^(range|if-range)$/i.test(name)) delete headers[name];
    });
  }

  fetchStream(req, res, target, headers, extraResponseHeaders, 0);
}

function fetchStream(req, res, target, headers, extraResponseHeaders, redirects) {
  var parsed = urlLib.parse(target);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return send(res, 400, 'invalid protocol', 'text/plain; charset=utf-8');
  }

  var transport = parsed.protocol === 'https:' ? https : http;
  var options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.path || '/',
    method: req.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: headers,
    agent: parsed.protocol === 'https:' ? HTTPS_AGENT : HTTP_AGENT,
    // Node 4 on the TV has an old CA store; media links are not a trust boundary here.
    rejectUnauthorized: false
  };

  var upstream;
  try {
    upstream = transport.request(options, function (upstreamRes) {
      var status = upstreamRes.statusCode || 502;
      if (status >= 300 && status < 400 && upstreamRes.headers.location && redirects < PROXY_MAX_REDIRECTS) {
        upstreamRes.resume();
        return fetchStream(req, res, urlLib.resolve(target, upstreamRes.headers.location), headers, extraResponseHeaders, redirects + 1);
      }

      var out = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition',
        'cache-control', 'expires', 'last-modified', 'etag', 'date', 'content-encoding', 'vary'].forEach(function (name) {
        if (upstreamRes.headers[name] !== undefined) out[name] = upstreamRes.headers[name];
      });

      // proxyHeaders.response from the add-on: safe headers only, never framing/body headers.
      for (var key in extraResponseHeaders) {
        if (!extraResponseHeaders.hasOwnProperty(key)) continue;
        if (HOP_HEADER.test(key) || /^content-(length|range)$/i.test(key) || /^set-cookie$/i.test(key)) continue;
        if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(key)) continue;
        var extraValue = String(extraResponseHeaders[key]);
        if (!extraValue || /[\r\n]/.test(extraValue)) continue;
        out[key] = extraValue;
      }
      out['Access-Control-Allow-Origin'] = '*';
      out['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges';

      var playlist = isPlaylist(target, upstreamRes.headers) && req.method !== 'HEAD';
      if (playlist && status === 206) {
        upstreamRes.resume();
        var fullHeaders = {};
        var hadRange = false;
        Object.keys(headers).forEach(function (name) {
          if (/^(range|if-range)$/i.test(name)) { hadRange = true; return; }
          fullHeaders[name] = headers[name];
        });
        if (hadRange) return fetchStream(req, res, target, fullHeaders, extraResponseHeaders, redirects);
        return send(res, 502, 'proxy: incomplete playlist', 'text/plain; charset=utf-8');
      }
      if (playlist) {
        var chunks = [];
        var size = 0;
        var tooBig = false;
        upstreamRes.on('data', function (chunk) {
          if (tooBig) return;
          size += chunk.length;
          if (size > MAX_PLAYLIST_BYTES) {
            tooBig = true;
            chunks = [];
            return;
          }
          chunks.push(chunk);
        });
        upstreamRes.on('error', function () {
          try { res.destroy(); } catch (e) { /* already closed */ }
        });
        upstreamRes.on('end', function () {
          if (tooBig) {
            if (!res.headersSent) send(res, 502, 'proxy: playlist too large', 'text/plain; charset=utf-8');
            return;
          }
          var body = rewritePlaylist(Buffer.concat(chunks).toString('utf8'), target, headers, extraResponseHeaders);
          delete out['content-length'];
          delete out['content-range'];
          delete out['content-encoding'];
          out['Content-Type'] = 'application/vnd.apple.mpegurl';
          out['Content-Length'] = Buffer.byteLength(body, 'utf8');
          try {
            res.writeHead(status, out);
          } catch (e) {
            try { res.destroy(); } catch (e2) { /* already closed */ }
            return;
          }
          res.end(body);
        });
        return;
      }

      try {
        res.writeHead(status, out);
      } catch (e) {
        upstreamRes.resume();
        try { res.destroy(); } catch (e2) { /* already closed */ }
        return;
      }
      if (req.method === 'HEAD') res.end();
      else upstreamRes.pipe(res);
      upstreamRes.on('error', function () {
        try { res.destroy(); } catch (e) { /* already closed */ }
      });
    });
  } catch (e) {
    return send(res, 502, 'proxy: ' + (e && e.message ? e.message : 'invalid request'), 'text/plain; charset=utf-8');
  }

  upstream.on('error', function (err) {
    if (!res.headersSent) {
      send(res, 502, 'proxy: ' + (err && err.message ? err.message : 'upstream error'), 'text/plain; charset=utf-8');
    } else {
      try { res.destroy(); } catch (e) { /* already closed */ }
    }
  });
  // Only the connect/response wait, not the whole download: slow streams keep streaming.
  upstream.setTimeout(PROXY_TIMEOUT_MS, function () { upstream.abort(); });
  res.on('close', function () { upstream.abort(); });
  upstream.end();
}

function push(ev) {
  ev.id = nextId++;
  events.push(ev);
  if (events.length > KEEP) events.shift();
  var w = waiting;
  waiting = [];
  w.forEach(function (fn) { fn(); });
}

function since(id) {
  return events.filter(function (e) { return e.id > id; });
}

function readBody(req, cb, limit) {
  var data = '';
  req.on('data', function (c) {
    data += c;
    if (data.length > (limit || 4096)) req.destroy();
  });
  req.on('end', function () { cb(data); });
}

var page = null;
function remotePage() {
  if (page === null) {
    // Served from the module on jsDelivr next to this file, or inlined by the build.
    page = typeof REMOTE_PAGE === 'string' ? REMOTE_PAGE : '';
  }
  return page;
}

// Volume: the app can't change it itself, so it presses the TV's own volume keys through
// Samsung's remote-control API (the one phone remote apps use), on this TV only. The first time,
// the TV may ask to allow "Stremio Kai Remote".
var tvWs = null;
var tvQueue = [];
function tvKey(keyName, cb) {
  var WebSocket;
  try {
    WebSocket = require('ws');
  } catch (e) {
    return cb('no websocket module');
  }
  var msg = JSON.stringify({
    method: 'ms.remote.control',
    params: { Cmd: 'Click', DataOfCmd: keyName, Option: 'false', TypeOfRemote: 'SendRemoteKey' }
  });
  if (tvWs && tvWs.readyState === 1) {
    tvWs.send(msg);
    return cb(null);
  }
  tvQueue.push({ msg: msg, cb: cb });
  if (tvWs) return;
  var name = new Buffer('Stremio Kai Remote').toString('base64');
  tvWs = new WebSocket('ws://127.0.0.1:8001/api/v2/channels/samsung.remote.control?name=' + name);
  var flush = function (err) {
    var q = tvQueue;
    tvQueue = [];
    q.forEach(function (item) {
      if (!err && tvWs && tvWs.readyState === 1) tvWs.send(item.msg);
      item.cb(err);
    });
  };
  tvWs.on('message', function (data) {
    // The TV answers ms.channel.connect once the connection is allowed.
    if (String(data).indexOf('ms.channel.connect') >= 0) flush(null);
    else if (String(data).indexOf('ms.channel.unauthorized') >= 0) flush('not allowed on the TV');
  });
  tvWs.on('error', function () {
    tvWs = null;
    flush('TV remote API unreachable');
  });
  tvWs.on('close', function () {
    tvWs = null;
  });
  setTimeout(function () {
    if (tvQueue.length) flush('waiting for the TV to allow the remote');
  }, 15000);
}

var server = http.createServer(function (req, res) {
  try {
    handle(req, res);
  } catch (e) {
    try { send(res, 500, { error: String(e && e.message) }); } catch (e2) { /* already answered */ }
  }
});

function handle(req, res) {
  var url = urlLib.parse(req.url, true);
  var q = url.query;

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // ---- TV side (app on the same TV only) ----
  if (url.pathname === '/api/info') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    return send(res, 200, {
      ip: tvIp(), port: PORT, pin: PIN, last: nextId - 1, version: 3, proxy: 1,
      torrent: PORT === 8097 && typeof TV_TORRENT !== 'undefined' && TV_TORRENT.supported() ? 1 : 0
    });
  }
  if (url.pathname === '/torrent/open' && req.method === 'POST') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    if (typeof TV_TORRENT === 'undefined' || !TV_TORRENT.supported()) return send(res, 503, { error: 'torrent engine unavailable' });
    return readBody(req, function (body) {
      var args;
      try { args = JSON.parse(body); } catch (e) { return send(res, 400, { error: 'invalid request' }); }
      TV_TORRENT.create(args, function (err, result) {
        if (err) return send(res, 502, { error: String(err.message || err) });
        send(res, 200, result);
      });
    }, 8192);
  }
  if (url.pathname.indexOf('/torrent-status/') === 0) {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
    var statsId = url.pathname.slice('/torrent-status/'.length);
    if (!/^[a-f0-9]{16}$/.test(statsId) || typeof TV_TORRENT === 'undefined' || !TV_TORRENT.stats) return send(res, 404, { error: 'not available' });
    var stats = TV_TORRENT.stats(statsId);
    return send(res, stats ? 200 : 404, stats || { error: 'session not found' });
  }
  if (url.pathname.indexOf('/torrent/') === 0) {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    if (typeof TV_TORRENT === 'undefined' || !TV_TORRENT.supported()) return send(res, 503, { error: 'torrent engine unavailable' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' });
    var torrentId = url.pathname.slice('/torrent/'.length);
    if (!/^[a-f0-9]{16}$/.test(torrentId)) return send(res, 404, { error: 'torrent session not found' });
    return TV_TORRENT.serve(req, res, torrentId);
  }
  if (url.pathname === '/proxy' || url.pathname === '/proxy/stream.m3u8') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    return proxy(req, res, q);
  }
  if (url.pathname === '/api/events') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    var after = parseInt(q.since, 10) || 0;
    if (after > nextId) after = 0; // the service restarted
    var ready = since(after);
    if (ready.length) return send(res, 200, { events: ready, last: nextId - 1 });
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      clearTimeout(timer);
      send(res, 200, { events: since(after), last: nextId - 1 });
    };
    var timer = setTimeout(finish, HOLD_MS);
    waiting.push(finish);
    req.on('close', function () { done = true; clearTimeout(timer); });
    return;
  }

  if (url.pathname === '/api/state' && req.method === 'POST') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    return readBody(req, function (body) {
      try {
        nowPlaying = JSON.parse(body);
      } catch (e) {
        nowPlaying = null;
      }
      nowPlayingAt = Date.now();
      send(res, 200, { ok: true });
    });
  }

  if (url.pathname === '/api/browse' && req.method === 'POST') {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    return readBody(req, function (body) {
      try {
        browseData = JSON.parse(body);
      } catch (e) {
        /* keep the last good lists */
      }
      send(res, 200, { ok: true });
    }, 500000);
  }

  // ---- Phone side ----
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return send(res, 200, remotePage(), 'text/html; charset=utf-8');
  }
  if (url.pathname === '/api/check') {
    return send(res, q.pin === PIN ? 200 : 401, { ok: q.pin === PIN });
  }
  if (url.pathname === '/api/key' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    var code = parseInt(q.code, 10);
    if (!(code > 0 && code < 70000)) return send(res, 400, { ok: false });
    push({ type: 'key', code: code });
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/api/search' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    return readBody(req, function (text) {
      push({ type: 'search', text: String(text).slice(0, 200) });
      send(res, 200, { ok: true });
    });
  }
  if (url.pathname === '/api/browse') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    return send(res, 200, browseData || { continueWatching: [], newEpisodes: [], library: [] });
  }
  if (url.pathname === '/api/open' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    if (!q.id || (q.type !== 'movie' && q.type !== 'series')) return send(res, 400, { ok: false });
    push({ type: 'open', kind: q.type, item: String(q.id).slice(0, 200), video: q.video ? String(q.video).slice(0, 200) : '' });
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/api/state') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    // The player reports every few seconds; a stale report means it's no longer playing.
    var fresh = nowPlaying && Date.now() - nowPlayingAt < 45000;
    return send(res, 200, { playing: fresh ? nowPlaying : null, at: nowPlayingAt });
  }
  if (url.pathname === '/api/seek' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    var to = parseInt(q.to, 10);
    if (!(to >= 0)) return send(res, 400, { ok: false });
    push({ type: 'seek', to: to });
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/api/volume' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    var keyName = { up: 'KEY_VOLUP', down: 'KEY_VOLDOWN', mute: 'KEY_MUTE' }[q.dir];
    if (!keyName) return send(res, 400, { ok: false });
    return tvKey(keyName, function (err) {
      send(res, err ? 502 : 200, { ok: !err, error: err || undefined });
    });
  }
  if (url.pathname === '/api/text' && req.method === 'POST') {
    if (q.pin !== PIN) return send(res, 401, { ok: false });
    return readBody(req, function (text) {
      push({ type: 'text', text: String(text).slice(0, 500), submit: q.submit === '1' });
      send(res, 200, { ok: true });
    });
  }
  send(res, 404, { error: 'not found' });
}

// Port busy: an older copy may still be letting go of it; try again for a minute.
var tries = 0;
server.on('error', function () {
  if (++tries < 12) setTimeout(function () { server.listen(PORT, BIND); }, 5000);
});
server.listen(PORT, BIND);
