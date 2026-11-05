// Torrent playback that runs on the TV itself, inside the TizenBrew service.
// The engine is bundled ahead of this file as the global TorrentEngine (torrent-stream
// 1.0.3, patched: pieces can be released and downloaded again for a rolling RAM cache).
// The player gets a local HTTP URL with Range support; nothing runs on a PC.
'use strict';

var TV_TORRENT = (function () {
  var os = require('os');
  var crypto = require('crypto');

  // ~40 MB window inside a 48 MB store: enough for a few seconds of 1080p after a seek.
  var CACHE_BYTES = 48 * 1024 * 1024;
  var AHEAD_BYTES = 32 * 1024 * 1024;
  var BEHIND_BYTES = 8 * 1024 * 1024;
  var OPEN_TIMEOUT_MS = 20000;
  var IDLE_MS = 3 * 60 * 1000;
  var STALL_MS = 20000;
  var MAX_SESSIONS = 2;

  // Public trackers, used together with the ones the add-on sends.
  var DEFAULT_TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://tracker.openbittorrent.com:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://exodus.desync.com:6969/announce',
    // TCP alternatives: UDP/DHT can be blocked while HTTP still works.
    'http://tracker.dler.com:6969/announce',
    'http://tracker2.dler.org:80/announce',
    'http://tracker.renfei.net:8080/announce'
  ];

  var VIDEO_RE = /\.(mp4|m4v|mkv|webm|avi|mov|mpg|mpeg|ts|m2ts|wmv|flv|ogv)$/i;
  var TYPES = {
    mp4: 'video/mp4', m4v: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm',
    avi: 'video/x-msvideo', mov: 'video/quicktime', mpg: 'video/mpeg', mpeg: 'video/mpeg',
    ts: 'video/mp2t', m2ts: 'video/mp2t', wmv: 'video/x-ms-wmv', flv: 'video/x-flv',
    ogv: 'video/ogg'
  };

  var sessions = {};
  var order = [];

  function noop() {}

  // Startup and transfer diagnostics kept on the engine (it survives warm episode reuse).
  // Counts and times only; no addresses, names or URLs.
  function attachDiag(engine) {
    var d = engine.diag = { createdAt: Date.now(), firstPeerMs: null, firstWireMs: null, firstUnchokeMs: null,
      firstBlockMs: null, readyMs: null, peersFound: 0, wiresOpened: 0, wiresClosed: 0, timeouts: 0,
      chokes: 0, unchokes: 0, hashFails: 0, hotswaps: 0, pieces: [], closed: [] };
    function at() { return Date.now() - d.createdAt; }
    engine.on('peer', function () { d.peersFound++; if (d.firstPeerMs === null) d.firstPeerMs = at(); });
    engine.on('wire', function (wire) {
      var openedAt = Date.now();
      var bytes = 0;
      d.wiresOpened++;
      if (d.firstWireMs === null) d.firstWireMs = at();
      if (typeof wire.on !== 'function') return;
      wire.on('unchoke', function () { d.unchokes++; if (d.firstUnchokeMs === null) d.firstUnchokeMs = at(); });
      wire.on('choke', function () { d.chokes++; });
      wire.on('download', function (n) { bytes += n; if (d.firstBlockMs === null) d.firstBlockMs = at(); });
      wire.on('close', function () {
        d.wiresClosed++;
        // Lifetime and payload of the most recent closed connections: short-lived wires with
        // no payload point at unreachable or choking peers rather than a slow swarm.
        d.closed.push({ s: Math.round((Date.now() - openedAt) / 1000), kb: Math.round(bytes / 1024) });
        if (d.closed.length > 8) d.closed.shift();
      });
    });
    engine.on('timeout', function () { d.timeouts++; });
    engine.on('invalid-piece', function () { d.hashFails++; });
    engine.on('hotswap', function () { d.hotswaps++; });
    engine.on('ready', function () { d.readyMs = at(); });
    engine.on('verify', function (index) {
      var requested = engine.pieceRequestedAt && engine.pieceRequestedAt[index];
      d.pieces.push({ i: index, ms: requested ? Date.now() - requested : null, at: at() });
      if (d.pieces.length > 10) d.pieces.shift();
      if (requested) delete engine.pieceRequestedAt[index];
    });
    return d;
  }

  // peer-wire-swarm forgets a discovered peer after one failed connection attempt; only peers
  // that completed a handshake are retried. TV trace: 59 peers discovered, 5 connections ever.
  // Like WebTorrent (RECONNECT_WAIT 1/5/15 s) and libtorrent (max_failcount 3), a peer that is
  // no longer known to the swarm is offered again, at most three more times, while the engine
  // has few connections. This adds connection attempts only, not downloads.
  var PEER_RETRY_WAIT = [5000, 15000, 30000];
  var PEER_RETRY_BELOW = 20;
  function retryFailedPeers(engine, now) {
    var known = {};
    engine.peerRetries = known;
    engine.on('peer', function (addr) {
      if (typeof addr === 'string' && !known[addr]) known[addr] = { tries: 0, at: (now || Date.now)() };
    });
    var timer = setInterval(function () {
      var swarm = engine.swarm;
      if (!swarm || !swarm._peers || swarm.wires.length >= PEER_RETRY_BELOW) return;
      var t = (now || Date.now)();
      Object.keys(known).forEach(function (addr) {
        var entry = known[addr];
        if (swarm._peers[addr] || entry.tries >= PEER_RETRY_WAIT.length) return;
        if (t - entry.at < PEER_RETRY_WAIT[entry.tries]) return;
        entry.tries++;
        entry.at = t;
        if (engine.diag) engine.diag.peerRetries = (engine.diag.peerRetries || 0) + 1;
        engine.connect(addr);
      });
    }, 2500);
    if (timer && timer.unref) timer.unref();
    var destroy = engine.destroy;
    engine.destroy = function () {
      if (timer) clearInterval(timer);
      return destroy.apply(engine, arguments);
    };
  }

  function wireSummary(engine) {
    var swarm = engine.swarm || {};
    var wires = swarm.wires || [];
    var unchoked = 0;
    var speeds = [];
    var speed = function (x) { return typeof x.downloadSpeed === 'function' ? x.downloadSpeed() : 0; };
    for (var i = 0; i < wires.length; i++) {
      if (!wires[i].peerChoking) unchoked++;
      speeds.push(Math.round(speed(wires[i]) / 1024));
    }
    speeds.sort(function (a, b) { return b - a; });
    return { connected: wires.length, unchoked: unchoked, topKBs: speeds.slice(0, 6), rateKBs: Math.round(speed(swarm) / 1024) };
  }

  function supported() {
    return typeof TorrentEngine === 'function';
  }

  function tmpDir() {
    try {
      return os.tmpdir ? os.tmpdir() : '/tmp';
    } catch (e) {
      return '/tmp';
    }
  }

  // RAM chunk store for torrent-stream: same API as fs-chunk-store, capped by the window.
  function makeStorage(maxBytes) {
    function Store(chunkLength) {
      if (!(this instanceof Store)) return new Store(chunkLength);
      this.chunkLength = chunkLength;
      this.buffers = [];
      this.present = [];
      this.bytes = 0;
      this.maxBytes = maxBytes;
    }

    Store.prototype.put = function (index, buf, cb) {
      if (this.buffers[index]) this.bytes -= this.buffers[index].length;
      else this.present.push(index);
      this.buffers[index] = buf;
      this.bytes += buf.length;
      if (cb) process.nextTick(cb);
    };

    Store.prototype.get = function (index, opts, cb) {
      if (typeof opts === 'function') return this.get(index, null, opts);
      var buf = this.buffers[index];
      if (!buf) {
        return process.nextTick(function () { cb(new Error('piece not in RAM: ' + index)); });
      }
      if (opts && (opts.offset || opts.length)) {
        var start = opts.offset || 0;
        var end = opts.length ? start + opts.length : buf.length;
        buf = buf.slice(start, end);
      }
      process.nextTick(function () { cb(null, buf); });
    };

    Store.prototype.remove = function (index) {
      var buf = this.buffers[index];
      if (!buf) return false;
      this.bytes -= buf.length;
      this.buffers[index] = null;
      var at = this.present.indexOf(index);
      if (at >= 0) this.present.splice(at, 1);
      return true;
    };

    Store.prototype.close = function (cb) {
      this.buffers = [];
      this.present = [];
      this.bytes = 0;
      if (cb) process.nextTick(cb);
    };

    Store.prototype.destroy = Store.prototype.close;
    return Store;
  }

  function trackerList(sources) {
    var out = DEFAULT_TRACKERS.slice();
    (sources || []).forEach(function (raw) {
      var s = String(raw || '').replace(/^tracker:/i, '');
      if (!/^(udp|http|https):\/\//i.test(s)) return; // dht: and peer hints are not trackers
      if (out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }

  function buildMagnet(infoHash, name, sources) {
    var parts = ['xt=urn:btih:' + infoHash];
    if (name) parts.push('dn=' + encodeURIComponent(name));
    trackerList(sources).forEach(function (tr) {
      parts.push('tr=' + encodeURIComponent(tr));
    });
    return 'magnet:?' + parts.join('&');
  }

  function videoScore(file) {
    return VIDEO_RE.test(file.name) ? 1 : 0;
  }

  // fileIdx from the add-on wins; otherwise a season/episode hint, otherwise the largest video.
  function pickFile(files, fileIdx, season, episode) {
    if (isFinite(fileIdx) && files[fileIdx]) return fileIdx;

    var candidates = [];
    for (var i = 0; i < files.length; i++) candidates.push(i);
    var videos = candidates.filter(function (i) { return videoScore(files[i]); });
    if (videos.length) candidates = videos;

    if (isFinite(season) && isFinite(episode)) {
      var s = String(season);
      var e = String(episode);
      var patterns = [
        new RegExp('s0?' + s + '[ ._-]?e0?' + e, 'i'),
        new RegExp('0?' + s + 'x0?' + e, 'i'),
        new RegExp('\\be0?' + e + '\\b', 'i')
      ];
      for (var p = 0; p < patterns.length; p++) {
        for (var c = 0; c < candidates.length; c++) {
          if (patterns[p].test(files[candidates[c]].name)) return candidates[c];
        }
      }
    }

    var best = candidates[0];
    for (var j = 1; j < candidates.length; j++) {
      if (files[candidates[j]].length > files[best].length) best = candidates[j];
    }
    return best;
  }

  function contentType(name) {
    var m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
    return (m && TYPES[m[1].toLowerCase()]) || 'application/octet-stream';
  }

  // ---- Session: engine + rolling window + one Range reader ----

  function Session(engine, file, fileIdx) {
    var self = this;
    this.id = crypto.randomBytes(8).toString('hex');
    this.engine = engine;
    this.file = file;
    this.fileIdx = fileIdx;
    this.store = engine.store.store;
    this.pieceLength = engine.torrent.pieceLength;
    this.first = Math.floor(file.offset / this.pieceLength);
    this.last = Math.floor((file.offset + file.length - 1) / this.pieceLength);
    var slots = Math.max(1, Math.floor(CACHE_BYTES / this.pieceLength));
    this.headerPieces = [];
    this.startupComplete = this.store.present.indexOf(this.first) >= 0;
    if (slots >= 4 && /\.(mp4|m4v|mov|mkv|webm)$/i.test(file.name)) {
      this.headerPieces.push(this.first);
      if (/\.(mp4|m4v|mov)$/i.test(file.name) && this.last !== this.first) this.headerPieces.push(this.last);
    }
    // One slot keeps the last piece read before a jump (see ensureWindow). TV traces: an MP4 read
    // 0 MiB, ~6 MiB, the moov at the end, then ~6 MiB again; an MKV with 16 MiB pieces read the
    // start, 8.5 KB at the end, then the start again. The piece had been evicted by the tail jump
    // and was downloaded twice. Needs room for at least two window pieces besides it.
    this.returnSlot = slots - this.headerPieces.length >= 3 ? 1 : 0;
    this.returnPiece = null;
    this.lastReadIndex = null;
    var windowSlots = Math.max(1, slots - this.headerPieces.length - this.returnSlot);
    this.behindPieces = Math.min(Math.ceil(BEHIND_BYTES / this.pieceLength), Math.max(0, windowSlots - 2));
    this.aheadPieces = Math.min(Math.ceil(AHEAD_BYTES / this.pieceLength), Math.max(0, windowSlots - this.behindPieces - 1));
    this.stepPieces = Math.max(1, Math.floor(this.aheadPieces / 4));
    this.selFrom = null;
    this.selTo = null;
    this.priorityPiece = null;
    this.windowFrom = 0;
    this.windowTo = -1;
    this.waiters = {};
    this.reader = null;
    this.lastUsed = Date.now();
    this.lastDataAt = this.lastUsed;

    this._onpiece = function (index) {
      process.nextTick(function () { self._pieceDone(index); });
    };
    engine.on('download', this._onpiece);
    this.headerNotify = function () {};
    this.headerPieces.forEach(function (index) {
      engine.select(index, index, 1, self.headerNotify);
    });
  }

  Session.prototype._pieceDone = function (index) {
    if (this.detached) return;
    // A piece that finished after the window moved on is dropped instead of leaking RAM.
    if ((index < this.windowFrom || index > this.windowTo) && this.headerPieces.indexOf(index) < 0 && index !== this.returnPiece) {
      if (this.store.remove(index)) this.engine.release(index);
      return;
    }
    if (index === this.first) this.startupComplete = true;
    var list = this.waiters[index];
    if (!list) return;
    delete this.waiters[index];
    var self = this;
    this.store.get(index, function (err, buf) {
      if (err) {
        self.waiters[index] = list;
        setTimeout(function () { self._pieceDone(index); }, 20);
        return;
      }
      for (var i = 0; i < list.length; i++) list[i](null, buf);
    });
  };

  Session.prototype._deselect = function () {
    if (this.priorityPiece !== null) {
      this.engine.deselect(this.priorityPiece, this.priorityPiece, 2, noop);
      this.priorityPiece = null;
    }
    if (this.selFrom === null) return;
    this.engine.deselect(this.selFrom, this.selTo, 1, noop);
    this.selFrom = null;
    this.selTo = null;
  };

  Session.prototype._prioritize = function (index) {
    if (this.priorityPiece === index) return;
    if (this.priorityPiece !== null) this.engine.deselect(this.priorityPiece, this.priorityPiece, 2, noop);
    this.priorityPiece = index;
    this.engine.select(index, index, 2, noop);
  };

  Session.prototype.ensureWindow = function (index, force) {
    if (index < this.first) index = this.first;
    if (index > this.last) index = this.last;

    if (!force && this.selFrom !== null && index >= this.selFrom && this.selTo - index >= this.stepPieces) {
      this._prioritize(index);
      return;
    }

    var from = Math.max(this.first, index - this.behindPieces);
    var to = Math.min(this.last, index + this.aheadPieces);
    if (from === this.selFrom && to === this.selTo) return;

    this._deselect();

    // The piece read just before this jump stays for one jump, in its reserved slot, so a reader
    // that returns to it (MP4 probe after a moov tail read) finds it in RAM.
    var last = this.lastReadIndex;
    if (this.returnSlot && last !== null && (last < from || last > to) && this.headerPieces.indexOf(last) < 0 &&
        this.store.present.indexOf(last) >= 0) this.returnPiece = last;
    else if (this.returnPiece !== null && this.returnPiece >= from && this.returnPiece <= to) this.returnPiece = null;
    else if (this.returnSlot && last !== null && (last < from || last > to)) this.returnPiece = null;

    // Forget pieces outside the new window. Released pieces become downloadable again
    // and are re-requested only if a future seek selects them.
    var present = this.store.present.slice();
    for (var i = 0; i < present.length; i++) {
      var p = present[i];
      if ((p >= from && p <= to) || this.headerPieces.indexOf(p) >= 0 || p === this.returnPiece) continue;
      if (this.store.remove(p)) this.engine.release(p);
    }

    this.windowFrom = from;
    this.windowTo = to;
    // Retain already cached pieces behind the reader, but never download them
    // ahead of the requested piece (e.g. an MP4 moov atom after a tail seek).
    this.selFrom = index;
    // When the player will resume later in the file, reads near the start are header/probe
    // reads only: download just the requested piece, no read-ahead that playback will never use.
    // The first read outside the start and the file's end region is the resume position.
    if (this.resumePending && index > this.first + 2 && index < this.last - 1) this.resumePending = false;
    // Cold-start bandwidth must finish the first verified piece before read-ahead.
    // Resume seeks continue to use the normal window after the header is delivered.
    this.selTo = (!this.startupComplete && index === this.first) || this.resumePending ? index : to;
    this.engine.select(index, this.selTo, 1, noop);
    this._prioritize(index);
  };

  Session.prototype.readPiece = function (index, cb) {
    var self = this;
    var tries = 0;

    function read() {
      if (self.engine.bitfield.get(index)) {
        self.store.get(index, function (err, buf) {
          if (!err) return cb(null, buf);
          if (++tries > 40) return cb(err);
          setTimeout(read, 10); // store.put from the same tick has not landed yet
        });
        return;
      }
      self.ensureWindow(index);
      if (self.waiters[index]) self.waiters[index].push(cb);
      else self.waiters[index] = [cb];
    }

    read();
  };

  Session.prototype.open = function (start, end, res) {
    if (this.reader) this.reader.destroy();
    this.waiters = {};
    this.lastUsed = Date.now();

    var reader = new Reader(this, start, end, res);
    reader.diag = { start: start, end: end, sent: 0, openedAt: Date.now(), closed: false };
    if (!this.requests) this.requests = [];
    this.requests.push(reader.diag);
    if (this.requests.length > 6) this.requests.shift();
    this.reader = reader;
    reader.start();
    return reader;
  };

  Session.prototype.detach = function () {
    this.detached = true;
    var self = this;
    this.headerPieces.forEach(function (index) { self.engine.deselect(index, index, 1, self.headerNotify); });
    this._deselect();
    this.waiters = {};
    if (this.reader) this.reader.destroy();
    try {
      this.engine.removeListener('download', this._onpiece);
    } catch (e) { /* old events module */ }
  };

  Session.prototype.destroy = function (cb) {
    this.detach();
    this.engine.destroy(function () { if (cb) cb(); });
  };

  function Reader(session, start, end, res) {
    this.session = session;
    this.pos = start;
    this.end = end;
    this.res = res;
    this.destroyed = false;
    this.reading = false;
    this.stall = null;
  }

  Reader.prototype.destroy = function () {
    this.destroyed = true;
    if (this.diag) this.diag.closed = true;
    clearTimeout(this.stall);
    if (this.onProgress) this.session.engine.swarm.removeListener('download', this.onProgress);
  };

  // No torrent data for STALL_MS. Before the player has received any video, closing lets it
  // report the failure. Once playback data has been delivered, a closed response is read by the
  // TV's player as the end of the file: it jumped to the duration and fired "ended", which
  // started the next episode mid-way (TV trace). Then the response stays open and the player's
  // own stall handling (buffering, reconnect, error) decides.
  Reader.prototype._stalled = function () {
    var self = this;
    if (this.destroyed) return;
    if (this.session.delivered > 0) {
      clearTimeout(this.stall);
      this.stall = setTimeout(function () { self._stalled(); }, STALL_MS);
      return;
    }
    this.destroy();
    try { this.res.destroy(); } catch (e) { /* already gone */ }
  };

  Reader.prototype.start = function () {
    var self = this;
    if (typeof this.session.lastDataAt !== 'number') this.session.lastDataAt = Date.now();
    this.onProgress = function (bytes) {
      if (self.destroyed) return;
      if (bytes > 0) self.session.lastDataAt = Date.now();
      if (self.diag) self.diag.lastDataAt = self.session.lastDataAt;
      clearTimeout(self.stall);
      self.stall = setTimeout(function () { self._stalled(); }, Math.max(0, STALL_MS - (Date.now() - self.session.lastDataAt)));
    };
    this.session.engine.swarm.on('download', this.onProgress);
    this.onProgress();
    this._next();
  };

  Reader.prototype._next = function () {
    if (this.destroyed) return;
    if (this.pos > this.end) {
      this.destroy();
      this.session.lastUsed = Date.now();
      try { this.res.end(); } catch (e) { /* already gone */ }
      return;
    }
    if (this.reading) return;
    this.reading = true;

    var self = this;
    var session = this.session;
    var pl = session.pieceLength;
    var global = session.file.offset + this.pos;
    var index = Math.floor(global / pl);
    var within = global - index * pl;

    session.ensureWindow(index);
    session.engine.critical(index, 2);
    session.readPiece(index, function (err, buf) {
      self.reading = false;
      if (self.destroyed) return;
      if (!err) session.lastReadIndex = index;
      if (err) {
        self.destroy();
        try { self.res.destroy(); } catch (e) { /* already gone */ }
        return;
      }
      clearTimeout(self.stall);
      self.stall = setTimeout(function () { self._stalled(); }, STALL_MS);

      var want = Math.min(buf.length - within, self.end - self.pos + 1);
      var slice = buf.slice(within, within + want);
      self.pos += slice.length;
      self.session.lastDataAt = Date.now();
      if (self.diag) self.diag.sent += slice.length;
      session.delivered = (session.delivered || 0) + slice.length;
      session.lastUsed = Date.now();
      if (self.res.write(slice)) return self._next();
      self.res.once('drain', function () { self._next(); });
    });
  };

  // ---- Public API used by remote-service.js ----

  function destroySession(id, keepEngine) {
    var s = sessions[id];
    if (!s) return;
    delete sessions[id];
    var at = order.indexOf(id);
    if (at >= 0) order.splice(at, 1);
    if (keepEngine === true) s.detach();
    else s.destroy(noop);
  }

  function destroyAll() {
    order.slice().forEach(destroySession);
  }

  function activateSession(engine, file, fileIdx, cb, reused, resume) {
    if (engine.torrent.pieceLength > CACHE_BYTES) {
      engine.destroy(noop);
      return cb(new Error('Torrent piece exceeds the 48 MiB TV cache limit'));
    }
    var session = new Session(engine, file, fileIdx);
    session.engineReused = !!reused;
    session.resumePending = !!resume;
    sessions[session.id] = session;
    order.push(session.id);
    if (order.length > MAX_SESSIONS) destroySession(order[0]);
    cb(null, { id: session.id,
      url: 'http://127.0.0.1:' + (typeof PLAYER_SERVICE !== 'undefined' && PLAYER_SERVICE ? '8097' : '8095') + '/torrent/' + session.id,
      name: file.name, length: file.length, fileIdx: fileIdx });
  }

  function create(body, cb) {
    if (!supported()) return cb(new Error('torrent engine missing'));
    var infoHash = String(body.infoHash || '').toLowerCase();
    if (!/^[a-f0-9]{40}$/.test(infoHash) && !/^[a-z2-7]{32}$/.test(infoHash)) {
      return cb(new Error('invalid info hash'));
    }

    for (var reuseAt = 0; reuseAt < order.length; reuseAt++) {
      var previous = sessions[order[reuseAt]];
      if (!previous || previous.engine.infoHash !== infoHash || !previous.engine.torrent) continue;
      var nextIndex = pickFile(previous.engine.files, body.fileIdx, body.season, body.episode);
      var nextFile = previous.engine.files[nextIndex];
      if (!nextFile) return cb(new Error('torrent has no playable file'));
      var warmEngine = previous.engine;
      destroySession(previous.id, true);
      destroyAll();
      return activateSession(warmEngine, nextFile, nextIndex, cb, true, body.resume);
    }
    destroyAll();

    var engine;
    try {
      engine = TorrentEngine(buildMagnet(infoHash, body.name, body.sources), {
        connections: 55,
        verify: false,
        cache: false, // no .torrent on the TV's small storage
        tmp: tmpDir(),
        storage: makeStorage(CACHE_BYTES)
      });
    } catch (e) {
      return cb(e);
    }
    attachDiag(engine);
    retryFailedPeers(engine);
    // Peers that delivered payload, returned to the app over loopback so it can offer them as
    // hints next time (libtorrent keeps known peers in resume data for the same reason).
    engine.goodPeers = [];
    engine.on('wire', function (wire) {
      if (typeof wire.once !== 'function') return;
      wire.once('download', function () {
        var addr = String(wire.peerAddress || '');
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}$/.test(addr) || engine.goodPeers.indexOf(addr) >= 0) return;
        engine.goodPeers.unshift(addr);
        if (engine.goodPeers.length > 30) engine.goodPeers.pop();
      });
    });

    var done = false;
    var peerCount = 0;
    var wireCount = 0;
    var handshakeCount = 0;
    var metadataInvalidCount = 0;
    var metadataPeerCount = 0;
    var metadataPieceCount = 0;
    var metadataExpectedPieces = 0;
    var receivedMetadataPieces = {};
    engine.on('peer', function () { peerCount++; });
    engine.on('wire', function (wire) {
      // peer-wire-swarm emits wire after validating the remote info hash.
      wireCount++;
      handshakeCount++;
    });
    engine.on('metadata-invalid', function () { metadataInvalidCount++; });
    engine.on('metadata-peer', function (size) {
      metadataPeerCount++;
      if (size > 0) metadataExpectedPieces = Math.max(metadataExpectedPieces, Math.ceil(size / 16384));
    });
    engine.on('metadata-piece', function (piece, size) {
      if (!receivedMetadataPieces[piece]) {
        receivedMetadataPieces[piece] = true;
        metadataPieceCount++;
        touchMetadata();
      }
      if (size > 0) metadataExpectedPieces = Math.max(metadataExpectedPieces, Math.ceil(size / 16384));
    });
    (body.sources || []).forEach(function (source) {
      var match = /^peer:((?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5})$/i.exec(String(source));
      if (match) { peerCount++; engine.connect(match[1]); }
    });
    var timer;
    function metadataDeadline() {
      var reason = engine.metadata ? 'Metadata verified, but the torrent engine did not finish preparing the files.'
        : !peerCount ? 'No peers found; tracker/DHT discovery may be blocked or the torrent is inactive.'
        : !handshakeCount ? 'Peers were found but no BitTorrent handshake completed; peers may be unreachable.'
        : !metadataPeerCount ? 'Handshakes completed, but no peer advertised the ut_metadata extension.'
        : 'Metadata transfer did not complete before the deadline.';
      var detail = 'torrent metadata transfer stalled for 20 seconds\n' + reason + '\n'
        + 'Peers discovered: ' + peerCount + ' · sockets opened: ' + wireCount + ' · handshakes: ' + handshakeCount + '\n'
        + 'Metadata hash failures: ' + metadataInvalidCount + '\n'
        + 'Metadata peers: ' + metadataPeerCount + ' · blocks received: ' + metadataPieceCount + '/' + (metadataExpectedPieces || '?');
      finish(new Error(detail));
    }
    function touchMetadata() {
      if (done) return;
      clearTimeout(timer);
      timer = setTimeout(metadataDeadline, OPEN_TIMEOUT_MS);
    }
    touchMetadata();

    function finish(err, file, fileIdx) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (err) {
        try { engine.destroy(noop); } catch (e) { /* already dead */ }
        return cb(err);
      }
      activateSession(engine, file, fileIdx, cb, false, body.resume);
    }

    engine.on('error', function (err) {
      // A failed .torrent cache write must not stop playback; metadata is already in RAM.
      if (!done) finish(err || new Error('torrent engine error'));
    });

    engine.on('ready', function () {
      var idx = pickFile(engine.files, body.fileIdx, body.season, body.episode);
      var file = engine.files[idx];
      if (!file) return finish(new Error('torrent has no playable file'));
      finish(null, file, idx);
    });
  }

  // Range: bytes=start-end | bytes=start- | bytes=-suffix. Returns null when malformed.
  function parseRange(header, length) {
    var m = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').replace(/\s+/g, ''));
    if (!m) return null;
    var start;
    var end;
    if (!m[1]) {
      if (!m[2]) return null;
      var suffix = parseInt(m[2], 10);
      if (!(suffix > 0)) return null;
      start = Math.max(0, length - suffix);
      end = length - 1;
    } else {
      start = parseInt(m[1], 10);
      end = m[2] ? parseInt(m[2], 10) : length - 1;
    }
    if (!isFinite(start) || !isFinite(end) || start < 0 || start >= length) return null;
    if (end >= length) end = length - 1;
    if (end < start) return null;
    return { start: start, end: end };
  }

  function serve(req, res, id) {
    var session = sessions[id];
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('torrent session not found');
    }
    session.lastUsed = Date.now();

    var length = session.file.length;
    var range = req.headers.range ? parseRange(req.headers.range, length) : null;
    if (req.headers.range && !range) {
      res.writeHead(416, {
        'Content-Range': 'bytes */' + length,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end();
    }

    var start = range ? range.start : 0;
    var end = range ? range.end : length - 1;
    var headers = {
      'Content-Type': contentType(session.file.name),
      'Content-Length': end - start + 1,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
    };
    if (range) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + length;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') return res.end();

    var reader = session.open(start, end, res);
    res.on('close', function () {
      // A previous Range response can close after its replacement has started.
      // It owns only its own reader, never the session's newest request.
      reader.destroy();
    });
  }

  setInterval(function () {
    sweepIdle(Date.now());
  }, 30000);

  // A session is idle only when no player response is open. lastUsed used to change only when a
  // Range request opened, so one long response (minutes of playback) looked idle and the session
  // was destroyed mid-playback after about 3.5 minutes (TV trace); the player then could not
  // reconnect to the removed session.
  function sweepIdle(now) {
    order.slice().forEach(function (id) {
      var s = sessions[id];
      if (!s) return;
      if (s.reader && !s.reader.destroyed) {
        s.lastUsed = now;
        return;
      }
      if (now - s.lastUsed > IDLE_MS) destroySession(id);
    });
  }

  // Verified bytes held in RAM directly after the service's read position (what the player can
  // still receive without waiting for the swarm). Bytes already sent to the browser are not included.
  function aheadBytes(s) {
    var r = s.reader;
    if (!r) return null;
    var pos = s.file.offset + r.pos;
    var i = Math.floor(pos / s.pieceLength);
    while (i <= s.last && s.store.present.indexOf(i) >= 0) i++;
    return Math.max(0, Math.min(i * s.pieceLength, s.file.offset + s.file.length) - pos);
  }

  return {
    sweepIdle: sweepIdle,
    resumed: function (id) {
      var s = sessions[id];
      if (!s) return false;
      if (s.resumePending) {
        s.resumePending = false;
        // Re-select the reader's piece so its normal read-ahead window starts now.
        if (s.reader && !s.reader.destroyed) s.ensureWindow(Math.floor((s.file.offset + s.reader.pos) / s.pieceLength), true);
      }
      return true;
    },
    stats: function (id) {
      var s = sessions[id];
      if (!s) return null;
      return { length: s.file.length, pieceLength: s.pieceLength, engineReused: s.engineReused,
        headerPieces: s.headerPieces, scheduler: s.engine.streamingStats ? s.engine.streamingStats() : null,
        downloaded: s.engine.swarm.downloaded, peers: s.engine.swarm.wires.length,
        cachedBytes: s.store.bytes, aheadBytes: aheadBytes(s), windowFrom: s.windowFrom, windowTo: s.windowTo,
        wires: wireSummary(s.engine), diag: s.engine.diag || null, resumePending: !!s.resumePending,
        goodPeers: s.engine.goodPeers || [],
        ranges: s.requests || [] };
    },
    supported: supported,
    create: create,
    serve: serve,
    destroyAll: destroyAll
  };
})();
