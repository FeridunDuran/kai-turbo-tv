var PLAYER_SERVICE = true;
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var TorrentEngine = function () {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */function (x) {
    return typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
      get: function get(a, b) {
        return (typeof require !== "undefined" ? require : a)[b];
      }
    }) : x;
  }(function (x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = function __commonJS(cb, mod) {
    return function __require2() {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = {
        exports: {}
      }).exports, mod), mod.exports;
    };
  };

  // node_modules/hat/index.js
  var require_hat = __commonJS({
    "node_modules/hat/index.js"(exports, module) {
      var hat = module.exports = function (bits, base) {
        if (!base) base = 16;
        if (bits === void 0) bits = 128;
        if (bits <= 0) return "0";
        var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
        for (var i = 2; digits === Infinity; i *= 2) {
          digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
        }
        var rem = digits - Math.floor(digits);
        var res = "";
        for (var i = 0; i < Math.floor(digits); i++) {
          var x = Math.floor(Math.random() * base).toString(base);
          res = x + res;
        }
        if (rem) {
          var b = Math.pow(base, rem);
          var x = Math.floor(Math.random() * b).toString(base);
          res = x + res;
        }
        var parsed = parseInt(res, base);
        if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
          return hat(bits, base);
        } else return res;
      };
      hat.rack = function (bits, base, expandBy) {
        var fn = function fn(data) {
          var iters = 0;
          do {
            if (iters++ > 10) {
              if (expandBy) bits += expandBy;else throw new Error("too many ID collisions, use more bits");
            }
            var id = hat(bits, base);
          } while (Object.hasOwnProperty.call(hats, id));
          hats[id] = data;
          return id;
        };
        var hats = fn.hats = {};
        fn.get = function (id) {
          return fn.hats[id];
        };
        fn.set = function (id, value) {
          fn.hats[id] = value;
          return fn;
        };
        fn.bits = bits || 128;
        fn.base = base || 16;
        return fn;
      };
    }
  });

  // node_modules/cyclist/index.js
  var require_cyclist = __commonJS({
    "node_modules/cyclist/index.js"(exports, module) {
      var _Cyclist = function Cyclist(size) {
        if (!(this instanceof _Cyclist)) return new _Cyclist(size);
        this.mask = 0;
        this.values = [];
        this.indexes = [];
        if (size) this.fit(size);
      };
      _Cyclist.prototype.__defineGetter__("size", function () {
        return this.mask + 1;
      });
      _Cyclist.prototype.put = function (index, val) {
        var pos = index & this.mask;
        this.indexes[pos] = index;
        this.values[pos] = val;
      };
      _Cyclist.prototype.get = function (index) {
        return this.values[index & this.mask];
      };
      _Cyclist.prototype.del = function (index) {
        var pos = index & this.mask;
        var val = this.values[pos];
        this.indexes[pos] = this.values[pos] = void 0;
        return val;
      };
      _Cyclist.prototype.fit = function (size) {
        if (size <= this.size) return;
        while (this.size < size) this.mask = 2 * (this.mask + 1) - 1;
        var values = this.values;
        var indexes = this.indexes;
        this.values = new Array(this.size);
        this.indexes = new Array(this.size);
        for (var i = 0; i < indexes.length; i++) {
          if (indexes[i] !== void 0) this.put(indexes[i], values[i]);
        }
      };
      module.exports = _Cyclist;
    }
  });

  // node_modules/utp/index.js
  var require_utp = __commonJS({
    "node_modules/utp/index.js"(exports) {
      var dgram = __require("dgram");
      var cyclist = require_cyclist();
      var util = __require("util");
      var EventEmitter = __require("events").EventEmitter;
      var Duplex = __require("stream").Duplex;
      var EXTENSION = 0;
      var VERSION = 1;
      var UINT16 = 65535;
      var ID_MASK = 15 << 4;
      var MTU = 1400;
      var PACKET_DATA = 0 << 4;
      var PACKET_FIN = 1 << 4;
      var PACKET_STATE = 2 << 4;
      var PACKET_RESET = 3 << 4;
      var PACKET_SYN = 4 << 4;
      var MIN_PACKET_SIZE = 20;
      var DEFAULT_WINDOW_SIZE = 1 << 18;
      var CLOSE_GRACE = 5e3;
      var BUFFER_SIZE = 512;
      var uint32 = function uint32(n) {
        return n >>> 0;
      };
      var uint16 = function uint16(n) {
        return n & UINT16;
      };
      var timestamp = function () {
        var offset = process.hrtime();
        var then = Date.now() * 1e3;
        return function () {
          var diff = process.hrtime(offset);
          return uint32(then + 1e6 * diff[0] + (diff[1] / 1e3 | 0));
        };
      }();
      var bufferToPacket = function bufferToPacket(buffer) {
        var packet = {};
        packet.id = buffer[0] & ID_MASK;
        packet.connection = buffer.readUInt16BE(2);
        packet.timestamp = buffer.readUInt32BE(4);
        packet.timediff = buffer.readUInt32BE(8);
        packet.window = buffer.readUInt32BE(12);
        packet.seq = buffer.readUInt16BE(16);
        packet.ack = buffer.readUInt16BE(18);
        packet.data = buffer.length > 20 ? buffer.slice(20) : null;
        return packet;
      };
      var packetToBuffer = function packetToBuffer(packet) {
        var buffer = new Buffer(20 + (packet.data ? packet.data.length : 0));
        buffer[0] = packet.id | VERSION;
        buffer[1] = EXTENSION;
        buffer.writeUInt16BE(packet.connection, 2);
        buffer.writeUInt32BE(packet.timestamp, 4);
        buffer.writeUInt32BE(packet.timediff, 8);
        buffer.writeUInt32BE(packet.window, 12);
        buffer.writeUInt16BE(packet.seq, 16);
        buffer.writeUInt16BE(packet.ack, 18);
        if (packet.data) packet.data.copy(buffer, 20);
        return buffer;
      };
      var createPacket = function createPacket(connection, id, data) {
        return {
          id,
          connection: id === PACKET_SYN ? connection._recvId : connection._sendId,
          seq: connection._seq,
          ack: connection._ack,
          timestamp: timestamp(),
          timediff: 0,
          window: DEFAULT_WINDOW_SIZE,
          data,
          sent: 0
        };
      };
      var Connection = function Connection(port, host, socket, syn) {
        Duplex.call(this);
        var self = this;
        this.port = port;
        this.host = host;
        this.socket = socket;
        this._outgoing = cyclist(BUFFER_SIZE);
        this._incoming = cyclist(BUFFER_SIZE);
        this._inflightPackets = 0;
        this._closed = false;
        this._alive = false;
        if (syn) {
          this._connecting = false;
          this._recvId = uint16(syn.connection + 1);
          this._sendId = syn.connection;
          this._seq = Math.random() * UINT16 | 0;
          this._ack = syn.seq;
          this._synack = createPacket(this, PACKET_STATE, null);
          this._transmit(this._synack);
        } else {
          this._connecting = true;
          this._recvId = 0;
          this._sendId = 0;
          this._seq = Math.random() * UINT16 | 0;
          this._ack = 0;
          this._synack = null;
          socket.on("listening", function () {
            self._recvId = socket.address().port;
            self._sendId = uint16(self._recvId + 1);
            self._sendOutgoing(createPacket(self, PACKET_SYN, null));
          });
          socket.on("error", function (err) {
            self.emit("error", err);
          });
          socket.bind();
        }
        var resend = setInterval(this._resend.bind(this), 500);
        var keepAlive = setInterval(this._keepAlive.bind(this), 10 * 1e3);
        var tick = 0;
        var closed = function closed() {
          if (++tick === 2) self._closing();
        };
        var _sendFin = function sendFin() {
          if (self._connecting) return self.once("connect", _sendFin);
          self._sendOutgoing(createPacket(self, PACKET_FIN, null));
          self.once("flush", closed);
        };
        this.once("finish", _sendFin);
        this.once("close", function () {
          if (!syn) setTimeout(socket.close.bind(socket), CLOSE_GRACE);
          clearInterval(resend);
          clearInterval(keepAlive);
        });
        this.once("end", function () {
          process.nextTick(closed);
        });
      };
      util.inherits(Connection, Duplex);
      Connection.prototype.setTimeout = function () {};
      Connection.prototype.destroy = function () {
        this.end();
      };
      Connection.prototype.address = function () {
        return {
          port: this.port,
          address: this.host
        };
      };
      Connection.prototype._read = function () {};
      Connection.prototype._write = function (data, enc, callback) {
        if (this._connecting) return this._writeOnce("connect", data, enc, callback);
        while (this._writable()) {
          var payload = this._payload(data);
          this._sendOutgoing(createPacket(this, PACKET_DATA, payload));
          if (payload.length === data.length) return callback();
          data = data.slice(payload.length);
        }
        this._writeOnce("flush", data, enc, callback);
      };
      Connection.prototype._writeOnce = function (event, data, enc, callback) {
        this.once(event, function () {
          this._write(data, enc, callback);
        });
      };
      Connection.prototype._writable = function () {
        return this._inflightPackets < BUFFER_SIZE - 1;
      };
      Connection.prototype._payload = function (data) {
        if (data.length > MTU) return data.slice(0, MTU);
        return data;
      };
      Connection.prototype._resend = function () {
        var offset = this._seq - this._inflightPackets;
        var first = this._outgoing.get(offset);
        if (!first) return;
        var timeout = 5e5;
        var now = timestamp();
        if (uint32(first.sent - now) < timeout) return;
        for (var i = 0; i < this._inflightPackets; i++) {
          var packet = this._outgoing.get(offset + i);
          if (uint32(packet.sent - now) >= timeout) this._transmit(packet);
        }
      };
      Connection.prototype._keepAlive = function () {
        if (this._alive) return this._alive = false;
        this._sendAck();
      };
      Connection.prototype._closing = function () {
        if (this._closed) return;
        this._closed = true;
        process.nextTick(this.emit.bind(this, "close"));
      };
      Connection.prototype._recvAck = function (ack) {
        var offset = this._seq - this._inflightPackets;
        var acked = uint16(ack - offset) + 1;
        if (acked >= BUFFER_SIZE) return;
        for (var i = 0; i < acked; i++) {
          this._outgoing.del(offset + i);
          this._inflightPackets--;
        }
        if (!this._inflightPackets) this.emit("flush");
      };
      Connection.prototype._recvIncoming = function (packet) {
        if (this._closed) return;
        if (packet.id === PACKET_SYN && this._connecting) {
          this._transmit(this._synack);
          return;
        }
        if (packet.id === PACKET_RESET) {
          this.push(null);
          this.end();
          this._closing();
          return;
        }
        if (this._connecting) {
          if (packet.id !== PACKET_STATE) return this._incoming.put(packet.seq, packet);
          this._ack = uint16(packet.seq - 1);
          this._recvAck(packet.ack);
          this._connecting = false;
          this.emit("connect");
          packet = this._incoming.del(packet.seq);
          if (!packet) return;
        }
        if (uint16(packet.seq - this._ack) >= BUFFER_SIZE) return this._sendAck();
        this._recvAck(packet.ack);
        if (packet.id === PACKET_STATE) return;
        this._incoming.put(packet.seq, packet);
        while (packet = this._incoming.del(this._ack + 1)) {
          this._ack = uint16(this._ack + 1);
          if (packet.id === PACKET_DATA) this.push(packet.data);
          if (packet.id === PACKET_FIN) this.push(null);
        }
        this._sendAck();
      };
      Connection.prototype._sendAck = function () {
        this._transmit(createPacket(this, PACKET_STATE, null));
      };
      Connection.prototype._sendOutgoing = function (packet) {
        this._outgoing.put(packet.seq, packet);
        this._seq = uint16(this._seq + 1);
        this._inflightPackets++;
        this._transmit(packet);
      };
      Connection.prototype._transmit = function (packet) {
        packet.sent = packet.sent === 0 ? packet.timestamp : timestamp();
        var message = packetToBuffer(packet);
        this._alive = true;
        this.socket.send(message, 0, message.length, this.port, this.host);
      };
      var Server = function Server() {
        EventEmitter.call(this);
        this._socket = null;
        this._connections = {};
      };
      util.inherits(Server, EventEmitter);
      Server.prototype.address = function () {
        return this._socket.address();
      };
      Server.prototype.listen = function (port, onlistening) {
        var socket = this._socket = dgram.createSocket("udp4");
        var connections = this._connections;
        var self = this;
        socket.on("message", function (message, rinfo) {
          if (message.length < MIN_PACKET_SIZE) return;
          var packet = bufferToPacket(message);
          var id = rinfo.address + ":" + (packet.id === PACKET_SYN ? uint16(packet.connection + 1) : packet.connection);
          if (connections[id]) return connections[id]._recvIncoming(packet);
          if (packet.id !== PACKET_SYN) return;
          connections[id] = new Connection(rinfo.port, rinfo.address, socket, packet);
          connections[id].on("close", function () {
            delete connections[id];
          });
          self.emit("connection", connections[id]);
        });
        socket.once("listening", function () {
          self.emit("listening");
        });
        if (onlistening) self.once("listening", onlistening);
        socket.bind(port);
      };
      exports.createServer = function (onconnection) {
        var server = new Server();
        if (onconnection) server.on("connection", onconnection);
        return server;
      };
      exports.connect = function (port, host) {
        var socket = dgram.createSocket("udp4");
        var connection = new Connection(port, host || "127.0.0.1", socket, null);
        socket.on("message", function (message) {
          if (message.length < MIN_PACKET_SIZE) return;
          var packet = bufferToPacket(message);
          if (packet.id === PACKET_SYN) return;
          if (packet.connection !== connection._recvId) return;
          connection._recvIncoming(packet);
        });
        return connection;
      };
    }
  });

  // node_modules/fifo/index.js
  var require_fifo = __commonJS({
    "node_modules/fifo/index.js"(exports, module) {
      var Node = function Node(list, val) {
        this.prev = this.next = this;
        this.value = val;
        this.list = list;
      };
      Node.prototype.link = function (next) {
        this.next = next;
        next.prev = this;
        return next;
      };
      var _FIFO = function FIFO() {
        if (!(this instanceof _FIFO)) return new _FIFO();
        this.node = null;
        this.length = 0;
      };
      _FIFO.prototype.set = function (node, value) {
        if (!node || node.list !== this) return null;
        node.value = value;
        return node;
      };
      _FIFO.prototype.get = function (node) {
        if (!node || node.list !== this) return null;
        return node.value;
      };
      _FIFO.prototype.remove = function (node) {
        if (!node || node.list !== this) return null;
        this.length--;
        node.list = null;
        node.prev.link(node.next);
        if (node === this.node) this.node = node.next === node ? null : node.next;
        return node.value;
      };
      _FIFO.prototype.unshift = function (value) {
        return this.node = this.push(value);
      };
      _FIFO.prototype.push = function (value) {
        var node = new Node(this, value);
        this.length++;
        if (!this.node) return this.node = node;
        this.node.prev.link(node);
        node.link(this.node);
        return node;
      };
      _FIFO.prototype.first = function () {
        return this.node && this.node.value;
      };
      _FIFO.prototype.last = function () {
        return this.node && this.node.prev.value;
      };
      _FIFO.prototype.shift = function () {
        return this.node && this.remove(this.node);
      };
      _FIFO.prototype.pop = function () {
        return this.node && this.remove(this.node.prev);
      };
      module.exports = _FIFO;
    }
  });

  // node_modules/wrappy/wrappy.js
  var require_wrappy = __commonJS({
    "node_modules/wrappy/wrappy.js"(exports, module) {
      module.exports = wrappy;
      function wrappy(fn, cb) {
        if (fn && cb) return wrappy(fn)(cb);
        if (typeof fn !== "function") throw new TypeError("need wrapper function");
        Object.keys(fn).forEach(function (k) {
          wrapper[k] = fn[k];
        });
        return wrapper;
        function wrapper() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
          }
          var ret = fn.apply(this, args);
          var cb2 = args[args.length - 1];
          if (typeof ret === "function" && ret !== cb2) {
            Object.keys(cb2).forEach(function (k) {
              ret[k] = cb2[k];
            });
          }
          return ret;
        }
      }
    }
  });

  // node_modules/once/once.js
  var require_once = __commonJS({
    "node_modules/once/once.js"(exports, module) {
      var wrappy = require_wrappy();
      module.exports = wrappy(once);
      once.proto = once(function () {
        Object.defineProperty(Function.prototype, "once", {
          value: function value() {
            return once(this);
          },
          configurable: true
        });
      });
      function once(fn) {
        var _f = function f() {
          if (_f.called) return _f.value;
          _f.called = true;
          return _f.value = fn.apply(this, arguments);
        };
        _f.called = false;
        return _f;
      }
    }
  });

  // node_modules/speedometer/index.js
  var require_speedometer = __commonJS({
    "node_modules/speedometer/index.js"(exports, module) {
      var tick = 1;
      var maxTick = 65535;
      var resolution = 4;
      var inc = function inc() {
        tick = tick + 1 & maxTick;
      };
      var timer = setInterval(inc, 1e3 / resolution | 0);
      if (timer.unref) timer.unref();
      module.exports = function (seconds) {
        var size = resolution * (seconds || 5);
        var buffer = [0];
        var pointer = 1;
        var last = tick - 1 & maxTick;
        return function (delta) {
          var dist = tick - last & maxTick;
          if (dist > size) dist = size;
          last = tick;
          while (dist--) {
            if (pointer === size) pointer = 0;
            buffer[pointer] = buffer[pointer === 0 ? size - 1 : pointer - 1];
            pointer++;
          }
          if (delta) buffer[pointer - 1] += delta;
          var top = buffer[pointer - 1];
          var btm = buffer.length < size ? 0 : buffer[pointer === size ? 0 : pointer];
          return buffer.length < resolution ? top : (top - btm) * resolution / buffer.length;
        };
      };
    }
  });

  // node_modules/isarray/index.js
  var require_isarray = __commonJS({
    "node_modules/isarray/index.js"(exports, module) {
      module.exports = Array.isArray || function (arr) {
        return Object.prototype.toString.call(arr) == "[object Array]";
      };
    }
  });

  // node_modules/core-util-is/lib/util.js
  var require_util = __commonJS({
    "node_modules/core-util-is/lib/util.js"(exports) {
      function isArray(arg) {
        if (Array.isArray) {
          return Array.isArray(arg);
        }
        return objectToString(arg) === "[object Array]";
      }
      exports.isArray = isArray;
      function isBoolean(arg) {
        return typeof arg === "boolean";
      }
      exports.isBoolean = isBoolean;
      function isNull(arg) {
        return arg === null;
      }
      exports.isNull = isNull;
      function isNullOrUndefined(arg) {
        return arg == null;
      }
      exports.isNullOrUndefined = isNullOrUndefined;
      function isNumber(arg) {
        return typeof arg === "number";
      }
      exports.isNumber = isNumber;
      function isString(arg) {
        return typeof arg === "string";
      }
      exports.isString = isString;
      function isSymbol(arg) {
        return _typeof(arg) === "symbol";
      }
      exports.isSymbol = isSymbol;
      function isUndefined(arg) {
        return arg === void 0;
      }
      exports.isUndefined = isUndefined;
      function isRegExp(re) {
        return objectToString(re) === "[object RegExp]";
      }
      exports.isRegExp = isRegExp;
      function isObject(arg) {
        return _typeof(arg) === "object" && arg !== null;
      }
      exports.isObject = isObject;
      function isDate(d) {
        return objectToString(d) === "[object Date]";
      }
      exports.isDate = isDate;
      function isError(e) {
        return objectToString(e) === "[object Error]" || e instanceof Error;
      }
      exports.isError = isError;
      function isFunction(arg) {
        return typeof arg === "function";
      }
      exports.isFunction = isFunction;
      function isPrimitive(arg) {
        return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || _typeof(arg) === "symbol" ||
        // ES6 symbol
        typeof arg === "undefined";
      }
      exports.isPrimitive = isPrimitive;
      exports.isBuffer = Buffer.isBuffer;
      function objectToString(o) {
        return Object.prototype.toString.call(o);
      }
    }
  });

  // node_modules/inherits/inherits_browser.js
  var require_inherits_browser = __commonJS({
    "node_modules/inherits/inherits_browser.js"(exports, module) {
      if (typeof Object.create === "function") {
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        };
      } else {
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function TempCtor() {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        };
      }
    }
  });

  // node_modules/inherits/inherits.js
  var require_inherits = __commonJS({
    "node_modules/inherits/inherits.js"(exports, module) {
      try {
        util = __require("util");
        if (typeof util.inherits !== "function") throw "";
        module.exports = util.inherits;
      } catch (e) {
        module.exports = require_inherits_browser();
      }
      var util;
    }
  });

  // node_modules/readable-stream/lib/_stream_writable.js
  var require_stream_writable = __commonJS({
    "node_modules/readable-stream/lib/_stream_writable.js"(exports, module) {
      module.exports = Writable;
      var Buffer2 = __require("buffer").Buffer;
      Writable.WritableState = WritableState;
      var util = require_util();
      util.inherits = require_inherits();
      var Stream = __require("stream");
      util.inherits(Writable, Stream);
      function WriteReq(chunk, encoding, cb) {
        this.chunk = chunk;
        this.encoding = encoding;
        this.callback = cb;
      }
      function WritableState(options, stream) {
        var Duplex = require_stream_duplex();
        options = options || {};
        var hwm = options.highWaterMark;
        var defaultHwm = options.objectMode ? 16 : 16 * 1024;
        this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
        this.objectMode = !!options.objectMode;
        if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
        this.highWaterMark = ~~this.highWaterMark;
        this.needDrain = false;
        this.ending = false;
        this.ended = false;
        this.finished = false;
        var noDecode = options.decodeStrings === false;
        this.decodeStrings = !noDecode;
        this.defaultEncoding = options.defaultEncoding || "utf8";
        this.length = 0;
        this.writing = false;
        this.corked = 0;
        this.sync = true;
        this.bufferProcessing = false;
        this.onwrite = function (er) {
          onwrite(stream, er);
        };
        this.writecb = null;
        this.writelen = 0;
        this.buffer = [];
        this.pendingcb = 0;
        this.prefinished = false;
        this.errorEmitted = false;
      }
      function Writable(options) {
        var Duplex = require_stream_duplex();
        if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);
        this._writableState = new WritableState(options, this);
        this.writable = true;
        Stream.call(this);
      }
      Writable.prototype.pipe = function () {
        this.emit("error", new Error("Cannot pipe. Not readable."));
      };
      function writeAfterEnd(stream, state, cb) {
        var er = new Error("write after end");
        stream.emit("error", er);
        process.nextTick(function () {
          cb(er);
        });
      }
      function validChunk(stream, state, chunk, cb) {
        var valid = true;
        if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
          var er = new TypeError("Invalid non-string/buffer chunk");
          stream.emit("error", er);
          process.nextTick(function () {
            cb(er);
          });
          valid = false;
        }
        return valid;
      }
      Writable.prototype.write = function (chunk, encoding, cb) {
        var state = this._writableState;
        var ret = false;
        if (util.isFunction(encoding)) {
          cb = encoding;
          encoding = null;
        }
        if (util.isBuffer(chunk)) encoding = "buffer";else if (!encoding) encoding = state.defaultEncoding;
        if (!util.isFunction(cb)) cb = function cb() {};
        if (state.ended) writeAfterEnd(this, state, cb);else if (validChunk(this, state, chunk, cb)) {
          state.pendingcb++;
          ret = writeOrBuffer(this, state, chunk, encoding, cb);
        }
        return ret;
      };
      Writable.prototype.cork = function () {
        var state = this._writableState;
        state.corked++;
      };
      Writable.prototype.uncork = function () {
        var state = this._writableState;
        if (state.corked) {
          state.corked--;
          if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.buffer.length) clearBuffer(this, state);
        }
      };
      function decodeChunk(state, chunk, encoding) {
        if (!state.objectMode && state.decodeStrings !== false && util.isString(chunk)) {
          chunk = new Buffer2(chunk, encoding);
        }
        return chunk;
      }
      function writeOrBuffer(stream, state, chunk, encoding, cb) {
        chunk = decodeChunk(state, chunk, encoding);
        if (util.isBuffer(chunk)) encoding = "buffer";
        var len = state.objectMode ? 1 : chunk.length;
        state.length += len;
        var ret = state.length < state.highWaterMark;
        if (!ret) state.needDrain = true;
        if (state.writing || state.corked) state.buffer.push(new WriteReq(chunk, encoding, cb));else doWrite(stream, state, false, len, chunk, encoding, cb);
        return ret;
      }
      function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }
      function onwriteError(stream, state, sync, er, cb) {
        if (sync) process.nextTick(function () {
          state.pendingcb--;
          cb(er);
        });else {
          state.pendingcb--;
          cb(er);
        }
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
      }
      function onwriteStateUpdate(state) {
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
      }
      function onwrite(stream, er) {
        var state = stream._writableState;
        var sync = state.sync;
        var cb = state.writecb;
        onwriteStateUpdate(state);
        if (er) onwriteError(stream, state, sync, er, cb);else {
          var finished = needFinish(stream, state);
          if (!finished && !state.corked && !state.bufferProcessing && state.buffer.length) {
            clearBuffer(stream, state);
          }
          if (sync) {
            process.nextTick(function () {
              afterWrite(stream, state, finished, cb);
            });
          } else {
            afterWrite(stream, state, finished, cb);
          }
        }
      }
      function afterWrite(stream, state, finished, cb) {
        if (!finished) onwriteDrain(stream, state);
        state.pendingcb--;
        cb();
        finishMaybe(stream, state);
      }
      function onwriteDrain(stream, state) {
        if (state.length === 0 && state.needDrain) {
          state.needDrain = false;
          stream.emit("drain");
        }
      }
      function clearBuffer(stream, state) {
        state.bufferProcessing = true;
        if (stream._writev && state.buffer.length > 1) {
          var cbs = [];
          for (var c = 0; c < state.buffer.length; c++) cbs.push(state.buffer[c].callback);
          state.pendingcb++;
          doWrite(stream, state, true, state.length, state.buffer, "", function (err) {
            for (var i = 0; i < cbs.length; i++) {
              state.pendingcb--;
              cbs[i](err);
            }
          });
          state.buffer = [];
        } else {
          for (var c = 0; c < state.buffer.length; c++) {
            var entry = state.buffer[c];
            var chunk = entry.chunk;
            var encoding = entry.encoding;
            var cb = entry.callback;
            var len = state.objectMode ? 1 : chunk.length;
            doWrite(stream, state, false, len, chunk, encoding, cb);
            if (state.writing) {
              c++;
              break;
            }
          }
          if (c < state.buffer.length) state.buffer = state.buffer.slice(c);else state.buffer.length = 0;
        }
        state.bufferProcessing = false;
      }
      Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new Error("not implemented"));
      };
      Writable.prototype._writev = null;
      Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;
        if (util.isFunction(chunk)) {
          cb = chunk;
          chunk = null;
          encoding = null;
        } else if (util.isFunction(encoding)) {
          cb = encoding;
          encoding = null;
        }
        if (!util.isNullOrUndefined(chunk)) this.write(chunk, encoding);
        if (state.corked) {
          state.corked = 1;
          this.uncork();
        }
        if (!state.ending && !state.finished) endWritable(this, state, cb);
      };
      function needFinish(stream, state) {
        return state.ending && state.length === 0 && !state.finished && !state.writing;
      }
      function prefinish(stream, state) {
        if (!state.prefinished) {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
      function finishMaybe(stream, state) {
        var need = needFinish(stream, state);
        if (need) {
          if (state.pendingcb === 0) {
            prefinish(stream, state);
            state.finished = true;
            stream.emit("finish");
          } else prefinish(stream, state);
        }
        return need;
      }
      function endWritable(stream, state, cb) {
        state.ending = true;
        finishMaybe(stream, state);
        if (cb) {
          if (state.finished) process.nextTick(cb);else stream.once("finish", cb);
        }
        state.ended = true;
      }
    }
  });

  // node_modules/readable-stream/lib/_stream_duplex.js
  var require_stream_duplex = __commonJS({
    "node_modules/readable-stream/lib/_stream_duplex.js"(exports, module) {
      module.exports = Duplex;
      var objectKeys = Object.keys || function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
      };
      var util = require_util();
      util.inherits = require_inherits();
      var Readable = require_stream_readable();
      var Writable = require_stream_writable();
      util.inherits(Duplex, Readable);
      forEach(objectKeys(Writable.prototype), function (method) {
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      });
      function Duplex(options) {
        if (!(this instanceof Duplex)) return new Duplex(options);
        Readable.call(this, options);
        Writable.call(this, options);
        if (options && options.readable === false) this.readable = false;
        if (options && options.writable === false) this.writable = false;
        this.allowHalfOpen = true;
        if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
        this.once("end", onend);
      }
      function onend() {
        if (this.allowHalfOpen || this._writableState.ended) return;
        process.nextTick(this.end.bind(this));
      }
      function forEach(xs, f) {
        for (var i = 0, l = xs.length; i < l; i++) {
          f(xs[i], i);
        }
      }
    }
  });

  // node_modules/string_decoder/index.js
  var require_string_decoder = __commonJS({
    "node_modules/string_decoder/index.js"(exports) {
      var Buffer2 = __require("buffer").Buffer;
      var isBufferEncoding = Buffer2.isEncoding || function (encoding) {
        switch (encoding && encoding.toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
          case "raw":
            return true;
          default:
            return false;
        }
      };
      function assertEncoding(encoding) {
        if (encoding && !isBufferEncoding(encoding)) {
          throw new Error("Unknown encoding: " + encoding);
        }
      }
      var StringDecoder = exports.StringDecoder = function (encoding) {
        this.encoding = (encoding || "utf8").toLowerCase().replace(/[-_]/, "");
        assertEncoding(encoding);
        switch (this.encoding) {
          case "utf8":
            this.surrogateSize = 3;
            break;
          case "ucs2":
          case "utf16le":
            this.surrogateSize = 2;
            this.detectIncompleteChar = utf16DetectIncompleteChar;
            break;
          case "base64":
            this.surrogateSize = 3;
            this.detectIncompleteChar = base64DetectIncompleteChar;
            break;
          default:
            this.write = passThroughWrite;
            return;
        }
        this.charBuffer = new Buffer2(6);
        this.charReceived = 0;
        this.charLength = 0;
      };
      StringDecoder.prototype.write = function (buffer) {
        var charStr = "";
        while (this.charLength) {
          var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;
          buffer.copy(this.charBuffer, this.charReceived, 0, available);
          this.charReceived += available;
          if (this.charReceived < this.charLength) {
            return "";
          }
          buffer = buffer.slice(available, buffer.length);
          charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
          var charCode = charStr.charCodeAt(charStr.length - 1);
          if (charCode >= 55296 && charCode <= 56319) {
            this.charLength += this.surrogateSize;
            charStr = "";
            continue;
          }
          this.charReceived = this.charLength = 0;
          if (buffer.length === 0) {
            return charStr;
          }
          break;
        }
        this.detectIncompleteChar(buffer);
        var end = buffer.length;
        if (this.charLength) {
          buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
          end -= this.charReceived;
        }
        charStr += buffer.toString(this.encoding, 0, end);
        var end = charStr.length - 1;
        var charCode = charStr.charCodeAt(end);
        if (charCode >= 55296 && charCode <= 56319) {
          var size = this.surrogateSize;
          this.charLength += size;
          this.charReceived += size;
          this.charBuffer.copy(this.charBuffer, size, 0, size);
          buffer.copy(this.charBuffer, 0, 0, size);
          return charStr.substring(0, end);
        }
        return charStr;
      };
      StringDecoder.prototype.detectIncompleteChar = function (buffer) {
        var i = buffer.length >= 3 ? 3 : buffer.length;
        for (; i > 0; i--) {
          var c = buffer[buffer.length - i];
          if (i == 1 && c >> 5 == 6) {
            this.charLength = 2;
            break;
          }
          if (i <= 2 && c >> 4 == 14) {
            this.charLength = 3;
            break;
          }
          if (i <= 3 && c >> 3 == 30) {
            this.charLength = 4;
            break;
          }
        }
        this.charReceived = i;
      };
      StringDecoder.prototype.end = function (buffer) {
        var res = "";
        if (buffer && buffer.length) res = this.write(buffer);
        if (this.charReceived) {
          var cr = this.charReceived;
          var buf = this.charBuffer;
          var enc = this.encoding;
          res += buf.slice(0, cr).toString(enc);
        }
        return res;
      };
      function passThroughWrite(buffer) {
        return buffer.toString(this.encoding);
      }
      function utf16DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 2;
        this.charLength = this.charReceived ? 2 : 0;
      }
      function base64DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 3;
        this.charLength = this.charReceived ? 3 : 0;
      }
    }
  });

  // node_modules/readable-stream/lib/_stream_readable.js
  var require_stream_readable = __commonJS({
    "node_modules/readable-stream/lib/_stream_readable.js"(exports, module) {
      module.exports = Readable;
      var isArray = require_isarray();
      var Buffer2 = __require("buffer").Buffer;
      Readable.ReadableState = ReadableState;
      var EE = __require("events").EventEmitter;
      if (!EE.listenerCount) EE.listenerCount = function (emitter, type) {
        return emitter.listeners(type).length;
      };
      var Stream = __require("stream");
      var util = require_util();
      util.inherits = require_inherits();
      var StringDecoder;
      var debug = __require("util");
      if (debug && debug.debuglog) {
        debug = debug.debuglog("stream");
      } else {
        debug = function debug() {};
      }
      util.inherits(Readable, Stream);
      function ReadableState(options, stream) {
        var Duplex = require_stream_duplex();
        options = options || {};
        var hwm = options.highWaterMark;
        var defaultHwm = options.objectMode ? 16 : 16 * 1024;
        this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
        this.highWaterMark = ~~this.highWaterMark;
        this.buffer = [];
        this.length = 0;
        this.pipes = null;
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;
        this.sync = true;
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;
        this.objectMode = !!options.objectMode;
        if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
        this.defaultEncoding = options.defaultEncoding || "utf8";
        this.ranOut = false;
        this.awaitDrain = 0;
        this.readingMore = false;
        this.decoder = null;
        this.encoding = null;
        if (options.encoding) {
          if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
          this.decoder = new StringDecoder(options.encoding);
          this.encoding = options.encoding;
        }
      }
      function Readable(options) {
        var Duplex = require_stream_duplex();
        if (!(this instanceof Readable)) return new Readable(options);
        this._readableState = new ReadableState(options, this);
        this.readable = true;
        Stream.call(this);
      }
      Readable.prototype.push = function (chunk, encoding) {
        var state = this._readableState;
        if (util.isString(chunk) && !state.objectMode) {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = new Buffer2(chunk, encoding);
            encoding = "";
          }
        }
        return readableAddChunk(this, state, chunk, encoding, false);
      };
      Readable.prototype.unshift = function (chunk) {
        var state = this._readableState;
        return readableAddChunk(this, state, chunk, "", true);
      };
      function readableAddChunk(stream, state, chunk, encoding, addToFront) {
        var er = chunkInvalid(state, chunk);
        if (er) {
          stream.emit("error", er);
        } else if (util.isNullOrUndefined(chunk)) {
          state.reading = false;
          if (!state.ended) onEofChunk(stream, state);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (state.ended && !addToFront) {
            var e = new Error("stream.push() after EOF");
            stream.emit("error", e);
          } else if (state.endEmitted && addToFront) {
            var e = new Error("stream.unshift() after end event");
            stream.emit("error", e);
          } else {
            if (state.decoder && !addToFront && !encoding) chunk = state.decoder.write(chunk);
            if (!addToFront) state.reading = false;
            if (state.flowing && state.length === 0 && !state.sync) {
              stream.emit("data", chunk);
              stream.read(0);
            } else {
              state.length += state.objectMode ? 1 : chunk.length;
              if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
              if (state.needReadable) emitReadable(stream);
            }
            maybeReadMore(stream, state);
          }
        } else if (!addToFront) {
          state.reading = false;
        }
        return needMoreData(state);
      }
      function needMoreData(state) {
        return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
      }
      Readable.prototype.setEncoding = function (enc) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this._readableState.decoder = new StringDecoder(enc);
        this._readableState.encoding = enc;
        return this;
      };
      var MAX_HWM = 8388608;
      function roundUpToNextPowerOf2(n) {
        if (n >= MAX_HWM) {
          n = MAX_HWM;
        } else {
          n--;
          for (var p = 1; p < 32; p <<= 1) n |= n >> p;
          n++;
        }
        return n;
      }
      function howMuchToRead(n, state) {
        if (state.length === 0 && state.ended) return 0;
        if (state.objectMode) return n === 0 ? 0 : 1;
        if (isNaN(n) || util.isNull(n)) {
          if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
        }
        if (n <= 0) return 0;
        if (n > state.highWaterMark) state.highWaterMark = roundUpToNextPowerOf2(n);
        if (n > state.length) {
          if (!state.ended) {
            state.needReadable = true;
            return 0;
          } else return state.length;
        }
        return n;
      }
      Readable.prototype.read = function (n) {
        debug("read", n);
        var state = this._readableState;
        var nOrig = n;
        if (!util.isNumber(n) || n > 0) state.emittedReadable = false;
        if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
          debug("read: emitReadable", state.length, state.ended);
          if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
          return null;
        }
        n = howMuchToRead(n, state);
        if (n === 0 && state.ended) {
          if (state.length === 0) endReadable(this);
          return null;
        }
        var doRead = state.needReadable;
        debug("need readable", doRead);
        if (state.length === 0 || state.length - n < state.highWaterMark) {
          doRead = true;
          debug("length less than watermark", doRead);
        }
        if (state.ended || state.reading) {
          doRead = false;
          debug("reading or ended", doRead);
        }
        if (doRead) {
          debug("do read");
          state.reading = true;
          state.sync = true;
          if (state.length === 0) state.needReadable = true;
          this._read(state.highWaterMark);
          state.sync = false;
        }
        if (doRead && !state.reading) n = howMuchToRead(nOrig, state);
        var ret;
        if (n > 0) ret = fromList(n, state);else ret = null;
        if (util.isNull(ret)) {
          state.needReadable = true;
          n = 0;
        }
        state.length -= n;
        if (state.length === 0 && !state.ended) state.needReadable = true;
        if (nOrig !== n && state.ended && state.length === 0) endReadable(this);
        if (!util.isNull(ret)) this.emit("data", ret);
        return ret;
      };
      function chunkInvalid(state, chunk) {
        var er = null;
        if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
          er = new TypeError("Invalid non-string/buffer chunk");
        }
        return er;
      }
      function onEofChunk(stream, state) {
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) {
            state.buffer.push(chunk);
            state.length += state.objectMode ? 1 : chunk.length;
          }
        }
        state.ended = true;
        emitReadable(stream);
      }
      function emitReadable(stream) {
        var state = stream._readableState;
        state.needReadable = false;
        if (!state.emittedReadable) {
          debug("emitReadable", state.flowing);
          state.emittedReadable = true;
          if (state.sync) process.nextTick(function () {
            emitReadable_(stream);
          });else emitReadable_(stream);
        }
      }
      function emitReadable_(stream) {
        debug("emit readable");
        stream.emit("readable");
        flow(stream);
      }
      function maybeReadMore(stream, state) {
        if (!state.readingMore) {
          state.readingMore = true;
          process.nextTick(function () {
            maybeReadMore_(stream, state);
          });
        }
      }
      function maybeReadMore_(stream, state) {
        var len = state.length;
        while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
          debug("maybeReadMore read 0");
          stream.read(0);
          if (len === state.length) break;else len = state.length;
        }
        state.readingMore = false;
      }
      Readable.prototype._read = function (n) {
        this.emit("error", new Error("not implemented"));
      };
      Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this;
        var state = this._readableState;
        switch (state.pipesCount) {
          case 0:
            state.pipes = dest;
            break;
          case 1:
            state.pipes = [state.pipes, dest];
            break;
          default:
            state.pipes.push(dest);
            break;
        }
        state.pipesCount += 1;
        debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
        var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
        var endFn = doEnd ? onend : cleanup;
        if (state.endEmitted) process.nextTick(endFn);else src.once("end", endFn);
        dest.on("unpipe", onunpipe);
        function onunpipe(readable) {
          debug("onunpipe");
          if (readable === src) {
            cleanup();
          }
        }
        function onend() {
          debug("onend");
          dest.end();
        }
        var ondrain = pipeOnDrain(src);
        dest.on("drain", ondrain);
        function cleanup() {
          debug("cleanup");
          dest.removeListener("close", onclose);
          dest.removeListener("finish", onfinish);
          dest.removeListener("drain", ondrain);
          dest.removeListener("error", onerror);
          dest.removeListener("unpipe", onunpipe);
          src.removeListener("end", onend);
          src.removeListener("end", cleanup);
          src.removeListener("data", ondata);
          if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
        }
        src.on("data", ondata);
        function ondata(chunk) {
          debug("ondata");
          var ret = dest.write(chunk);
          if (false === ret) {
            debug("false write response, pause", src._readableState.awaitDrain);
            src._readableState.awaitDrain++;
            src.pause();
          }
        }
        function onerror(er) {
          debug("onerror", er);
          unpipe();
          dest.removeListener("error", onerror);
          if (EE.listenerCount(dest, "error") === 0) dest.emit("error", er);
        }
        if (!dest._events || !dest._events.error) dest.on("error", onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];
        function onclose() {
          dest.removeListener("finish", onfinish);
          unpipe();
        }
        dest.once("close", onclose);
        function onfinish() {
          debug("onfinish");
          dest.removeListener("close", onclose);
          unpipe();
        }
        dest.once("finish", onfinish);
        function unpipe() {
          debug("unpipe");
          src.unpipe(dest);
        }
        dest.emit("pipe", src);
        if (!state.flowing) {
          debug("pipe resume");
          src.resume();
        }
        return dest;
      };
      function pipeOnDrain(src) {
        return function () {
          var state = src._readableState;
          debug("pipeOnDrain", state.awaitDrain);
          if (state.awaitDrain) state.awaitDrain--;
          if (state.awaitDrain === 0 && EE.listenerCount(src, "data")) {
            state.flowing = true;
            flow(src);
          }
        };
      }
      Readable.prototype.unpipe = function (dest) {
        var state = this._readableState;
        if (state.pipesCount === 0) return this;
        if (state.pipesCount === 1) {
          if (dest && dest !== state.pipes) return this;
          if (!dest) dest = state.pipes;
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;
          if (dest) dest.emit("unpipe", this);
          return this;
        }
        if (!dest) {
          var dests = state.pipes;
          var len = state.pipesCount;
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;
          for (var i = 0; i < len; i++) dests[i].emit("unpipe", this);
          return this;
        }
        var i = indexOf(state.pipes, dest);
        if (i === -1) return this;
        state.pipes.splice(i, 1);
        state.pipesCount -= 1;
        if (state.pipesCount === 1) state.pipes = state.pipes[0];
        dest.emit("unpipe", this);
        return this;
      };
      Readable.prototype.on = function (ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn);
        if (ev === "data" && false !== this._readableState.flowing) {
          this.resume();
        }
        if (ev === "readable" && this.readable) {
          var state = this._readableState;
          if (!state.readableListening) {
            state.readableListening = true;
            state.emittedReadable = false;
            state.needReadable = true;
            if (!state.reading) {
              var self = this;
              process.nextTick(function () {
                debug("readable nexttick read 0");
                self.read(0);
              });
            } else if (state.length) {
              emitReadable(this, state);
            }
          }
        }
        return res;
      };
      Readable.prototype.addListener = Readable.prototype.on;
      Readable.prototype.resume = function () {
        var state = this._readableState;
        if (!state.flowing) {
          debug("resume");
          state.flowing = true;
          if (!state.reading) {
            debug("resume read 0");
            this.read(0);
          }
          resume(this, state);
        }
        return this;
      };
      function resume(stream, state) {
        if (!state.resumeScheduled) {
          state.resumeScheduled = true;
          process.nextTick(function () {
            resume_(stream, state);
          });
        }
      }
      function resume_(stream, state) {
        state.resumeScheduled = false;
        stream.emit("resume");
        flow(stream);
        if (state.flowing && !state.reading) stream.read(0);
      }
      Readable.prototype.pause = function () {
        debug("call pause flowing=%j", this._readableState.flowing);
        if (false !== this._readableState.flowing) {
          debug("pause");
          this._readableState.flowing = false;
          this.emit("pause");
        }
        return this;
      };
      function flow(stream) {
        var state = stream._readableState;
        debug("flow", state.flowing);
        if (state.flowing) {
          do {
            var chunk = stream.read();
          } while (null !== chunk && state.flowing);
        }
      }
      Readable.prototype.wrap = function (stream) {
        var state = this._readableState;
        var paused = false;
        var self = this;
        stream.on("end", function () {
          debug("wrapped end");
          if (state.decoder && !state.ended) {
            var chunk = state.decoder.end();
            if (chunk && chunk.length) self.push(chunk);
          }
          self.push(null);
        });
        stream.on("data", function (chunk) {
          debug("wrapped data");
          if (state.decoder) chunk = state.decoder.write(chunk);
          if (!chunk || !state.objectMode && !chunk.length) return;
          var ret = self.push(chunk);
          if (!ret) {
            paused = true;
            stream.pause();
          }
        });
        for (var i in stream) {
          if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
            this[i] = /* @__PURE__ */function (method) {
              return function () {
                return stream[method].apply(stream, arguments);
              };
            }(i);
          }
        }
        var events = ["error", "close", "destroy", "pause", "resume"];
        forEach(events, function (ev) {
          stream.on(ev, self.emit.bind(self, ev));
        });
        self._read = function (n) {
          debug("wrapped _read", n);
          if (paused) {
            paused = false;
            stream.resume();
          }
        };
        return self;
      };
      Readable._fromList = fromList;
      function fromList(n, state) {
        var list = state.buffer;
        var length = state.length;
        var stringMode = !!state.decoder;
        var objectMode = !!state.objectMode;
        var ret;
        if (list.length === 0) return null;
        if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
          if (stringMode) ret = list.join("");else ret = Buffer2.concat(list, length);
          list.length = 0;
        } else {
          if (n < list[0].length) {
            var buf = list[0];
            ret = buf.slice(0, n);
            list[0] = buf.slice(n);
          } else if (n === list[0].length) {
            ret = list.shift();
          } else {
            if (stringMode) ret = "";else ret = new Buffer2(n);
            var c = 0;
            for (var i = 0, l = list.length; i < l && c < n; i++) {
              var buf = list[0];
              var cpy = Math.min(n - c, buf.length);
              if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);
              if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();
              c += cpy;
            }
          }
        }
        return ret;
      }
      function endReadable(stream) {
        var state = stream._readableState;
        if (state.length > 0) throw new Error("endReadable called on non-empty stream");
        if (!state.endEmitted) {
          state.ended = true;
          process.nextTick(function () {
            if (!state.endEmitted && state.length === 0) {
              state.endEmitted = true;
              stream.readable = false;
              stream.emit("end");
            }
          });
        }
      }
      function forEach(xs, f) {
        for (var i = 0, l = xs.length; i < l; i++) {
          f(xs[i], i);
        }
      }
      function indexOf(xs, x) {
        for (var i = 0, l = xs.length; i < l; i++) {
          if (xs[i] === x) return i;
        }
        return -1;
      }
    }
  });

  // node_modules/readable-stream/lib/_stream_transform.js
  var require_stream_transform = __commonJS({
    "node_modules/readable-stream/lib/_stream_transform.js"(exports, module) {
      module.exports = Transform;
      var Duplex = require_stream_duplex();
      var util = require_util();
      util.inherits = require_inherits();
      util.inherits(Transform, Duplex);
      function TransformState(options, stream) {
        this.afterTransform = function (er, data) {
          return afterTransform(stream, er, data);
        };
        this.needTransform = false;
        this.transforming = false;
        this.writecb = null;
        this.writechunk = null;
      }
      function afterTransform(stream, er, data) {
        var ts = stream._transformState;
        ts.transforming = false;
        var cb = ts.writecb;
        if (!cb) return stream.emit("error", new Error("no writecb in Transform class"));
        ts.writechunk = null;
        ts.writecb = null;
        if (!util.isNullOrUndefined(data)) stream.push(data);
        if (cb) cb(er);
        var rs = stream._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
          stream._read(rs.highWaterMark);
        }
      }
      function Transform(options) {
        if (!(this instanceof Transform)) return new Transform(options);
        Duplex.call(this, options);
        this._transformState = new TransformState(options, this);
        var stream = this;
        this._readableState.needReadable = true;
        this._readableState.sync = false;
        this.once("prefinish", function () {
          if (util.isFunction(this._flush)) this._flush(function (er) {
            done(stream, er);
          });else done(stream);
        });
      }
      Transform.prototype.push = function (chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
      };
      Transform.prototype._transform = function (chunk, encoding, cb) {
        throw new Error("not implemented");
      };
      Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
          var rs = this._readableState;
          if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
      };
      Transform.prototype._read = function (n) {
        var ts = this._transformState;
        if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
          ts.transforming = true;
          this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
          ts.needTransform = true;
        }
      };
      function done(stream, er) {
        if (er) return stream.emit("error", er);
        var ws = stream._writableState;
        var ts = stream._transformState;
        if (ws.length) throw new Error("calling transform done when ws.length != 0");
        if (ts.transforming) throw new Error("calling transform done when still transforming");
        return stream.push(null);
      }
    }
  });

  // node_modules/readable-stream/lib/_stream_passthrough.js
  var require_stream_passthrough = __commonJS({
    "node_modules/readable-stream/lib/_stream_passthrough.js"(exports, module) {
      module.exports = PassThrough;
      var Transform = require_stream_transform();
      var util = require_util();
      util.inherits = require_inherits();
      util.inherits(PassThrough, Transform);
      function PassThrough(options) {
        if (!(this instanceof PassThrough)) return new PassThrough(options);
        Transform.call(this, options);
      }
      PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      };
    }
  });

  // node_modules/readable-stream/readable.js
  var require_readable = __commonJS({
    "node_modules/readable-stream/readable.js"(exports, module) {
      exports = module.exports = require_stream_readable();
      exports.Stream = __require("stream");
      exports.Readable = exports;
      exports.Writable = require_stream_writable();
      exports.Duplex = require_stream_duplex();
      exports.Transform = require_stream_transform();
      exports.PassThrough = require_stream_passthrough();
      if (!process.browser && process.env.READABLE_STREAM === "disable") {
        module.exports = __require("stream");
      }
    }
  });

  // node_modules/bitfield/index.js
  var require_bitfield = __commonJS({
    "node_modules/bitfield/index.js"(exports, module) {
      var Container = typeof Buffer !== "undefined" ? Buffer : typeof Int8Array !== "undefined" ? Int8Array : function (l) {
        var a = new Array(l);
        for (var i = 0; i < l; i++) a[i] = 0;
      };
      function BitField(data) {
        if (!(this instanceof BitField)) {
          return new BitField(data);
        }
        if (typeof data === "number") {
          if (data % 8 !== 0) data += 1 << 3;
          data = new Container(data >> 3);
          if (data.fill) data.fill(0);
        }
        this.buffer = data;
      }
      BitField.prototype.get = function (i) {
        return !!(this.buffer[i >> 3] & 128 >> i % 8);
      };
      BitField.prototype.set = function (i, b) {
        if (b || arguments.length === 1) {
          this.buffer[i >> 3] |= 128 >> i % 8;
        } else {
          this.buffer[i >> 3] &= ~(128 >> i % 8);
        }
      };
      if (typeof module !== "undefined") module.exports = BitField;
    }
  });

  // node_modules/bncode/bncode.js
  var require_bncode = __commonJS({
    "node_modules/bncode/bncode.js"(exports) {
      exports.encode = Bencode;
      exports.decoder = Bdecode;
      exports.decode = decode;
      exports.Stream = Stream;
      var inherits = __require("util").inherits;
      var Transform = __require("stream").Transform;
      var I = "i".charCodeAt(0);
      var L = "l".charCodeAt(0);
      var E = "e".charCodeAt(0);
      var D = "d".charCodeAt(0);
      var COLON = ":".charCodeAt(0);
      var DASH = "-".charCodeAt(0);
      var STATE_INITIAL = 0;
      var STATE_STATE_STRING_LEN = STATE_INITIAL + 1;
      var STATE_STRING = STATE_STATE_STRING_LEN + 1;
      var STATE_COLON = STATE_STRING + 1;
      var STATE_STATE_INTEGER = STATE_COLON + 1;
      var STATE_INTEGER = STATE_STATE_INTEGER + 1;
      function BdecodeSMachine(cb, cb_list, cb_dict, cb_end) {
        var depth = 0;
        var state = STATE_INITIAL;
        this.consistent = function () {
          return state === STATE_INITIAL && depth === 0;
        };
        var strLen = 0;
        var str = "";
        var _int = 0;
        var neg = false;
        this.parse = function (buffer, encoding) {
          if (typeof buffer === "string") {
            buffer = new Buffer(buffer, encoding || "utf8");
          }
          for (var pos = 0; pos !== buffer.length; ++pos) {
            switch (state) {
              case STATE_INITIAL:
                switch (buffer[pos]) {
                  case 48:
                  case 49:
                  case 50:
                  case 51:
                  case 52:
                  case 53:
                  case 54:
                  case 55:
                  case 56:
                  case 57:
                    state = STATE_STATE_STRING_LEN;
                    strLen = 0;
                    strLen += buffer[pos] - 48;
                    break;
                  case I:
                    state = STATE_STATE_INTEGER;
                    _int = 0;
                    neg = false;
                    break;
                  case L:
                    state = STATE_INITIAL;
                    depth += 1;
                    cb_list();
                    break;
                  case D:
                    state = STATE_INITIAL;
                    depth += 1;
                    cb_dict();
                    break;
                  case E:
                    state = STATE_INITIAL;
                    depth -= 1;
                    if (depth < 0) {
                      throw new Error("end with no beginning: " + pos);
                    } else {
                      cb_end();
                    }
                    break;
                }
                break;
              case STATE_STATE_STRING_LEN:
                if (integer(buffer[pos])) {
                  strLen *= 10;
                  strLen += buffer[pos] - 48;
                } else {
                  str = new Buffer(strLen);
                  pos -= 1;
                  state = STATE_COLON;
                }
                break;
              case STATE_COLON:
                if (buffer[pos] !== COLON) {
                  throw new Error("not a colon at: " + pos.toString(16));
                }
                state = STATE_STRING;
                if (0 === strLen) {
                  cb(new Buffer(0));
                  state = STATE_INITIAL;
                }
                break;
              case STATE_STRING:
                if (0 === strLen) {
                  cb(str);
                  state = STATE_INITIAL;
                } else {
                  str[str.length - strLen] = buffer[pos];
                  strLen -= 1;
                  if (0 === strLen) {
                    cb(str);
                    state = STATE_INITIAL;
                  }
                }
                break;
              case STATE_STATE_INTEGER:
                state = STATE_INTEGER;
                if (buffer[pos] === DASH) {
                  neg = true;
                  break;
                }
              // else fall through
              case STATE_INTEGER:
                if (integer(buffer[pos])) {
                  _int *= 10;
                  _int += buffer[pos] - 48;
                } else if (buffer[pos] === E) {
                  var ret = neg ? 0 - _int : _int;
                  cb(ret);
                  state = STATE_INITIAL;
                } else {
                  throw new Error("not part of int at:" + pos.toString(16));
                }
                break;
            }
          }
        };
        function integer(value) {
          if (typeof value !== "number") {
            return false;
          }
          return between(value, 48, 57);
        }
        function between(val, min, max) {
          return min <= val && val <= max;
        }
      }
      function Bdecode() {
        var DICTIONARY_START = {};
        var LIST_START = {};
        var Context = function Context() {
          var self2 = this;
          var stack = [];
          this.cb = function (o) {
            stack.push(o);
          };
          this.cb_list = function () {
            self2.cb(LIST_START);
          };
          this.cb_dict = function () {
            self2.cb(DICTIONARY_START);
          };
          this.cb_end = function () {
            var obj = null;
            var tmp_stack = [];
            while ((obj = stack.pop()) !== void 0) {
              if (LIST_START === obj) {
                var obj2 = null;
                var list = [];
                while ((obj2 = tmp_stack.pop()) !== void 0) {
                  list.push(obj2);
                }
                self2.cb(list);
                break;
              } else if (DICTIONARY_START === obj) {
                var key = null;
                var val = null;
                var dic = {};
                while ((key = tmp_stack.pop()) !== void 0 && (val = tmp_stack.pop()) !== void 0) {
                  dic[key.toString()] = val;
                }
                if (key !== void 0 && dic[key] === void 0) {
                  throw new Error("uneven number of keys and values A");
                }
                self2.cb(dic);
                break;
              } else {
                tmp_stack.push(obj);
              }
            }
            if (tmp_stack.length > 0) {
              throw new Error("uneven number of keys and values B");
            }
          };
          this.result = function () {
            return stack;
          };
        };
        var self = this;
        var ctx = new Context();
        var smachine = new BdecodeSMachine(ctx.cb, ctx.cb_list, ctx.cb_dict, ctx.cb_end);
        this.result = function () {
          if (!smachine.consistent()) {
            throw new Error("not in consistent state. More bytes coming?");
          }
          return ctx.result();
        };
        this.decode = function (buf, encoding) {
          smachine.parse(buf, encoding);
        };
      }
      function Bencode(obj) {
        var self = this;
        var to_encode = obj;
        var buffer = null;
        switch (_typeof(obj)) {
          case "string":
            return encodeString(obj);
          case "number":
            return encodeNumber(obj);
          case "object":
            if (obj instanceof Array) {
              return encodeList(obj);
            } else if (Buffer.isBuffer(obj)) {
              return encodeBuffer(obj);
            } else {
              return encodeDict(obj);
            }
        }
        function encodeString(obj2) {
          var blen = Buffer.byteLength(obj2);
          var len = blen.toString(10);
          var buf = new Buffer(len.length + 1 + blen);
          buf.write(len, 0, "ascii");
          buf.write(":", len.length, "ascii");
          buf.write(obj2, len.length + 1, "utf8");
          return buf;
        }
        function encodeNumber(num) {
          var n = num.toString(10);
          var buf = new Buffer(n.length + 2);
          buf.write("i", 0);
          buf.write(n, 1);
          buf.write("e", n.length + 1);
          return buf;
        }
        function encodeDict(obj2) {
          var func = function func(obj3, pos) {
            var keys = Object.keys(obj3).sort();
            keys.forEach(function (key) {
              var val = new Bencode(obj3[key]);
              key = new Bencode(key);
              ensure(key.length + val.length, pos);
              key.copy(buffer, pos, 0);
              pos += key.length;
              val.copy(buffer, pos, 0);
              pos += val.length;
            });
            return pos;
          };
          return assemble(obj2, "d", func);
        }
        function encodeList(obj2) {
          var func = function func(obj3, pos) {
            obj3.forEach(function (o) {
              var elem = new Bencode(o);
              ensure(elem.length, pos);
              elem.copy(buffer, pos, 0);
              pos += elem.length;
            });
            return pos;
          };
          return assemble(obj2, "l", func);
        }
        function encodeBuffer(obj2) {
          var len = obj2.length.toString(10);
          var buf = new Buffer(len.length + 1 + obj2.length);
          buf.write(len, 0, "ascii");
          buf.write(":", len.length, "ascii");
          obj2.copy(buf, len.length + 1, 0);
          return buf;
        }
        function assemble(obj2, prefix, func) {
          var pos = 0;
          ensure(1024, 0);
          buffer.write(prefix, pos++);
          pos = func(obj2, pos);
          ensure(1, pos);
          buffer.write("e", pos++);
          return buffer.slice(0, pos);
        }
        function ensure(num, pos) {
          if (!buffer) {
            buffer = new Buffer(num);
          } else {
            if (buffer.length > num + pos + 1) {
              return;
            } else {
              var buf2 = new Buffer(buffer.length + num);
              buffer.copy(buf2, 0, 0);
              buffer = buf2;
            }
          }
        }
      }
      function decode(buffer, encoding) {
        var decoder = new Bdecode();
        decoder.decode(buffer, encoding);
        return decoder.result()[0];
      }
      function Stream(options) {
        options = options || {};
        options.objectMode = true;
        Transform.call(this, options);
        this._decoder = new Bdecode();
      }
      inherits(Stream, Transform);
      Stream.prototype._transform = function (chunk, encoding, callback) {
        try {
          this._decoder.decode(chunk, encoding);
          callback(null);
        } catch (err) {
          callback(err);
        }
      };
      Stream.prototype._flush = function (callback) {
        this.push(this._decoder.result()[0]);
        callback(null);
      };
    }
  });

  // node_modules/peer-wire-protocol/index.js
  var require_peer_wire_protocol = __commonJS({
    "node_modules/peer-wire-protocol/index.js"(exports, module) {
      var Duplex = __require("stream").Duplex || require_readable().Duplex;
      var EventEmitter = __require("events").EventEmitter;
      var bitfield = require_bitfield();
      var util = __require("util");
      var bncode = require_bncode();
      var speedometer = require_speedometer();
      var MESSAGE_PROTOCOL = new Buffer([19, 66, 105, 116, 84, 111, 114, 114, 101, 110, 116, 32, 112, 114, 111, 116, 111, 99, 111, 108]);
      var MESSAGE_KEEP_ALIVE = new Buffer([0, 0, 0, 0]);
      var MESSAGE_CHOKE = new Buffer([0, 0, 0, 1, 0]);
      var MESSAGE_UNCHOKE = new Buffer([0, 0, 0, 1, 1]);
      var MESSAGE_INTERESTED = new Buffer([0, 0, 0, 1, 2]);
      var MESSAGE_UNINTERESTED = new Buffer([0, 0, 0, 1, 3]);
      var MESSAGE_RESERVED = [0, 0, 0, 0, 0, 0, 0, 0];
      var MESSAGE_PORT = [0, 0, 0, 3, 9, 0, 0];
      var noop = function noop() {};
      var pull = function pull(requests, piece, offset, length) {
        for (var i = 0; i < requests.length; i++) {
          var req = requests[i];
          if (req.piece !== piece || req.offset !== offset || req.length !== length) continue;
          if (i === 0) requests.shift();else requests.splice(i, 1);
          return req;
        }
        return null;
      };
      var Request = function Request(piece, offset, length, callback) {
        this.piece = piece;
        this.offset = offset;
        this.length = length;
        this.callback = callback;
        this.timeout = null;
      };
      var _Wire = function Wire(opts) {
        if (!(this instanceof _Wire)) return new _Wire(opts);
        if (!opts) opts = {};
        Duplex.call(this);
        var self = this;
        this.amChoking = true;
        this.amInterested = false;
        this.peerChoking = true;
        this.peerInterested = false;
        this.peerPieces = [];
        this.peerExtensions = {};
        this.peerAddress = null;
        this.uploaded = 0;
        this.downloaded = 0;
        this.uploadSpeed = speedometer(opts.speed);
        this.downloadSpeed = speedometer(opts.speed);
        this.requests = [];
        this.peerRequests = [];
        this._keepAlive = null;
        this._finished = false;
        this.on("finish", function () {
          self._finished = true;
          self.push(null);
          clearInterval(self._keepAlive);
          self._parse(Number.MAX_VALUE, noop);
          while (self.peerRequests.length) self.peerRequests.pop();
          while (self.requests.length) self._callback(self.requests.shift(), new Error("wire is closed"), null);
        });
        var ontimeout = function ontimeout() {
          self._callback(self.requests.shift(), new Error("request has timed out"), null);
          self.emit("timeout");
        };
        this._timeout = 0;
        this._ontimeout = ontimeout;
        var _onmessagelength = function onmessagelength(buffer) {
          var length = buffer.readUInt32BE(0);
          if (length) return self._parse(length, onmessage);
          self._parse(4, _onmessagelength);
          self.emit("keep-alive");
        };
        var onmessage = function onmessage(buffer) {
          self._parse(4, _onmessagelength);
          switch (buffer[0]) {
            case 0:
              return self._onchoke();
            case 1:
              return self._onunchoke();
            case 2:
              return self._oninterested();
            case 3:
              return self._onuninterested();
            case 4:
              return self._onhave(buffer.readUInt32BE(1));
            case 5:
              return self._onbitfield(buffer.slice(1));
            case 6:
              return self._onrequest(buffer.readUInt32BE(1), buffer.readUInt32BE(5), buffer.readUInt32BE(9));
            case 7:
              return self._onpiece(buffer.readUInt32BE(1), buffer.readUInt32BE(5), buffer.slice(9));
            case 8:
              return self._oncancel(buffer.readUInt32BE(1), buffer.readUInt32BE(5), buffer.readUInt32BE(9));
            case 9:
              return self._onport(buffer.readUInt16BE(1));
            case 20:
              return self._onextended(buffer.readUInt8(1), buffer.slice(2));
          }
          self.emit("unknownmessage", buffer);
        };
        this._buffer = [];
        this._bufferSize = 0;
        this._parser = null;
        this._parserSize = 0;
        this._parse(1, function (buffer) {
          var pstrlen = buffer.readUInt8(0);
          self._parse(pstrlen + 48, function (handshake) {
            handshake = handshake.slice(pstrlen);
            self._onhandshake(handshake.slice(8, 28), handshake.slice(28, 48), {
              dht: !!(handshake[7] & 1),
              extended: !!(handshake[5] & 16)
            });
            self._parse(4, _onmessagelength);
          });
        });
      };
      util.inherits(_Wire, Duplex);
      _Wire.prototype.handshake = function (infoHash, peerId, extensions) {
        if (typeof infoHash === "string") infoHash = new Buffer(infoHash, "hex");
        if (typeof peerId === "string") peerId = new Buffer(peerId);
        if (infoHash.length !== 20 || peerId.length !== 20) throw new Error("infoHash and peerId MUST have length 20");
        var reserved = new Buffer(MESSAGE_RESERVED);
        if (extensions && extensions.dht) reserved[7] |= 1;
        reserved[5] |= 16;
        this._push(Buffer.concat([MESSAGE_PROTOCOL, reserved, infoHash, peerId], MESSAGE_PROTOCOL.length + 48));
      };
      _Wire.prototype.choke = function () {
        if (this.amChoking) return;
        this.amChoking = true;
        while (this.peerRequests.length) this.peerRequests.pop();
        this._push(MESSAGE_CHOKE);
      };
      _Wire.prototype.unchoke = function () {
        if (!this.amChoking) return;
        this.amChoking = false;
        this._push(MESSAGE_UNCHOKE);
      };
      _Wire.prototype.interested = function () {
        if (this.amInterested) return;
        this.amInterested = true;
        this._push(MESSAGE_INTERESTED);
      };
      _Wire.prototype.uninterested = function () {
        if (!this.amInterested) return;
        this.amInterested = false;
        this._push(MESSAGE_UNINTERESTED);
      };
      _Wire.prototype.have = function (i) {
        this._message(4, [i], null);
      };
      _Wire.prototype.bitfield = function (bitfield2) {
        if (bitfield2.buffer) bitfield2 = bitfield2.buffer;
        this._message(5, [], bitfield2);
      };
      _Wire.prototype.request = function (i, offset, length, callback) {
        if (!callback) callback = noop;
        if (this._finished) return callback(new Error("wire is closed"));
        if (this.peerChoking) return callback(new Error("peer is choking"));
        this.requests.push(new Request(i, offset, length, callback));
        this._updateTimeout();
        this._message(6, [i, offset, length], null);
      };
      _Wire.prototype.piece = function (i, offset, buffer) {
        this.uploaded += buffer.length;
        this.uploadSpeed(buffer.length);
        this.emit("upload", buffer.length);
        this._message(7, [i, offset], buffer);
      };
      _Wire.prototype.cancel = function (i, offset, length) {
        this._callback(pull(this.requests, i, offset, length), new Error("request was cancelled"), null);
        this._message(8, [i, offset, length], null);
      };
      _Wire.prototype.extended = function (id, msg) {
        this._message(20, [], Buffer.concat([new Buffer([id]), Buffer.isBuffer(msg) ? msg : bncode.encode(msg)]));
      };
      _Wire.prototype.port = function (port) {
        var message = new Buffer(MESSAGE_PORT);
        message.writeUInt16BE(port, 5);
        this._push(message);
      };
      _Wire.prototype.setKeepAlive = function (bool) {
        clearInterval(this._keepAlive);
        if (bool === false) return;
        this._keepAlive = setInterval(this._push.bind(this, MESSAGE_KEEP_ALIVE), 6e4);
      };
      _Wire.prototype.setTimeout = function (ms, fn) {
        if (this.requests.length) clearTimeout(this.requests[0].timeout);
        this._timeout = ms;
        this._updateTimeout();
        if (fn) this.on("timeout", fn);
      };
      _Wire.prototype.destroy = function () {
        this.emit("close");
        this.end();
      };
      _Wire.prototype._onhandshake = function (infoHash, peerId, extensions) {
        this.peerExtensions = extensions;
        this.emit("handshake", infoHash, peerId, extensions);
      };
      _Wire.prototype._oninterested = function () {
        this.peerInterested = true;
        this.emit("interested");
      };
      _Wire.prototype._onuninterested = function () {
        this.peerInterested = false;
        this.emit("uninterested");
      };
      _Wire.prototype._onchoke = function () {
        this.peerChoking = true;
        this.emit("choke");
        while (this.requests.length) this._callback(this.requests.shift(), new Error("peer is choking"), null);
      };
      _Wire.prototype._onunchoke = function () {
        this.peerChoking = false;
        this.emit("unchoke");
      };
      _Wire.prototype._onbitfield = function (buffer) {
        var pieces = bitfield(buffer);
        for (var i = 0; i < 8 * buffer.length; i++) {
          this.peerPieces[i] = pieces.get(i);
        }
        this.emit("bitfield", buffer);
      };
      _Wire.prototype._onhave = function (i) {
        this.peerPieces[i] = true;
        this.emit("have", i);
      };
      _Wire.prototype._onrequest = function (i, offset, length) {
        if (this.amChoking) return;
        var self = this;
        var respond = function respond(err, buffer) {
          if (request !== pull(self.peerRequests, i, offset, length)) return;
          if (err) return;
          self.piece(i, offset, buffer);
        };
        var request = new Request(i, offset, length, respond);
        this.peerRequests.push(request);
        this.emit("request", i, offset, length, respond);
      };
      _Wire.prototype._oncancel = function (i, offset, length) {
        pull(this.peerRequests, i, offset, length);
        this.emit("cancel", i, offset, length);
      };
      _Wire.prototype._onpiece = function (i, offset, buffer) {
        this._callback(pull(this.requests, i, offset, buffer.length), null, buffer);
        this.downloaded += buffer.length;
        this.downloadSpeed(buffer.length);
        this.emit("download", buffer.length);
        this.emit("piece", i, offset, buffer);
      };
      _Wire.prototype._onport = function (port) {
        this.emit("port", port);
      };
      _Wire.prototype._onextended = function (id, ext) {
        this.emit("extended", id, ext);
      };
      _Wire.prototype._callback = function (request, err, buffer) {
        if (!request) return;
        if (request.timeout) clearTimeout(request.timeout);
        if (!this.peerChoking && !this._finished) this._updateTimeout();
        request.callback(err, buffer);
      };
      _Wire.prototype._updateTimeout = function () {
        if (!this._timeout || !this.requests.length || this.requests[0].timeout) return;
        this.requests[0].timeout = setTimeout(this._ontimeout, this._timeout);
      };
      _Wire.prototype._message = function (id, numbers, data) {
        var dataLength = data ? data.length : 0;
        var buffer = new Buffer(5 + 4 * numbers.length);
        buffer.writeUInt32BE(buffer.length + dataLength - 4, 0);
        buffer[4] = id;
        for (var i = 0; i < numbers.length; i++) {
          buffer.writeUInt32BE(numbers[i], 5 + 4 * i);
        }
        this._push(buffer);
        if (data) this._push(data);
      };
      _Wire.prototype._push = function (data) {
        if (this._finished) return;
        this.push(data);
      };
      _Wire.prototype._parse = function (size, parser) {
        this._parserSize = size;
        this._parser = parser;
      };
      _Wire.prototype._write = function (data, encoding, callback) {
        this._bufferSize += data.length;
        this._buffer.push(data);
        while (this._bufferSize >= this._parserSize) {
          var buffer = this._buffer.length === 1 ? this._buffer[0] : Buffer.concat(this._buffer, this._bufferSize);
          this._bufferSize -= this._parserSize;
          this._buffer = this._bufferSize ? [buffer.slice(this._parserSize)] : [];
          this._parser(buffer.slice(0, this._parserSize));
        }
        callback();
      };
      _Wire.prototype._read = noop;
      module.exports = _Wire;
    }
  });

  // service/vendor/torrent-stream/lib/peer-wire-swarm.cjs
  var require_peer_wire_swarm = __commonJS({
    "service/vendor/torrent-stream/lib/peer-wire-swarm.cjs"(exports, module) {
      var utp = require_utp();
      var net = __require("net");
      var fifo = require_fifo();
      var once = require_once();
      var speedometer = require_speedometer();
      var peerWireProtocol = require_peer_wire_protocol();
      var EventEmitter = __require("events").EventEmitter;
      var util = __require("util");
      var HANDSHAKE_TIMEOUT = 25e3;
      var CONNECTION_TIMEOUT = 3e3;
      var RECONNECT_WAIT = [1e3, 5e3, 15e3];
      var DEFAULT_SIZE = 100;
      var toBuffer = function toBuffer(str, encoding) {
        return Buffer.isBuffer(str) ? str : new Buffer(str, encoding);
      };
      var toAddress = function toAddress(wire) {
        if (typeof wire === "string") return wire;
        return wire.peerAddress;
      };
      var onwire = function onwire(swarm, connection, onhandshake, isServer) {
        var wire = peerWireProtocol(swarm._pwp);
        var destroy = function destroy() {
          connection.destroy();
          connection.emit("timeout");
        };
        var connectTimeout = !isServer && setTimeout(destroy, swarm.connectTimeout);
        var handshakeTimeout = setTimeout(destroy, swarm.handshakeTimeout);
        if (handshakeTimeout.unref) handshakeTimeout.unref();
        if (connectTimeout.unref) connectTimeout.unref();
        connection.on("connect", function () {
          clearTimeout(connectTimeout);
        });
        wire.once("handshake", function (infoHash, peerId) {
          clearTimeout(handshakeTimeout);
          onhandshake(infoHash, peerId);
        });
        connection.on("end", function () {
          connection.destroy();
        });
        connection.on("error", function () {
          connection.destroy();
        });
        connection.on("close", function () {
          clearTimeout(connectTimeout);
          clearTimeout(handshakeTimeout);
          wire.destroy();
        });
        connection.pipe(wire).pipe(connection);
        return wire;
      };
      var pools = {};
      var leave = function leave(port, swarm) {
        if (!pools[port]) return;
        delete pools[port].swarms[swarm.infoHash.toString("hex")];
        if (Object.keys(pools[port].swarms).length) return;
        pools[port].servers.forEach(function (server) {
          try {
            if (typeof server.close === "function") server.close();else if (server._socket) server._socket.close();
          } catch (err) {}
        });
        delete pools[port];
      };
      var join = function join(port, swarm) {
        var pool = pools[port];
        if (!pool) {
          var swarms = {};
          var servers = [];
          var onconnection = function onconnection(connection) {
            var wire = onwire(swarm, connection, function (infoHash2, peerId) {
              var swarm2 = swarms[infoHash2.toString("hex")];
              if (!swarm2) return connection.destroy();
              swarm2._onincoming(connection, wire);
            }, true);
          };
          servers.push(net.createServer(onconnection));
          if (swarm.utp || swarm.utpFallback) servers.push(utp.createServer(onconnection));
          var _loop = function loop(i) {
            if (i < servers.length) {
              var next = once(_loop.bind(null, i + 1));
              var server = servers[i];
              server.on("error", function () {
                servers.splice(servers.indexOf(server), 1);
                next();
              });
              server.listen(port, next);
              if (server._socket) server._socket.on("error", function (err) {
                server.emit("error", err);
              });
              return;
            }
            pool.listening = true;
            Object.keys(swarms).forEach(function (infoHash2) {
              swarms[infoHash2].emit("listening");
            });
          };
          _loop(0);
          pool = pools[port] = {
            servers,
            swarms,
            listening: false
          };
        }
        var infoHash = swarm.infoHash.toString("hex");
        if (pool.listening) {
          process.nextTick(function () {
            swarm.emit("listening");
          });
        }
        if (pool.swarms[infoHash]) {
          process.nextTick(function () {
            swarm.emit("error", new Error("port and info hash already in use"));
          });
          return;
        }
        pool.swarms[infoHash] = swarm;
      };
      var _Swarm = function Swarm(infoHash, peerId, options) {
        if (!(this instanceof _Swarm)) return new _Swarm(infoHash, peerId, options);
        EventEmitter.call(this);
        options = options || {};
        this.handshake = options.handshake;
        this.port = 0;
        this.size = options.size || DEFAULT_SIZE;
        this.utp = options.utp || false;
        this.utpFallback = options.utpFallback || false;
        this.handshakeTimeout = options.handshakeTimeout || HANDSHAKE_TIMEOUT;
        this.connectTimeout = options.connectTimeout || CONNECTION_TIMEOUT;
        this.infoHash = toBuffer(infoHash, "hex");
        this.peerId = toBuffer(peerId, "utf-8");
        this.downloaded = 0;
        this.uploaded = 0;
        this.connections = [];
        this.wires = [];
        this.paused = false;
        this.uploaded = 0;
        this.downloaded = 0;
        this.downloadSpeed = speedometer();
        this.uploadSpeed = speedometer();
        this._destroyed = false;
        this._queues = [fifo()];
        this._peers = {};
        this._pwp = {
          speed: options.speed
        };
      };
      util.inherits(_Swarm, EventEmitter);
      _Swarm.prototype.__defineGetter__("queued", function () {
        return this._queues.reduce(function (prev, queue) {
          return prev + queue.length;
        }, 0);
      });
      _Swarm.prototype.pause = function () {
        this.paused = true;
      };
      _Swarm.prototype.resume = function () {
        this.paused = false;
        this._drain();
      };
      _Swarm.prototype.priority = function (addr, level) {
        addr = toAddress(addr);
        var peer = this._peers[addr];
        if (!peer) return 0;
        if (typeof level !== "number" || peer.priority === level) return level;
        if (!this._queues[level]) this._queues[level] = fifo();
        if (peer.node) {
          this._queues[peer.priority].remove(peer.node);
          peer.node = this._queues[level].push(addr);
        }
        return peer.priority = level;
      };
      _Swarm.prototype.add = function (addr) {
        if (this._destroyed || this._peers[addr]) return;
        var port = Number(addr.split(":")[1]);
        if (!(port > 0 && port < 65535)) return;
        this._peers[addr] = {
          node: this._queues[0].push(addr),
          wire: null,
          timeout: null,
          reconnect: false,
          priority: 0,
          retries: 0,
          noUtp: false
        };
        this._drain();
      };
      _Swarm.prototype.remove = function (addr) {
        this._remove(toAddress(addr));
        this._drain();
      };
      _Swarm.prototype.listen = function (port, onlistening) {
        if (onlistening) this.once("listening", onlistening);
        this.port = port;
        join(this.port, this);
      };
      _Swarm.prototype.destroy = function () {
        this._destroyed = true;
        var self = this;
        Object.keys(this._peers).forEach(function (addr) {
          self._remove(addr);
        });
        this.wires.forEach(function (wire) {
          wire.destroy();
        });
        leave(this.port, this);
        process.nextTick(function () {
          self.emit("close");
        });
      };
      _Swarm.prototype._remove = function (addr) {
        var peer = this._peers[addr];
        if (!peer) return;
        delete this._peers[addr];
        if (peer.node) this._queues[peer.priority].remove(peer.node);
        if (peer.timeout) clearTimeout(peer.timeout);
        if (peer.wire) peer.wire.destroy();
      };
      _Swarm.prototype._drain = function () {
        if (this.connections.length >= this.size || this.paused) return;
        var self = this;
        var addr = this._shift();
        if (!addr) return;
        var peer = this._peers[addr];
        if (!peer) return;
        var repush = function repush() {
          peer.node = self._queues[peer.priority].push(addr);
          self._drain();
        };
        var parts = addr.split(":");
        var connection;
        var viaUtp = this.utp && !peer.noUtp || peer.useUtp;
        if (peer.useUtp) {
          peer.useUtp = false;
          connection = utp.connect(parts[1], parts[0]);
        } else if (this.utp && !peer.noUtp) {
          connection = utp.connect(parts[1], parts[0]);
          connection.on("timeout", function () {
            peer.noUtp = true;
            repush();
          });
        } else {
          connection = net.connect(parts[1], parts[0]);
        }
        if (peer.timeout) clearTimeout(peer.timeout);
        peer.node = null;
        peer.timeout = null;
        var opened = false;
        var tcpRefused = false;
        connection.once("connect", function () {
          opened = true;
        });
        connection.on("error", function (err) {
          if (err && (err.code === "ECONNREFUSED" || err.code === "ECONNRESET")) tcpRefused = true;
        });
        var wire = onwire(this, connection, function (infoHash) {
          if (infoHash.toString("hex") !== self.infoHash.toString("hex")) return connection.destroy();
          peer.reconnect = true;
          peer.retries = 0;
          wire.transport = viaUtp ? "utp" : "tcp";
          wire.incoming = false;
          self._onwire(connection, wire);
        });
        var ended = false;
        var onend = function onend() {
          if (ended) return;
          ended = true;
          if (peer.wire === wire) peer.wire = null;
          if (self._peers[addr] !== peer) return;
          if (!opened && tcpRefused && !viaUtp && self.utpFallback && !peer.triedUtp && !self._destroyed) {
            peer.triedUtp = true;
            peer.useUtp = true;
            self.emit("utp-fallback", addr);
            return repush();
          }
          if (!peer.reconnect || self._destroyed || peer.retries >= RECONNECT_WAIT.length) return self._remove(addr);
          peer.timeout = setTimeout(repush, RECONNECT_WAIT[peer.retries++]);
        };
        wire.on("end", onend);
        connection.once("close", onend);
        peer.wire = wire;
        self._onconnection(connection);
        wire.peerAddress = addr;
        wire.handshake(this.infoHash, this.peerId, this.handshake);
      };
      _Swarm.prototype._shift = function () {
        for (var i = this._queues.length - 1; i >= 0; i--) {
          if (this._queues[i] && this._queues[i].length) return this._queues[i].shift();
        }
        return null;
      };
      _Swarm.prototype._onincoming = function (connection, wire) {
        var remote = connection.remoteAddress ? {
          address: connection.remoteAddress,
          port: connection.remotePort
        } : connection.address();
        wire.peerAddress = String(remote.address).replace(/^::ffff:/, "") + ":" + remote.port;
        wire.incoming = true;
        wire.transport = connection.remoteAddress ? "tcp" : "utp";
        wire.handshake(this.infoHash, this.peerId, this.handshake);
        this._onconnection(connection);
        this._onwire(connection, wire);
      };
      _Swarm.prototype._onconnection = function (connection) {
        var self = this;
        connection.once("close", function () {
          self.connections.splice(self.connections.indexOf(connection), 1);
          self._drain();
        });
        this.connections.push(connection);
      };
      _Swarm.prototype._onwire = function (connection, wire) {
        var self = this;
        wire.on("download", function (downloaded) {
          self.downloaded += downloaded;
          self.downloadSpeed(downloaded);
          self.emit("download", downloaded);
        });
        wire.on("upload", function (uploaded) {
          self.uploaded += uploaded;
          self.uploadSpeed(uploaded);
          self.emit("upload", uploaded);
        });
        var cleanup = once(function () {
          self.emit("wire-disconnect", wire, connection);
          self.wires.splice(self.wires.indexOf(wire), 1);
          connection.destroy();
        });
        connection.on("close", cleanup);
        connection.on("error", cleanup);
        connection.on("end", cleanup);
        wire.on("end", cleanup);
        wire.on("close", cleanup);
        wire.on("finish", cleanup);
        this.wires.push(wire);
        this.emit("wire", wire, connection);
      };
      module.exports = _Swarm;
    }
  });

  // node_modules/thirty-two/lib/thirty-two/thirty-two.js
  var require_thirty_two = __commonJS({
    "node_modules/thirty-two/lib/thirty-two/thirty-two.js"(exports) {
      var charTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      var byteTable = [255, 255, 26, 27, 28, 29, 30, 31, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255];
      function quintetCount(buff) {
        var quintets = Math.floor(buff.length / 5);
        return buff.length % 5 == 0 ? quintets : quintets + 1;
      }
      exports.encode = function (plain) {
        var i = 0;
        var j = 0;
        var shiftIndex = 0;
        var digit = 0;
        var encoded = new Buffer(quintetCount(plain) * 8);
        if (!Buffer.isBuffer(plain)) {
          plain = new Buffer(plain);
        }
        while (i < plain.length) {
          var current = plain[i];
          if (shiftIndex > 3) {
            digit = current & 255 >> shiftIndex;
            shiftIndex = (shiftIndex + 5) % 8;
            digit = digit << shiftIndex | (i + 1 < plain.length ? plain[i + 1] : 0) >> 8 - shiftIndex;
            i++;
          } else {
            digit = current >> 8 - (shiftIndex + 5) & 31;
            shiftIndex = (shiftIndex + 5) % 8;
            if (shiftIndex == 0) i++;
          }
          encoded[j] = charTable.charCodeAt(digit);
          j++;
        }
        for (i = j; i < encoded.length; i++) encoded[i] = 61;
        return encoded;
      };
      exports.decode = function (encoded) {
        var shiftIndex = 0;
        var plainDigit = 0;
        var plainChar;
        var plainPos = 0;
        if (!Buffer.isBuffer(encoded)) {
          encoded = new Buffer(encoded);
        }
        var decoded = new Buffer(Math.ceil(encoded.length * 5 / 8));
        for (var i = 0; i < encoded.length; i++) {
          if (encoded[i] == 61) {
            break;
          }
          var encodedByte = encoded[i] - 48;
          if (encodedByte < byteTable.length) {
            plainDigit = byteTable[encodedByte];
            if (shiftIndex <= 3) {
              shiftIndex = (shiftIndex + 5) % 8;
              if (shiftIndex == 0) {
                plainChar |= plainDigit;
                decoded[plainPos] = plainChar;
                plainPos++;
                plainChar = 0;
              } else {
                plainChar |= 255 & plainDigit << 8 - shiftIndex;
              }
            } else {
              shiftIndex = (shiftIndex + 5) % 8;
              plainChar |= 255 & plainDigit >>> shiftIndex;
              decoded[plainPos] = plainChar;
              plainPos++;
              plainChar = 255 & plainDigit << 8 - shiftIndex;
            }
          } else {
            throw new Error("Invalid input - it is not base32 encoded string");
          }
        }
        return decoded.slice(0, plainPos);
      };
    }
  });

  // node_modules/thirty-two/lib/thirty-two/index.js
  var require_thirty_two2 = __commonJS({
    "node_modules/thirty-two/lib/thirty-two/index.js"(exports) {
      var base32 = require_thirty_two();
      exports.encode = base32.encode;
      exports.decode = base32.decode;
    }
  });

  // node_modules/xtend/immutable.js
  var require_immutable = __commonJS({
    "node_modules/xtend/immutable.js"(exports, module) {
      module.exports = extend;
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      function extend() {
        var target = {};
        for (var i = 0; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      }
    }
  });

  // node_modules/flatten/index.js
  var require_flatten = __commonJS({
    "node_modules/flatten/index.js"(exports, module) {
      module.exports = function flatten(list, depth) {
        depth = typeof depth == "number" ? depth : Infinity;
        return _flatten(list, 1);
        function _flatten(list2, d) {
          return list2.reduce(function (acc, item) {
            if (Array.isArray(item) && d < depth) {
              return acc.concat(_flatten(item, d + 1));
            } else {
              return acc.concat(item);
            }
          }, []);
        }
      };
    }
  });

  // node_modules/magnet-uri/index.js
  var require_magnet_uri = __commonJS({
    "node_modules/magnet-uri/index.js"(exports, module) {
      module.exports = magnetURIDecode;
      module.exports.decode = magnetURIDecode;
      module.exports.encode = magnetURIEncode;
      var base32 = require_thirty_two2();
      var extend = require_immutable();
      var flatten = require_flatten();
      function magnetURIDecode(uri) {
        var result = {};
        var data = uri.split("magnet:?")[1];
        var params = data && data.length >= 0 ? data.split("&") : [];
        params.forEach(function (param) {
          var keyval = param.split("=");
          if (keyval.length !== 2) return;
          var key = keyval[0];
          var val = keyval[1];
          if (key === "dn") val = decodeURIComponent(val).replace(/\+/g, " ");
          if (key === "tr" || key === "xs" || key === "as" || key === "ws") {
            val = decodeURIComponent(val);
          }
          if (key === "kt") val = decodeURIComponent(val).split("+");
          if (result[key]) {
            if (Array.isArray(result[key])) {
              result[key].push(val);
            } else {
              var old = result[key];
              result[key] = [old, val];
            }
          } else {
            result[key] = val;
          }
        });
        var m;
        if (result.xt) {
          var xts = Array.isArray(result.xt) ? result.xt : [result.xt];
          xts.forEach(function (xt) {
            if (m = xt.match(/^urn:btih:(.{40})/)) {
              result.infoHash = new Buffer(m[1], "hex").toString("hex");
            } else if (m = xt.match(/^urn:btih:(.{32})/)) {
              var decodedStr = base32.decode(m[1]);
              result.infoHash = new Buffer(decodedStr, "binary").toString("hex");
            }
          });
        }
        if (result.dn) result.name = result.dn;
        if (result.kt) result.keywords = result.kt;
        if (typeof result.tr === "string") result.announce = [result.tr];else if (Array.isArray(result.tr)) result.announce = result.tr;else result.announce = [];
        result.announceList = result.announce.map(function (url) {
          return [url];
        });
        result.urlList = [];
        if (typeof result.as === "string" || Array.isArray(result.as)) {
          result.urlList = result.urlList.concat(result.as);
        }
        if (typeof result.ws === "string" || Array.isArray(result.ws)) {
          result.urlList = result.urlList.concat(result.ws);
        }
        return result;
      }
      function magnetURIEncode(obj) {
        obj = extend(obj);
        if (obj.infoHash) obj.xt = "urn:btih:" + obj.infoHash;
        if (obj.name) obj.dn = obj.name;
        if (obj.keywords) obj.kt = obj.keywords;
        if (obj.announce) obj.tr = obj.announce;
        if (obj.announceList) obj.tr = flatten(obj.announceList);
        if (obj.urlList) {
          obj.ws = flatten(obj.urlList);
          delete obj.as;
        }
        var result = "magnet:?";
        Object.keys(obj).filter(function (key) {
          return key.length === 2;
        }).forEach(function (key, i) {
          var values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
          values.forEach(function (val, j) {
            if ((i > 0 || j > 0) && (key !== "kt" || j === 0)) result += "&";
            if (key === "dn") val = encodeURIComponent(val).replace(/%20/g, "+");
            if (key === "tr" || key === "xs" || key === "as" || key === "ws") {
              val = encodeURIComponent(val);
            }
            if (key === "kt") val = encodeURIComponent(val);
            if (key === "kt" && j > 0) result += "+" + val;else result += key + "=" + val;
          });
        });
        return result;
      }
    }
  });

  // node_modules/bencode/lib/encode.js
  var require_encode = __commonJS({
    "node_modules/bencode/lib/encode.js"(exports, module) {
      function encode(data) {
        var buffers = [];
        encode._encode(buffers, data);
        return Buffer.concat(buffers);
      }
      encode._floatConversionDetected = false;
      encode._encode = function (buffers, data) {
        if (Buffer.isBuffer(data)) {
          buffers.push(new Buffer(data.length + ":"));
          buffers.push(data);
          return;
        }
        switch (_typeof(data)) {
          case "string":
            encode.bytes(buffers, data);
            break;
          case "number":
            encode.number(buffers, data);
            break;
          case "object":
            data.constructor === Array ? encode.list(buffers, data) : encode.dict(buffers, data);
            break;
        }
      };
      var buff_e = new Buffer("e");
      var buff_d = new Buffer("d");
      var buff_l = new Buffer("l");
      encode.bytes = function (buffers, data) {
        buffers.push(new Buffer(Buffer.byteLength(data) + ":" + data));
      };
      encode.number = function (buffers, data) {
        var maxLo = 2147483648;
        var hi = data / maxLo << 0;
        var lo = data % maxLo << 0;
        var val = hi * maxLo + lo;
        buffers.push(new Buffer("i" + val + "e"));
        if (val !== data && !encode._floatConversionDetected) {
          encode._floatConversionDetected = true;
          console.warn('WARNING: Possible data corruption detected with value "' + data + '":', 'Bencoding only defines support for integers, value was converted to "' + val + '"');
          console.trace();
        }
      };
      encode.dict = function (buffers, data) {
        buffers.push(buff_d);
        var j = 0;
        var k;
        var keys = Object.keys(data).sort();
        var kl = keys.length;
        for (; j < kl; j++) {
          k = keys[j];
          encode.bytes(buffers, k);
          encode._encode(buffers, data[k]);
        }
        buffers.push(buff_e);
      };
      encode.list = function (buffers, data) {
        var i = 0,
          j = 1;
        var c = data.length;
        buffers.push(buff_l);
        for (; i < c; i++) {
          encode._encode(buffers, data[i]);
        }
        buffers.push(buff_e);
      };
      module.exports = encode;
    }
  });

  // node_modules/bencode/lib/dict.js
  var require_dict = __commonJS({
    "node_modules/bencode/lib/dict.js"(exports, module) {
      var Dict = module.exports = function Dict2() {
        Object.defineProperty(this, "_keys", {
          enumerable: false,
          value: []
        });
      };
      Dict.prototype.binaryKeys = function binaryKeys() {
        return this._keys.slice();
      };
      Dict.prototype.binarySet = function binarySet(key, value) {
        this._keys.push(key);
        this[key] = value;
      };
    }
  });

  // node_modules/bencode/lib/decode.js
  var require_decode = __commonJS({
    "node_modules/bencode/lib/decode.js"(exports, module) {
      var Dict = require_dict();
      function decode(data, encoding) {
        decode.position = 0;
        decode.encoding = encoding || null;
        decode.data = !Buffer.isBuffer(data) ? new Buffer(data) : data;
        return decode.next();
      }
      decode.position = 0;
      decode.data = null;
      decode.encoding = null;
      decode.next = function () {
        switch (decode.data[decode.position]) {
          case 100:
            return decode.dictionary();
            break;
          case 108:
            return decode.list();
            break;
          case 105:
            return decode.integer();
            break;
          default:
            return decode.bytes();
            break;
        }
      };
      decode.find = function (chr) {
        var i = decode.position;
        var c = decode.data.length;
        var d = decode.data;
        while (i < c) {
          if (d[i] === chr) return i;
          i++;
        }
        throw new Error('Invalid data: Missing delimiter "' + String.fromCharCode(chr) + '" [0x' + chr.toString(16) + "]");
      };
      decode.dictionary = function () {
        decode.position++;
        var dict = new Dict();
        while (decode.data[decode.position] !== 101) {
          dict.binarySet(decode.bytes(), decode.next());
        }
        decode.position++;
        return dict;
      };
      decode.list = function () {
        decode.position++;
        var lst = [];
        while (decode.data[decode.position] !== 101) {
          lst.push(decode.next());
        }
        decode.position++;
        return lst;
      };
      decode.integer = function () {
        var end = decode.find(101);
        var number = decode.data.toString("ascii", decode.position + 1, end);
        decode.position += end + 1 - decode.position;
        return parseInt(number, 10);
      };
      decode.bytes = function () {
        var sep = decode.find(58);
        var length = parseInt(decode.data.toString("ascii", decode.position, sep), 10);
        var end = ++sep + length;
        decode.position = end;
        return decode.encoding ? decode.data.toString(decode.encoding, sep, end) : decode.data.slice(sep, end);
      };
      module.exports = decode;
    }
  });

  // node_modules/bencode/bencode.js
  var require_bencode = __commonJS({
    "node_modules/bencode/bencode.js"(exports, module) {
      module.exports = {
        encode: require_encode(),
        decode: require_decode()
      };
    }
  });

  // node_modules/simple-sha1/index.js
  var require_simple_sha1 = __commonJS({
    "node_modules/simple-sha1/index.js"(exports, module) {
      var crypto = __require("crypto");
      function sha1(buf, cb) {
        var hash = sha1sync(buf);
        process.nextTick(function () {
          cb(hash);
        });
      }
      function sha1sync(buf) {
        return crypto.createHash("sha1").update(buf).digest("hex");
      }
      module.exports = sha1;
      module.exports.sync = sha1sync;
    }
  });

  // node_modules/parse-torrent-file/index.js
  var require_parse_torrent_file = __commonJS({
    "node_modules/parse-torrent-file/index.js"(exports, module) {
      module.exports = decodeTorrentFile;
      module.exports.decode = decodeTorrentFile;
      module.exports.encode = encodeTorrentFile;
      var bencode = require_bencode();
      var path = __require("path");
      var sha1 = require_simple_sha1();
      function decodeTorrentFile(torrent) {
        if (Buffer.isBuffer(torrent)) {
          torrent = bencode.decode(torrent);
        }
        ensure(torrent.info, "info");
        ensure(torrent.info.name, "info.name");
        ensure(torrent.info["piece length"], "info['piece length']");
        ensure(torrent.info.pieces, "info.pieces");
        if (torrent.info.files) {
          torrent.info.files.forEach(function (file) {
            ensure(typeof file.length === "number", "info.files[0].length");
            ensure(file.path, "info.files[0].path");
          });
        } else {
          ensure(typeof torrent.info.length === "number", "info.length");
        }
        var result = {};
        result.info = torrent.info;
        result.infoBuffer = bencode.encode(torrent.info);
        result.infoHash = sha1.sync(result.infoBuffer);
        result.name = torrent.info.name.toString();
        result.private = !!torrent.info.private;
        if (torrent["creation date"]) result.created = new Date(torrent["creation date"] * 1e3);
        if (Buffer.isBuffer(torrent.comment)) result.comment = torrent.comment.toString();
        var announce = torrent["announce-list"];
        if (!announce) {
          if (torrent.announce) {
            announce = [[torrent.announce]];
          } else {
            announce = [];
          }
        }
        result.announceList = announce.map(function (urls) {
          return urls.map(function (url) {
            return url.toString();
          });
        });
        result.announce = [].concat.apply([], result.announceList);
        if (Buffer.isBuffer(torrent["url-list"])) {
          torrent["url-list"] = torrent["url-list"].length > 0 ? [torrent["url-list"]] : [];
        }
        result.urlList = (torrent["url-list"] || []).map(function (url) {
          return url.toString();
        });
        var files = torrent.info.files || [torrent.info];
        result.files = files.map(function (file, i) {
          var parts = [].concat(file.name || result.name, file.path || []).map(function (p) {
            return p.toString();
          });
          return {
            path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
            name: parts[parts.length - 1],
            length: file.length,
            offset: files.slice(0, i).reduce(sumLength, 0)
          };
        });
        result.length = files.reduce(sumLength, 0);
        var lastFile = result.files[result.files.length - 1];
        result.pieceLength = torrent.info["piece length"];
        result.lastPieceLength = (lastFile.offset + lastFile.length) % result.pieceLength || result.pieceLength;
        result.pieces = splitPieces(torrent.info.pieces);
        return result;
      }
      function encodeTorrentFile(parsed) {
        var torrent = {
          info: parsed.info
        };
        if (parsed.announce && parsed.announce[0]) {
          torrent.announce = parsed.announce[0];
        }
        if (parsed.announceList) {
          torrent["announce-list"] = parsed.announceList.map(function (urls) {
            return urls.map(function (url) {
              url = new Buffer(url, "utf8");
              if (!torrent.announce) {
                torrent.announce = url;
              }
              return url;
            });
          });
        }
        if (parsed.created) {
          torrent["creation date"] = parsed.created.getTime() / 1e3 | 0;
        }
        return bencode.encode(torrent);
      }
      function sumLength(sum, file) {
        return sum + file.length;
      }
      function splitPieces(buf) {
        var pieces = [];
        for (var i = 0; i < buf.length; i += 20) {
          pieces.push(buf.slice(i, i + 20).toString("hex"));
        }
        return pieces;
      }
      function ensure(bool, fieldName) {
        if (!bool) throw new Error("Torrent is missing required field: " + fieldName);
      }
    }
  });

  // node_modules/parse-torrent/index.js
  var require_parse_torrent = __commonJS({
    "node_modules/parse-torrent/index.js"(exports, module) {
      var magnet = require_magnet_uri();
      var parseTorrentFile = require_parse_torrent_file();
      module.exports = function parseTorrent(torrentId) {
        var len = torrentId && torrentId.length;
        if (typeof torrentId === "string" && /magnet:/.test(torrentId)) {
          return magnet(torrentId);
        } else if (typeof torrentId === "string" && (len === 40 || len === 32)) {
          return magnet("magnet:?xt=urn:btih:" + torrentId);
        } else if (Buffer.isBuffer(torrentId) && len === 20) {
          return magnet("magnet:?xt=urn:btih:" + torrentId.toString("hex"));
        } else if (Buffer.isBuffer(torrentId)) {
          return parseTorrentFile(torrentId);
        } else if (torrentId && torrentId.infoHash) {
          return torrentId;
        } else {
          throw new Error("Invalid torrent identifier");
        }
      };
      module.exports.toMagnetURI = magnet.encode;
      module.exports.toTorrentFile = parseTorrentFile.encode;
    }
  });

  // node_modules/mkdirp/index.js
  var require_mkdirp = __commonJS({
    "node_modules/mkdirp/index.js"(exports, module) {
      var path = __require("path");
      var fs = __require("fs");
      module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;
      function mkdirP(p, mode, f, made) {
        if (typeof mode === "function" || mode === void 0) {
          f = mode;
          mode = 511 & ~process.umask();
        }
        if (!made) made = null;
        var cb = f || function () {};
        if (typeof mode === "string") mode = parseInt(mode, 8);
        p = path.resolve(p);
        fs.mkdir(p, mode, function (er) {
          if (!er) {
            made = made || p;
            return cb(null, made);
          }
          switch (er.code) {
            case "ENOENT":
              mkdirP(path.dirname(p), mode, function (er2, made2) {
                if (er2) cb(er2, made2);else mkdirP(p, mode, cb, made2);
              });
              break;
            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
              fs.stat(p, function (er2, stat) {
                if (er2 || !stat.isDirectory()) cb(er, made);else cb(null, made);
              });
              break;
          }
        });
      }
      mkdirP.sync = function sync(p, mode, made) {
        if (mode === void 0) {
          mode = 511 & ~process.umask();
        }
        if (!made) made = null;
        if (typeof mode === "string") mode = parseInt(mode, 8);
        p = path.resolve(p);
        try {
          fs.mkdirSync(p, mode);
          made = made || p;
        } catch (err0) {
          switch (err0.code) {
            case "ENOENT":
              made = sync(path.dirname(p), mode, made);
              sync(p, mode, made);
              break;
            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
              var stat;
              try {
                stat = fs.statSync(p);
              } catch (err1) {
                throw err0;
              }
              if (!stat.isDirectory()) throw err0;
              break;
          }
        }
        return made;
      };
    }
  });

  // node_modules/end-of-stream/index.js
  var require_end_of_stream = __commonJS({
    "node_modules/end-of-stream/index.js"(exports, module) {
      var once = require_once();
      var noop = function noop() {};
      var isRequest = function isRequest(stream) {
        return stream.setHeader && typeof stream.abort === "function";
      };
      var _eos = function eos(stream, opts, callback) {
        if (typeof opts === "function") return _eos(stream, null, opts);
        if (!opts) opts = {};
        callback = once(callback || noop);
        var ws = stream._writableState;
        var rs = stream._readableState;
        var readable = opts.readable || opts.readable !== false && stream.readable;
        var writable = opts.writable || opts.writable !== false && stream.writable;
        var onlegacyfinish = function onlegacyfinish() {
          if (!stream.writable) onfinish();
        };
        var onfinish = function onfinish() {
          writable = false;
          if (!readable) callback();
        };
        var onend = function onend() {
          readable = false;
          if (!writable) callback();
        };
        var onclose = function onclose() {
          if (readable && !(rs && rs.ended)) return callback(new Error("premature close"));
          if (writable && !(ws && ws.ended)) return callback(new Error("premature close"));
        };
        var onrequest = function onrequest() {
          stream.req.on("finish", onfinish);
        };
        if (isRequest(stream)) {
          stream.on("complete", onfinish);
          stream.on("abort", onclose);
          if (stream.req) onrequest();else stream.on("request", onrequest);
        } else if (writable && !ws) {
          stream.on("end", onlegacyfinish);
          stream.on("close", onlegacyfinish);
        }
        stream.on("end", onend);
        stream.on("finish", onfinish);
        if (opts.error !== false) stream.on("error", callback);
        stream.on("close", onclose);
        return stream;
      };
      module.exports = _eos;
    }
  });

  // node_modules/torrent-piece/index.js
  var require_torrent_piece = __commonJS({
    "node_modules/torrent-piece/index.js"(exports, module) {
      module.exports = Piece;
      var BLOCK_LENGTH = 1 << 14;
      function Piece(length) {
        if (!(this instanceof Piece)) return new Piece(length);
        this.length = length;
        this.missing = length;
        this.sources = null;
        this._chunks = Math.ceil(length / BLOCK_LENGTH);
        this._remainder = length % BLOCK_LENGTH || BLOCK_LENGTH;
        this._buffered = 0;
        this._buffer = null;
        this._cancellations = null;
        this._reservations = 0;
        this._flushed = false;
      }
      Piece.BLOCK_LENGTH = BLOCK_LENGTH;
      Piece.prototype.chunkLength = function (i) {
        return i === this._chunks - 1 ? this._remainder : BLOCK_LENGTH;
      };
      Piece.prototype.chunkLengthRemaining = function (i) {
        return this.length - i * BLOCK_LENGTH;
      };
      Piece.prototype.chunkOffset = function (i) {
        return i * BLOCK_LENGTH;
      };
      Piece.prototype.reserve = function () {
        if (!this.init()) return -1;
        if (this._cancellations.length) return this._cancellations.pop();
        if (this._reservations < this._chunks) return this._reservations++;
        return -1;
      };
      Piece.prototype.reserveRemaining = function () {
        if (!this.init()) return -1;
        if (this._reservations < this._chunks) {
          var min = this._reservations;
          this._reservations = this._chunks;
          return min;
        }
        return -1;
      };
      Piece.prototype.cancel = function (i) {
        if (!this.init()) return;
        this._cancellations.push(i);
      };
      Piece.prototype.cancelRemaining = function (i) {
        if (!this.init()) return;
        this._reservations = i;
      };
      Piece.prototype.get = function (i) {
        if (!this.init()) return null;
        return this._buffer[i];
      };
      Piece.prototype.set = function (i, data, source) {
        if (!this.init()) return false;
        var len = data.length;
        var blocks = Math.ceil(len / BLOCK_LENGTH);
        for (var j = 0; j < blocks; j++) {
          if (!this._buffer[i + j]) {
            var offset = j * BLOCK_LENGTH;
            var splitData = data.slice(offset, offset + BLOCK_LENGTH);
            this._buffered++;
            this._buffer[i + j] = splitData;
            this.missing -= splitData.length;
            if (this.sources.indexOf(source) === -1) {
              this.sources.push(source);
            }
          }
        }
        return this._buffered === this._chunks;
      };
      Piece.prototype.flush = function () {
        if (!this._buffer || this._chunks !== this._buffered) return null;
        var buffer = Buffer.concat(this._buffer, this.length);
        this._buffer = null;
        this._cancellations = null;
        this.sources = null;
        this._flushed = true;
        return buffer;
      };
      Piece.prototype.init = function () {
        if (this._flushed) return false;
        if (this._buffer) return true;
        this._buffer = new Array(this._chunks);
        this._cancellations = [];
        this.sources = [];
        return true;
      };
    }
  });

  // node_modules/fs.realpath/old.js
  var require_old = __commonJS({
    "node_modules/fs.realpath/old.js"(exports) {
      var pathModule = __require("path");
      var isWindows = process.platform === "win32";
      var fs = __require("fs");
      var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);
      function rethrow() {
        var callback;
        if (DEBUG) {
          var backtrace = new Error();
          callback = debugCallback;
        } else callback = missingCallback;
        return callback;
        function debugCallback(err) {
          if (err) {
            backtrace.message = err.message;
            err = backtrace;
            missingCallback(err);
          }
        }
        function missingCallback(err) {
          if (err) {
            if (process.throwDeprecation) throw err;else if (!process.noDeprecation) {
              var msg = "fs: missing callback " + (err.stack || err.message);
              if (process.traceDeprecation) console.trace(msg);else console.error(msg);
            }
          }
        }
      }
      function maybeCallback(cb) {
        return typeof cb === "function" ? cb : rethrow();
      }
      var normalize = pathModule.normalize;
      if (isWindows) {
        nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
      } else {
        nextPartRe = /(.*?)(?:[\/]+|$)/g;
      }
      var nextPartRe;
      if (isWindows) {
        splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
      } else {
        splitRootRe = /^[\/]*/;
      }
      var splitRootRe;
      exports.realpathSync = function realpathSync(p, cache) {
        p = pathModule.resolve(p);
        if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
          return cache[p];
        }
        var original = p,
          seenLinks = {},
          knownHard = {};
        var pos;
        var current;
        var base;
        var previous;
        start();
        function start() {
          var m = splitRootRe.exec(p);
          pos = m[0].length;
          current = m[0];
          base = m[0];
          previous = "";
          if (isWindows && !knownHard[base]) {
            fs.lstatSync(base);
            knownHard[base] = true;
          }
        }
        while (pos < p.length) {
          nextPartRe.lastIndex = pos;
          var result = nextPartRe.exec(p);
          previous = current;
          current += result[0];
          base = previous + result[1];
          pos = nextPartRe.lastIndex;
          if (knownHard[base] || cache && cache[base] === base) {
            continue;
          }
          var resolvedLink;
          if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
            resolvedLink = cache[base];
          } else {
            var stat = fs.lstatSync(base);
            if (!stat.isSymbolicLink()) {
              knownHard[base] = true;
              if (cache) cache[base] = base;
              continue;
            }
            var linkTarget = null;
            if (!isWindows) {
              var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
              if (seenLinks.hasOwnProperty(id)) {
                linkTarget = seenLinks[id];
              }
            }
            if (linkTarget === null) {
              fs.statSync(base);
              linkTarget = fs.readlinkSync(base);
            }
            resolvedLink = pathModule.resolve(previous, linkTarget);
            if (cache) cache[base] = resolvedLink;
            if (!isWindows) seenLinks[id] = linkTarget;
          }
          p = pathModule.resolve(resolvedLink, p.slice(pos));
          start();
        }
        if (cache) cache[original] = p;
        return p;
      };
      exports.realpath = function realpath(p, cache, cb) {
        if (typeof cb !== "function") {
          cb = maybeCallback(cache);
          cache = null;
        }
        p = pathModule.resolve(p);
        if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
          return process.nextTick(cb.bind(null, null, cache[p]));
        }
        var original = p,
          seenLinks = {},
          knownHard = {};
        var pos;
        var current;
        var base;
        var previous;
        start();
        function start() {
          var m = splitRootRe.exec(p);
          pos = m[0].length;
          current = m[0];
          base = m[0];
          previous = "";
          if (isWindows && !knownHard[base]) {
            fs.lstat(base, function (err) {
              if (err) return cb(err);
              knownHard[base] = true;
              LOOP();
            });
          } else {
            process.nextTick(LOOP);
          }
        }
        function LOOP() {
          if (pos >= p.length) {
            if (cache) cache[original] = p;
            return cb(null, p);
          }
          nextPartRe.lastIndex = pos;
          var result = nextPartRe.exec(p);
          previous = current;
          current += result[0];
          base = previous + result[1];
          pos = nextPartRe.lastIndex;
          if (knownHard[base] || cache && cache[base] === base) {
            return process.nextTick(LOOP);
          }
          if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
            return gotResolvedLink(cache[base]);
          }
          return fs.lstat(base, gotStat);
        }
        function gotStat(err, stat) {
          if (err) return cb(err);
          if (!stat.isSymbolicLink()) {
            knownHard[base] = true;
            if (cache) cache[base] = base;
            return process.nextTick(LOOP);
          }
          if (!isWindows) {
            var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
            if (seenLinks.hasOwnProperty(id)) {
              return gotTarget(null, seenLinks[id], base);
            }
          }
          fs.stat(base, function (err2) {
            if (err2) return cb(err2);
            fs.readlink(base, function (err3, target) {
              if (!isWindows) seenLinks[id] = target;
              gotTarget(err3, target);
            });
          });
        }
        function gotTarget(err, target, base2) {
          if (err) return cb(err);
          var resolvedLink = pathModule.resolve(previous, target);
          if (cache) cache[base2] = resolvedLink;
          gotResolvedLink(resolvedLink);
        }
        function gotResolvedLink(resolvedLink) {
          p = pathModule.resolve(resolvedLink, p.slice(pos));
          start();
        }
      };
    }
  });

  // node_modules/fs.realpath/index.js
  var require_fs = __commonJS({
    "node_modules/fs.realpath/index.js"(exports, module) {
      module.exports = realpath;
      realpath.realpath = realpath;
      realpath.sync = realpathSync;
      realpath.realpathSync = realpathSync;
      realpath.monkeypatch = monkeypatch;
      realpath.unmonkeypatch = unmonkeypatch;
      var fs = __require("fs");
      var origRealpath = fs.realpath;
      var origRealpathSync = fs.realpathSync;
      var version = process.version;
      var ok = /^v[0-5]\./.test(version);
      var old = require_old();
      function newError(er) {
        return er && er.syscall === "realpath" && (er.code === "ELOOP" || er.code === "ENOMEM" || er.code === "ENAMETOOLONG");
      }
      function realpath(p, cache, cb) {
        if (ok) {
          return origRealpath(p, cache, cb);
        }
        if (typeof cache === "function") {
          cb = cache;
          cache = null;
        }
        origRealpath(p, cache, function (er, result) {
          if (newError(er)) {
            old.realpath(p, cache, cb);
          } else {
            cb(er, result);
          }
        });
      }
      function realpathSync(p, cache) {
        if (ok) {
          return origRealpathSync(p, cache);
        }
        try {
          return origRealpathSync(p, cache);
        } catch (er) {
          if (newError(er)) {
            return old.realpathSync(p, cache);
          } else {
            throw er;
          }
        }
      }
      function monkeypatch() {
        fs.realpath = realpath;
        fs.realpathSync = realpathSync;
      }
      function unmonkeypatch() {
        fs.realpath = origRealpath;
        fs.realpathSync = origRealpathSync;
      }
    }
  });

  // node_modules/concat-map/index.js
  var require_concat_map = __commonJS({
    "node_modules/concat-map/index.js"(exports, module) {
      module.exports = function (xs, fn) {
        var res = [];
        for (var i = 0; i < xs.length; i++) {
          var x = fn(xs[i], i);
          if (isArray(x)) res.push.apply(res, x);else res.push(x);
        }
        return res;
      };
      var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === "[object Array]";
      };
    }
  });

  // node_modules/balanced-match/index.js
  var require_balanced_match = __commonJS({
    "node_modules/balanced-match/index.js"(exports, module) {
      module.exports = balanced;
      function balanced(a, b, str) {
        if (a instanceof RegExp) a = maybeMatch(a, str);
        if (b instanceof RegExp) b = maybeMatch(b, str);
        var r = range(a, b, str);
        return r && {
          start: r[0],
          end: r[1],
          pre: str.slice(0, r[0]),
          body: str.slice(r[0] + a.length, r[1]),
          post: str.slice(r[1] + b.length)
        };
      }
      function maybeMatch(reg, str) {
        var m = str.match(reg);
        return m ? m[0] : null;
      }
      balanced.range = range;
      function range(a, b, str) {
        var begs, beg, left, right, result;
        var ai = str.indexOf(a);
        var bi = str.indexOf(b, ai + 1);
        var i = ai;
        if (ai >= 0 && bi > 0) {
          begs = [];
          left = str.length;
          while (i >= 0 && !result) {
            if (i == ai) {
              begs.push(i);
              ai = str.indexOf(a, i + 1);
            } else if (begs.length == 1) {
              result = [begs.pop(), bi];
            } else {
              beg = begs.pop();
              if (beg < left) {
                left = beg;
                right = bi;
              }
              bi = str.indexOf(b, i + 1);
            }
            i = ai < bi && ai >= 0 ? ai : bi;
          }
          if (begs.length) {
            result = [left, right];
          }
        }
        return result;
      }
    }
  });

  // node_modules/brace-expansion/index.js
  var require_brace_expansion = __commonJS({
    "node_modules/brace-expansion/index.js"(exports, module) {
      var concatMap = require_concat_map();
      var balanced = require_balanced_match();
      module.exports = expandTop;
      var escSlash = "\0SLASH" + Math.random() + "\0";
      var escOpen = "\0OPEN" + Math.random() + "\0";
      var escClose = "\0CLOSE" + Math.random() + "\0";
      var escComma = "\0COMMA" + Math.random() + "\0";
      var escPeriod = "\0PERIOD" + Math.random() + "\0";
      function numeric(str) {
        return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
      }
      function escapeBraces(str) {
        return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
      }
      function unescapeBraces(str) {
        return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
      }
      function parseCommaParts(str) {
        if (!str) return [""];
        var parts = [];
        var m = balanced("{", "}", str);
        if (!m) return str.split(",");
        var pre = m.pre;
        var body = m.body;
        var post = m.post;
        var p = pre.split(",");
        p[p.length - 1] += "{" + body + "}";
        var postParts = parseCommaParts(post);
        if (post.length) {
          p[p.length - 1] += postParts.shift();
          p.push.apply(p, postParts);
        }
        parts.push.apply(parts, p);
        return parts;
      }
      function expandTop(str) {
        if (!str) return [];
        if (str.substr(0, 2) === "{}") {
          str = "\\{\\}" + str.substr(2);
        }
        return expand(escapeBraces(str), true).map(unescapeBraces);
      }
      function embrace(str) {
        return "{" + str + "}";
      }
      function isPadded(el) {
        return /^-?0\d/.test(el);
      }
      function lte(i, y) {
        return i <= y;
      }
      function gte(i, y) {
        return i >= y;
      }
      function expand(str, isTop) {
        var expansions = [];
        var m = balanced("{", "}", str);
        if (!m || /\$$/.test(m.pre)) return [str];
        var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        var isSequence = isNumericSequence || isAlphaSequence;
        var isOptions = /^(.*,)+(.+)?$/.test(m.body);
        if (!isSequence && !isOptions) {
          if (m.post.match(/,.*\}/)) {
            str = m.pre + "{" + m.body + escClose + m.post;
            return expand(str);
          }
          return [str];
        }
        var n;
        if (isSequence) {
          n = m.body.split(/\.\./);
        } else {
          n = parseCommaParts(m.body);
          if (n.length === 1) {
            n = expand(n[0], false).map(embrace);
            if (n.length === 1) {
              var post = m.post.length ? expand(m.post, false) : [""];
              return post.map(function (p) {
                return m.pre + n[0] + p;
              });
            }
          }
        }
        var pre = m.pre;
        var post = m.post.length ? expand(m.post, false) : [""];
        var N;
        if (isSequence) {
          var x = numeric(n[0]);
          var y = numeric(n[1]);
          var width = Math.max(n[0].length, n[1].length);
          var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
          var test = lte;
          var reverse = y < x;
          if (reverse) {
            incr *= -1;
            test = gte;
          }
          var pad = n.some(isPadded);
          N = [];
          for (var i = x; test(i, y); i += incr) {
            var c;
            if (isAlphaSequence) {
              c = String.fromCharCode(i);
              if (c === "\\") c = "";
            } else {
              c = String(i);
              if (pad) {
                var need = width - c.length;
                if (need > 0) {
                  var z = new Array(need + 1).join("0");
                  if (i < 0) c = "-" + z + c.slice(1);else c = z + c;
                }
              }
            }
            N.push(c);
          }
        } else {
          N = concatMap(n, function (el) {
            return expand(el, false);
          });
        }
        for (var j = 0; j < N.length; j++) {
          for (var k = 0; k < post.length; k++) {
            var expansion = pre + N[j] + post[k];
            if (!isTop || isSequence || expansion) expansions.push(expansion);
          }
        }
        return expansions;
      }
    }
  });

  // node_modules/minimatch/minimatch.js
  var require_minimatch = __commonJS({
    "node_modules/minimatch/minimatch.js"(exports, module) {
      module.exports = minimatch;
      minimatch.Minimatch = Minimatch;
      var path = {
        sep: "/"
      };
      try {
        path = __require("path");
      } catch (er) {}
      var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};
      var expand = require_brace_expansion();
      var plTypes = {
        "!": {
          open: "(?:(?!(?:",
          close: "))[^/]*?)"
        },
        "?": {
          open: "(?:",
          close: ")?"
        },
        "+": {
          open: "(?:",
          close: ")+"
        },
        "*": {
          open: "(?:",
          close: ")*"
        },
        "@": {
          open: "(?:",
          close: ")"
        }
      };
      var qmark = "[^/]";
      var star = qmark + "*?";
      var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
      var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
      var reSpecials = charSet("().*{}+?[]^$\\!");
      function charSet(s) {
        return s.split("").reduce(function (set, c) {
          set[c] = true;
          return set;
        }, {});
      }
      var slashSplit = /\/+/;
      minimatch.filter = filter;
      function filter(pattern, options) {
        options = options || {};
        return function (p, i, list) {
          return minimatch(p, pattern, options);
        };
      }
      function ext(a, b) {
        a = a || {};
        b = b || {};
        var t = {};
        Object.keys(b).forEach(function (k) {
          t[k] = b[k];
        });
        Object.keys(a).forEach(function (k) {
          t[k] = a[k];
        });
        return t;
      }
      minimatch.defaults = function (def) {
        if (!def || !Object.keys(def).length) return minimatch;
        var orig = minimatch;
        var m = function minimatch2(p, pattern, options) {
          return orig.minimatch(p, pattern, ext(def, options));
        };
        m.Minimatch = function Minimatch2(pattern, options) {
          return new orig.Minimatch(pattern, ext(def, options));
        };
        return m;
      };
      Minimatch.defaults = function (def) {
        if (!def || !Object.keys(def).length) return Minimatch;
        return minimatch.defaults(def).Minimatch;
      };
      function minimatch(p, pattern, options) {
        if (typeof pattern !== "string") {
          throw new TypeError("glob pattern string required");
        }
        if (!options) options = {};
        if (!options.nocomment && pattern.charAt(0) === "#") {
          return false;
        }
        if (pattern.trim() === "") return p === "";
        return new Minimatch(pattern, options).match(p);
      }
      function Minimatch(pattern, options) {
        if (!(this instanceof Minimatch)) {
          return new Minimatch(pattern, options);
        }
        if (typeof pattern !== "string") {
          throw new TypeError("glob pattern string required");
        }
        if (!options) options = {};
        pattern = pattern.trim();
        if (path.sep !== "/") {
          pattern = pattern.split(path.sep).join("/");
        }
        this.options = options;
        this.set = [];
        this.pattern = pattern;
        this.regexp = null;
        this.negate = false;
        this.comment = false;
        this.empty = false;
        this.make();
      }
      Minimatch.prototype.debug = function () {};
      Minimatch.prototype.make = make;
      function make() {
        if (this._made) return;
        var pattern = this.pattern;
        var options = this.options;
        if (!options.nocomment && pattern.charAt(0) === "#") {
          this.comment = true;
          return;
        }
        if (!pattern) {
          this.empty = true;
          return;
        }
        this.parseNegate();
        var set = this.globSet = this.braceExpand();
        if (options.debug) this.debug = console.error;
        this.debug(this.pattern, set);
        set = this.globParts = set.map(function (s) {
          return s.split(slashSplit);
        });
        this.debug(this.pattern, set);
        set = set.map(function (s, si, set2) {
          return s.map(this.parse, this);
        }, this);
        this.debug(this.pattern, set);
        set = set.filter(function (s) {
          return s.indexOf(false) === -1;
        });
        this.debug(this.pattern, set);
        this.set = set;
      }
      Minimatch.prototype.parseNegate = parseNegate;
      function parseNegate() {
        var pattern = this.pattern;
        var negate = false;
        var options = this.options;
        var negateOffset = 0;
        if (options.nonegate) return;
        for (var i = 0, l = pattern.length; i < l && pattern.charAt(i) === "!"; i++) {
          negate = !negate;
          negateOffset++;
        }
        if (negateOffset) this.pattern = pattern.substr(negateOffset);
        this.negate = negate;
      }
      minimatch.braceExpand = function (pattern, options) {
        return braceExpand(pattern, options);
      };
      Minimatch.prototype.braceExpand = braceExpand;
      function braceExpand(pattern, options) {
        if (!options) {
          if (this instanceof Minimatch) {
            options = this.options;
          } else {
            options = {};
          }
        }
        pattern = typeof pattern === "undefined" ? this.pattern : pattern;
        if (typeof pattern === "undefined") {
          throw new TypeError("undefined pattern");
        }
        if (options.nobrace || !pattern.match(/\{.*\}/)) {
          return [pattern];
        }
        return expand(pattern);
      }
      Minimatch.prototype.parse = parse;
      var SUBPARSE = {};
      function parse(pattern, isSub) {
        if (pattern.length > 1024 * 64) {
          throw new TypeError("pattern is too long");
        }
        var options = this.options;
        if (!options.noglobstar && pattern === "**") return GLOBSTAR;
        if (pattern === "") return "";
        var re = "";
        var hasMagic = !!options.nocase;
        var escaping = false;
        var patternListStack = [];
        var negativeLists = [];
        var stateChar;
        var inClass = false;
        var reClassStart = -1;
        var classStart = -1;
        var patternStart = pattern.charAt(0) === "." ? "" : options.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
        var self = this;
        function clearStateChar() {
          if (stateChar) {
            switch (stateChar) {
              case "*":
                re += star;
                hasMagic = true;
                break;
              case "?":
                re += qmark;
                hasMagic = true;
                break;
              default:
                re += "\\" + stateChar;
                break;
            }
            self.debug("clearStateChar %j %j", stateChar, re);
            stateChar = false;
          }
        }
        for (var i = 0, len = pattern.length, c; i < len && (c = pattern.charAt(i)); i++) {
          this.debug("%s	%s %s %j", pattern, i, re, c);
          if (escaping && reSpecials[c]) {
            re += "\\" + c;
            escaping = false;
            continue;
          }
          switch (c) {
            case "/":
              return false;
            case "\\":
              clearStateChar();
              escaping = true;
              continue;
            // the various stateChar values
            // for the "extglob" stuff.
            case "?":
            case "*":
            case "+":
            case "@":
            case "!":
              this.debug("%s	%s %s %j <-- stateChar", pattern, i, re, c);
              if (inClass) {
                this.debug("  in class");
                if (c === "!" && i === classStart + 1) c = "^";
                re += c;
                continue;
              }
              self.debug("call clearStateChar %j", stateChar);
              clearStateChar();
              stateChar = c;
              if (options.noext) clearStateChar();
              continue;
            case "(":
              if (inClass) {
                re += "(";
                continue;
              }
              if (!stateChar) {
                re += "\\(";
                continue;
              }
              patternListStack.push({
                type: stateChar,
                start: i - 1,
                reStart: re.length,
                open: plTypes[stateChar].open,
                close: plTypes[stateChar].close
              });
              re += stateChar === "!" ? "(?:(?!(?:" : "(?:";
              this.debug("plType %j %j", stateChar, re);
              stateChar = false;
              continue;
            case ")":
              if (inClass || !patternListStack.length) {
                re += "\\)";
                continue;
              }
              clearStateChar();
              hasMagic = true;
              var pl = patternListStack.pop();
              re += pl.close;
              if (pl.type === "!") {
                negativeLists.push(pl);
              }
              pl.reEnd = re.length;
              continue;
            case "|":
              if (inClass || !patternListStack.length || escaping) {
                re += "\\|";
                escaping = false;
                continue;
              }
              clearStateChar();
              re += "|";
              continue;
            // these are mostly the same in regexp and glob
            case "[":
              clearStateChar();
              if (inClass) {
                re += "\\" + c;
                continue;
              }
              inClass = true;
              classStart = i;
              reClassStart = re.length;
              re += c;
              continue;
            case "]":
              if (i === classStart + 1 || !inClass) {
                re += "\\" + c;
                escaping = false;
                continue;
              }
              if (inClass) {
                var cs = pattern.substring(classStart + 1, i);
                try {
                  RegExp("[" + cs + "]");
                } catch (er) {
                  var sp = this.parse(cs, SUBPARSE);
                  re = re.substr(0, reClassStart) + "\\[" + sp[0] + "\\]";
                  hasMagic = hasMagic || sp[1];
                  inClass = false;
                  continue;
                }
              }
              hasMagic = true;
              inClass = false;
              re += c;
              continue;
            default:
              clearStateChar();
              if (escaping) {
                escaping = false;
              } else if (reSpecials[c] && !(c === "^" && inClass)) {
                re += "\\";
              }
              re += c;
          }
        }
        if (inClass) {
          cs = pattern.substr(classStart + 1);
          sp = this.parse(cs, SUBPARSE);
          re = re.substr(0, reClassStart) + "\\[" + sp[0];
          hasMagic = hasMagic || sp[1];
        }
        for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
          var tail = re.slice(pl.reStart + pl.open.length);
          this.debug("setting tail", re, pl);
          tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
            if (!$2) {
              $2 = "\\";
            }
            return $1 + $1 + $2 + "|";
          });
          this.debug("tail=%j\n   %s", tail, tail, pl, re);
          var t = pl.type === "*" ? star : pl.type === "?" ? qmark : "\\" + pl.type;
          hasMagic = true;
          re = re.slice(0, pl.reStart) + t + "\\(" + tail;
        }
        clearStateChar();
        if (escaping) {
          re += "\\\\";
        }
        var addPatternStart = false;
        switch (re.charAt(0)) {
          case ".":
          case "[":
          case "(":
            addPatternStart = true;
        }
        for (var n = negativeLists.length - 1; n > -1; n--) {
          var nl = negativeLists[n];
          var nlBefore = re.slice(0, nl.reStart);
          var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
          var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
          var nlAfter = re.slice(nl.reEnd);
          nlLast += nlAfter;
          var openParensBefore = nlBefore.split("(").length - 1;
          var cleanAfter = nlAfter;
          for (i = 0; i < openParensBefore; i++) {
            cleanAfter = cleanAfter.replace(/\)[+*?]?/, "");
          }
          nlAfter = cleanAfter;
          var dollar = "";
          if (nlAfter === "" && isSub !== SUBPARSE) {
            dollar = "$";
          }
          var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
          re = newRe;
        }
        if (re !== "" && hasMagic) {
          re = "(?=.)" + re;
        }
        if (addPatternStart) {
          re = patternStart + re;
        }
        if (isSub === SUBPARSE) {
          return [re, hasMagic];
        }
        if (!hasMagic) {
          return globUnescape(pattern);
        }
        var flags = options.nocase ? "i" : "";
        try {
          var regExp = new RegExp("^" + re + "$", flags);
        } catch (er) {
          return new RegExp("$.");
        }
        regExp._glob = pattern;
        regExp._src = re;
        return regExp;
      }
      minimatch.makeRe = function (pattern, options) {
        return new Minimatch(pattern, options || {}).makeRe();
      };
      Minimatch.prototype.makeRe = makeRe;
      function makeRe() {
        if (this.regexp || this.regexp === false) return this.regexp;
        var set = this.set;
        if (!set.length) {
          this.regexp = false;
          return this.regexp;
        }
        var options = this.options;
        var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
        var flags = options.nocase ? "i" : "";
        var re = set.map(function (pattern) {
          return pattern.map(function (p) {
            return p === GLOBSTAR ? twoStar : typeof p === "string" ? regExpEscape(p) : p._src;
          }).join("\\/");
        }).join("|");
        re = "^(?:" + re + ")$";
        if (this.negate) re = "^(?!" + re + ").*$";
        try {
          this.regexp = new RegExp(re, flags);
        } catch (ex) {
          this.regexp = false;
        }
        return this.regexp;
      }
      minimatch.match = function (list, pattern, options) {
        options = options || {};
        var mm = new Minimatch(pattern, options);
        list = list.filter(function (f) {
          return mm.match(f);
        });
        if (mm.options.nonull && !list.length) {
          list.push(pattern);
        }
        return list;
      };
      Minimatch.prototype.match = match;
      function match(f, partial) {
        this.debug("match", f, this.pattern);
        if (this.comment) return false;
        if (this.empty) return f === "";
        if (f === "/" && partial) return true;
        var options = this.options;
        if (path.sep !== "/") {
          f = f.split(path.sep).join("/");
        }
        f = f.split(slashSplit);
        this.debug(this.pattern, "split", f);
        var set = this.set;
        this.debug(this.pattern, "set", set);
        var filename;
        var i;
        for (i = f.length - 1; i >= 0; i--) {
          filename = f[i];
          if (filename) break;
        }
        for (i = 0; i < set.length; i++) {
          var pattern = set[i];
          var file = f;
          if (options.matchBase && pattern.length === 1) {
            file = [filename];
          }
          var hit = this.matchOne(file, pattern, partial);
          if (hit) {
            if (options.flipNegate) return true;
            return !this.negate;
          }
        }
        if (options.flipNegate) return false;
        return this.negate;
      }
      Minimatch.prototype.matchOne = function (file, pattern, partial) {
        var options = this.options;
        this.debug("matchOne", {
          "this": this,
          file,
          pattern
        });
        this.debug("matchOne", file.length, pattern.length);
        for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
          this.debug("matchOne loop");
          var p = pattern[pi];
          var f = file[fi];
          this.debug(pattern, p, f);
          if (p === false) return false;
          if (p === GLOBSTAR) {
            this.debug("GLOBSTAR", [pattern, p, f]);
            var fr = fi;
            var pr = pi + 1;
            if (pr === pl) {
              this.debug("** at the end");
              for (; fi < fl; fi++) {
                if (file[fi] === "." || file[fi] === ".." || !options.dot && file[fi].charAt(0) === ".") return false;
              }
              return true;
            }
            while (fr < fl) {
              var swallowee = file[fr];
              this.debug("\nglobstar while", file, fr, pattern, pr, swallowee);
              if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
                this.debug("globstar found match!", fr, fl, swallowee);
                return true;
              } else {
                if (swallowee === "." || swallowee === ".." || !options.dot && swallowee.charAt(0) === ".") {
                  this.debug("dot detected!", file, fr, pattern, pr);
                  break;
                }
                this.debug("globstar swallow a segment, and continue");
                fr++;
              }
            }
            if (partial) {
              this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
              if (fr === fl) return true;
            }
            return false;
          }
          var hit;
          if (typeof p === "string") {
            if (options.nocase) {
              hit = f.toLowerCase() === p.toLowerCase();
            } else {
              hit = f === p;
            }
            this.debug("string match", p, f, hit);
          } else {
            hit = f.match(p);
            this.debug("pattern match", p, f, hit);
          }
          if (!hit) return false;
        }
        if (fi === fl && pi === pl) {
          return true;
        } else if (fi === fl) {
          return partial;
        } else if (pi === pl) {
          var emptyFileEnd = fi === fl - 1 && file[fi] === "";
          return emptyFileEnd;
        }
        throw new Error("wtf?");
      };
      function globUnescape(s) {
        return s.replace(/\\(.)/g, "$1");
      }
      function regExpEscape(s) {
        return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      }
    }
  });

  // node_modules/path-is-absolute/index.js
  var require_path_is_absolute = __commonJS({
    "node_modules/path-is-absolute/index.js"(exports, module) {
      "use strict";

      function posix(path) {
        return path.charAt(0) === "/";
      }
      function win32(path) {
        var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
        var result = splitDeviceRe.exec(path);
        var device = result[1] || "";
        var isUnc = Boolean(device && device.charAt(1) !== ":");
        return Boolean(result[2] || isUnc);
      }
      module.exports = process.platform === "win32" ? win32 : posix;
      module.exports.posix = posix;
      module.exports.win32 = win32;
    }
  });

  // node_modules/glob/common.js
  var require_common = __commonJS({
    "node_modules/glob/common.js"(exports) {
      exports.alphasort = alphasort;
      exports.alphasorti = alphasorti;
      exports.setopts = setopts;
      exports.ownProp = ownProp;
      exports.makeAbs = makeAbs;
      exports.finish = finish;
      exports.mark = mark;
      exports.isIgnored = isIgnored;
      exports.childrenIgnored = childrenIgnored;
      function ownProp(obj, field) {
        return Object.prototype.hasOwnProperty.call(obj, field);
      }
      var path = __require("path");
      var minimatch = require_minimatch();
      var isAbsolute = require_path_is_absolute();
      var Minimatch = minimatch.Minimatch;
      function alphasorti(a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }
      function alphasort(a, b) {
        return a.localeCompare(b);
      }
      function setupIgnores(self, options) {
        self.ignore = options.ignore || [];
        if (!Array.isArray(self.ignore)) self.ignore = [self.ignore];
        if (self.ignore.length) {
          self.ignore = self.ignore.map(ignoreMap);
        }
      }
      function ignoreMap(pattern) {
        var gmatcher = null;
        if (pattern.slice(-3) === "/**") {
          var gpattern = pattern.replace(/(\/\*\*)+$/, "");
          gmatcher = new Minimatch(gpattern, {
            dot: true
          });
        }
        return {
          matcher: new Minimatch(pattern, {
            dot: true
          }),
          gmatcher
        };
      }
      function setopts(self, pattern, options) {
        if (!options) options = {};
        if (options.matchBase && -1 === pattern.indexOf("/")) {
          if (options.noglobstar) {
            throw new Error("base matching requires globstar");
          }
          pattern = "**/" + pattern;
        }
        self.silent = !!options.silent;
        self.pattern = pattern;
        self.strict = options.strict !== false;
        self.realpath = !!options.realpath;
        self.realpathCache = options.realpathCache || /* @__PURE__ */Object.create(null);
        self.follow = !!options.follow;
        self.dot = !!options.dot;
        self.mark = !!options.mark;
        self.nodir = !!options.nodir;
        if (self.nodir) self.mark = true;
        self.sync = !!options.sync;
        self.nounique = !!options.nounique;
        self.nonull = !!options.nonull;
        self.nosort = !!options.nosort;
        self.nocase = !!options.nocase;
        self.stat = !!options.stat;
        self.noprocess = !!options.noprocess;
        self.absolute = !!options.absolute;
        self.maxLength = options.maxLength || Infinity;
        self.cache = options.cache || /* @__PURE__ */Object.create(null);
        self.statCache = options.statCache || /* @__PURE__ */Object.create(null);
        self.symlinks = options.symlinks || /* @__PURE__ */Object.create(null);
        setupIgnores(self, options);
        self.changedCwd = false;
        var cwd = process.cwd();
        if (!ownProp(options, "cwd")) self.cwd = cwd;else {
          self.cwd = path.resolve(options.cwd);
          self.changedCwd = self.cwd !== cwd;
        }
        self.root = options.root || path.resolve(self.cwd, "/");
        self.root = path.resolve(self.root);
        if (process.platform === "win32") self.root = self.root.replace(/\\/g, "/");
        self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
        if (process.platform === "win32") self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
        self.nomount = !!options.nomount;
        options.nonegate = true;
        options.nocomment = true;
        self.minimatch = new Minimatch(pattern, options);
        self.options = self.minimatch.options;
      }
      function finish(self) {
        var nou = self.nounique;
        var all = nou ? [] : /* @__PURE__ */Object.create(null);
        for (var i = 0, l = self.matches.length; i < l; i++) {
          var matches = self.matches[i];
          if (!matches || Object.keys(matches).length === 0) {
            if (self.nonull) {
              var literal = self.minimatch.globSet[i];
              if (nou) all.push(literal);else all[literal] = true;
            }
          } else {
            var m = Object.keys(matches);
            if (nou) all.push.apply(all, m);else m.forEach(function (m2) {
              all[m2] = true;
            });
          }
        }
        if (!nou) all = Object.keys(all);
        if (!self.nosort) all = all.sort(self.nocase ? alphasorti : alphasort);
        if (self.mark) {
          for (var i = 0; i < all.length; i++) {
            all[i] = self._mark(all[i]);
          }
          if (self.nodir) {
            all = all.filter(function (e) {
              var notDir = !/\/$/.test(e);
              var c = self.cache[e] || self.cache[makeAbs(self, e)];
              if (notDir && c) notDir = c !== "DIR" && !Array.isArray(c);
              return notDir;
            });
          }
        }
        if (self.ignore.length) all = all.filter(function (m2) {
          return !isIgnored(self, m2);
        });
        self.found = all;
      }
      function mark(self, p) {
        var abs = makeAbs(self, p);
        var c = self.cache[abs];
        var m = p;
        if (c) {
          var isDir = c === "DIR" || Array.isArray(c);
          var slash = p.slice(-1) === "/";
          if (isDir && !slash) m += "/";else if (!isDir && slash) m = m.slice(0, -1);
          if (m !== p) {
            var mabs = makeAbs(self, m);
            self.statCache[mabs] = self.statCache[abs];
            self.cache[mabs] = self.cache[abs];
          }
        }
        return m;
      }
      function makeAbs(self, f) {
        var abs = f;
        if (f.charAt(0) === "/") {
          abs = path.join(self.root, f);
        } else if (isAbsolute(f) || f === "") {
          abs = f;
        } else if (self.changedCwd) {
          abs = path.resolve(self.cwd, f);
        } else {
          abs = path.resolve(f);
        }
        if (process.platform === "win32") abs = abs.replace(/\\/g, "/");
        return abs;
      }
      function isIgnored(self, path2) {
        if (!self.ignore.length) return false;
        return self.ignore.some(function (item) {
          return item.matcher.match(path2) || !!(item.gmatcher && item.gmatcher.match(path2));
        });
      }
      function childrenIgnored(self, path2) {
        if (!self.ignore.length) return false;
        return self.ignore.some(function (item) {
          return !!(item.gmatcher && item.gmatcher.match(path2));
        });
      }
    }
  });

  // node_modules/glob/sync.js
  var require_sync = __commonJS({
    "node_modules/glob/sync.js"(exports, module) {
      module.exports = globSync;
      globSync.GlobSync = GlobSync;
      var fs = __require("fs");
      var rp = require_fs();
      var minimatch = require_minimatch();
      var Minimatch = minimatch.Minimatch;
      var Glob = require_glob().Glob;
      var util = __require("util");
      var path = __require("path");
      var assert = __require("assert");
      var isAbsolute = require_path_is_absolute();
      var common = require_common();
      var alphasort = common.alphasort;
      var alphasorti = common.alphasorti;
      var setopts = common.setopts;
      var ownProp = common.ownProp;
      var childrenIgnored = common.childrenIgnored;
      var isIgnored = common.isIgnored;
      function globSync(pattern, options) {
        if (typeof options === "function" || arguments.length === 3) throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
        return new GlobSync(pattern, options).found;
      }
      function GlobSync(pattern, options) {
        if (!pattern) throw new Error("must provide pattern");
        if (typeof options === "function" || arguments.length === 3) throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
        if (!(this instanceof GlobSync)) return new GlobSync(pattern, options);
        setopts(this, pattern, options);
        if (this.noprocess) return this;
        var n = this.minimatch.set.length;
        this.matches = new Array(n);
        for (var i = 0; i < n; i++) {
          this._process(this.minimatch.set[i], i, false);
        }
        this._finish();
      }
      GlobSync.prototype._finish = function () {
        assert(this instanceof GlobSync);
        if (this.realpath) {
          var self = this;
          this.matches.forEach(function (matchset, index) {
            var set = self.matches[index] = /* @__PURE__ */Object.create(null);
            for (var p in matchset) {
              try {
                p = self._makeAbs(p);
                var real = rp.realpathSync(p, self.realpathCache);
                set[real] = true;
              } catch (er) {
                if (er.syscall === "stat") set[self._makeAbs(p)] = true;else throw er;
              }
            }
          });
        }
        common.finish(this);
      };
      GlobSync.prototype._process = function (pattern, index, inGlobStar) {
        assert(this instanceof GlobSync);
        var n = 0;
        while (typeof pattern[n] === "string") {
          n++;
        }
        var prefix;
        switch (n) {
          // if not, then this is rather simple
          case pattern.length:
            this._processSimple(pattern.join("/"), index);
            return;
          case 0:
            prefix = null;
            break;
          default:
            prefix = pattern.slice(0, n).join("/");
            break;
        }
        var remain = pattern.slice(n);
        var read;
        if (prefix === null) read = ".";else if (isAbsolute(prefix) || isAbsolute(pattern.join("/"))) {
          if (!prefix || !isAbsolute(prefix)) prefix = "/" + prefix;
          read = prefix;
        } else read = prefix;
        var abs = this._makeAbs(read);
        if (childrenIgnored(this, read)) return;
        var isGlobStar = remain[0] === minimatch.GLOBSTAR;
        if (isGlobStar) this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);else this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
      };
      GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
        var entries = this._readdir(abs, inGlobStar);
        if (!entries) return;
        var pn = remain[0];
        var negate = !!this.minimatch.negate;
        var rawGlob = pn._glob;
        var dotOk = this.dot || rawGlob.charAt(0) === ".";
        var matchedEntries = [];
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.charAt(0) !== "." || dotOk) {
            var m;
            if (negate && !prefix) {
              m = !e.match(pn);
            } else {
              m = e.match(pn);
            }
            if (m) matchedEntries.push(e);
          }
        }
        var len = matchedEntries.length;
        if (len === 0) return;
        if (remain.length === 1 && !this.mark && !this.stat) {
          if (!this.matches[index]) this.matches[index] = /* @__PURE__ */Object.create(null);
          for (var i = 0; i < len; i++) {
            var e = matchedEntries[i];
            if (prefix) {
              if (prefix.slice(-1) !== "/") e = prefix + "/" + e;else e = prefix + e;
            }
            if (e.charAt(0) === "/" && !this.nomount) {
              e = path.join(this.root, e);
            }
            this._emitMatch(index, e);
          }
          return;
        }
        remain.shift();
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          var newPattern;
          if (prefix) newPattern = [prefix, e];else newPattern = [e];
          this._process(newPattern.concat(remain), index, inGlobStar);
        }
      };
      GlobSync.prototype._emitMatch = function (index, e) {
        if (isIgnored(this, e)) return;
        var abs = this._makeAbs(e);
        if (this.mark) e = this._mark(e);
        if (this.absolute) {
          e = abs;
        }
        if (this.matches[index][e]) return;
        if (this.nodir) {
          var c = this.cache[abs];
          if (c === "DIR" || Array.isArray(c)) return;
        }
        this.matches[index][e] = true;
        if (this.stat) this._stat(e);
      };
      GlobSync.prototype._readdirInGlobStar = function (abs) {
        if (this.follow) return this._readdir(abs, false);
        var entries;
        var lstat;
        var stat;
        try {
          lstat = fs.lstatSync(abs);
        } catch (er) {
          if (er.code === "ENOENT") {
            return null;
          }
        }
        var isSym = lstat && lstat.isSymbolicLink();
        this.symlinks[abs] = isSym;
        if (!isSym && lstat && !lstat.isDirectory()) this.cache[abs] = "FILE";else entries = this._readdir(abs, false);
        return entries;
      };
      GlobSync.prototype._readdir = function (abs, inGlobStar) {
        var entries;
        if (inGlobStar && !ownProp(this.symlinks, abs)) return this._readdirInGlobStar(abs);
        if (ownProp(this.cache, abs)) {
          var c = this.cache[abs];
          if (!c || c === "FILE") return null;
          if (Array.isArray(c)) return c;
        }
        try {
          return this._readdirEntries(abs, fs.readdirSync(abs));
        } catch (er) {
          this._readdirError(abs, er);
          return null;
        }
      };
      GlobSync.prototype._readdirEntries = function (abs, entries) {
        if (!this.mark && !this.stat) {
          for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (abs === "/") e = abs + e;else e = abs + "/" + e;
            this.cache[e] = true;
          }
        }
        this.cache[abs] = entries;
        return entries;
      };
      GlobSync.prototype._readdirError = function (f, er) {
        switch (er.code) {
          case "ENOTSUP":
          // https://github.com/isaacs/node-glob/issues/205
          case "ENOTDIR":
            var abs = this._makeAbs(f);
            this.cache[abs] = "FILE";
            if (abs === this.cwdAbs) {
              var error = new Error(er.code + " invalid cwd " + this.cwd);
              error.path = this.cwd;
              error.code = er.code;
              throw error;
            }
            break;
          case "ENOENT":
          // not terribly unusual
          case "ELOOP":
          case "ENAMETOOLONG":
          case "UNKNOWN":
            this.cache[this._makeAbs(f)] = false;
            break;
          default:
            this.cache[this._makeAbs(f)] = false;
            if (this.strict) throw er;
            if (!this.silent) console.error("glob error", er);
            break;
        }
      };
      GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {
        var entries = this._readdir(abs, inGlobStar);
        if (!entries) return;
        var remainWithoutGlobStar = remain.slice(1);
        var gspref = prefix ? [prefix] : [];
        var noGlobStar = gspref.concat(remainWithoutGlobStar);
        this._process(noGlobStar, index, false);
        var len = entries.length;
        var isSym = this.symlinks[abs];
        if (isSym && inGlobStar) return;
        for (var i = 0; i < len; i++) {
          var e = entries[i];
          if (e.charAt(0) === "." && !this.dot) continue;
          var instead = gspref.concat(entries[i], remainWithoutGlobStar);
          this._process(instead, index, true);
          var below = gspref.concat(entries[i], remain);
          this._process(below, index, true);
        }
      };
      GlobSync.prototype._processSimple = function (prefix, index) {
        var exists = this._stat(prefix);
        if (!this.matches[index]) this.matches[index] = /* @__PURE__ */Object.create(null);
        if (!exists) return;
        if (prefix && isAbsolute(prefix) && !this.nomount) {
          var trail = /[\/\\]$/.test(prefix);
          if (prefix.charAt(0) === "/") {
            prefix = path.join(this.root, prefix);
          } else {
            prefix = path.resolve(this.root, prefix);
            if (trail) prefix += "/";
          }
        }
        if (process.platform === "win32") prefix = prefix.replace(/\\/g, "/");
        this._emitMatch(index, prefix);
      };
      GlobSync.prototype._stat = function (f) {
        var abs = this._makeAbs(f);
        var needDir = f.slice(-1) === "/";
        if (f.length > this.maxLength) return false;
        if (!this.stat && ownProp(this.cache, abs)) {
          var c = this.cache[abs];
          if (Array.isArray(c)) c = "DIR";
          if (!needDir || c === "DIR") return c;
          if (needDir && c === "FILE") return false;
        }
        var exists;
        var stat = this.statCache[abs];
        if (!stat) {
          var lstat;
          try {
            lstat = fs.lstatSync(abs);
          } catch (er) {
            if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
              this.statCache[abs] = false;
              return false;
            }
          }
          if (lstat && lstat.isSymbolicLink()) {
            try {
              stat = fs.statSync(abs);
            } catch (er) {
              stat = lstat;
            }
          } else {
            stat = lstat;
          }
        }
        this.statCache[abs] = stat;
        var c = true;
        if (stat) c = stat.isDirectory() ? "DIR" : "FILE";
        this.cache[abs] = this.cache[abs] || c;
        if (needDir && c === "FILE") return false;
        return c;
      };
      GlobSync.prototype._mark = function (p) {
        return common.mark(this, p);
      };
      GlobSync.prototype._makeAbs = function (f) {
        return common.makeAbs(this, f);
      };
    }
  });

  // node_modules/inflight/inflight.js
  var require_inflight = __commonJS({
    "node_modules/inflight/inflight.js"(exports, module) {
      var wrappy = require_wrappy();
      var reqs = /* @__PURE__ */Object.create(null);
      var once = require_once();
      module.exports = wrappy(inflight);
      function inflight(key, cb) {
        if (reqs[key]) {
          reqs[key].push(cb);
          return null;
        } else {
          reqs[key] = [cb];
          return makeres(key);
        }
      }
      function makeres(key) {
        return once(function RES() {
          var cbs = reqs[key];
          var len = cbs.length;
          var args = slice(arguments);
          try {
            for (var i = 0; i < len; i++) {
              cbs[i].apply(null, args);
            }
          } finally {
            if (cbs.length > len) {
              cbs.splice(0, len);
              process.nextTick(function () {
                RES.apply(null, args);
              });
            } else {
              delete reqs[key];
            }
          }
        });
      }
      function slice(args) {
        var length = args.length;
        var array = [];
        for (var i = 0; i < length; i++) array[i] = args[i];
        return array;
      }
    }
  });

  // node_modules/glob/glob.js
  var require_glob = __commonJS({
    "node_modules/glob/glob.js"(exports, module) {
      module.exports = glob;
      var fs = __require("fs");
      var rp = require_fs();
      var minimatch = require_minimatch();
      var Minimatch = minimatch.Minimatch;
      var inherits = require_inherits();
      var EE = __require("events").EventEmitter;
      var path = __require("path");
      var assert = __require("assert");
      var isAbsolute = require_path_is_absolute();
      var globSync = require_sync();
      var common = require_common();
      var alphasort = common.alphasort;
      var alphasorti = common.alphasorti;
      var setopts = common.setopts;
      var ownProp = common.ownProp;
      var inflight = require_inflight();
      var util = __require("util");
      var childrenIgnored = common.childrenIgnored;
      var isIgnored = common.isIgnored;
      var once = require_once();
      function glob(pattern, options, cb) {
        if (typeof options === "function") cb = options, options = {};
        if (!options) options = {};
        if (options.sync) {
          if (cb) throw new TypeError("callback provided to sync glob");
          return globSync(pattern, options);
        }
        return new Glob(pattern, options, cb);
      }
      glob.sync = globSync;
      var GlobSync = glob.GlobSync = globSync.GlobSync;
      glob.glob = glob;
      function extend(origin, add) {
        if (add === null || _typeof(add) !== "object") {
          return origin;
        }
        var keys = Object.keys(add);
        var i = keys.length;
        while (i--) {
          origin[keys[i]] = add[keys[i]];
        }
        return origin;
      }
      glob.hasMagic = function (pattern, options_) {
        var options = extend({}, options_);
        options.noprocess = true;
        var g = new Glob(pattern, options);
        var set = g.minimatch.set;
        if (!pattern) return false;
        if (set.length > 1) return true;
        for (var j = 0; j < set[0].length; j++) {
          if (typeof set[0][j] !== "string") return true;
        }
        return false;
      };
      glob.Glob = Glob;
      inherits(Glob, EE);
      function Glob(pattern, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = null;
        }
        if (options && options.sync) {
          if (cb) throw new TypeError("callback provided to sync glob");
          return new GlobSync(pattern, options);
        }
        if (!(this instanceof Glob)) return new Glob(pattern, options, cb);
        setopts(this, pattern, options);
        this._didRealPath = false;
        var n = this.minimatch.set.length;
        this.matches = new Array(n);
        if (typeof cb === "function") {
          cb = once(cb);
          this.on("error", cb);
          this.on("end", function (matches) {
            cb(null, matches);
          });
        }
        var self = this;
        var n = this.minimatch.set.length;
        this._processing = 0;
        this.matches = new Array(n);
        this._emitQueue = [];
        this._processQueue = [];
        this.paused = false;
        if (this.noprocess) return this;
        if (n === 0) return done();
        var sync = true;
        for (var i = 0; i < n; i++) {
          this._process(this.minimatch.set[i], i, false, done);
        }
        sync = false;
        function done() {
          --self._processing;
          if (self._processing <= 0) {
            if (sync) {
              process.nextTick(function () {
                self._finish();
              });
            } else {
              self._finish();
            }
          }
        }
      }
      Glob.prototype._finish = function () {
        assert(this instanceof Glob);
        if (this.aborted) return;
        if (this.realpath && !this._didRealpath) return this._realpath();
        common.finish(this);
        this.emit("end", this.found);
      };
      Glob.prototype._realpath = function () {
        if (this._didRealpath) return;
        this._didRealpath = true;
        var n = this.matches.length;
        if (n === 0) return this._finish();
        var self = this;
        for (var i = 0; i < this.matches.length; i++) this._realpathSet(i, next);
        function next() {
          if (--n === 0) self._finish();
        }
      };
      Glob.prototype._realpathSet = function (index, cb) {
        var matchset = this.matches[index];
        if (!matchset) return cb();
        var found = Object.keys(matchset);
        var self = this;
        var n = found.length;
        if (n === 0) return cb();
        var set = this.matches[index] = /* @__PURE__ */Object.create(null);
        found.forEach(function (p, i) {
          p = self._makeAbs(p);
          rp.realpath(p, self.realpathCache, function (er, real) {
            if (!er) set[real] = true;else if (er.syscall === "stat") set[p] = true;else self.emit("error", er);
            if (--n === 0) {
              self.matches[index] = set;
              cb();
            }
          });
        });
      };
      Glob.prototype._mark = function (p) {
        return common.mark(this, p);
      };
      Glob.prototype._makeAbs = function (f) {
        return common.makeAbs(this, f);
      };
      Glob.prototype.abort = function () {
        this.aborted = true;
        this.emit("abort");
      };
      Glob.prototype.pause = function () {
        if (!this.paused) {
          this.paused = true;
          this.emit("pause");
        }
      };
      Glob.prototype.resume = function () {
        if (this.paused) {
          this.emit("resume");
          this.paused = false;
          if (this._emitQueue.length) {
            var eq = this._emitQueue.slice(0);
            this._emitQueue.length = 0;
            for (var i = 0; i < eq.length; i++) {
              var e = eq[i];
              this._emitMatch(e[0], e[1]);
            }
          }
          if (this._processQueue.length) {
            var pq = this._processQueue.slice(0);
            this._processQueue.length = 0;
            for (var i = 0; i < pq.length; i++) {
              var p = pq[i];
              this._processing--;
              this._process(p[0], p[1], p[2], p[3]);
            }
          }
        }
      };
      Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
        assert(this instanceof Glob);
        assert(typeof cb === "function");
        if (this.aborted) return;
        this._processing++;
        if (this.paused) {
          this._processQueue.push([pattern, index, inGlobStar, cb]);
          return;
        }
        var n = 0;
        while (typeof pattern[n] === "string") {
          n++;
        }
        var prefix;
        switch (n) {
          // if not, then this is rather simple
          case pattern.length:
            this._processSimple(pattern.join("/"), index, cb);
            return;
          case 0:
            prefix = null;
            break;
          default:
            prefix = pattern.slice(0, n).join("/");
            break;
        }
        var remain = pattern.slice(n);
        var read;
        if (prefix === null) read = ".";else if (isAbsolute(prefix) || isAbsolute(pattern.join("/"))) {
          if (!prefix || !isAbsolute(prefix)) prefix = "/" + prefix;
          read = prefix;
        } else read = prefix;
        var abs = this._makeAbs(read);
        if (childrenIgnored(this, read)) return cb();
        var isGlobStar = remain[0] === minimatch.GLOBSTAR;
        if (isGlobStar) this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);else this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
      };
      Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
        var self = this;
        this._readdir(abs, inGlobStar, function (er, entries) {
          return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
        });
      };
      Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
        if (!entries) return cb();
        var pn = remain[0];
        var negate = !!this.minimatch.negate;
        var rawGlob = pn._glob;
        var dotOk = this.dot || rawGlob.charAt(0) === ".";
        var matchedEntries = [];
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.charAt(0) !== "." || dotOk) {
            var m;
            if (negate && !prefix) {
              m = !e.match(pn);
            } else {
              m = e.match(pn);
            }
            if (m) matchedEntries.push(e);
          }
        }
        var len = matchedEntries.length;
        if (len === 0) return cb();
        if (remain.length === 1 && !this.mark && !this.stat) {
          if (!this.matches[index]) this.matches[index] = /* @__PURE__ */Object.create(null);
          for (var i = 0; i < len; i++) {
            var e = matchedEntries[i];
            if (prefix) {
              if (prefix !== "/") e = prefix + "/" + e;else e = prefix + e;
            }
            if (e.charAt(0) === "/" && !this.nomount) {
              e = path.join(this.root, e);
            }
            this._emitMatch(index, e);
          }
          return cb();
        }
        remain.shift();
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          var newPattern;
          if (prefix) {
            if (prefix !== "/") e = prefix + "/" + e;else e = prefix + e;
          }
          this._process([e].concat(remain), index, inGlobStar, cb);
        }
        cb();
      };
      Glob.prototype._emitMatch = function (index, e) {
        if (this.aborted) return;
        if (isIgnored(this, e)) return;
        if (this.paused) {
          this._emitQueue.push([index, e]);
          return;
        }
        var abs = isAbsolute(e) ? e : this._makeAbs(e);
        if (this.mark) e = this._mark(e);
        if (this.absolute) e = abs;
        if (this.matches[index][e]) return;
        if (this.nodir) {
          var c = this.cache[abs];
          if (c === "DIR" || Array.isArray(c)) return;
        }
        this.matches[index][e] = true;
        var st = this.statCache[abs];
        if (st) this.emit("stat", e, st);
        this.emit("match", e);
      };
      Glob.prototype._readdirInGlobStar = function (abs, cb) {
        if (this.aborted) return;
        if (this.follow) return this._readdir(abs, false, cb);
        var lstatkey = "lstat\0" + abs;
        var self = this;
        var lstatcb = inflight(lstatkey, lstatcb_);
        if (lstatcb) fs.lstat(abs, lstatcb);
        function lstatcb_(er, lstat) {
          if (er && er.code === "ENOENT") return cb();
          var isSym = lstat && lstat.isSymbolicLink();
          self.symlinks[abs] = isSym;
          if (!isSym && lstat && !lstat.isDirectory()) {
            self.cache[abs] = "FILE";
            cb();
          } else self._readdir(abs, false, cb);
        }
      };
      Glob.prototype._readdir = function (abs, inGlobStar, cb) {
        if (this.aborted) return;
        cb = inflight("readdir\0" + abs + "\0" + inGlobStar, cb);
        if (!cb) return;
        if (inGlobStar && !ownProp(this.symlinks, abs)) return this._readdirInGlobStar(abs, cb);
        if (ownProp(this.cache, abs)) {
          var c = this.cache[abs];
          if (!c || c === "FILE") return cb();
          if (Array.isArray(c)) return cb(null, c);
        }
        var self = this;
        fs.readdir(abs, readdirCb(this, abs, cb));
      };
      function readdirCb(self, abs, cb) {
        return function (er, entries) {
          if (er) self._readdirError(abs, er, cb);else self._readdirEntries(abs, entries, cb);
        };
      }
      Glob.prototype._readdirEntries = function (abs, entries, cb) {
        if (this.aborted) return;
        if (!this.mark && !this.stat) {
          for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (abs === "/") e = abs + e;else e = abs + "/" + e;
            this.cache[e] = true;
          }
        }
        this.cache[abs] = entries;
        return cb(null, entries);
      };
      Glob.prototype._readdirError = function (f, er, cb) {
        if (this.aborted) return;
        switch (er.code) {
          case "ENOTSUP":
          // https://github.com/isaacs/node-glob/issues/205
          case "ENOTDIR":
            var abs = this._makeAbs(f);
            this.cache[abs] = "FILE";
            if (abs === this.cwdAbs) {
              var error = new Error(er.code + " invalid cwd " + this.cwd);
              error.path = this.cwd;
              error.code = er.code;
              this.emit("error", error);
              this.abort();
            }
            break;
          case "ENOENT":
          // not terribly unusual
          case "ELOOP":
          case "ENAMETOOLONG":
          case "UNKNOWN":
            this.cache[this._makeAbs(f)] = false;
            break;
          default:
            this.cache[this._makeAbs(f)] = false;
            if (this.strict) {
              this.emit("error", er);
              this.abort();
            }
            if (!this.silent) console.error("glob error", er);
            break;
        }
        return cb();
      };
      Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
        var self = this;
        this._readdir(abs, inGlobStar, function (er, entries) {
          self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
        });
      };
      Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
        if (!entries) return cb();
        var remainWithoutGlobStar = remain.slice(1);
        var gspref = prefix ? [prefix] : [];
        var noGlobStar = gspref.concat(remainWithoutGlobStar);
        this._process(noGlobStar, index, false, cb);
        var isSym = this.symlinks[abs];
        var len = entries.length;
        if (isSym && inGlobStar) return cb();
        for (var i = 0; i < len; i++) {
          var e = entries[i];
          if (e.charAt(0) === "." && !this.dot) continue;
          var instead = gspref.concat(entries[i], remainWithoutGlobStar);
          this._process(instead, index, true, cb);
          var below = gspref.concat(entries[i], remain);
          this._process(below, index, true, cb);
        }
        cb();
      };
      Glob.prototype._processSimple = function (prefix, index, cb) {
        var self = this;
        this._stat(prefix, function (er, exists) {
          self._processSimple2(prefix, index, er, exists, cb);
        });
      };
      Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {
        if (!this.matches[index]) this.matches[index] = /* @__PURE__ */Object.create(null);
        if (!exists) return cb();
        if (prefix && isAbsolute(prefix) && !this.nomount) {
          var trail = /[\/\\]$/.test(prefix);
          if (prefix.charAt(0) === "/") {
            prefix = path.join(this.root, prefix);
          } else {
            prefix = path.resolve(this.root, prefix);
            if (trail) prefix += "/";
          }
        }
        if (process.platform === "win32") prefix = prefix.replace(/\\/g, "/");
        this._emitMatch(index, prefix);
        cb();
      };
      Glob.prototype._stat = function (f, cb) {
        var abs = this._makeAbs(f);
        var needDir = f.slice(-1) === "/";
        if (f.length > this.maxLength) return cb();
        if (!this.stat && ownProp(this.cache, abs)) {
          var c = this.cache[abs];
          if (Array.isArray(c)) c = "DIR";
          if (!needDir || c === "DIR") return cb(null, c);
          if (needDir && c === "FILE") return cb();
        }
        var exists;
        var stat = this.statCache[abs];
        if (stat !== void 0) {
          if (stat === false) return cb(null, stat);else {
            var type = stat.isDirectory() ? "DIR" : "FILE";
            if (needDir && type === "FILE") return cb();else return cb(null, type, stat);
          }
        }
        var self = this;
        var statcb = inflight("stat\0" + abs, lstatcb_);
        if (statcb) fs.lstat(abs, statcb);
        function lstatcb_(er, lstat) {
          if (lstat && lstat.isSymbolicLink()) {
            return fs.stat(abs, function (er2, stat2) {
              if (er2) self._stat2(f, abs, null, lstat, cb);else self._stat2(f, abs, er2, stat2, cb);
            });
          } else {
            self._stat2(f, abs, er, lstat, cb);
          }
        }
      };
      Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
        if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
          this.statCache[abs] = false;
          return cb();
        }
        var needDir = f.slice(-1) === "/";
        this.statCache[abs] = stat;
        if (abs.slice(-1) === "/" && stat && !stat.isDirectory()) return cb(null, false, stat);
        var c = true;
        if (stat) c = stat.isDirectory() ? "DIR" : "FILE";
        this.cache[abs] = this.cache[abs] || c;
        if (needDir && c === "FILE") return cb();
        return cb(null, c, stat);
      };
    }
  });

  // node_modules/rimraf/rimraf.js
  var require_rimraf = __commonJS({
    "node_modules/rimraf/rimraf.js"(exports, module) {
      module.exports = rimraf;
      rimraf.sync = rimrafSync;
      var assert = __require("assert");
      var path = __require("path");
      var fs = __require("fs");
      var glob = require_glob();
      var defaultGlobOpts = {
        nosort: true,
        silent: true
      };
      var timeout = 0;
      var isWindows = process.platform === "win32";
      function defaults(options) {
        var methods = ["unlink", "chmod", "stat", "lstat", "rmdir", "readdir"];
        methods.forEach(function (m) {
          options[m] = options[m] || fs[m];
          m = m + "Sync";
          options[m] = options[m] || fs[m];
        });
        options.maxBusyTries = options.maxBusyTries || 3;
        options.emfileWait = options.emfileWait || 1e3;
        if (options.glob === false) {
          options.disableGlob = true;
        }
        options.disableGlob = options.disableGlob || false;
        options.glob = options.glob || defaultGlobOpts;
      }
      function rimraf(p, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        assert(p, "rimraf: missing path");
        assert.equal(_typeof(p), "string", "rimraf: path should be a string");
        assert.equal(_typeof(cb), "function", "rimraf: callback function required");
        assert(options, "rimraf: invalid options argument provided");
        assert.equal(_typeof(options), "object", "rimraf: options should be object");
        defaults(options);
        var busyTries = 0;
        var errState = null;
        var n = 0;
        if (options.disableGlob || !glob.hasMagic(p)) return afterGlob(null, [p]);
        options.lstat(p, function (er, stat) {
          if (!er) return afterGlob(null, [p]);
          glob(p, options.glob, afterGlob);
        });
        function next(er) {
          errState = errState || er;
          if (--n === 0) cb(errState);
        }
        function afterGlob(er, results) {
          if (er) return cb(er);
          n = results.length;
          if (n === 0) return cb();
          results.forEach(function (p2) {
            rimraf_(p2, options, function CB(er2) {
              if (er2) {
                if (isWindows && (er2.code === "EBUSY" || er2.code === "ENOTEMPTY" || er2.code === "EPERM") && busyTries < options.maxBusyTries) {
                  busyTries++;
                  var time = busyTries * 100;
                  return setTimeout(function () {
                    rimraf_(p2, options, CB);
                  }, time);
                }
                if (er2.code === "EMFILE" && timeout < options.emfileWait) {
                  return setTimeout(function () {
                    rimraf_(p2, options, CB);
                  }, timeout++);
                }
                if (er2.code === "ENOENT") er2 = null;
              }
              timeout = 0;
              next(er2);
            });
          });
        }
      }
      function rimraf_(p, options, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === "function");
        options.lstat(p, function (er, st) {
          if (er && er.code === "ENOENT") return cb(null);
          if (er && er.code === "EPERM" && isWindows) fixWinEPERM(p, options, er, cb);
          if (st && st.isDirectory()) return rmdir(p, options, er, cb);
          options.unlink(p, function (er2) {
            if (er2) {
              if (er2.code === "ENOENT") return cb(null);
              if (er2.code === "EPERM") return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
              if (er2.code === "EISDIR") return rmdir(p, options, er2, cb);
            }
            return cb(er2);
          });
        });
      }
      function fixWinEPERM(p, options, er, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === "function");
        if (er) assert(er instanceof Error);
        options.chmod(p, 666, function (er2) {
          if (er2) cb(er2.code === "ENOENT" ? null : er);else options.stat(p, function (er3, stats) {
            if (er3) cb(er3.code === "ENOENT" ? null : er);else if (stats.isDirectory()) rmdir(p, options, er, cb);else options.unlink(p, cb);
          });
        });
      }
      function fixWinEPERMSync(p, options, er) {
        assert(p);
        assert(options);
        if (er) assert(er instanceof Error);
        try {
          options.chmodSync(p, 666);
        } catch (er2) {
          if (er2.code === "ENOENT") return;else throw er;
        }
        try {
          var stats = options.statSync(p);
        } catch (er3) {
          if (er3.code === "ENOENT") return;else throw er;
        }
        if (stats.isDirectory()) rmdirSync(p, options, er);else options.unlinkSync(p);
      }
      function rmdir(p, options, originalEr, cb) {
        assert(p);
        assert(options);
        if (originalEr) assert(originalEr instanceof Error);
        assert(typeof cb === "function");
        options.rmdir(p, function (er) {
          if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) rmkids(p, options, cb);else if (er && er.code === "ENOTDIR") cb(originalEr);else cb(er);
        });
      }
      function rmkids(p, options, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === "function");
        options.readdir(p, function (er, files) {
          if (er) return cb(er);
          var n = files.length;
          if (n === 0) return options.rmdir(p, cb);
          var errState;
          files.forEach(function (f) {
            rimraf(path.join(p, f), options, function (er2) {
              if (errState) return;
              if (er2) return cb(errState = er2);
              if (--n === 0) options.rmdir(p, cb);
            });
          });
        });
      }
      function rimrafSync(p, options) {
        options = options || {};
        defaults(options);
        assert(p, "rimraf: missing path");
        assert.equal(_typeof(p), "string", "rimraf: path should be a string");
        assert(options, "rimraf: missing options");
        assert.equal(_typeof(options), "object", "rimraf: options should be object");
        var results;
        if (options.disableGlob || !glob.hasMagic(p)) {
          results = [p];
        } else {
          try {
            options.lstatSync(p);
            results = [p];
          } catch (er) {
            results = glob.sync(p, options.glob);
          }
        }
        if (!results.length) return;
        for (var i = 0; i < results.length; i++) {
          var p = results[i];
          try {
            var st = options.lstatSync(p);
          } catch (er) {
            if (er.code === "ENOENT") return;
            if (er.code === "EPERM" && isWindows) fixWinEPERMSync(p, options, er);
          }
          try {
            if (st && st.isDirectory()) rmdirSync(p, options, null);else options.unlinkSync(p);
          } catch (er) {
            if (er.code === "ENOENT") return;
            if (er.code === "EPERM") return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
            if (er.code !== "EISDIR") throw er;
            rmdirSync(p, options, er);
          }
        }
      }
      function rmdirSync(p, options, originalEr) {
        assert(p);
        assert(options);
        if (originalEr) assert(originalEr instanceof Error);
        try {
          options.rmdirSync(p);
        } catch (er) {
          if (er.code === "ENOENT") return;
          if (er.code === "ENOTDIR") throw originalEr;
          if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") rmkidsSync(p, options);
        }
      }
      function rmkidsSync(p, options) {
        assert(p);
        assert(options);
        options.readdirSync(p).forEach(function (f) {
          rimrafSync(path.join(p, f), options);
        });
        options.rmdirSync(p, options);
      }
    }
  });

  // node_modules/run-parallel/index.js
  var require_run_parallel = __commonJS({
    "node_modules/run-parallel/index.js"(exports, module) {
      module.exports = function (tasks, cb) {
        var results, pending, keys;
        var isSync = true;
        if (Array.isArray(tasks)) {
          results = [];
          pending = tasks.length;
        } else {
          keys = Object.keys(tasks);
          results = {};
          pending = keys.length;
        }
        function done(err) {
          function end() {
            if (cb) cb(err, results);
            cb = null;
          }
          if (isSync) process.nextTick(end);else end();
        }
        function each(i, err, result) {
          results[i] = result;
          if (--pending === 0 || err) {
            done(err);
          }
        }
        if (!pending) {
          done(null);
        } else if (keys) {
          keys.forEach(function (key) {
            tasks[key](function (err, result) {
              each(key, err, result);
            });
          });
        } else {
          tasks.forEach(function (task, i) {
            task(function (err, result) {
              each(i, err, result);
            });
          });
        }
        isSync = false;
      };
    }
  });

  // node_modules/thunky/index.js
  var require_thunky = __commonJS({
    "node_modules/thunky/index.js"(exports, module) {
      "use strict";

      module.exports = thunky;
      function thunky(fn) {
        var state = run;
        return thunk;
        function thunk(callback) {
          state(callback || noop);
        }
        function run(callback) {
          var stack = [callback];
          state = wait;
          fn(done);
          function wait(callback2) {
            stack.push(callback2);
          }
          function done(err) {
            var args = arguments;
            var apply = applier(args);
            state = isError(err) ? run : apply;
            while (stack.length) stack.shift().apply(null, args);
          }
        }
      }
      function applier(args) {
        return args.length ? applyArgs : applyNoArgs;
        function applyArgs(callback) {
          process.nextTick(function () {
            callback.apply(null, args);
          });
        }
        function applyNoArgs(callback) {
          process.nextTick(callback);
        }
      }
      function isError(err) {
        return Object.prototype.toString.call(err) === "[object Error]";
      }
      function noop() {}
    }
  });

  // node_modules/ms/index.js
  var require_ms = __commonJS({
    "node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function (val, options) {
        options = options || {};
        var type = _typeof(val);
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
      };
      function parse(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/debug/src/common.js
  var require_common2 = __commonJS({
    "node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms();
        createDebug.destroy = destroy;
        Object.keys(env).forEach(function (key) {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          var hash = 0;
          for (var i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          var prevTime;
          var enableOverride = null;
          var namespacesCache;
          var enabledCache;
          function debug() {
            for (var _len3 = arguments.length, args = new Array(_len3), _key = 0; _key < _len3; _key++) {
              args[_key] = arguments[_key];
            }
            if (!debug.enabled) {
              return;
            }
            var self = debug;
            var curr = Number(/* @__PURE__ */new Date());
            var ms = curr - (prevTime || curr);
            self.diff = ms;
            self.prev = prevTime;
            self.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            var index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
              if (match === "%%") {
                return "%";
              }
              index++;
              var formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                var val = args[index];
                match = formatter.call(self, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self, args);
            var logFn = self.log || createDebug.log;
            logFn.apply(self, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: function get() {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: function set(v) {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          var newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          var split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
          var _iterator = _createForOfIteratorHelper(split),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var ns = _step.value;
              if (ns[0] === "-") {
                createDebug.skips.push(ns.slice(1));
              } else {
                createDebug.names.push(ns);
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
        function matchesTemplate(search, template) {
          var searchIndex = 0;
          var templateIndex = 0;
          var starIndex = -1;
          var matchIndex = 0;
          while (searchIndex < search.length) {
            if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
              if (template[templateIndex] === "*") {
                starIndex = templateIndex;
                matchIndex = searchIndex;
                templateIndex++;
              } else {
                searchIndex++;
                templateIndex++;
              }
            } else if (starIndex !== -1) {
              templateIndex = starIndex + 1;
              matchIndex++;
              searchIndex = matchIndex;
            } else {
              return false;
            }
          }
          while (templateIndex < template.length && template[templateIndex] === "*") {
            templateIndex++;
          }
          return templateIndex === template.length;
        }
        function disable() {
          var namespaces = [].concat(_toConsumableArray(createDebug.names), _toConsumableArray(createDebug.skips.map(function (namespace) {
            return "-" + namespace;
          }))).join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          var _iterator2 = _createForOfIteratorHelper(createDebug.skips),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var skip = _step2.value;
              if (matchesTemplate(name, skip)) {
                return false;
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          var _iterator3 = _createForOfIteratorHelper(createDebug.names),
            _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var ns = _step3.value;
              if (matchesTemplate(name, ns)) {
                return true;
              }
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/debug/src/browser.js
  var require_browser = __commonJS({
    "node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */function () {
        var warned = false;
        return function () {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      }();
      exports.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        var m;
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance ||
        // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) ||
        // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 ||
        // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        var c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        var index = 0;
        var lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, function (match) {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || function () {};
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {}
      }
      function load() {
        var r;
        try {
          r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
        } catch (error) {}
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {}
      }
      module.exports = require_common2()(exports);
      var formatters = module.exports.formatters;
      formatters.j = function (v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/debug/src/node.js
  var require_node = __commonJS({
    "node_modules/debug/src/node.js"(exports, module) {
      var tty = __require("tty");
      var util = __require("util");
      exports.init = init;
      exports.log = log;
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.destroy = util.deprecate(function () {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      exports.colors = [6, 2, 3, 4, 5, 1];
      try {
        var supportsColor = __require("supports-color");
        if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
          exports.colors = [20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221];
        }
      } catch (error) {}
      exports.inspectOpts = Object.keys(process.env).filter(function (key) {
        return /^debug_/i.test(key);
      }).reduce(function (obj, key) {
        var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function (_, k) {
          return k.toUpperCase();
        });
        var val = process.env[key];
        if (/^(yes|on|true|enabled)$/i.test(val)) {
          val = true;
        } else if (/^(no|off|false|disabled)$/i.test(val)) {
          val = false;
        } else if (val === "null") {
          val = null;
        } else {
          val = Number(val);
        }
        obj[prop] = val;
        return obj;
      }, {});
      function useColors() {
        return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
      }
      function formatArgs(args) {
        var name = this.namespace,
          useColors2 = this.useColors;
        if (useColors2) {
          var c = this.color;
          var colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
          var prefix = `  ${colorCode};1m${name} \x1B[0m`;
          args[0] = prefix + args[0].split("\n").join("\n" + prefix);
          args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
        } else {
          args[0] = getDate() + name + " " + args[0];
        }
      }
      function getDate() {
        if (exports.inspectOpts.hideDate) {
          return "";
        }
        return (/* @__PURE__ */new Date()).toISOString() + " ";
      }
      function log() {
        for (var _len4 = arguments.length, args = new Array(_len4), _key2 = 0; _key2 < _len4; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return process.stderr.write(util.formatWithOptions.apply(util, [exports.inspectOpts].concat(args)) + "\n");
      }
      function save(namespaces) {
        if (namespaces) {
          process.env.DEBUG = namespaces;
        } else {
          delete process.env.DEBUG;
        }
      }
      function load() {
        return process.env.DEBUG;
      }
      function init(debug) {
        debug.inspectOpts = {};
        var keys = Object.keys(exports.inspectOpts);
        for (var i = 0; i < keys.length; i++) {
          debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
        }
      }
      module.exports = require_common2()(exports);
      var formatters = module.exports.formatters;
      formatters.o = function (v) {
        this.inspectOpts.colors = this.useColors;
        return util.inspect(v, this.inspectOpts).split("\n").map(function (str) {
          return str.trim();
        }).join(" ");
      };
      formatters.O = function (v) {
        this.inspectOpts.colors = this.useColors;
        return util.inspect(v, this.inspectOpts);
      };
    }
  });

  // node_modules/debug/src/index.js
  var require_src = __commonJS({
    "node_modules/debug/src/index.js"(exports, module) {
      if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
        module.exports = require_browser();
      } else {
        module.exports = require_node();
      }
    }
  });

  // node_modules/random-access-file/index.js
  var require_random_access_file = __commonJS({
    "node_modules/random-access-file/index.js"(exports, module) {
      var thunky = require_thunky();
      var fs = __require("fs");
      var path = __require("path");
      var inherits = require_inherits();
      var mkdirp = require_mkdirp();
      var events = __require("events");
      var c = __require("constants");
      var debug = require_src()("random-access-file");
      module.exports = RandomAccessFile;
      function RandomAccessFile(filename, opts) {
        if (!(this instanceof RandomAccessFile)) return new RandomAccessFile(filename, opts);
        if (!opts) opts = {};
        events.EventEmitter.call(this);
        var self = this;
        this.filename = filename;
        this.fd = 0;
        this.readable = opts.readable !== false;
        this.writable = opts.writable !== false;
        this.mtime = opts.mtime;
        this.atime = opts.atime;
        this.length = opts.length || 0;
        this.opened = false;
        this.open = thunky(open);
        this.open();
        function open(cb) {
          var dir = path.dirname(filename);
          debug("open() file=%s", filename);
          if (dir) {
            debug("creating containing directory %s", dir);
            mkdirp(dir, ondir);
          } else {
            ondir();
          }
          function ondir(err) {
            if (err) debug("failed to create directory %s - %s", dir, err);
            fs.open(filename, mode(self), onopen);
          }
          function onopen(err, fd) {
            if (err && err.code === "EACCES" && self.writable) {
              self.writable = false;
              debug("failed to open file for writing, trying again in read only mode (file=%s)", filename);
              fs.open(filename, mode(self), onopen);
              return;
            }
            if (err) {
              debug("failed to open file=%s err=%s", filename, err);
              return cb(err);
            }
            self.opened = true;
            self.fd = fd;
            debug("opened file=%s", filename);
            self.emit("open");
            if (self.length || opts.truncate) return fs.ftruncate(fd, opts.truncate ? 0 : self.length, cb);
            fs.fstat(fd, function (err2, st) {
              if (err2) {
                debug("failed to stat file after open, file=%s err=%s", filename, err2);
                return cb(err2);
              }
              self.length = st.size;
              cb();
            });
          }
        }
      }
      inherits(RandomAccessFile, events.EventEmitter);
      RandomAccessFile.prototype.read = function (offset, length, cb) {
        if (!this.opened) return openAndRead(this, offset, length, cb);
        if (!this.fd) {
          debug("read() failed: fd is closed file=%s", this.filename);
          return cb(new Error("File is closed"));
        }
        if (!this.readable) return cb(new Error("File is not readable"));
        var self = this;
        var buf = Buffer(length);
        if (!length) return cb(null, buf);
        fs.read(this.fd, buf, 0, length, offset, onread);
        function onread(err, bytes) {
          if (err) {
            debug("read() failed file=%s err=%s", self.filename, err);
            return cb(err);
          }
          if (!bytes) return cb(new Error("Could not satisfy length"));
          offset += bytes;
          length -= bytes;
          if (!length) return cb(null, buf);
          if (!self.fd) {
            debug("read() failed: fd is closed file=%s", self.filename);
            return cb(new Error("File is closed"));
          }
          fs.read(self.fd, buf, buf.length - length, length, offset, onread);
        }
      };
      RandomAccessFile.prototype.write = function (offset, buf, cb) {
        if (!cb) cb = noop;
        if (!this.opened) return openAndWrite(this, offset, buf, cb);
        if (!this.fd) {
          debug("write() failed: fd is closed file=%s", this.filename);
          return cb(new Error("File is closed"));
        }
        if (!this.writable) {
          debug("write() failed: fd is not writable file=%s", this.filename);
          return cb(new Error("File is not writable"));
        }
        var self = this;
        var length = buf.length;
        fs.write(this.fd, buf, 0, length, offset, onwrite);
        function onwrite(err, bytes) {
          if (err) {
            debug("write() failed file=%s err=%s", self.filename, err);
            return cb(err);
          }
          offset += bytes;
          length -= bytes;
          if (offset > self.length) self.length = offset;
          if (!length) return cb(null);
          if (!self.fd) {
            debug("write() failed: fd is closed file=%s", self.filename);
            return cb(new Error("File is closed"));
          }
          fs.write(self.fd, buf, buf.length - offset, length, offset, onwrite);
        }
      };
      RandomAccessFile.prototype.close = function (cb) {
        if (!cb) cb = noop;
        if (this.opened && !this.fd) return cb();
        debug("close() file=%s", this.filename);
        var self = this;
        this.open(onopen);
        function onopen(err) {
          if (err) return cb();
          fs.close(self.fd, onclose);
        }
        function onclose(err) {
          if (err) {
            debug("failed to close file=%s err=%s", self.filename, err);
            return cb(err);
          }
          debug("closed file=%s", self.filename);
          self.fd = 0;
          self.emit("close");
          cb();
        }
      };
      RandomAccessFile.prototype.end = function (opts, cb) {
        if (typeof opts === "function") {
          cb = opts;
          opts = {};
        }
        var atime = opts.atime || this.atime;
        var mtime = opts.mtime || this.mtime;
        var self = this;
        this.open(onopen);
        debug("end() file=%s", this.filename);
        function onopen(err) {
          if (err) return cb(err);
          if (!atime && !mtime) {
            cb();
          } else if (atime && mtime) {
            end(atime, mtime);
          } else {
            fs.fstat(self.fd, function (err2, stat) {
              if (err2) return cb(err2);
              end(atime || stat.atime, mtime || stat.mtime);
            });
          }
        }
        function end(atime2, mtime2) {
          fs.futimes(self.fd, atime2, mtime2, cb);
        }
      };
      RandomAccessFile.prototype.unlink = function (cb) {
        if (!cb) cb = noop;
        debug("unlink() file=%s", this.filename);
        fs.unlink(this.filename, cb);
      };
      function noop() {}
      function openAndRead(self, offset, length, cb) {
        self.open(function (err) {
          if (err) return cb(err);
          self.read(offset, length, cb);
        });
      }
      function openAndWrite(self, offset, buf, cb) {
        self.open(function (err) {
          if (err) return cb(err);
          self.write(offset, buf, cb);
        });
      }
      function mode(self) {
        if (self.readable && self.writable) return c.O_RDWR | c.O_CREAT;
        if (self.writable) return c.O_WRONLY | c.O_CREAT;
        return c.O_RDONLY;
      }
    }
  });

  // node_modules/randombytes/index.js
  var require_randombytes = __commonJS({
    "node_modules/randombytes/index.js"(exports, module) {
      module.exports = __require("crypto").randomBytes;
    }
  });

  // node_modules/fs-chunk-store/index.js
  var require_fs_chunk_store = __commonJS({
    "node_modules/fs-chunk-store/index.js"(exports, module) {
      module.exports = Storage;
      var fs = __require("fs");
      var mkdirp = require_mkdirp();
      var os = __require("os");
      var parallel = require_run_parallel();
      var path = __require("path");
      var raf = require_random_access_file();
      var randombytes = require_randombytes();
      var rimraf = require_rimraf();
      var thunky = require_thunky();
      var TMP;
      try {
        TMP = fs.statSync("/tmp") && "/tmp";
      } catch (err) {
        TMP = os.tmpDir();
      }
      function Storage(chunkLength, opts) {
        var self = this;
        if (!(self instanceof Storage)) return new Storage(chunkLength, opts);
        if (!opts) opts = {};
        self.chunkLength = Number(chunkLength);
        if (!self.chunkLength) throw new Error("First argument must be a chunk length");
        if (opts.files) {
          if (!Array.isArray(opts.files)) {
            throw new Error("`files` option must be an array");
          }
          self.files = opts.files.slice(0).map(function (file, i, files) {
            if (file.path == null) throw new Error("File is missing `path` property");
            if (file.length == null) throw new Error("File is missing `length` property");
            if (file.offset == null) {
              if (i === 0) {
                file.offset = 0;
              } else {
                var prevFile = files[i - 1];
                file.offset = prevFile.offset + prevFile.length;
              }
            }
            return file;
          });
          self.length = self.files.reduce(function (sum, file) {
            return sum + file.length;
          }, 0);
          if (opts.length != null && opts.length !== self.length) {
            throw new Error("total `files` length is not equal to explicit `length` option");
          }
        } else {
          var len = Number(opts.length) || Infinity;
          self.files = [{
            offset: 0,
            path: path.resolve(opts.path || path.join(TMP, "fs-chunk-store", randombytes(20).toString("hex"))),
            length: len
          }];
          self.length = len;
        }
        self.chunkMap = [];
        self.closed = false;
        self.files.forEach(function (file) {
          file.open = thunky(function (cb) {
            if (self.closed) return cb(new Error("Storage is closed"));
            mkdirp(path.dirname(file.path), function (err) {
              if (err) return cb(err);
              if (self.closed) return cb(new Error("Storage is closed"));
              cb(null, raf(file.path));
            });
          });
        });
        if (self.length !== Infinity) {
          self.lastChunkLength = self.length % self.chunkLength || self.chunkLength;
          self.lastChunkIndex = Math.ceil(self.length / self.chunkLength) - 1;
          self.files.forEach(function (file) {
            var fileStart = file.offset;
            var fileEnd = file.offset + file.length;
            var firstChunk = Math.floor(fileStart / self.chunkLength);
            var lastChunk = Math.floor((fileEnd - 1) / self.chunkLength);
            for (var p = firstChunk; p <= lastChunk; ++p) {
              var chunkStart = p * self.chunkLength;
              var chunkEnd = chunkStart + self.chunkLength;
              var from = fileStart < chunkStart ? 0 : fileStart - chunkStart;
              var to = fileEnd > chunkEnd ? self.chunkLength : fileEnd - chunkStart;
              var offset = fileStart > chunkStart ? 0 : chunkStart - fileStart;
              if (!self.chunkMap[p]) self.chunkMap[p] = [];
              self.chunkMap[p].push({
                from,
                to,
                offset,
                file
              });
            }
          });
        }
      }
      Storage.prototype.put = function (index, buf, cb) {
        var self = this;
        if (typeof cb !== "function") cb = noop;
        if (self.closed) return nextTick(cb, new Error("Storage is closed"));
        var isLastChunk = index === self.lastChunkIndex;
        if (isLastChunk && buf.length !== self.lastChunkLength) {
          return nextTick(cb, new Error("Last chunk length must be " + self.lastChunkLength));
        }
        if (!isLastChunk && buf.length !== self.chunkLength) {
          return nextTick(cb, new Error("Chunk length must be " + self.chunkLength));
        }
        if (self.length === Infinity) {
          self.files[0].open(function (err, file) {
            if (err) return cb(err);
            file.write(index * self.chunkLength, buf, cb);
          });
        } else {
          var targets = self.chunkMap[index];
          if (!targets) return nextTick(cb, new Error("no files matching the request range"));
          var tasks = targets.map(function (target) {
            return function (cb2) {
              target.file.open(function (err, file) {
                if (err) return cb2(err);
                file.write(target.offset, buf.slice(target.from, target.to), cb2);
              });
            };
          });
          parallel(tasks, cb);
        }
      };
      Storage.prototype.get = function (index, opts, cb) {
        var self = this;
        if (typeof opts === "function") return self.get(index, null, opts);
        if (self.closed) return nextTick(cb, new Error("Storage is closed"));
        var chunkLength = index === self.lastChunkIndex ? self.lastChunkLength : self.chunkLength;
        var rangeFrom = opts && opts.offset || 0;
        var rangeTo = opts && opts.length ? rangeFrom + opts.length : chunkLength;
        if (rangeFrom < 0 || rangeFrom < 0 || rangeTo > chunkLength) {
          return nextTick(cb, new Error("Invalid offset and/or length"));
        }
        if (self.length === Infinity) {
          if (rangeFrom === rangeTo) return nextTick(cb, null, new Buffer(0));
          self.files[0].open(function (err, file) {
            if (err) return cb(err);
            var offset = index * self.chunkLength + rangeFrom;
            file.read(offset, rangeTo - rangeFrom, cb);
          });
        } else {
          var targets = self.chunkMap[index];
          if (!targets) return nextTick(cb, new Error("no files matching the request range"));
          if (opts) {
            targets = targets.filter(function (target) {
              return target.to > rangeFrom && target.from < rangeTo;
            });
            if (targets.length === 0) {
              return nextTick(cb, new Error("no files matching the requested range"));
            }
          }
          if (rangeFrom === rangeTo) return nextTick(cb, null, new Buffer(0));
          var tasks = targets.map(function (target) {
            return function (cb2) {
              var from = target.from;
              var to = target.to;
              var offset = target.offset;
              if (opts) {
                if (to > rangeTo) to = rangeTo;
                if (from < rangeFrom) {
                  offset += rangeFrom - from;
                  from = rangeFrom;
                }
              }
              target.file.open(function (err, file) {
                if (err) return cb2(err);
                file.read(offset, to - from, cb2);
              });
            };
          });
          parallel(tasks, function (err, buffers) {
            if (err) return cb(err);
            cb(null, Buffer.concat(buffers));
          });
        }
      };
      Storage.prototype.close = function (cb) {
        var self = this;
        if (self.closed) return nextTick(cb, new Error("Storage is closed"));
        self.closed = true;
        var tasks = self.files.map(function (file) {
          return function (cb2) {
            file.open(function (err, file2) {
              if (err) return cb2(null);
              file2.close(cb2);
            });
          };
        });
        parallel(tasks, cb);
      };
      Storage.prototype.destroy = function (cb) {
        var self = this;
        self.close(function () {
          var tasks = self.files.map(function (file) {
            return function (cb2) {
              rimraf(file.path, {
                maxBusyTries: 10
              }, cb2);
            };
          });
          parallel(tasks, cb);
        });
      };
      function nextTick(cb, err, val) {
        process.nextTick(function () {
          if (cb) cb(err, val);
        });
      }
      function noop() {}
    }
  });

  // node_modules/immediate-chunk-store/index.js
  var require_immediate_chunk_store = __commonJS({
    "node_modules/immediate-chunk-store/index.js"(exports, module) {
      module.exports = ImmediateStore;
      function ImmediateStore(store) {
        if (!(this instanceof ImmediateStore)) return new ImmediateStore(store);
        this.store = store;
        this.chunkLength = store.chunkLength;
        if (!this.store || !this.store.get || !this.store.put) {
          throw new Error("First argument must be abstract-chunk-store compliant");
        }
        this.mem = [];
      }
      ImmediateStore.prototype.put = function (index, buf, cb) {
        var self = this;
        self.mem[index] = buf;
        self.store.put(index, buf, function (err) {
          self.mem[index] = null;
          if (cb) cb(err);
        });
      };
      ImmediateStore.prototype.get = function (index, opts, cb) {
        if (typeof opts === "function") return this.get(index, null, opts);
        var start = opts && opts.offset || 0;
        var end = opts && opts.length && start + opts.length;
        var buf = this.mem[index];
        if (buf) return nextTick(cb, null, opts ? buf.slice(start, end) : buf);
        this.store.get(index, opts, cb);
      };
      ImmediateStore.prototype.close = function (cb) {
        this.store.close(cb);
      };
      ImmediateStore.prototype.destroy = function (cb) {
        this.store.destroy(cb);
      };
      function nextTick(cb, err, val) {
        process.nextTick(function () {
          if (cb) cb(err, val);
        });
      }
    }
  });

  // node_modules/k-rpc-socket/index.js
  var require_k_rpc_socket = __commonJS({
    "node_modules/k-rpc-socket/index.js"(exports, module) {
      var dgram = __require("dgram");
      var bencode = require_bencode();
      var isIP = __require("net").isIP;
      var dns = __require("dns");
      var util = __require("util");
      var events = __require("events");
      var ETIMEDOUT = new Error("Query timed out");
      ETIMEDOUT.code = "ETIMEDOUT";
      module.exports = RPC;
      function RPC(opts) {
        if (!(this instanceof RPC)) return new RPC(opts);
        if (!opts) opts = {};
        var self = this;
        this.timeout = opts.timeout || 2e3;
        this.inflight = 0;
        this.destroyed = false;
        this.isIP = opts.isIP || isIP;
        this.socket = opts.socket || dgram.createSocket("udp4");
        this.socket.on("message", onmessage);
        this.socket.on("error", onerror);
        this.socket.on("listening", onlistening);
        this._tick = 0;
        this._ids = [];
        this._reqs = [];
        this._timer = setInterval(check, this.timeout / 4 | 0);
        events.EventEmitter.call(this);
        function check() {
          var missing = self.inflight;
          if (!missing) return;
          for (var i = 0; i < self._reqs.length; i++) {
            var req = self._reqs[i];
            if (!req) continue;
            if (req.ttl) req.ttl--;else self._cancel(i, ETIMEDOUT);
            if (! --missing) return;
          }
        }
        function onlistening() {
          self.emit("listening");
        }
        function onerror(err) {
          if (err.code === "EACCES" || err.code === "EADDRINUSE") self.emit("error", err);else self.emit("warning", err);
        }
        function onmessage(buf, rinfo) {
          if (self.destroyed) return;
          if (!rinfo.port) return;
          try {
            var message = bencode.decode(buf);
          } catch (e) {
            return self.emit("warning", e);
          }
          var type = message.y && message.y.toString();
          if (type === "r" || type === "e") {
            if (!Buffer.isBuffer(message.t)) return;
            try {
              var tid = message.t.readUInt16BE(0);
            } catch (err2) {
              return self.emit("warning", err2);
            }
            var index = self._ids.indexOf(tid);
            if (index === -1 || tid === 0) {
              self.emit("response", message, rinfo);
              self.emit("warning", new Error("Unexpected transaction id: " + tid));
              return;
            }
            var req = self._reqs[index];
            if (req.peer.host !== rinfo.address) {
              self.emit("response", message, rinfo);
              self.emit("warning", new Error("Out of order response"));
              return;
            }
            self._ids[index] = 0;
            self._reqs[index] = null;
            self.inflight--;
            if (type === "e") {
              var isArray = Array.isArray(message.e);
              var err = new Error(isArray ? message.e.join(" ") : "Unknown error");
              err.code = isArray && message.e.length && typeof message.e[0] === "number" ? message.e[0] : 0;
              req.callback(err, message, rinfo, req.message);
              self.emit("update");
              self.emit("postupdate");
              return;
            }
            req.callback(null, message, rinfo, req.message);
            self.emit("update");
            self.emit("postupdate");
            self.emit("response", message, rinfo);
          } else if (type === "q") {
            self.emit("query", message, rinfo);
          } else {
            self.emit("warning", new Error("Unknown type: " + type));
          }
        }
      }
      util.inherits(RPC, events.EventEmitter);
      RPC.prototype.address = function () {
        return this.socket.address();
      };
      RPC.prototype.response = function (peer, req, res, cb) {
        this.send(peer, {
          t: req.t,
          y: "r",
          r: res
        }, cb);
      };
      RPC.prototype.error = function (peer, req, error, cb) {
        this.send(peer, {
          t: req.t,
          y: "e",
          e: [].concat(error.message || error)
        }, cb);
      };
      RPC.prototype.send = function (peer, message, cb) {
        var buf = bencode.encode(message);
        this.socket.send(buf, 0, buf.length, peer.port, peer.address || peer.host, cb || noop);
      };
      RPC.prototype.bind = function (port, cb) {
        this.socket.bind(port, cb);
      };
      RPC.prototype.destroy = function (cb) {
        this.destroyed = true;
        clearInterval(this._timer);
        if (cb) this.socket.on("close", cb);
        for (var i = 0; i < this._ids.length; i++) this._cancel(i);
        this.socket.close();
      };
      RPC.prototype.query = function (peer, query, cb) {
        if (!cb) cb = noop;
        if (!this.isIP(peer.host)) return this._resolveAndQuery(peer, query, cb);
        var message = {
          t: new Buffer(2),
          y: "q",
          q: query.q,
          a: query.a
        };
        var req = {
          ttl: 4,
          peer,
          message,
          callback: cb
        };
        if (this._tick === 65535) this._tick = 0;
        var tid = ++this._tick;
        var free = this._ids.indexOf(0);
        if (free === -1) free = this._ids.push(0) - 1;
        this._ids[free] = tid;
        while (this._reqs.length < free) this._reqs.push(null);
        this._reqs[free] = req;
        this.inflight++;
        message.t.writeUInt16BE(tid, 0);
        this.send(peer, message);
        return tid;
      };
      RPC.prototype.cancel = function (tid, err) {
        var index = this._ids.indexOf(tid);
        if (index > -1) this._cancel(index, err);
      };
      RPC.prototype._cancel = function (index, err) {
        var req = this._reqs[index];
        this._ids[index] = 0;
        this._reqs[index] = null;
        if (req) {
          this.inflight--;
          req.callback(err || new Error("Query was cancelled"), null, req.peer);
          this.emit("update");
          this.emit("postupdate");
        }
      };
      RPC.prototype._resolveAndQuery = function (peer, query, cb) {
        var self = this;
        dns.lookup(peer.host, function (err, ip) {
          if (err) return cb(err);
          if (self.destroyed) return cb(new Error("k-rpc-socket is destroyed"));
          self.query({
            host: ip,
            port: peer.port
          }, query, cb);
        });
      };
      function noop() {}
    }
  });

  // node_modules/buffer-equal/index.js
  var require_buffer_equal = __commonJS({
    "node_modules/buffer-equal/index.js"(exports, module) {
      var Buffer2 = __require("buffer").Buffer;
      module.exports = function (a, b) {
        if (!Buffer2.isBuffer(a)) return void 0;
        if (!Buffer2.isBuffer(b)) return void 0;
        if (typeof a.equals === "function") return a.equals(b);
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      };
    }
  });

  // node_modules/k-bucket/index.js
  var require_k_bucket = __commonJS({
    "node_modules/k-bucket/index.js"(exports, module) {
      "use strict";

      var assert = __require("assert");
      var bufferEqual = require_buffer_equal();
      var crypto = __require("crypto");
      var events = __require("events");
      var inherits = require_inherits();
      var KBucket = module.exports = function KBucket2(options) {
        var self = this;
        options = options || {};
        events.EventEmitter.call(self);
        self.arbiter = options.arbiter || function arbiter(incumbent, candidate) {
          if (incumbent.vectorClock > candidate.vectorClock) {
            return incumbent;
          }
          return candidate;
        };
        self.bucket = [];
        self.localNodeId = options.localNodeId || crypto.randomBytes(20);
        if (!Buffer.isBuffer(self.localNodeId)) {
          throw new Error("localNodeId is not a Buffer");
        }
        self.numberOfNodesPerKBucket = options.numberOfNodesPerKBucket || 20;
        self.numberOfNodesToPing = options.numberOfNodesToPing || 3;
        self.root = options.root || self;
        self.dontSplit = null;
        self.low = null;
        self.high = null;
      };
      inherits(KBucket, events.EventEmitter);
      KBucket.distance = function distance(firstId, secondId) {
        var max = Math.max(firstId.length, secondId.length);
        var accumulator = "";
        for (var i = 0; i < max; i++) {
          var maxDistance = firstId[i] === void 0 || secondId[i] === void 0;
          if (maxDistance) {
            accumulator += 255 .toString(16);
          } else {
            accumulator += (firstId[i] ^ secondId[i]).toString(16);
          }
        }
        return parseInt(accumulator, 16);
      };
      KBucket.prototype.add = function add(contact, bitIndex) {
        var self = this;
        if (!self.bucket) {
          bitIndex = bitIndex || 0;
          if (self.determineBucket(contact.id, bitIndex++) < 0) {
            return self.low.add(contact, bitIndex);
          } else {
            return self.high.add(contact, bitIndex);
          }
        }
        var index = self.indexOf(contact);
        if (index >= 0) {
          self.update(contact, index);
          return self;
        }
        if (self.bucket.length < self.numberOfNodesPerKBucket) {
          self.bucket.push(contact);
          return self;
        }
        if (self.dontSplit) {
          self.root.emit("ping", self.bucket.slice(0, self.numberOfNodesToPing), contact);
          return self;
        }
        return self.splitAndAdd(contact, bitIndex);
      };
      KBucket.prototype.closest = function closest(contact, n, bitIndex) {
        var self = this;
        var contacts;
        if (!self.bucket) {
          bitIndex = bitIndex || 0;
          if (self.determineBucket(contact.id, bitIndex++) < 0) {
            contacts = self.low.closest(contact, n, bitIndex);
            if (contacts.length < n) {
              contacts = contacts.concat(self.high.closest(contact, n, bitIndex));
            }
          } else {
            contacts = self.high.closest(contact, n, bitIndex);
            if (contacts.length < n) {
              contacts = contacts.concat(self.low.closest(contact, n, bitIndex));
            }
          }
          return contacts.slice(0, n);
        }
        contacts = self.bucket.slice();
        contacts.forEach(function (storedContact) {
          storedContact.distance = KBucket.distance(storedContact.id, contact.id);
        });
        contacts.sort(function (a, b) {
          return a.distance - b.distance;
        });
        return contacts.slice(0, n);
      };
      KBucket.prototype.count = function count() {
        var self = this;
        if (self.bucket) {
          return self.bucket.length;
        } else {
          return self.high.count() + self.low.count();
        }
      };
      KBucket.prototype.determineBucket = function determineBucket(id, bitIndex) {
        var self = this;
        bitIndex = bitIndex || 0;
        var bytesDescribedByBitIndex = parseInt(bitIndex / 8, 10);
        var bitIndexWithinByte = bitIndex % 8;
        if (id.length <= bytesDescribedByBitIndex && bitIndexWithinByte != 0) return -1;
        var byteUnderConsideration = id[bytesDescribedByBitIndex];
        if (byteUnderConsideration & Math.pow(2, 7 - bitIndexWithinByte)) {
          return 1;
        }
        return -1;
      };
      KBucket.prototype.get = function get(id, bitIndex) {
        var self = this;
        if (!self.bucket) {
          bitIndex = bitIndex || 0;
          if (self.determineBucket(id, bitIndex++) < 0) {
            return self.low.get(id, bitIndex);
          } else {
            return self.high.get(id, bitIndex);
          }
        }
        var index = self.indexOf({
          id
        });
        if (index < 0) {
          return null;
        }
        return self.bucket[index];
      };
      KBucket.prototype.indexOf = function indexOf(contact) {
        var self = this;
        for (var i = 0; i < self.bucket.length; i++) {
          if (bufferEqual(self.bucket[i].id, contact.id)) return i;
        }
        return -1;
      };
      KBucket.prototype.remove = function remove(contact, bitIndex) {
        var self = this;
        if (!self.bucket) {
          bitIndex = bitIndex || 0;
          if (self.determineBucket(contact.id, bitIndex++) < 0) {
            return self.low.remove(contact, bitIndex);
          } else {
            return self.high.remove(contact, bitIndex);
          }
        }
        var index = self.indexOf(contact);
        if (index >= 0) self.bucket.splice(index, 1);
        return self;
      };
      KBucket.prototype.splitAndAdd = function splitAndAdd(contact, bitIndex) {
        var self = this;
        self.low = new KBucket({
          arbiter: self.arbiter,
          localNodeId: self.localNodeId,
          root: self.root,
          numberOfNodesPerKBucket: self.numberOfNodesPerKBucket,
          numberOfNodesToPing: self.numberOfNodesToPing
        });
        self.high = new KBucket({
          arbiter: self.arbiter,
          localNodeId: self.localNodeId,
          root: self.root,
          numberOfNodesPerKBucket: self.numberOfNodesPerKBucket,
          numberOfNodesToPing: self.numberOfNodesToPing
        });
        bitIndex = bitIndex || 0;
        self.bucket.forEach(function (storedContact) {
          if (self.determineBucket(storedContact.id, bitIndex) < 0) {
            self.low.add(storedContact);
          } else {
            self.high.add(storedContact);
          }
        });
        self.bucket = void 0;
        if (self.determineBucket(self.localNodeId, bitIndex) < 0) {
          self.high.dontSplit = true;
        } else {
          self.low.dontSplit = true;
        }
        self.add(contact, bitIndex);
        return self;
      };
      KBucket.prototype.toArray = function toArray() {
        var self = this;
        if (self.bucket) {
          return self.bucket.slice(0);
        } else {
          return self.low.toArray().concat(self.high.toArray());
        }
      };
      KBucket.prototype.update = function update(contact, index) {
        var self = this;
        assert.ok(bufferEqual(self.bucket[index].id, contact.id), "indexOf() calculation resulted in wrong index");
        var incumbent = self.bucket[index];
        var selection = self.arbiter(incumbent, contact);
        if (selection === incumbent && incumbent !== contact) {
          return;
        }
        self.bucket.splice(index, 1);
        self.bucket.push(selection);
      };
    }
  });

  // node_modules/buffer-equals/index.js
  var require_buffer_equals = __commonJS({
    "node_modules/buffer-equals/index.js"(exports, module) {
      "use strict";

      module.exports = function (a, b) {
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
          throw new TypeError("Arguments must be Buffers");
        }
        if (a === b) {
          return true;
        }
        if (typeof a.equals === "function") {
          return a.equals(b);
        }
        if (a.length !== b.length) {
          return false;
        }
        for (var i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        return true;
      };
    }
  });

  // node_modules/k-rpc/index.js
  var require_k_rpc = __commonJS({
    "node_modules/k-rpc/index.js"(exports, module) {
      var socket = require_k_rpc_socket();
      var KBucket = require_k_bucket();
      var equals = require_buffer_equals();
      var crypto = __require("crypto");
      var events = __require("events");
      var util = __require("util");
      var K = 20;
      var MAX_CONCURRENCY = 16;
      var BOOTSTRAP_NODES = [{
        host: "router.bittorrent.com",
        port: 6881
      }, {
        host: "router.utorrent.com",
        port: 6881
      }, {
        host: "dht.transmissionbt.com",
        port: 6881
      }];
      module.exports = RPC;
      function RPC(opts) {
        if (!(this instanceof RPC)) return new RPC(opts);
        if (!opts) opts = {};
        var self = this;
        this.id = toBuffer(opts.id || opts.nodeId || crypto.randomBytes(20));
        this.socket = socket(opts);
        this.bootstrap = toBootstrapArray(opts.nodes || opts.bootstrap);
        this.concurrency = opts.concurrency || MAX_CONCURRENCY;
        this.backgroundConcurrency = opts.backgroundConcurrency || this.concurrency / 4 | 0;
        this.k = opts.k || K;
        this.destroyed = false;
        this.pending = [];
        this.nodes = null;
        this.socket.on("query", onquery);
        this.socket.on("response", onresponse);
        this.socket.on("warning", onwarning);
        this.socket.on("error", onerror);
        this.socket.on("update", onupdate);
        this.socket.on("listening", onlistening);
        events.EventEmitter.call(this);
        this.clear();
        function onupdate() {
          while (self.pending.length && self.socket.inflight < self.concurrency) {
            var next = self.pending.shift();
            self.query(next[0], next[1], next[2]);
          }
        }
        function onerror(err) {
          self.emit("error", err);
        }
        function onlistening() {
          self.emit("listening");
        }
        function onwarning(err) {
          self.emit("warning", err);
        }
        function onquery(query, peer) {
          addNode(query.a, peer);
          self.emit("query", query, peer);
        }
        function onresponse(reply, peer) {
          addNode(reply.r, peer);
        }
        function addNode(data, peer) {
          if (data && isNodeId(data.id) && !self.nodes.get(data.id)) {
            self._addNode({
              id: data.id,
              host: peer.address || peer.host,
              port: peer.port,
              distance: 0
            });
          }
        }
      }
      util.inherits(RPC, events.EventEmitter);
      RPC.prototype.response = function (node, query, response, nodes, cb) {
        if (typeof nodes === "function") {
          cb = nodes;
          nodes = null;
        }
        if (!response.id) response.id = this.id;
        if (nodes) response.nodes = encodeNodes(nodes);
        this.socket.response(node, query, response, cb);
      };
      RPC.prototype.error = function (node, query, error, cb) {
        this.socket.error(node, query, error, cb);
      };
      RPC.prototype.bind = function (port, cb) {
        this.socket.bind(port, cb);
      };
      RPC.prototype.address = function () {
        return this.socket.address();
      };
      RPC.prototype.queryAll = function (nodes, message, visit, cb) {
        if (!message.a) message.a = {};
        if (!message.a.id) message.a.id = this.id;
        var stop = false;
        var missing = nodes.length;
        var hits = 0;
        var error = null;
        if (!missing) return cb(new Error("No nodes to query"), 0);
        for (var i = 0; i < nodes.length; i++) {
          this.query(nodes[i], message, done);
        }
        function done(err, res, peer) {
          if (!err) hits++;else if (err.code >= 300 && err.code < 400) error = err;
          if (!err && !stop) {
            if (visit && visit(res, peer) === false) stop = true;
          }
          if (! --missing) cb(hits ? null : error || new Error("All queries failed"), hits);
        }
      };
      RPC.prototype.query = function (node, message, cb) {
        if (this.socket.inflight >= this.concurrency) {
          this.pending.push([node, message, cb]);
        } else {
          if (!message.a) message.a = {};
          if (!message.a.id) message.a.id = this.id;
          if (node.token) message.a.token = node.token;
          this.socket.query(node, message, cb);
        }
      };
      RPC.prototype.destroy = function (cb) {
        this.destroyed = true;
        this.socket.destroy(cb);
      };
      RPC.prototype.clear = function () {
        var self = this;
        this.nodes = new KBucket({
          localNodeId: this.id,
          numberOfNodesPerKBucket: this.k,
          numberOfNodesToPing: this.concurrency,
          ping: onping
        });
        function onping(older, newer) {
          self.emit("ping", older, newer);
        }
      };
      RPC.prototype.populate = function (target, message, cb) {
        this._closest(target, message, true, null, cb);
      };
      RPC.prototype.closest = function (target, message, visit, cb) {
        this._closest(target, message, false, visit, cb);
      };
      RPC.prototype._addNode = function (node) {
        var old = this.nodes.get(node.id);
        this.nodes.add(node);
        if (!old) this.emit("node", node);
      };
      RPC.prototype._closest = function (target, message, background, visit, cb) {
        if (!cb) cb = noop;
        var self = this;
        var count = 0;
        var queried = {};
        var pending = 0;
        var once = true;
        var stop = false;
        if (!message.a) message.a = {};
        if (!message.a.id) message.a.id = this.id;
        var table = new KBucket({
          localNodeId: target,
          numberOfNodesPerKBucket: this.k,
          numberOfNodesToPing: this.concurrency
        });
        var evt = background ? "postupdate" : "update";
        this.socket.on(evt, kick);
        kick();
        function kick() {
          if (self.destroyed || self.socket.inflight >= self.concurrency) return;
          var otherInflight = self.pending.length + self.socket.inflight - pending;
          if (background && self.socket.inflight >= self.backgroundConcurrency && otherInflight) return;
          var closest = table.closest({
            id: target
          }, self.k);
          if (!closest.length || closest.length < self.bootstrap.length) {
            closest = self.nodes.closest({
              id: target
            }, self.k);
            if (!closest.length || closest.length < self.bootstrap.length) bootstrap();
          }
          for (var i = 0; i < closest.length; i++) {
            if (stop) break;
            if (self.socket.inflight >= self.concurrency) return;
            var peer = closest[i];
            var id = peer.host + ":" + peer.port;
            if (queried[id]) continue;
            queried[id] = true;
            pending++;
            self.socket.query(peer, message, afterQuery);
          }
          if (!pending) {
            self.socket.removeListener(evt, kick);
            process.nextTick(done);
          }
        }
        function done() {
          cb(null, count);
        }
        function bootstrap() {
          if (!once) return;
          once = false;
          self.bootstrap.forEach(function (peer) {
            pending++;
            self.socket.query(peer, message, afterQuery);
          });
        }
        function afterQuery(err, res, peer) {
          pending--;
          if (peer) queried[peer.address + ":" + peer.port] = true;
          var r = res && res.r;
          if (!r) return;
          if (peer && peer.id && self.nodes.get(peer.id)) {
            if (err && err.code === "ETIMEDOUT") self.nodes.remove(peer);
          }
          if (!err && isNodeId(r.id)) {
            count++;
            add({
              id: r.id,
              port: peer.port,
              host: peer.host || peer.address,
              distance: 0
            });
          }
          var nodes = r.nodes ? parseNodes(r.nodes) : [];
          for (var i = 0; i < nodes.length; i++) add(nodes[i]);
          if (visit && visit(res, peer) === false) stop = true;
          kick();
        }
        function add(node) {
          if (equals(node.id, self.id)) return;
          table.add(node);
        }
      };
      function toBootstrapArray(val) {
        if (val === false) return [];
        if (val === true) return BOOTSTRAP_NODES;
        return [].concat(val || BOOTSTRAP_NODES).map(parsePeer);
      }
      function isNodeId(id) {
        return id && Buffer.isBuffer(id) && id.length === 20;
      }
      function encodeNodes(nodes) {
        var buf = new Buffer(nodes.length * 26);
        var ptr = 0;
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (!isNodeId(node.id)) continue;
          node.id.copy(buf, ptr);
          ptr += 20;
          var ip = (node.host || node.address).split(".");
          for (var j = 0; j < 4; j++) buf[ptr++] = parseInt(ip[j] || 0, 10);
          buf.writeUInt16BE(node.port, ptr);
          ptr += 2;
        }
        if (ptr === buf.length) return buf;
        return buf.slice(0, ptr);
      }
      function parseNodes(buf) {
        var contacts = [];
        try {
          for (var i = 0; i < buf.length; i += 26) {
            var port = buf.readUInt16BE(i + 24);
            if (!port) continue;
            contacts.push({
              id: buf.slice(i, i + 20),
              host: parseIp(buf, i + 20),
              port,
              distance: 0,
              token: null
            });
          }
        } catch (err) {}
        return contacts;
      }
      function parseIp(buf, offset) {
        return buf[offset++] + "." + buf[offset++] + "." + buf[offset++] + "." + buf[offset++];
      }
      function parsePeer(peer) {
        if (typeof peer === "string") return {
          host: peer.split(":")[0],
          port: Number(peer.split(":")[1])
        };
        return peer;
      }
      function noop() {}
      function toBuffer(str) {
        if (typeof str === "string") return new Buffer(str, "hex");
        if (Buffer.isBuffer(str)) return str;
        throw new Error("Pass a buffer or a string");
      }
    }
  });

  // node_modules/lru/index.js
  var require_lru = __commonJS({
    "node_modules/lru/index.js"(exports, module) {
      var events = __require("events");
      var inherits = require_inherits();
      module.exports = LRU;
      function LRU(opts) {
        if (!(this instanceof LRU)) return new LRU(opts);
        if (typeof opts === "number") opts = {
          max: opts
        };
        if (!opts) opts = {};
        events.EventEmitter.call(this);
        this.cache = {};
        this.head = this.tail = null;
        this.length = 0;
        this.max = opts.max || 1e3;
        this.maxAge = opts.maxAge || 0;
      }
      inherits(LRU, events.EventEmitter);
      LRU.prototype.remove = function (key) {
        if (typeof key !== "string") key = "" + key;
        if (!this.cache.hasOwnProperty(key)) return;
        var element = this.cache[key];
        delete this.cache[key];
        this._unlink(key, element.prev, element.next);
        return element.value;
      };
      LRU.prototype._unlink = function (key, prev, next) {
        this.length--;
        if (this.length === 0) {
          this.head = this.tail = null;
        } else {
          if (this.head === key) {
            this.head = prev;
            this.cache[this.head].next = null;
          } else if (this.tail === key) {
            this.tail = next;
            this.cache[this.tail].prev = null;
          } else {
            this.cache[prev].next = next;
            this.cache[next].prev = prev;
          }
        }
      };
      LRU.prototype.peek = function (key) {
        return this.cache.hasOwnProperty(key) ? this.cache[key].value : null;
      };
      LRU.prototype.set = function (key, value) {
        if (typeof key !== "string") key = "" + key;
        var element;
        if (this.cache.hasOwnProperty(key)) {
          element = this.cache[key];
          element.value = value;
          if (this.maxAge) element.modified = Date.now();
          if (key === this.head) return value;
          this._unlink(key, element.prev, element.next);
        } else {
          element = {
            value,
            modified: 0,
            next: null,
            prev: null
          };
          if (this.maxAge) element.modified = Date.now();
          this.cache[key] = element;
          if (this.length === this.max) this.evict();
        }
        this.length++;
        element.next = null;
        element.prev = this.head;
        if (this.head) this.cache[this.head].next = key;
        this.head = key;
        if (!this.tail) this.tail = key;
        return value;
      };
      LRU.prototype.get = function (key) {
        if (typeof key !== "string") key = "" + key;
        if (!this.cache.hasOwnProperty(key)) return;
        var element = this.cache[key];
        if (this.maxAge && Date.now() - element.modified > this.maxAge) {
          this.remove(key);
          this.emit("evict", {
            key,
            value: element.value
          });
          return;
        }
        if (this.head !== key) {
          if (key === this.tail) {
            this.tail = element.next;
            this.cache[this.tail].prev = null;
          } else {
            this.cache[element.prev].next = element.next;
          }
          this.cache[element.next].prev = element.prev;
          this.cache[this.head].next = key;
          element.prev = this.head;
          element.next = null;
          this.head = key;
        }
        return element.value;
      };
      LRU.prototype.evict = function () {
        if (!this.tail) return;
        var key = this.tail;
        var value = this.remove(this.tail);
        this.emit("evict", {
          key,
          value
        });
      };
    }
  });

  // node_modules/bittorrent-dht/client.js
  var require_client = __commonJS({
    "node_modules/bittorrent-dht/client.js"(exports, module) {
      module.exports = DHT;
      var inherits = require_inherits();
      var EventEmitter = __require("events").EventEmitter;
      var krpc = require_k_rpc();
      var KBucket = require_k_bucket();
      var crypto = __require("crypto");
      var bencode = require_bencode();
      var equals = require_buffer_equals();
      var LRU = require_lru();
      var debug = require_src()("bittorrent-dht");
      var ROTATE_INTERVAL = 5 * 60 * 1e3;
      inherits(DHT, EventEmitter);
      function DHT(opts) {
        if (!(this instanceof DHT)) return new DHT(opts);
        if (!opts) opts = {};
        var self = this;
        this._tables = LRU({
          maxAge: ROTATE_INTERVAL,
          max: opts.maxTables || 1e3
        });
        this._values = LRU(opts.maxValues || 1e3);
        this._peers = new PeerStore(opts.maxPeers || 1e4);
        this._secrets = null;
        this._rpc = krpc(opts);
        this._rpc.on("query", onquery);
        this._rpc.on("node", onnode);
        this._rpc.on("warning", onwarning);
        this._rpc.on("error", onerror);
        this._rpc.on("listening", onlistening);
        this._rotateSecrets();
        this._verify = opts.verify || null;
        this._host = opts.host || null;
        this._interval = setInterval(rotateSecrets, ROTATE_INTERVAL);
        this.listening = false;
        this.destroyed = false;
        this.nodeId = this._rpc.id;
        this.nodes = this._rpc.nodes;
        process.nextTick(bootstrap);
        EventEmitter.call(this);
        this._debug("new DHT %s", this.nodeId);
        function onlistening() {
          self.listening = true;
          self._debug("listening %d", self.address().port);
          self.emit("listening");
        }
        function onquery(query, peer) {
          self._onquery(query, peer);
        }
        function rotateSecrets() {
          self._rotateSecrets();
        }
        function bootstrap() {
          if (!self.destroyed) self._bootstrap(opts.bootstrap !== false);
        }
        function onwarning(err) {
          self.emit("warning", err);
        }
        function onerror(err) {
          self.emit("error", err);
        }
        function onnode(node) {
          self.emit("node", node);
        }
      }
      DHT.prototype.addNode = function (node) {
        var self = this;
        if (node.id) {
          node.id = toBuffer(node.id);
          var old = !!this._rpc.nodes.get(node.id);
          this._rpc.nodes.add(node);
          if (!old) this.emit("node", node);
          return;
        }
        this._sendPing(node, function (_, node2) {
          if (node2) self.addNode(node2);
        });
      };
      DHT.prototype.removeNode = function (id) {
        this._rpc.nodes.remove({
          id: toBuffer(id)
        });
      };
      DHT.prototype._sendPing = function (node, cb) {
        this._rpc.query(node, {
          q: "ping"
        }, function (err, pong, node2) {
          if (err) return cb(err);
          if (!pong.r || !pong.r.id || !Buffer.isBuffer(pong.r.id) || pong.r.id.length !== 20) {
            return cb(new Error("Bad reply"));
          }
          cb(null, {
            id: pong.r.id,
            host: node2.host || node2.address,
            port: node2.port
          });
        });
      };
      DHT.prototype.toJSON = DHT.prototype.toArray = function () {
        return this._rpc.nodes.toArray().map(toNode);
      };
      DHT.prototype.put = function (opts, cb) {
        if (Buffer.isBuffer(opts) || typeof opts === "string") opts = {
          v: opts
        };
        var isMutable = !!opts.k;
        if (opts.v === void 0) {
          throw new Error("opts.v not given");
        }
        if (opts.v.length >= 1e3) {
          throw new Error("v must be less than 1000 bytes in put()");
        }
        if (isMutable && opts.cas !== void 0 && typeof opts.cas !== "number") {
          throw new Error("opts.cas must be an integer if provided");
        }
        if (isMutable && !opts.k) {
          throw new Error("opts.k ed25519 public key required for mutable put");
        }
        if (isMutable && opts.k.length !== 32) {
          throw new Error("opts.k ed25519 public key must be 32 bytes");
        }
        if (isMutable && typeof opts.sign !== "function" && !Buffer.isBuffer(opts.sig)) {
          throw new Error("opts.sign function or options.sig signature is required for mutable put");
        }
        if (isMutable && opts.salt && opts.salt.length > 64) {
          throw new Error("opts.salt is > 64 bytes long");
        }
        if (isMutable && opts.seq === void 0) {
          throw new Error("opts.seq not provided for a mutable update");
        }
        if (isMutable && typeof opts.seq !== "number") {
          throw new Error("opts.seq not an integer");
        }
        return this._put(opts, cb);
      };
      DHT.prototype._put = function (opts, cb) {
        if (!cb) cb = noop;
        var isMutable = !!opts.k;
        var v = typeof opts.v === "string" ? new Buffer(opts.v) : opts.v;
        var key = isMutable ? sha1(opts.salt ? Buffer.concat([opts.salt, opts.k]) : opts.k) : sha1(bencode.encode(v));
        var table = this._tables.get(key.toString("hex"));
        if (!table) return this._preput(key, opts, cb);
        var message = {
          q: "put",
          a: {
            id: this._rpc.id,
            token: null,
            // queryAll sets this
            v
          }
        };
        if (isMutable) {
          if (typeof opts.cas === "number") message.a.cas = opts.cas;
          if (opts.salt) message.a.salt = opts.salt;
          message.a.k = opts.k;
          message.a.seq = opts.seq;
          if (typeof opts.sign === "function") message.a.sig = opts.sign(encodeSigData(message.a));else if (Buffer.isBuffer(opts.sig)) message.a.sig = opts.sig;
        }
        this._values.set(key.toString("hex"), message.a);
        this._rpc.queryAll(table.closest({
          id: key
        }), message, null, function (err, n) {
          if (err) return cb(err, key, n);
          cb(null, key, n);
        });
        return key;
      };
      DHT.prototype._preput = function (key, opts, cb) {
        var self = this;
        this._closest(key, {
          q: "get",
          a: {
            id: this._rpc.id,
            target: key
          }
        }, null, function (err, n) {
          if (err) return cb(err);
          self.put(opts, cb);
        });
        return key;
      };
      DHT.prototype.get = function (key, opts, cb) {
        key = toBuffer(key);
        if (typeof opts === "function") {
          cb = opts;
          opts = null;
        }
        if (!opts) opts = {};
        var verify = opts.verify || this._verify;
        var value = this._values.get(key.toString("hex")) || null;
        if (value) {
          value = createGetResponse(this._rpc.id, null, value);
          return process.nextTick(done);
        }
        this._closest(key, {
          q: "get",
          a: {
            id: this._rpc.id,
            target: key
          }
        }, onreply, done);
        function done(err) {
          if (err) return cb(err);
          cb(null, value);
        }
        function onreply(message) {
          var r = message.r;
          if (!r || !r.v) return true;
          var isMutable = r.k || r.sig;
          if (isMutable) {
            if (!verify || !r.sig || !r.k) return true;
            if (!verify(r.sig, encodeSigData(r), r.k)) return true;
            if (equals(sha1(r.salt ? Buffer.concat([r.salt, r.k]) : r.k), key)) {
              value = r;
              return false;
            }
          } else {
            if (equals(sha1(bencode.encode(r.v)), key)) {
              value = r;
              return false;
            }
          }
          return true;
        }
      };
      DHT.prototype.announce = function (infoHash, port, cb) {
        if (typeof port === "function") return this.announce(infoHash, 0, port);
        infoHash = toBuffer(infoHash);
        if (!cb) cb = noop;
        var table = this._tables.get(infoHash.toString("hex"));
        if (!table) return this._preannounce(infoHash, port, cb);
        if (this._host) {
          var dhtPort = this.listening ? this.address().port : 0;
          this._addPeer({
            host: this._host,
            port: port || dhtPort
          }, infoHash, {
            host: this._host,
            port: dhtPort
          });
        }
        var message = {
          q: "announce_peer",
          a: {
            id: this._rpc.id,
            token: null,
            // queryAll sets this
            info_hash: infoHash,
            port,
            implied_port: port ? 0 : 1
          }
        };
        this._debug("announce %s %d", infoHash, port);
        this._rpc.queryAll(table.closest({
          id: infoHash
        }), message, null, cb);
      };
      DHT.prototype._preannounce = function (infoHash, port, cb) {
        var self = this;
        this.lookup(infoHash, function (err) {
          if (self.destroyed) return cb(new Error("dht is destroyed"));
          if (err) return cb(err);
          self.announce(infoHash, port, cb);
        });
      };
      DHT.prototype.lookup = function (infoHash, cb) {
        infoHash = toBuffer(infoHash);
        if (!cb) cb = noop;
        var self = this;
        var aborted = false;
        this._debug("lookup %s", infoHash);
        process.nextTick(emit);
        this._closest(infoHash, {
          q: "get_peers",
          a: {
            id: this._rpc.id,
            info_hash: infoHash
          }
        }, onreply, cb);
        function emit(values, from) {
          if (!values) values = self._peers.get(infoHash.toString("hex"));
          var peers = decodePeers(values);
          for (var i = 0; i < peers.length; i++) {
            self.emit("peer", peers[i], infoHash, from || null);
          }
        }
        function onreply(message, node) {
          if (aborted) return false;
          if (message.r.values) emit(message.r.values, node);
        }
        return function abort() {
          aborted = true;
        };
      };
      DHT.prototype.address = function () {
        return this._rpc.address();
      };
      DHT.prototype.listen = function (port, cb) {
        if (typeof port === "function") return this.listen(0, port);
        this._rpc.bind(port, cb);
      };
      DHT.prototype.destroy = function (cb) {
        if (this.destroyed) {
          if (cb) process.nextTick(cb);
          return;
        }
        this.destroyed = true;
        var self = this;
        clearInterval(this._interval);
        this._debug("destroying");
        this._rpc.destroy(function () {
          self.emit("close");
          if (cb) cb();
        });
      };
      DHT.prototype._onquery = function (query, peer) {
        var q = query.q.toString();
        this._debug("received %s query from %s:%d", q, peer.address, peer.port);
        if (!query.a) return;
        switch (q) {
          case "ping":
            return this._rpc.response(peer, query, {
              id: this._rpc.id
            });
          case "find_node":
            return this._onfindnode(query, peer);
          case "get_peers":
            return this._ongetpeers(query, peer);
          case "announce_peer":
            return this._onannouncepeer(query, peer);
          case "get":
            return this._onget(query, peer);
          case "put":
            return this._onput(query, peer);
        }
      };
      DHT.prototype._onfindnode = function (query, peer) {
        var target = query.a.target;
        if (!target) return this._rpc.error(peer, query, [203, "`find_node` missing required `a.target` field"]);
        var nodes = this._rpc.nodes.closest({
          id: target
        });
        this._rpc.response(peer, query, {
          id: this._rpc.id
        }, nodes);
      };
      DHT.prototype._ongetpeers = function (query, peer) {
        var host = peer.address || peer.host;
        var infoHash = query.a.info_hash;
        if (!infoHash) return this._rpc.error(peer, query, [203, "`get_peers` missing required `a.info_hash` field"]);
        var r = {
          id: this._rpc.id,
          token: this._generateToken(host)
        };
        var peers = this._peers.get(infoHash.toString("hex"));
        if (peers.length) {
          r.values = peers;
          this._rpc.response(peer, query, r);
        } else {
          this._rpc.response(peer, query, r, this._rpc.nodes.closest({
            id: infoHash
          }));
        }
      };
      DHT.prototype._onannouncepeer = function (query, peer) {
        var host = peer.address || peer.host;
        var port = query.a.implied_port ? peer.port : query.a.port;
        if (!port || typeof port !== "number") return;
        var infoHash = query.a.info_hash;
        var token = query.a.token;
        if (!infoHash || !token) return;
        if (!this._validateToken(host, token)) {
          return this._rpc.error(peer, query, [203, "cannot `announce_peer` with bad token"]);
        }
        this._addPeer({
          host,
          port
        }, infoHash, {
          host,
          port: peer.port
        });
        this._rpc.response(peer, query, {
          id: this._rpc.id
        });
      };
      DHT.prototype._addPeer = function (peer, infoHash, from) {
        this._peers.add(infoHash.toString("hex"), encodePeer(peer.host, peer.port));
        this.emit("announce", peer, infoHash, from);
      };
      DHT.prototype._onget = function (query, peer) {
        var host = peer.address || peer.host;
        var target = query.a.target;
        if (!target) return;
        var token = this._generateToken(host);
        var value = this._values.get(target.toString("hex"));
        if (!value) {
          var nodes = this._rpc.nodes.closest({
            id: target
          });
          this._rpc.response(peer, query, {
            id: this._rpc.id,
            token
          }, nodes);
        } else {
          this._rpc.response(peer, query, createGetResponse(this._rpc.id, token, value));
        }
      };
      DHT.prototype._onput = function (query, peer) {
        var host = peer.address || peer.host;
        var a = query.a;
        if (!a) return;
        var v = query.a.v;
        if (!v) return;
        var token = a.token;
        if (!token) return;
        if (!this._validateToken(host, token)) {
          return this._rpc.error(peer, query, [203, "cannot `put` with bad token"]);
        }
        if (v.length > 1e3) {
          return this._rpc.error(peer, query, [205, "data payload too large"]);
        }
        var isMutable = !!(a.k || a.sig);
        if (isMutable && !a.k && !a.sig) return;
        var key = isMutable ? sha1(a.salt ? Buffer.concat([a.salt, a.k]) : a.k) : sha1(bencode.encode(v));
        var keyHex = key.toString("hex");
        if (isMutable) {
          if (!this._verify) return this._rpc.error(peer, query, [400, "verification not supported"]);
          if (!this._verify(a.sig, encodeSigData(a), a.k)) return;
          var prev = this._values.get(keyHex);
          if (prev && typeof a.cas === "number" && prev.seq !== a.cas) {
            return this._rpc.error(peer, query, [301, "CAS mismatch, re-read and try again"]);
          }
          if (prev && typeof prev.seq === "number" && !(a.seq > prev.seq)) {
            return this._rpc.error(peer, query, [302, "sequence number less than current"]);
          }
          this._values.set(keyHex, {
            v,
            k: a.k,
            salt: a.salt,
            sig: a.sig,
            seq: a.seq
          });
        } else {
          this._values.set(keyHex, {
            v
          });
        }
        this._rpc.response(peer, query, {
          id: this._rpc.id
        });
      };
      DHT.prototype._bootstrap = function (populate) {
        var self = this;
        if (!populate) return process.nextTick(ready);
        this._rpc.populate(self._rpc.id, {
          q: "find_node",
          a: {
            id: self._rpc.id,
            target: self._rpc.id
          }
        }, ready);
        function ready() {
          self._debug("emit ready");
          self.ready = true;
          self.emit("ready");
        }
      };
      DHT.prototype._closest = function (target, message, onmessage, cb) {
        var self = this;
        var table = new KBucket({
          localNodeId: target,
          numberOfNodesPerKBucket: this._rpc.k
        });
        this._rpc.closest(target, message, onreply, done);
        function done(err, n) {
          if (err) return cb(err);
          self._tables.set(target.toString("hex"), table);
          self._debug("visited %d nodes", n);
          cb(null, n);
        }
        function onreply(message2, node) {
          if (!message2.r) return true;
          if (message2.r.token && message2.r.id && Buffer.isBuffer(message2.r.id) && message2.r.id.length === 20) {
            self._debug("found node %s (target: %s)", message2.r.id, target);
            table.add({
              id: message2.r.id,
              host: node.host || node.address,
              port: node.port,
              token: message2.r.token
            });
          }
          if (!onmessage) return true;
          return onmessage(message2, node);
        }
      };
      DHT.prototype._debug = function () {
        if (!debug.enabled) return;
        var args = [].slice.call(arguments);
        args[0] = "[" + this.nodeId.toString("hex").substring(0, 7) + "] " + args[0];
        for (var i = 1; i < args.length; i++) {
          if (Buffer.isBuffer(args[i])) args[i] = args[i].toString("hex");
        }
        debug.apply(null, args);
      };
      DHT.prototype._validateToken = function (host, token) {
        var tokenA = this._generateToken(host, this._secrets[0]);
        var tokenB = this._generateToken(host, this._secrets[1]);
        return equals(token, tokenA) || equals(token, tokenB);
      };
      DHT.prototype._generateToken = function (host, secret) {
        if (!secret) secret = this._secrets[0];
        return crypto.createHash("sha1").update(new Buffer(host, "utf8")).update(secret).digest();
      };
      DHT.prototype._rotateSecrets = function () {
        if (!this._secrets) {
          this._secrets = [crypto.randomBytes(20), crypto.randomBytes(20)];
        } else {
          this._secrets[1] = this._secrets[0];
          this._secrets[0] = crypto.randomBytes(20);
        }
      };
      function noop() {}
      function sha1(buf) {
        return crypto.createHash("sha1").update(buf).digest();
      }
      function createGetResponse(id, token, value) {
        var r = {
          id,
          token,
          v: value.v
        };
        if (value.sig) {
          r.sig = value.sig;
          r.k = value.k;
          if (value.salt) r.salt = value.salt;
          if (typeof value.seq === "number") r.seq = value.seq;
        }
        return r;
      }
      function encodePeer(host, port) {
        var buf = new Buffer(6);
        var ip = host.split(".");
        for (var i = 0; i < 4; i++) buf[i] = parseInt(ip[i] || 0, 10);
        buf.writeUInt16BE(port, 4);
        return buf;
      }
      function decodePeers(buf) {
        var peers = [];
        try {
          for (var i = 0; i < buf.length; i++) {
            var port = buf[i].readUInt16BE(4);
            if (!port) continue;
            peers.push({
              host: parseIp(buf[i], 0),
              port
            });
          }
        } catch (err) {}
        return peers;
      }
      function parseIp(buf, offset) {
        return buf[offset++] + "." + buf[offset++] + "." + buf[offset++] + "." + buf[offset++];
      }
      function encodeSigData(msg) {
        var ref = {
          seq: msg.seq || 0,
          v: msg.v
        };
        if (msg.salt) ref.salt = msg.salt;
        return bencode.encode(ref).slice(1, -1);
      }
      function toNode(node) {
        return {
          host: node.host,
          port: node.port
        };
      }
      function PeerStore(max) {
        this.max = max || 1e4;
        this.used = 0;
        this.peers = LRU(Infinity);
      }
      PeerStore.prototype.add = function (key, peer) {
        var peers = this.peers.get(key);
        if (!peers) {
          peers = {
            values: [],
            map: LRU(Infinity)
          };
          this.peers.set(key, peers);
        }
        var id = peer.toString("hex");
        if (peers.map.get(id)) return;
        var node = {
          index: peers.values.length,
          peer
        };
        peers.map.set(id, node);
        peers.values.push(node);
        if (++this.used > this.max) this._evict();
      };
      PeerStore.prototype._evict = function () {
        var a = this.peers.peek(this.peers.tail);
        var b = a.map.remove(a.map.tail);
        var values = a.values;
        swap(values, b.index, values.length - 1);
        values.pop();
        this.used--;
        if (!values.length) this.peers.remove(this.peers.tail);
      };
      PeerStore.prototype.get = function (key) {
        var node = this.peers.get(key);
        if (!node) return [];
        return pick(node.values, 100);
      };
      function swap(list, a, b) {
        if (a === b) return;
        var tmp = list[a];
        list[a] = list[b];
        list[b] = tmp;
        list[a].index = a;
        list[b].index = b;
      }
      function pick(values, n) {
        var len = Math.min(values.length, n);
        var ptr = 0;
        var res = new Array(len);
        for (var i = 0; i < len; i++) {
          var next = ptr + Math.random() * (values.length - ptr) | 0;
          res[ptr] = values[next].peer;
          swap(values, ptr++, next);
        }
        return res;
      }
      function toBuffer(str) {
        if (Buffer.isBuffer(str)) return str;
        if (typeof str === "string") return new Buffer(str, "hex");
        throw new Error("Pass a buffer or a string");
      }
    }
  });

  // node_modules/re-emitter/index.js
  var require_re_emitter = __commonJS({
    "node_modules/re-emitter/index.js"(exports, module) {
      module.exports = reemit;
      module.exports.filter = filter;
      var EventEmitter = __require("events").EventEmitter;
      function reemit(source, target, events) {
        if (!Array.isArray(events)) events = [events];
        var listeners = [];
        events.forEach(function (event) {
          var listener = function listener() {
            var args = [].slice.call(arguments);
            args.unshift(event);
            target.emit.apply(target, args);
          };
          listeners.push(listener);
          source.on(event, listener);
        });
        return function cancel() {
          events.forEach(function (event, i) {
            source.removeListener(event, listeners[i]);
          });
        };
      }
      function filter(source, events) {
        var emitter = new EventEmitter();
        reemit(source, emitter, events);
        return emitter;
      }
    }
  });

  // node_modules/uniq/uniq.js
  var require_uniq = __commonJS({
    "node_modules/uniq/uniq.js"(exports, module) {
      "use strict";

      function unique_pred(list, compare) {
        var ptr = 1,
          len = list.length,
          a = list[0],
          b = list[0];
        for (var i = 1; i < len; ++i) {
          b = a;
          a = list[i];
          if (compare(a, b)) {
            if (i === ptr) {
              ptr++;
              continue;
            }
            list[ptr++] = a;
          }
        }
        list.length = ptr;
        return list;
      }
      function unique_eq(list) {
        var ptr = 1,
          len = list.length,
          a = list[0],
          b = list[0];
        for (var i = 1; i < len; ++i, b = a) {
          b = a;
          a = list[i];
          if (a !== b) {
            if (i === ptr) {
              ptr++;
              continue;
            }
            list[ptr++] = a;
          }
        }
        list.length = ptr;
        return list;
      }
      function unique(list, compare, sorted) {
        if (list.length === 0) {
          return list;
        }
        if (compare) {
          if (!sorted) {
            list.sort(compare);
          }
          return unique_pred(list, compare);
        }
        if (!sorted) {
          list.sort();
        }
        return unique_eq(list);
      }
      module.exports = unique;
    }
  });

  // node_modules/xtend/mutable.js
  var require_mutable = __commonJS({
    "node_modules/xtend/mutable.js"(exports, module) {
      module.exports = extend;
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      }
    }
  });

  // node_modules/bittorrent-tracker/lib/common-node.js
  var require_common_node = __commonJS({
    "node_modules/bittorrent-tracker/lib/common-node.js"(exports) {
      var querystring = __require("querystring");
      exports.IPV4_RE = /^[\d\.]+$/;
      exports.IPV6_RE = /^[\da-fA-F:]+$/;
      exports.REMOVE_IPV4_MAPPED_IPV6_RE = /^::ffff:/;
      exports.CONNECTION_ID = Buffer.concat([toUInt32(1047), toUInt32(655366528)]);
      exports.ACTIONS = {
        CONNECT: 0,
        ANNOUNCE: 1,
        SCRAPE: 2,
        ERROR: 3
      };
      exports.EVENTS = {
        update: 0,
        completed: 1,
        started: 2,
        stopped: 3
      };
      exports.EVENT_IDS = {
        0: "update",
        1: "completed",
        2: "started",
        3: "stopped"
      };
      exports.EVENT_NAMES = {
        update: "update",
        completed: "complete",
        started: "start",
        stopped: "stop"
      };
      function toUInt32(n) {
        var buf = new Buffer(4);
        buf.writeUInt32BE(n, 0);
        return buf;
      }
      exports.toUInt32 = toUInt32;
      exports.querystringParse = function (q) {
        var saved = querystring.unescape;
        querystring.unescape = unescape;
        var ret = querystring.parse(q);
        querystring.unescape = saved;
        return ret;
      };
      exports.querystringStringify = function (obj) {
        var saved = querystring.escape;
        querystring.escape = escape;
        var ret = querystring.stringify(obj);
        ret = ret.replace(/[\@\*\/\+]/g, function (char) {
          return "%" + char.charCodeAt(0).toString(16).toUpperCase();
        });
        querystring.escape = saved;
        return ret;
      };
    }
  });

  // node_modules/bittorrent-tracker/lib/common.js
  var require_common3 = __commonJS({
    "node_modules/bittorrent-tracker/lib/common.js"(exports) {
      var extend = require_mutable();
      exports.DEFAULT_ANNOUNCE_PEERS = 50;
      exports.MAX_ANNOUNCE_PEERS = 82;
      exports.binaryToHex = function (str) {
        return new Buffer(str, "binary").toString("hex");
      };
      exports.hexToBinary = function (str) {
        return new Buffer(str, "hex").toString("binary");
      };
      var config = require_common_node();
      extend(exports, config);
    }
  });

  // node_modules/ipaddr.js/lib/ipaddr.js
  var require_ipaddr = __commonJS({
    "node_modules/ipaddr.js/lib/ipaddr.js"(exports, module) {
      (function () {
        var expandIPv6, ipaddr, ipv4Part, ipv4Regexes, ipv6Part, ipv6Regexes, matchCIDR, root;
        ipaddr = {};
        root = this;
        if (typeof module !== "undefined" && module !== null && module.exports) {
          module.exports = ipaddr;
        } else {
          root["ipaddr"] = ipaddr;
        }
        matchCIDR = function matchCIDR(first, second, partSize, cidrBits) {
          var part, shift;
          if (first.length !== second.length) {
            throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
          }
          part = 0;
          while (cidrBits > 0) {
            shift = partSize - cidrBits;
            if (shift < 0) {
              shift = 0;
            }
            if (first[part] >> shift !== second[part] >> shift) {
              return false;
            }
            cidrBits -= partSize;
            part += 1;
          }
          return true;
        };
        ipaddr.subnetMatch = function (address, rangeList, defaultName) {
          var rangeName, rangeSubnets, subnet, _i, _len;
          if (defaultName == null) {
            defaultName = "unicast";
          }
          for (rangeName in rangeList) {
            rangeSubnets = rangeList[rangeName];
            if (rangeSubnets[0] && !(rangeSubnets[0] instanceof Array)) {
              rangeSubnets = [rangeSubnets];
            }
            for (_i = 0, _len = rangeSubnets.length; _i < _len; _i++) {
              subnet = rangeSubnets[_i];
              if (address.match.apply(address, subnet)) {
                return rangeName;
              }
            }
          }
          return defaultName;
        };
        ipaddr.IPv4 = function () {
          function IPv4(octets) {
            var octet, _i, _len;
            if (octets.length !== 4) {
              throw new Error("ipaddr: ipv4 octet count should be 4");
            }
            for (_i = 0, _len = octets.length; _i < _len; _i++) {
              octet = octets[_i];
              if (!(0 <= octet && octet <= 255)) {
                throw new Error("ipaddr: ipv4 octet should fit in 8 bits");
              }
            }
            this.octets = octets;
          }
          IPv4.prototype.kind = function () {
            return "ipv4";
          };
          IPv4.prototype.toString = function () {
            return this.octets.join(".");
          };
          IPv4.prototype.toByteArray = function () {
            return this.octets.slice(0);
          };
          IPv4.prototype.match = function (other, cidrRange) {
            var _ref;
            if (cidrRange === void 0) {
              _ref = other, other = _ref[0], cidrRange = _ref[1];
            }
            if (other.kind() !== "ipv4") {
              throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
            }
            return matchCIDR(this.octets, other.octets, 8, cidrRange);
          };
          IPv4.prototype.SpecialRanges = {
            unspecified: [[new IPv4([0, 0, 0, 0]), 8]],
            broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
            multicast: [[new IPv4([224, 0, 0, 0]), 4]],
            linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
            loopback: [[new IPv4([127, 0, 0, 0]), 8]],
            "private": [[new IPv4([10, 0, 0, 0]), 8], [new IPv4([172, 16, 0, 0]), 12], [new IPv4([192, 168, 0, 0]), 16]],
            reserved: [[new IPv4([192, 0, 0, 0]), 24], [new IPv4([192, 0, 2, 0]), 24], [new IPv4([192, 88, 99, 0]), 24], [new IPv4([198, 51, 100, 0]), 24], [new IPv4([203, 0, 113, 0]), 24], [new IPv4([240, 0, 0, 0]), 4]]
          };
          IPv4.prototype.range = function () {
            return ipaddr.subnetMatch(this, this.SpecialRanges);
          };
          IPv4.prototype.toIPv4MappedAddress = function () {
            return ipaddr.IPv6.parse("::ffff:" + this.toString());
          };
          IPv4.prototype.prefixLengthFromSubnetMask = function () {
            var cidr, i, octet, stop, zeros, zerotable, _i;
            zerotable = {
              0: 8,
              128: 7,
              192: 6,
              224: 5,
              240: 4,
              248: 3,
              252: 2,
              254: 1,
              255: 0
            };
            cidr = 0;
            stop = false;
            for (i = _i = 3; _i >= 0; i = _i += -1) {
              octet = this.octets[i];
              if (octet in zerotable) {
                zeros = zerotable[octet];
                if (stop && zeros !== 0) {
                  return null;
                }
                if (zeros !== 8) {
                  stop = true;
                }
                cidr += zeros;
              } else {
                return null;
              }
            }
            return 32 - cidr;
          };
          return IPv4;
        }();
        ipv4Part = "(0?\\d+|0x[a-f0-9]+)";
        ipv4Regexes = {
          fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", "i"),
          longValue: new RegExp("^" + ipv4Part + "$", "i")
        };
        ipaddr.IPv4.parser = function (string) {
          var match, parseIntAuto, part, shift, value;
          parseIntAuto = function parseIntAuto(string2) {
            if (string2[0] === "0" && string2[1] !== "x") {
              return parseInt(string2, 8);
            } else {
              return parseInt(string2);
            }
          };
          if (match = string.match(ipv4Regexes.fourOctet)) {
            return function () {
              var _i, _len, _ref, _results;
              _ref = match.slice(1, 6);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                part = _ref[_i];
                _results.push(parseIntAuto(part));
              }
              return _results;
            }();
          } else if (match = string.match(ipv4Regexes.longValue)) {
            value = parseIntAuto(match[1]);
            if (value > 4294967295 || value < 0) {
              throw new Error("ipaddr: address outside defined range");
            }
            return function () {
              var _i, _results;
              _results = [];
              for (shift = _i = 0; _i <= 24; shift = _i += 8) {
                _results.push(value >> shift & 255);
              }
              return _results;
            }().reverse();
          } else {
            return null;
          }
        };
        ipaddr.IPv6 = function () {
          function IPv6(parts) {
            var i, part, _i, _j, _len, _ref;
            if (parts.length === 16) {
              this.parts = [];
              for (i = _i = 0; _i <= 14; i = _i += 2) {
                this.parts.push(parts[i] << 8 | parts[i + 1]);
              }
            } else if (parts.length === 8) {
              this.parts = parts;
            } else {
              throw new Error("ipaddr: ipv6 part count should be 8 or 16");
            }
            _ref = this.parts;
            for (_j = 0, _len = _ref.length; _j < _len; _j++) {
              part = _ref[_j];
              if (!(0 <= part && part <= 65535)) {
                throw new Error("ipaddr: ipv6 part should fit in 16 bits");
              }
            }
          }
          IPv6.prototype.kind = function () {
            return "ipv6";
          };
          IPv6.prototype.toString = function () {
            var compactStringParts, part, pushPart, state, stringParts, _i, _len;
            stringParts = function () {
              var _i2, _len2, _ref, _results;
              _ref = this.parts;
              _results = [];
              for (_i2 = 0, _len2 = _ref.length; _i2 < _len2; _i2++) {
                part = _ref[_i2];
                _results.push(part.toString(16));
              }
              return _results;
            }.call(this);
            compactStringParts = [];
            pushPart = function pushPart(part2) {
              return compactStringParts.push(part2);
            };
            state = 0;
            for (_i = 0, _len = stringParts.length; _i < _len; _i++) {
              part = stringParts[_i];
              switch (state) {
                case 0:
                  if (part === "0") {
                    pushPart("");
                  } else {
                    pushPart(part);
                  }
                  state = 1;
                  break;
                case 1:
                  if (part === "0") {
                    state = 2;
                  } else {
                    pushPart(part);
                  }
                  break;
                case 2:
                  if (part !== "0") {
                    pushPart("");
                    pushPart(part);
                    state = 3;
                  }
                  break;
                case 3:
                  pushPart(part);
              }
            }
            if (state === 2) {
              pushPart("");
              pushPart("");
            }
            return compactStringParts.join(":");
          };
          IPv6.prototype.toByteArray = function () {
            var bytes, part, _i, _len, _ref;
            bytes = [];
            _ref = this.parts;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              part = _ref[_i];
              bytes.push(part >> 8);
              bytes.push(part & 255);
            }
            return bytes;
          };
          IPv6.prototype.toNormalizedString = function () {
            var part;
            return function () {
              var _i, _len, _ref, _results;
              _ref = this.parts;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                part = _ref[_i];
                _results.push(part.toString(16));
              }
              return _results;
            }.call(this).join(":");
          };
          IPv6.prototype.match = function (other, cidrRange) {
            var _ref;
            if (cidrRange === void 0) {
              _ref = other, other = _ref[0], cidrRange = _ref[1];
            }
            if (other.kind() !== "ipv6") {
              throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
            }
            return matchCIDR(this.parts, other.parts, 16, cidrRange);
          };
          IPv6.prototype.SpecialRanges = {
            unspecified: [new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 128],
            linkLocal: [new IPv6([65152, 0, 0, 0, 0, 0, 0, 0]), 10],
            multicast: [new IPv6([65280, 0, 0, 0, 0, 0, 0, 0]), 8],
            loopback: [new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128],
            uniqueLocal: [new IPv6([64512, 0, 0, 0, 0, 0, 0, 0]), 7],
            ipv4Mapped: [new IPv6([0, 0, 0, 0, 0, 65535, 0, 0]), 96],
            rfc6145: [new IPv6([0, 0, 0, 0, 65535, 0, 0, 0]), 96],
            rfc6052: [new IPv6([100, 65435, 0, 0, 0, 0, 0, 0]), 96],
            "6to4": [new IPv6([8194, 0, 0, 0, 0, 0, 0, 0]), 16],
            teredo: [new IPv6([8193, 0, 0, 0, 0, 0, 0, 0]), 32],
            reserved: [[new IPv6([8193, 3512, 0, 0, 0, 0, 0, 0]), 32]]
          };
          IPv6.prototype.range = function () {
            return ipaddr.subnetMatch(this, this.SpecialRanges);
          };
          IPv6.prototype.isIPv4MappedAddress = function () {
            return this.range() === "ipv4Mapped";
          };
          IPv6.prototype.toIPv4Address = function () {
            var high, low, _ref;
            if (!this.isIPv4MappedAddress()) {
              throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
            }
            _ref = this.parts.slice(-2), high = _ref[0], low = _ref[1];
            return new ipaddr.IPv4([high >> 8, high & 255, low >> 8, low & 255]);
          };
          return IPv6;
        }();
        ipv6Part = "(?:[0-9a-f]+::?)+";
        ipv6Regexes = {
          "native": new RegExp("^(::)?(" + ipv6Part + ")?([0-9a-f]+)?(::)?$", "i"),
          transitional: new RegExp("^((?:" + ipv6Part + ")|(?:::)(?:" + ipv6Part + ")?)" + ("" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$"), "i")
        };
        expandIPv6 = function expandIPv6(string, parts) {
          var colonCount, lastColon, part, replacement, replacementCount;
          if (string.indexOf("::") !== string.lastIndexOf("::")) {
            return null;
          }
          colonCount = 0;
          lastColon = -1;
          while ((lastColon = string.indexOf(":", lastColon + 1)) >= 0) {
            colonCount++;
          }
          if (string.substr(0, 2) === "::") {
            colonCount--;
          }
          if (string.substr(-2, 2) === "::") {
            colonCount--;
          }
          if (colonCount > parts) {
            return null;
          }
          replacementCount = parts - colonCount;
          replacement = ":";
          while (replacementCount--) {
            replacement += "0:";
          }
          string = string.replace("::", replacement);
          if (string[0] === ":") {
            string = string.slice(1);
          }
          if (string[string.length - 1] === ":") {
            string = string.slice(0, -1);
          }
          return function () {
            var _i, _len, _ref, _results;
            _ref = string.split(":");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              part = _ref[_i];
              _results.push(parseInt(part, 16));
            }
            return _results;
          }();
        };
        ipaddr.IPv6.parser = function (string) {
          var match, octet, octets, parts, _i, _len;
          if (string.match(ipv6Regexes["native"])) {
            return expandIPv6(string, 8);
          } else if (match = string.match(ipv6Regexes["transitional"])) {
            parts = expandIPv6(match[1].slice(0, -1), 6);
            if (parts) {
              octets = [parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5])];
              for (_i = 0, _len = octets.length; _i < _len; _i++) {
                octet = octets[_i];
                if (!(0 <= octet && octet <= 255)) {
                  return null;
                }
              }
              parts.push(octets[0] << 8 | octets[1]);
              parts.push(octets[2] << 8 | octets[3]);
              return parts;
            }
          }
          return null;
        };
        ipaddr.IPv4.isIPv4 = ipaddr.IPv6.isIPv6 = function (string) {
          return this.parser(string) !== null;
        };
        ipaddr.IPv4.isValid = function (string) {
          var e;
          try {
            new this(this.parser(string));
            return true;
          } catch (_error) {
            e = _error;
            return false;
          }
        };
        ipaddr.IPv4.isValidFourPartDecimal = function (string) {
          if (ipaddr.IPv4.isValid(string) && string.match(/^\d+(\.\d+){3}$/)) {
            return true;
          } else {
            return false;
          }
        };
        ipaddr.IPv6.isValid = function (string) {
          var e;
          if (typeof string === "string" && string.indexOf(":") === -1) {
            return false;
          }
          try {
            new this(this.parser(string));
            return true;
          } catch (_error) {
            e = _error;
            return false;
          }
        };
        ipaddr.IPv4.parse = ipaddr.IPv6.parse = function (string) {
          var parts;
          parts = this.parser(string);
          if (parts === null) {
            throw new Error("ipaddr: string is not formatted like ip address");
          }
          return new this(parts);
        };
        ipaddr.IPv4.parseCIDR = function (string) {
          var maskLength, match;
          if (match = string.match(/^(.+)\/(\d+)$/)) {
            maskLength = parseInt(match[2]);
            if (maskLength >= 0 && maskLength <= 32) {
              return [this.parse(match[1]), maskLength];
            }
          }
          throw new Error("ipaddr: string is not formatted like an IPv4 CIDR range");
        };
        ipaddr.IPv6.parseCIDR = function (string) {
          var maskLength, match;
          if (match = string.match(/^(.+)\/(\d+)$/)) {
            maskLength = parseInt(match[2]);
            if (maskLength >= 0 && maskLength <= 128) {
              return [this.parse(match[1]), maskLength];
            }
          }
          throw new Error("ipaddr: string is not formatted like an IPv6 CIDR range");
        };
        ipaddr.isValid = function (string) {
          return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
        };
        ipaddr.parse = function (string) {
          if (ipaddr.IPv6.isValid(string)) {
            return ipaddr.IPv6.parse(string);
          } else if (ipaddr.IPv4.isValid(string)) {
            return ipaddr.IPv4.parse(string);
          } else {
            throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
          }
        };
        ipaddr.parseCIDR = function (string) {
          var e;
          try {
            return ipaddr.IPv6.parseCIDR(string);
          } catch (_error) {
            e = _error;
            try {
              return ipaddr.IPv4.parseCIDR(string);
            } catch (_error2) {
              e = _error2;
              throw new Error("ipaddr: the address has neither IPv6 nor IPv4 CIDR format");
            }
          }
        };
        ipaddr.fromByteArray = function (bytes) {
          var length;
          length = bytes.length;
          if (length === 4) {
            return new ipaddr.IPv4(bytes);
          } else if (length === 16) {
            return new ipaddr.IPv6(bytes);
          } else {
            throw new Error("ipaddr: the binary input is neither an IPv6 nor IPv4 address");
          }
        };
        ipaddr.process = function (string) {
          var addr;
          addr = this.parse(string);
          if (addr.kind() === "ipv6" && addr.isIPv4MappedAddress()) {
            return addr.toIPv4Address();
          } else {
            return addr;
          }
        };
      }).call(exports);
    }
  });

  // node_modules/compact2string/index.js
  var require_compact2string = __commonJS({
    "node_modules/compact2string/index.js"(exports, module) {
      var ipaddr = require_ipaddr();
      module.exports = compact2string = function compact2string(buf) {
        switch (buf.length) {
          case 6:
            return buf[0] + "." + buf[1] + "." + buf[2] + "." + buf[3] + ":" + buf.readUInt16BE(4);
            break;
          case 18:
            var hexGroups = [];
            for (var i = 0; i < 8; i++) {
              hexGroups.push(buf.readUInt16BE(i * 2).toString(16));
            }
            var host = ipaddr.parse(hexGroups.join(":")).toString();
            return "[" + host + "]:" + buf.readUInt16BE(16);
          default:
            throw new Error("Invalid Compact IP/PORT, It should contain 6 or 18 bytes");
        }
      };
      compact2string.multi = function (buf) {
        if (buf.length % 6 !== 0) throw new Error("buf length isn't multiple of compact IP/PORTs (6 bytes)");
        var output = [];
        for (var i = 0; i <= buf.length - 1; i = i + 6) {
          output.push(compact2string(buf.slice(i, i + 6)));
        }
        return output;
      };
      compact2string.multi6 = function (buf) {
        if (buf.length % 18 !== 0) throw new Error("buf length isn't multiple of compact IP6/PORTs (18 bytes)");
        var output = [];
        for (var i = 0; i <= buf.length - 1; i = i + 18) {
          output.push(compact2string(buf.slice(i, i + 18)));
        }
        return output;
      };
    }
  });

  // node_modules/simple-concat/index.js
  var require_simple_concat = __commonJS({
    "node_modules/simple-concat/index.js"(exports, module) {
      module.exports = function (stream, cb) {
        var chunks = [];
        stream.on("data", function (chunk) {
          chunks.push(chunk);
        });
        stream.once("end", function () {
          if (cb) cb(null, Buffer.concat(chunks));
          cb = null;
        });
        stream.once("error", function (err) {
          if (cb) cb(err);
          cb = null;
        });
      };
    }
  });

  // node_modules/unzip-response/index.js
  var require_unzip_response = __commonJS({
    "node_modules/unzip-response/index.js"(exports, module) {
      "use strict";

      var PassThrough = __require("stream").PassThrough;
      var zlib = __require("zlib");
      module.exports = function (res) {
        if (["gzip", "deflate"].indexOf(res.headers["content-encoding"]) === -1) {
          return res;
        }
        var unzip = zlib.createUnzip();
        var stream = new PassThrough();
        stream.httpVersion = res.httpVersion;
        stream.headers = res.headers;
        stream.rawHeaders = res.rawHeaders;
        stream.trailers = res.trailers;
        stream.rawTrailers = res.rawTrailers;
        stream.setTimeout = res.setTimeout.bind(res);
        stream.statusCode = res.statusCode;
        stream.statusMessage = res.statusMessage;
        stream.socket = res.socket;
        unzip.on("error", function (err) {
          if (err.code === "Z_BUF_ERROR") {
            stream.end();
            return;
          }
          stream.emit("error", err);
        });
        res.pipe(unzip).pipe(stream);
        return stream;
      };
    }
  });

  // node_modules/simple-get/index.js
  var require_simple_get = __commonJS({
    "node_modules/simple-get/index.js"(exports, module) {
      module.exports = simpleGet;
      var concat = require_simple_concat();
      var http = __require("http");
      var https = __require("https");
      var once = require_once();
      var querystring = __require("querystring");
      var unzipResponse = require_unzip_response();
      var url = __require("url");
      function simpleGet(opts, cb) {
        opts = typeof opts === "string" ? {
          url: opts
        } : Object.assign({}, opts);
        cb = once(cb);
        if (opts.url) parseOptsUrl(opts);
        if (opts.headers == null) opts.headers = {};
        if (opts.maxRedirects == null) opts.maxRedirects = 10;
        var body;
        if (opts.form) body = typeof opts.form === "string" ? opts.form : querystring.stringify(opts.form);
        if (opts.body) body = opts.json ? JSON.stringify(opts.body) : opts.body;
        if (opts.json) opts.headers.accept = "application/json";
        if (opts.json && body) opts.headers["content-type"] = "application/json";
        if (opts.form) opts.headers["content-type"] = "application/x-www-form-urlencoded";
        if (body) opts.headers["content-length"] = Buffer.byteLength(body);
        delete opts.body;
        delete opts.form;
        if (body && !opts.method) opts.method = "POST";
        if (opts.method) opts.method = opts.method.toUpperCase();
        var customAcceptEncoding = Object.keys(opts.headers).some(function (h) {
          return h.toLowerCase() === "accept-encoding";
        });
        if (!customAcceptEncoding) opts.headers["accept-encoding"] = "gzip, deflate";
        var protocol = opts.protocol === "https:" ? https : http;
        var req = protocol.request(opts, function (res) {
          if (res.statusCode >= 300 && res.statusCode < 400 && "location" in res.headers) {
            opts.url = res.headers.location;
            parseOptsUrl(opts);
            res.resume();
            opts.maxRedirects -= 1;
            if (opts.maxRedirects > 0) simpleGet(opts, cb);else cb(new Error("too many redirects"));
            return;
          }
          var tryUnzip = typeof unzipResponse === "function" && opts.method !== "HEAD";
          cb(null, tryUnzip ? unzipResponse(res) : res);
        });
        req.on("error", cb);
        req.end(body);
        return req;
      }
      simpleGet.concat = function (opts, cb) {
        return simpleGet(opts, function (err, res) {
          if (err) return cb(err);
          concat(res, function (err2, data) {
            if (err2) return cb(err2);
            if (opts.json) {
              try {
                data = JSON.parse(data.toString());
              } catch (err3) {
                return cb(err3, res, data);
              }
            }
            cb(null, res, data);
          });
        });
      };
      ["get", "post", "put", "patch", "head", "delete"].forEach(function (method) {
        simpleGet[method] = function (opts, cb) {
          if (typeof opts === "string") opts = {
            url: opts
          };
          opts.method = method.toUpperCase();
          return simpleGet(opts, cb);
        };
      });
      function parseOptsUrl(opts) {
        var loc = url.parse(opts.url);
        if (loc.hostname) opts.hostname = loc.hostname;
        if (loc.port) opts.port = loc.port;
        if (loc.protocol) opts.protocol = loc.protocol;
        if (loc.auth) opts.auth = loc.auth;
        opts.path = loc.path;
        delete opts.url;
      }
    }
  });

  // node_modules/bittorrent-tracker/lib/client/tracker.js
  var require_tracker = __commonJS({
    "node_modules/bittorrent-tracker/lib/client/tracker.js"(exports, module) {
      module.exports = Tracker;
      var EventEmitter = __require("events").EventEmitter;
      var inherits = require_inherits();
      inherits(Tracker, EventEmitter);
      function Tracker(client, announceUrl) {
        var self = this;
        EventEmitter.call(self);
        self.client = client;
        self.announceUrl = announceUrl;
        self.interval = null;
        self.destroyed = false;
      }
      Tracker.prototype.setInterval = function (intervalMs) {
        var self = this;
        if (intervalMs == null) intervalMs = self.DEFAULT_ANNOUNCE_INTERVAL;
        clearInterval(self.interval);
        if (intervalMs) {
          self.interval = setInterval(function () {
            self.announce(self.client._defaultAnnounceOpts());
          }, intervalMs);
          if (self.interval.unref) self.interval.unref();
        }
      };
    }
  });

  // node_modules/bittorrent-tracker/lib/client/http-tracker.js
  var require_http_tracker = __commonJS({
    "node_modules/bittorrent-tracker/lib/client/http-tracker.js"(exports, module) {
      module.exports = HTTPTracker;
      var bencode = require_bencode();
      var compact2string2 = require_compact2string();
      var debug = require_src()("bittorrent-tracker:http-tracker");
      var extend = require_immutable();
      var get = require_simple_get();
      var inherits = require_inherits();
      var common = require_common3();
      var Tracker = require_tracker();
      var HTTP_SCRAPE_SUPPORT = /\/(announce)[^\/]*$/;
      inherits(HTTPTracker, Tracker);
      function HTTPTracker(client, announceUrl, opts) {
        var self = this;
        Tracker.call(self, client, announceUrl);
        debug("new http tracker %s", announceUrl);
        self.scrapeUrl = null;
        var m;
        if (m = self.announceUrl.match(HTTP_SCRAPE_SUPPORT)) {
          self.scrapeUrl = self.announceUrl.slice(0, m.index) + "/scrape" + self.announceUrl.slice(m.index + 9);
        }
      }
      HTTPTracker.prototype.DEFAULT_ANNOUNCE_INTERVAL = 30 * 60 * 1e3;
      HTTPTracker.prototype.announce = function (opts) {
        var self = this;
        if (self.destroyed) return;
        var params = extend(opts, {
          compact: opts.compact == null ? 1 : opts.compact,
          info_hash: self.client._infoHashBinary,
          peer_id: self.client._peerIdBinary,
          port: self.client._port
        });
        if (self._trackerId) params.trackerid = self._trackerId;
        self._request(self.announceUrl, params, function (data) {
          self._onAnnounceResponse(data);
        });
      };
      HTTPTracker.prototype.scrape = function (opts) {
        var self = this;
        if (self.destroyed) return;
        if (!self.scrapeUrl) {
          self.client.emit("error", new Error("scrape not supported " + self.announceUrl));
          return;
        }
        var infoHashes = Array.isArray(opts.infoHash) && opts.infoHash.length > 0 ? opts.infoHash.map(function (infoHash) {
          return infoHash.toString("binary");
        }) : opts.infoHash && opts.infoHash.toString("binary") || self.client._infoHashBinary;
        var params = {
          info_hash: infoHashes
        };
        self._request(self.scrapeUrl, params, function (data) {
          self._onScrapeResponse(data);
        });
      };
      HTTPTracker.prototype.destroy = function (cb) {
        var self = this;
        if (self.destroyed) return cb(null);
        self.destroyed = true;
        clearInterval(self.interval);
        cb(null);
      };
      HTTPTracker.prototype._request = function (requestUrl, params, cb) {
        var self = this;
        var u = requestUrl + (requestUrl.indexOf("?") === -1 ? "?" : "&") + common.querystringStringify(params);
        get.concat(u, function (err, res, data) {
          if (self.destroyed) return;
          if (err) return self.client.emit("warning", err);
          if (res.statusCode !== 200) {
            return self.client.emit("warning", new Error("Non-200 response code " + res.statusCode + " from " + self.announceUrl));
          }
          if (!data || data.length === 0) {
            return self.client.emit("warning", new Error("Invalid tracker response from" + self.announceUrl));
          }
          try {
            data = bencode.decode(data);
          } catch (err2) {
            return self.client.emit("warning", new Error("Error decoding tracker response: " + err2.message));
          }
          var failure = data["failure reason"];
          if (failure) {
            debug("failure from " + requestUrl + " (" + failure + ")");
            return self.client.emit("warning", new Error(failure));
          }
          var warning = data["warning message"];
          if (warning) {
            debug("warning from " + requestUrl + " (" + warning + ")");
            self.client.emit("warning", new Error(warning));
          }
          debug("response from " + requestUrl);
          cb(data);
        });
      };
      HTTPTracker.prototype._onAnnounceResponse = function (data) {
        var self = this;
        var interval = data.interval || data["min interval"];
        if (interval) self.setInterval(interval * 1e3);
        var trackerId = data["tracker id"];
        if (trackerId) {
          self._trackerId = trackerId;
        }
        self.client.emit("update", {
          announce: self.announceUrl,
          complete: data.complete,
          incomplete: data.incomplete
        });
        var addrs;
        if (Buffer.isBuffer(data.peers)) {
          try {
            addrs = compact2string2.multi(data.peers);
          } catch (err) {
            return self.client.emit("warning", err);
          }
          addrs.forEach(function (addr) {
            self.client.emit("peer", addr);
          });
        } else if (Array.isArray(data.peers)) {
          data.peers.forEach(function (peer) {
            self.client.emit("peer", peer.ip + ":" + peer.port);
          });
        }
        if (Buffer.isBuffer(data.peers6)) {
          try {
            addrs = compact2string2.multi6(data.peers6);
          } catch (err) {
            return self.client.emit("warning", err);
          }
          addrs.forEach(function (addr) {
            self.client.emit("peer", addr);
          });
        } else if (Array.isArray(data.peers6)) {
          data.peers6.forEach(function (peer) {
            var ip = /^\[/.test(peer.ip) || !/:/.test(peer.ip) ? peer.ip : "[" + peer.ip + "]";
            self.client.emit("peer", ip + ":" + peer.port);
          });
        }
      };
      HTTPTracker.prototype._onScrapeResponse = function (data) {
        var self = this;
        data = data.files || data.host || {};
        var keys = Object.keys(data);
        if (keys.length === 0) {
          self.client.emit("warning", new Error("invalid scrape response"));
          return;
        }
        keys.forEach(function (infoHash) {
          var response = data[infoHash];
          self.client.emit("scrape", {
            announce: self.announceUrl,
            infoHash: common.binaryToHex(infoHash),
            complete: response.complete,
            incomplete: response.incomplete,
            downloaded: response.downloaded
          });
        });
      };
    }
  });

  // node_modules/bn.js/lib/bn.js
  var require_bn = __commonJS({
    "node_modules/bn.js/lib/bn.js"(exports, module) {
      (function (module2, exports2) {
        "use strict";

        function assert(val, msg) {
          if (!val) throw new Error(msg || "Assertion failed");
        }
        function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function TempCtor() {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
        function BN(number, base, endian) {
          if (BN.isBN(number)) {
            return number;
          }
          this.negative = 0;
          this.words = null;
          this.length = 0;
          this.red = null;
          if (number !== null) {
            if (base === "le" || base === "be") {
              endian = base;
              base = 10;
            }
            this._init(number || 0, base || 10, endian || "be");
          }
        }
        if (_typeof(module2) === "object") {
          module2.exports = BN;
        } else {
          exports2.BN = BN;
        }
        BN.BN = BN;
        BN.wordSize = 26;
        var Buffer2;
        try {
          Buffer2 = __require("buffer").Buffer;
        } catch (e) {}
        BN.isBN = function isBN(num) {
          if (num instanceof BN) {
            return true;
          }
          return num !== null && _typeof(num) === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
        };
        BN.max = function max(left, right) {
          if (left.cmp(right) > 0) return left;
          return right;
        };
        BN.min = function min(left, right) {
          if (left.cmp(right) < 0) return left;
          return right;
        };
        BN.prototype._init = function init(number, base, endian) {
          if (typeof number === "number") {
            return this._initNumber(number, base, endian);
          }
          if (_typeof(number) === "object") {
            return this._initArray(number, base, endian);
          }
          if (base === "hex") {
            base = 16;
          }
          assert(base === (base | 0) && base >= 2 && base <= 36);
          number = number.toString().replace(/\s+/g, "");
          var start = 0;
          if (number[0] === "-") {
            start++;
          }
          if (base === 16) {
            this._parseHex(number, start);
          } else {
            this._parseBase(number, base, start);
          }
          if (number[0] === "-") {
            this.negative = 1;
          }
          this.strip();
          if (endian !== "le") return;
          this._initArray(this.toArray(), base, endian);
        };
        BN.prototype._initNumber = function _initNumber(number, base, endian) {
          if (number < 0) {
            this.negative = 1;
            number = -number;
          }
          if (number < 67108864) {
            this.words = [number & 67108863];
            this.length = 1;
          } else if (number < 4503599627370496) {
            this.words = [number & 67108863, number / 67108864 & 67108863];
            this.length = 2;
          } else {
            assert(number < 9007199254740992);
            this.words = [number & 67108863, number / 67108864 & 67108863, 1];
            this.length = 3;
          }
          if (endian !== "le") return;
          this._initArray(this.toArray(), base, endian);
        };
        BN.prototype._initArray = function _initArray(number, base, endian) {
          assert(typeof number.length === "number");
          if (number.length <= 0) {
            this.words = [0];
            this.length = 1;
            return this;
          }
          this.length = Math.ceil(number.length / 3);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }
          var j, w;
          var off = 0;
          if (endian === "be") {
            for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
              w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
              this.words[j] |= w << off & 67108863;
              this.words[j + 1] = w >>> 26 - off & 67108863;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          } else if (endian === "le") {
            for (i = 0, j = 0; i < number.length; i += 3) {
              w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
              this.words[j] |= w << off & 67108863;
              this.words[j + 1] = w >>> 26 - off & 67108863;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          }
          return this.strip();
        };
        function parseHex(str, start, end) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;
            r <<= 4;
            if (c >= 49 && c <= 54) {
              r |= c - 49 + 10;
            } else if (c >= 17 && c <= 22) {
              r |= c - 17 + 10;
            } else {
              r |= c & 15;
            }
          }
          return r;
        }
        BN.prototype._parseHex = function _parseHex(number, start) {
          this.length = Math.ceil((number.length - start) / 6);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }
          var j, w;
          var off = 0;
          for (i = number.length - 6, j = 0; i >= start; i -= 6) {
            w = parseHex(number, i, i + 6);
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] |= w >>> 26 - off & 4194303;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
          if (i + 6 !== start) {
            w = parseHex(number, start, i + 6);
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] |= w >>> 26 - off & 4194303;
          }
          this.strip();
        };
        function parseBase(str, start, end, mul) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;
            r *= mul;
            if (c >= 49) {
              r += c - 49 + 10;
            } else if (c >= 17) {
              r += c - 17 + 10;
            } else {
              r += c;
            }
          }
          return r;
        }
        BN.prototype._parseBase = function _parseBase(number, base, start) {
          this.words = [0];
          this.length = 1;
          for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) {
            limbLen++;
          }
          limbLen--;
          limbPow = limbPow / base | 0;
          var total = number.length - start;
          var mod = total % limbLen;
          var end = Math.min(total, total - mod) + start;
          var word = 0;
          for (var i = start; i < end; i += limbLen) {
            word = parseBase(number, i, i + limbLen, base);
            this.imuln(limbPow);
            if (this.words[0] + word < 67108864) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }
          if (mod !== 0) {
            var pow = 1;
            word = parseBase(number, i, number.length, base);
            for (i = 0; i < mod; i++) {
              pow *= base;
            }
            this.imuln(pow);
            if (this.words[0] + word < 67108864) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }
        };
        BN.prototype.copy = function copy(dest) {
          dest.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            dest.words[i] = this.words[i];
          }
          dest.length = this.length;
          dest.negative = this.negative;
          dest.red = this.red;
        };
        BN.prototype.clone = function clone() {
          var r = new BN(null);
          this.copy(r);
          return r;
        };
        BN.prototype._expand = function _expand(size) {
          while (this.length < size) {
            this.words[this.length++] = 0;
          }
          return this;
        };
        BN.prototype.strip = function strip() {
          while (this.length > 1 && this.words[this.length - 1] === 0) {
            this.length--;
          }
          return this._normSign();
        };
        BN.prototype._normSign = function _normSign() {
          if (this.length === 1 && this.words[0] === 0) {
            this.negative = 0;
          }
          return this;
        };
        BN.prototype.inspect = function inspect() {
          return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
        };
        var zeros = ["", "0", "00", "000", "0000", "00000", "000000", "0000000", "00000000", "000000000", "0000000000", "00000000000", "000000000000", "0000000000000", "00000000000000", "000000000000000", "0000000000000000", "00000000000000000", "000000000000000000", "0000000000000000000", "00000000000000000000", "000000000000000000000", "0000000000000000000000", "00000000000000000000000", "000000000000000000000000", "0000000000000000000000000"];
        var groupSizes = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
        var groupBases = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 1e7, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 243e5, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176];
        BN.prototype.toString = function toString(base, padding) {
          base = base || 10;
          padding = padding | 0 || 1;
          var out;
          if (base === 16 || base === "hex") {
            out = "";
            var off = 0;
            var carry = 0;
            for (var i = 0; i < this.length; i++) {
              var w = this.words[i];
              var word = ((w << off | carry) & 16777215).toString(16);
              carry = w >>> 24 - off & 16777215;
              if (carry !== 0 || i !== this.length - 1) {
                out = zeros[6 - word.length] + word + out;
              } else {
                out = word + out;
              }
              off += 2;
              if (off >= 26) {
                off -= 26;
                i--;
              }
            }
            if (carry !== 0) {
              out = carry.toString(16) + out;
            }
            while (out.length % padding !== 0) {
              out = "0" + out;
            }
            if (this.negative !== 0) {
              out = "-" + out;
            }
            return out;
          }
          if (base === (base | 0) && base >= 2 && base <= 36) {
            var groupSize = groupSizes[base];
            var groupBase = groupBases[base];
            out = "";
            var c = this.clone();
            c.negative = 0;
            while (!c.isZero()) {
              var r = c.modn(groupBase).toString(base);
              c = c.idivn(groupBase);
              if (!c.isZero()) {
                out = zeros[groupSize - r.length] + r + out;
              } else {
                out = r + out;
              }
            }
            if (this.isZero()) {
              out = "0" + out;
            }
            while (out.length % padding !== 0) {
              out = "0" + out;
            }
            if (this.negative !== 0) {
              out = "-" + out;
            }
            return out;
          }
          assert(false, "Base should be between 2 and 36");
        };
        BN.prototype.toNumber = function toNumber() {
          var ret = this.words[0];
          if (this.length === 2) {
            ret += this.words[1] * 67108864;
          } else if (this.length === 3 && this.words[2] === 1) {
            ret += 4503599627370496 + this.words[1] * 67108864;
          } else if (this.length > 2) {
            assert(false, "Number can only safely store up to 53 bits");
          }
          return this.negative !== 0 ? -ret : ret;
        };
        BN.prototype.toJSON = function toJSON() {
          return this.toString(16);
        };
        BN.prototype.toBuffer = function toBuffer(endian, length) {
          assert(typeof Buffer2 !== "undefined");
          return this.toArrayLike(Buffer2, endian, length);
        };
        BN.prototype.toArray = function toArray(endian, length) {
          return this.toArrayLike(Array, endian, length);
        };
        BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
          var byteLength = this.byteLength();
          var reqLength = length || Math.max(1, byteLength);
          assert(byteLength <= reqLength, "byte array longer than desired length");
          assert(reqLength > 0, "Requested array length <= 0");
          this.strip();
          var littleEndian = endian === "le";
          var res = new ArrayType(reqLength);
          var b, i;
          var q = this.clone();
          if (!littleEndian) {
            for (i = 0; i < reqLength - byteLength; i++) {
              res[i] = 0;
            }
            for (i = 0; !q.isZero(); i++) {
              b = q.andln(255);
              q.iushrn(8);
              res[reqLength - i - 1] = b;
            }
          } else {
            for (i = 0; !q.isZero(); i++) {
              b = q.andln(255);
              q.iushrn(8);
              res[i] = b;
            }
            for (; i < reqLength; i++) {
              res[i] = 0;
            }
          }
          return res;
        };
        if (Math.clz32) {
          BN.prototype._countBits = function _countBits(w) {
            return 32 - Math.clz32(w);
          };
        } else {
          BN.prototype._countBits = function _countBits(w) {
            var t = w;
            var r = 0;
            if (t >= 4096) {
              r += 13;
              t >>>= 13;
            }
            if (t >= 64) {
              r += 7;
              t >>>= 7;
            }
            if (t >= 8) {
              r += 4;
              t >>>= 4;
            }
            if (t >= 2) {
              r += 2;
              t >>>= 2;
            }
            return r + t;
          };
        }
        BN.prototype._zeroBits = function _zeroBits(w) {
          if (w === 0) return 26;
          var t = w;
          var r = 0;
          if ((t & 8191) === 0) {
            r += 13;
            t >>>= 13;
          }
          if ((t & 127) === 0) {
            r += 7;
            t >>>= 7;
          }
          if ((t & 15) === 0) {
            r += 4;
            t >>>= 4;
          }
          if ((t & 3) === 0) {
            r += 2;
            t >>>= 2;
          }
          if ((t & 1) === 0) {
            r++;
          }
          return r;
        };
        BN.prototype.bitLength = function bitLength() {
          var w = this.words[this.length - 1];
          var hi = this._countBits(w);
          return (this.length - 1) * 26 + hi;
        };
        function toBitArray(num) {
          var w = new Array(num.bitLength());
          for (var bit = 0; bit < w.length; bit++) {
            var off = bit / 26 | 0;
            var wbit = bit % 26;
            w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
          }
          return w;
        }
        BN.prototype.zeroBits = function zeroBits() {
          if (this.isZero()) return 0;
          var r = 0;
          for (var i = 0; i < this.length; i++) {
            var b = this._zeroBits(this.words[i]);
            r += b;
            if (b !== 26) break;
          }
          return r;
        };
        BN.prototype.byteLength = function byteLength() {
          return Math.ceil(this.bitLength() / 8);
        };
        BN.prototype.toTwos = function toTwos(width) {
          if (this.negative !== 0) {
            return this.abs().inotn(width).iaddn(1);
          }
          return this.clone();
        };
        BN.prototype.fromTwos = function fromTwos(width) {
          if (this.testn(width - 1)) {
            return this.notn(width).iaddn(1).ineg();
          }
          return this.clone();
        };
        BN.prototype.isNeg = function isNeg() {
          return this.negative !== 0;
        };
        BN.prototype.neg = function neg() {
          return this.clone().ineg();
        };
        BN.prototype.ineg = function ineg() {
          if (!this.isZero()) {
            this.negative ^= 1;
          }
          return this;
        };
        BN.prototype.iuor = function iuor(num) {
          while (this.length < num.length) {
            this.words[this.length++] = 0;
          }
          for (var i = 0; i < num.length; i++) {
            this.words[i] = this.words[i] | num.words[i];
          }
          return this.strip();
        };
        BN.prototype.ior = function ior(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuor(num);
        };
        BN.prototype.or = function or(num) {
          if (this.length > num.length) return this.clone().ior(num);
          return num.clone().ior(this);
        };
        BN.prototype.uor = function uor(num) {
          if (this.length > num.length) return this.clone().iuor(num);
          return num.clone().iuor(this);
        };
        BN.prototype.iuand = function iuand(num) {
          var b;
          if (this.length > num.length) {
            b = num;
          } else {
            b = this;
          }
          for (var i = 0; i < b.length; i++) {
            this.words[i] = this.words[i] & num.words[i];
          }
          this.length = b.length;
          return this.strip();
        };
        BN.prototype.iand = function iand(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuand(num);
        };
        BN.prototype.and = function and(num) {
          if (this.length > num.length) return this.clone().iand(num);
          return num.clone().iand(this);
        };
        BN.prototype.uand = function uand(num) {
          if (this.length > num.length) return this.clone().iuand(num);
          return num.clone().iuand(this);
        };
        BN.prototype.iuxor = function iuxor(num) {
          var a;
          var b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }
          for (var i = 0; i < b.length; i++) {
            this.words[i] = a.words[i] ^ b.words[i];
          }
          if (this !== a) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }
          this.length = a.length;
          return this.strip();
        };
        BN.prototype.ixor = function ixor(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuxor(num);
        };
        BN.prototype.xor = function xor(num) {
          if (this.length > num.length) return this.clone().ixor(num);
          return num.clone().ixor(this);
        };
        BN.prototype.uxor = function uxor(num) {
          if (this.length > num.length) return this.clone().iuxor(num);
          return num.clone().iuxor(this);
        };
        BN.prototype.inotn = function inotn(width) {
          assert(typeof width === "number" && width >= 0);
          var bytesNeeded = Math.ceil(width / 26) | 0;
          var bitsLeft = width % 26;
          this._expand(bytesNeeded);
          if (bitsLeft > 0) {
            bytesNeeded--;
          }
          for (var i = 0; i < bytesNeeded; i++) {
            this.words[i] = ~this.words[i] & 67108863;
          }
          if (bitsLeft > 0) {
            this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
          }
          return this.strip();
        };
        BN.prototype.notn = function notn(width) {
          return this.clone().inotn(width);
        };
        BN.prototype.setn = function setn(bit, val) {
          assert(typeof bit === "number" && bit >= 0);
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          this._expand(off + 1);
          if (val) {
            this.words[off] = this.words[off] | 1 << wbit;
          } else {
            this.words[off] = this.words[off] & ~(1 << wbit);
          }
          return this.strip();
        };
        BN.prototype.iadd = function iadd(num) {
          var r;
          if (this.negative !== 0 && num.negative === 0) {
            this.negative = 0;
            r = this.isub(num);
            this.negative ^= 1;
            return this._normSign();
          } else if (this.negative === 0 && num.negative !== 0) {
            num.negative = 0;
            r = this.isub(num);
            num.negative = 1;
            return r._normSign();
          }
          var a, b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }
          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
            this.words[i] = r & 67108863;
            carry = r >>> 26;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            this.words[i] = r & 67108863;
            carry = r >>> 26;
          }
          this.length = a.length;
          if (carry !== 0) {
            this.words[this.length] = carry;
            this.length++;
          } else if (a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }
          return this;
        };
        BN.prototype.add = function add(num) {
          var res;
          if (num.negative !== 0 && this.negative === 0) {
            num.negative = 0;
            res = this.sub(num);
            num.negative ^= 1;
            return res;
          } else if (num.negative === 0 && this.negative !== 0) {
            this.negative = 0;
            res = num.sub(this);
            this.negative = 1;
            return res;
          }
          if (this.length > num.length) return this.clone().iadd(num);
          return num.clone().iadd(this);
        };
        BN.prototype.isub = function isub(num) {
          if (num.negative !== 0) {
            num.negative = 0;
            var r = this.iadd(num);
            num.negative = 1;
            return r._normSign();
          } else if (this.negative !== 0) {
            this.negative = 0;
            this.iadd(num);
            this.negative = 1;
            return this._normSign();
          }
          var cmp = this.cmp(num);
          if (cmp === 0) {
            this.negative = 0;
            this.length = 1;
            this.words[0] = 0;
            return this;
          }
          var a, b;
          if (cmp > 0) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }
          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 67108863;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 67108863;
          }
          if (carry === 0 && i < a.length && a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }
          this.length = Math.max(this.length, i);
          if (a !== this) {
            this.negative = 1;
          }
          return this.strip();
        };
        BN.prototype.sub = function sub(num) {
          return this.clone().isub(num);
        };
        function smallMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          var len = self.length + num.length | 0;
          out.length = len;
          len = len - 1 | 0;
          var a = self.words[0] | 0;
          var b = num.words[0] | 0;
          var r = a * b;
          var lo = r & 67108863;
          var carry = r / 67108864 | 0;
          out.words[0] = lo;
          for (var k = 1; k < len; k++) {
            var ncarry = carry >>> 26;
            var rword = carry & 67108863;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j | 0;
              a = self.words[i] | 0;
              b = num.words[j] | 0;
              r = a * b + rword;
              ncarry += r / 67108864 | 0;
              rword = r & 67108863;
            }
            out.words[k] = rword | 0;
            carry = ncarry | 0;
          }
          if (carry !== 0) {
            out.words[k] = carry | 0;
          } else {
            out.length--;
          }
          return out.strip();
        }
        var comb10MulTo = function comb10MulTo2(self, num, out) {
          var a = self.words;
          var b = num.words;
          var o = out.words;
          var c = 0;
          var lo;
          var mid;
          var hi;
          var a0 = a[0] | 0;
          var al0 = a0 & 8191;
          var ah0 = a0 >>> 13;
          var a1 = a[1] | 0;
          var al1 = a1 & 8191;
          var ah1 = a1 >>> 13;
          var a2 = a[2] | 0;
          var al2 = a2 & 8191;
          var ah2 = a2 >>> 13;
          var a3 = a[3] | 0;
          var al3 = a3 & 8191;
          var ah3 = a3 >>> 13;
          var a4 = a[4] | 0;
          var al4 = a4 & 8191;
          var ah4 = a4 >>> 13;
          var a5 = a[5] | 0;
          var al5 = a5 & 8191;
          var ah5 = a5 >>> 13;
          var a6 = a[6] | 0;
          var al6 = a6 & 8191;
          var ah6 = a6 >>> 13;
          var a7 = a[7] | 0;
          var al7 = a7 & 8191;
          var ah7 = a7 >>> 13;
          var a8 = a[8] | 0;
          var al8 = a8 & 8191;
          var ah8 = a8 >>> 13;
          var a9 = a[9] | 0;
          var al9 = a9 & 8191;
          var ah9 = a9 >>> 13;
          var b0 = b[0] | 0;
          var bl0 = b0 & 8191;
          var bh0 = b0 >>> 13;
          var b1 = b[1] | 0;
          var bl1 = b1 & 8191;
          var bh1 = b1 >>> 13;
          var b2 = b[2] | 0;
          var bl2 = b2 & 8191;
          var bh2 = b2 >>> 13;
          var b3 = b[3] | 0;
          var bl3 = b3 & 8191;
          var bh3 = b3 >>> 13;
          var b4 = b[4] | 0;
          var bl4 = b4 & 8191;
          var bh4 = b4 >>> 13;
          var b5 = b[5] | 0;
          var bl5 = b5 & 8191;
          var bh5 = b5 >>> 13;
          var b6 = b[6] | 0;
          var bl6 = b6 & 8191;
          var bh6 = b6 >>> 13;
          var b7 = b[7] | 0;
          var bl7 = b7 & 8191;
          var bh7 = b7 >>> 13;
          var b8 = b[8] | 0;
          var bl8 = b8 & 8191;
          var bh8 = b8 >>> 13;
          var b9 = b[9] | 0;
          var bl9 = b9 & 8191;
          var bh9 = b9 >>> 13;
          out.negative = self.negative ^ num.negative;
          out.length = 19;
          lo = Math.imul(al0, bl0);
          mid = Math.imul(al0, bh0);
          mid = mid + Math.imul(ah0, bl0) | 0;
          hi = Math.imul(ah0, bh0);
          var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
          w0 &= 67108863;
          lo = Math.imul(al1, bl0);
          mid = Math.imul(al1, bh0);
          mid = mid + Math.imul(ah1, bl0) | 0;
          hi = Math.imul(ah1, bh0);
          lo = lo + Math.imul(al0, bl1) | 0;
          mid = mid + Math.imul(al0, bh1) | 0;
          mid = mid + Math.imul(ah0, bl1) | 0;
          hi = hi + Math.imul(ah0, bh1) | 0;
          var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
          w1 &= 67108863;
          lo = Math.imul(al2, bl0);
          mid = Math.imul(al2, bh0);
          mid = mid + Math.imul(ah2, bl0) | 0;
          hi = Math.imul(ah2, bh0);
          lo = lo + Math.imul(al1, bl1) | 0;
          mid = mid + Math.imul(al1, bh1) | 0;
          mid = mid + Math.imul(ah1, bl1) | 0;
          hi = hi + Math.imul(ah1, bh1) | 0;
          lo = lo + Math.imul(al0, bl2) | 0;
          mid = mid + Math.imul(al0, bh2) | 0;
          mid = mid + Math.imul(ah0, bl2) | 0;
          hi = hi + Math.imul(ah0, bh2) | 0;
          var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
          w2 &= 67108863;
          lo = Math.imul(al3, bl0);
          mid = Math.imul(al3, bh0);
          mid = mid + Math.imul(ah3, bl0) | 0;
          hi = Math.imul(ah3, bh0);
          lo = lo + Math.imul(al2, bl1) | 0;
          mid = mid + Math.imul(al2, bh1) | 0;
          mid = mid + Math.imul(ah2, bl1) | 0;
          hi = hi + Math.imul(ah2, bh1) | 0;
          lo = lo + Math.imul(al1, bl2) | 0;
          mid = mid + Math.imul(al1, bh2) | 0;
          mid = mid + Math.imul(ah1, bl2) | 0;
          hi = hi + Math.imul(ah1, bh2) | 0;
          lo = lo + Math.imul(al0, bl3) | 0;
          mid = mid + Math.imul(al0, bh3) | 0;
          mid = mid + Math.imul(ah0, bl3) | 0;
          hi = hi + Math.imul(ah0, bh3) | 0;
          var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
          w3 &= 67108863;
          lo = Math.imul(al4, bl0);
          mid = Math.imul(al4, bh0);
          mid = mid + Math.imul(ah4, bl0) | 0;
          hi = Math.imul(ah4, bh0);
          lo = lo + Math.imul(al3, bl1) | 0;
          mid = mid + Math.imul(al3, bh1) | 0;
          mid = mid + Math.imul(ah3, bl1) | 0;
          hi = hi + Math.imul(ah3, bh1) | 0;
          lo = lo + Math.imul(al2, bl2) | 0;
          mid = mid + Math.imul(al2, bh2) | 0;
          mid = mid + Math.imul(ah2, bl2) | 0;
          hi = hi + Math.imul(ah2, bh2) | 0;
          lo = lo + Math.imul(al1, bl3) | 0;
          mid = mid + Math.imul(al1, bh3) | 0;
          mid = mid + Math.imul(ah1, bl3) | 0;
          hi = hi + Math.imul(ah1, bh3) | 0;
          lo = lo + Math.imul(al0, bl4) | 0;
          mid = mid + Math.imul(al0, bh4) | 0;
          mid = mid + Math.imul(ah0, bl4) | 0;
          hi = hi + Math.imul(ah0, bh4) | 0;
          var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
          w4 &= 67108863;
          lo = Math.imul(al5, bl0);
          mid = Math.imul(al5, bh0);
          mid = mid + Math.imul(ah5, bl0) | 0;
          hi = Math.imul(ah5, bh0);
          lo = lo + Math.imul(al4, bl1) | 0;
          mid = mid + Math.imul(al4, bh1) | 0;
          mid = mid + Math.imul(ah4, bl1) | 0;
          hi = hi + Math.imul(ah4, bh1) | 0;
          lo = lo + Math.imul(al3, bl2) | 0;
          mid = mid + Math.imul(al3, bh2) | 0;
          mid = mid + Math.imul(ah3, bl2) | 0;
          hi = hi + Math.imul(ah3, bh2) | 0;
          lo = lo + Math.imul(al2, bl3) | 0;
          mid = mid + Math.imul(al2, bh3) | 0;
          mid = mid + Math.imul(ah2, bl3) | 0;
          hi = hi + Math.imul(ah2, bh3) | 0;
          lo = lo + Math.imul(al1, bl4) | 0;
          mid = mid + Math.imul(al1, bh4) | 0;
          mid = mid + Math.imul(ah1, bl4) | 0;
          hi = hi + Math.imul(ah1, bh4) | 0;
          lo = lo + Math.imul(al0, bl5) | 0;
          mid = mid + Math.imul(al0, bh5) | 0;
          mid = mid + Math.imul(ah0, bl5) | 0;
          hi = hi + Math.imul(ah0, bh5) | 0;
          var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
          w5 &= 67108863;
          lo = Math.imul(al6, bl0);
          mid = Math.imul(al6, bh0);
          mid = mid + Math.imul(ah6, bl0) | 0;
          hi = Math.imul(ah6, bh0);
          lo = lo + Math.imul(al5, bl1) | 0;
          mid = mid + Math.imul(al5, bh1) | 0;
          mid = mid + Math.imul(ah5, bl1) | 0;
          hi = hi + Math.imul(ah5, bh1) | 0;
          lo = lo + Math.imul(al4, bl2) | 0;
          mid = mid + Math.imul(al4, bh2) | 0;
          mid = mid + Math.imul(ah4, bl2) | 0;
          hi = hi + Math.imul(ah4, bh2) | 0;
          lo = lo + Math.imul(al3, bl3) | 0;
          mid = mid + Math.imul(al3, bh3) | 0;
          mid = mid + Math.imul(ah3, bl3) | 0;
          hi = hi + Math.imul(ah3, bh3) | 0;
          lo = lo + Math.imul(al2, bl4) | 0;
          mid = mid + Math.imul(al2, bh4) | 0;
          mid = mid + Math.imul(ah2, bl4) | 0;
          hi = hi + Math.imul(ah2, bh4) | 0;
          lo = lo + Math.imul(al1, bl5) | 0;
          mid = mid + Math.imul(al1, bh5) | 0;
          mid = mid + Math.imul(ah1, bl5) | 0;
          hi = hi + Math.imul(ah1, bh5) | 0;
          lo = lo + Math.imul(al0, bl6) | 0;
          mid = mid + Math.imul(al0, bh6) | 0;
          mid = mid + Math.imul(ah0, bl6) | 0;
          hi = hi + Math.imul(ah0, bh6) | 0;
          var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
          w6 &= 67108863;
          lo = Math.imul(al7, bl0);
          mid = Math.imul(al7, bh0);
          mid = mid + Math.imul(ah7, bl0) | 0;
          hi = Math.imul(ah7, bh0);
          lo = lo + Math.imul(al6, bl1) | 0;
          mid = mid + Math.imul(al6, bh1) | 0;
          mid = mid + Math.imul(ah6, bl1) | 0;
          hi = hi + Math.imul(ah6, bh1) | 0;
          lo = lo + Math.imul(al5, bl2) | 0;
          mid = mid + Math.imul(al5, bh2) | 0;
          mid = mid + Math.imul(ah5, bl2) | 0;
          hi = hi + Math.imul(ah5, bh2) | 0;
          lo = lo + Math.imul(al4, bl3) | 0;
          mid = mid + Math.imul(al4, bh3) | 0;
          mid = mid + Math.imul(ah4, bl3) | 0;
          hi = hi + Math.imul(ah4, bh3) | 0;
          lo = lo + Math.imul(al3, bl4) | 0;
          mid = mid + Math.imul(al3, bh4) | 0;
          mid = mid + Math.imul(ah3, bl4) | 0;
          hi = hi + Math.imul(ah3, bh4) | 0;
          lo = lo + Math.imul(al2, bl5) | 0;
          mid = mid + Math.imul(al2, bh5) | 0;
          mid = mid + Math.imul(ah2, bl5) | 0;
          hi = hi + Math.imul(ah2, bh5) | 0;
          lo = lo + Math.imul(al1, bl6) | 0;
          mid = mid + Math.imul(al1, bh6) | 0;
          mid = mid + Math.imul(ah1, bl6) | 0;
          hi = hi + Math.imul(ah1, bh6) | 0;
          lo = lo + Math.imul(al0, bl7) | 0;
          mid = mid + Math.imul(al0, bh7) | 0;
          mid = mid + Math.imul(ah0, bl7) | 0;
          hi = hi + Math.imul(ah0, bh7) | 0;
          var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
          w7 &= 67108863;
          lo = Math.imul(al8, bl0);
          mid = Math.imul(al8, bh0);
          mid = mid + Math.imul(ah8, bl0) | 0;
          hi = Math.imul(ah8, bh0);
          lo = lo + Math.imul(al7, bl1) | 0;
          mid = mid + Math.imul(al7, bh1) | 0;
          mid = mid + Math.imul(ah7, bl1) | 0;
          hi = hi + Math.imul(ah7, bh1) | 0;
          lo = lo + Math.imul(al6, bl2) | 0;
          mid = mid + Math.imul(al6, bh2) | 0;
          mid = mid + Math.imul(ah6, bl2) | 0;
          hi = hi + Math.imul(ah6, bh2) | 0;
          lo = lo + Math.imul(al5, bl3) | 0;
          mid = mid + Math.imul(al5, bh3) | 0;
          mid = mid + Math.imul(ah5, bl3) | 0;
          hi = hi + Math.imul(ah5, bh3) | 0;
          lo = lo + Math.imul(al4, bl4) | 0;
          mid = mid + Math.imul(al4, bh4) | 0;
          mid = mid + Math.imul(ah4, bl4) | 0;
          hi = hi + Math.imul(ah4, bh4) | 0;
          lo = lo + Math.imul(al3, bl5) | 0;
          mid = mid + Math.imul(al3, bh5) | 0;
          mid = mid + Math.imul(ah3, bl5) | 0;
          hi = hi + Math.imul(ah3, bh5) | 0;
          lo = lo + Math.imul(al2, bl6) | 0;
          mid = mid + Math.imul(al2, bh6) | 0;
          mid = mid + Math.imul(ah2, bl6) | 0;
          hi = hi + Math.imul(ah2, bh6) | 0;
          lo = lo + Math.imul(al1, bl7) | 0;
          mid = mid + Math.imul(al1, bh7) | 0;
          mid = mid + Math.imul(ah1, bl7) | 0;
          hi = hi + Math.imul(ah1, bh7) | 0;
          lo = lo + Math.imul(al0, bl8) | 0;
          mid = mid + Math.imul(al0, bh8) | 0;
          mid = mid + Math.imul(ah0, bl8) | 0;
          hi = hi + Math.imul(ah0, bh8) | 0;
          var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
          w8 &= 67108863;
          lo = Math.imul(al9, bl0);
          mid = Math.imul(al9, bh0);
          mid = mid + Math.imul(ah9, bl0) | 0;
          hi = Math.imul(ah9, bh0);
          lo = lo + Math.imul(al8, bl1) | 0;
          mid = mid + Math.imul(al8, bh1) | 0;
          mid = mid + Math.imul(ah8, bl1) | 0;
          hi = hi + Math.imul(ah8, bh1) | 0;
          lo = lo + Math.imul(al7, bl2) | 0;
          mid = mid + Math.imul(al7, bh2) | 0;
          mid = mid + Math.imul(ah7, bl2) | 0;
          hi = hi + Math.imul(ah7, bh2) | 0;
          lo = lo + Math.imul(al6, bl3) | 0;
          mid = mid + Math.imul(al6, bh3) | 0;
          mid = mid + Math.imul(ah6, bl3) | 0;
          hi = hi + Math.imul(ah6, bh3) | 0;
          lo = lo + Math.imul(al5, bl4) | 0;
          mid = mid + Math.imul(al5, bh4) | 0;
          mid = mid + Math.imul(ah5, bl4) | 0;
          hi = hi + Math.imul(ah5, bh4) | 0;
          lo = lo + Math.imul(al4, bl5) | 0;
          mid = mid + Math.imul(al4, bh5) | 0;
          mid = mid + Math.imul(ah4, bl5) | 0;
          hi = hi + Math.imul(ah4, bh5) | 0;
          lo = lo + Math.imul(al3, bl6) | 0;
          mid = mid + Math.imul(al3, bh6) | 0;
          mid = mid + Math.imul(ah3, bl6) | 0;
          hi = hi + Math.imul(ah3, bh6) | 0;
          lo = lo + Math.imul(al2, bl7) | 0;
          mid = mid + Math.imul(al2, bh7) | 0;
          mid = mid + Math.imul(ah2, bl7) | 0;
          hi = hi + Math.imul(ah2, bh7) | 0;
          lo = lo + Math.imul(al1, bl8) | 0;
          mid = mid + Math.imul(al1, bh8) | 0;
          mid = mid + Math.imul(ah1, bl8) | 0;
          hi = hi + Math.imul(ah1, bh8) | 0;
          lo = lo + Math.imul(al0, bl9) | 0;
          mid = mid + Math.imul(al0, bh9) | 0;
          mid = mid + Math.imul(ah0, bl9) | 0;
          hi = hi + Math.imul(ah0, bh9) | 0;
          var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
          w9 &= 67108863;
          lo = Math.imul(al9, bl1);
          mid = Math.imul(al9, bh1);
          mid = mid + Math.imul(ah9, bl1) | 0;
          hi = Math.imul(ah9, bh1);
          lo = lo + Math.imul(al8, bl2) | 0;
          mid = mid + Math.imul(al8, bh2) | 0;
          mid = mid + Math.imul(ah8, bl2) | 0;
          hi = hi + Math.imul(ah8, bh2) | 0;
          lo = lo + Math.imul(al7, bl3) | 0;
          mid = mid + Math.imul(al7, bh3) | 0;
          mid = mid + Math.imul(ah7, bl3) | 0;
          hi = hi + Math.imul(ah7, bh3) | 0;
          lo = lo + Math.imul(al6, bl4) | 0;
          mid = mid + Math.imul(al6, bh4) | 0;
          mid = mid + Math.imul(ah6, bl4) | 0;
          hi = hi + Math.imul(ah6, bh4) | 0;
          lo = lo + Math.imul(al5, bl5) | 0;
          mid = mid + Math.imul(al5, bh5) | 0;
          mid = mid + Math.imul(ah5, bl5) | 0;
          hi = hi + Math.imul(ah5, bh5) | 0;
          lo = lo + Math.imul(al4, bl6) | 0;
          mid = mid + Math.imul(al4, bh6) | 0;
          mid = mid + Math.imul(ah4, bl6) | 0;
          hi = hi + Math.imul(ah4, bh6) | 0;
          lo = lo + Math.imul(al3, bl7) | 0;
          mid = mid + Math.imul(al3, bh7) | 0;
          mid = mid + Math.imul(ah3, bl7) | 0;
          hi = hi + Math.imul(ah3, bh7) | 0;
          lo = lo + Math.imul(al2, bl8) | 0;
          mid = mid + Math.imul(al2, bh8) | 0;
          mid = mid + Math.imul(ah2, bl8) | 0;
          hi = hi + Math.imul(ah2, bh8) | 0;
          lo = lo + Math.imul(al1, bl9) | 0;
          mid = mid + Math.imul(al1, bh9) | 0;
          mid = mid + Math.imul(ah1, bl9) | 0;
          hi = hi + Math.imul(ah1, bh9) | 0;
          var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
          w10 &= 67108863;
          lo = Math.imul(al9, bl2);
          mid = Math.imul(al9, bh2);
          mid = mid + Math.imul(ah9, bl2) | 0;
          hi = Math.imul(ah9, bh2);
          lo = lo + Math.imul(al8, bl3) | 0;
          mid = mid + Math.imul(al8, bh3) | 0;
          mid = mid + Math.imul(ah8, bl3) | 0;
          hi = hi + Math.imul(ah8, bh3) | 0;
          lo = lo + Math.imul(al7, bl4) | 0;
          mid = mid + Math.imul(al7, bh4) | 0;
          mid = mid + Math.imul(ah7, bl4) | 0;
          hi = hi + Math.imul(ah7, bh4) | 0;
          lo = lo + Math.imul(al6, bl5) | 0;
          mid = mid + Math.imul(al6, bh5) | 0;
          mid = mid + Math.imul(ah6, bl5) | 0;
          hi = hi + Math.imul(ah6, bh5) | 0;
          lo = lo + Math.imul(al5, bl6) | 0;
          mid = mid + Math.imul(al5, bh6) | 0;
          mid = mid + Math.imul(ah5, bl6) | 0;
          hi = hi + Math.imul(ah5, bh6) | 0;
          lo = lo + Math.imul(al4, bl7) | 0;
          mid = mid + Math.imul(al4, bh7) | 0;
          mid = mid + Math.imul(ah4, bl7) | 0;
          hi = hi + Math.imul(ah4, bh7) | 0;
          lo = lo + Math.imul(al3, bl8) | 0;
          mid = mid + Math.imul(al3, bh8) | 0;
          mid = mid + Math.imul(ah3, bl8) | 0;
          hi = hi + Math.imul(ah3, bh8) | 0;
          lo = lo + Math.imul(al2, bl9) | 0;
          mid = mid + Math.imul(al2, bh9) | 0;
          mid = mid + Math.imul(ah2, bl9) | 0;
          hi = hi + Math.imul(ah2, bh9) | 0;
          var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
          w11 &= 67108863;
          lo = Math.imul(al9, bl3);
          mid = Math.imul(al9, bh3);
          mid = mid + Math.imul(ah9, bl3) | 0;
          hi = Math.imul(ah9, bh3);
          lo = lo + Math.imul(al8, bl4) | 0;
          mid = mid + Math.imul(al8, bh4) | 0;
          mid = mid + Math.imul(ah8, bl4) | 0;
          hi = hi + Math.imul(ah8, bh4) | 0;
          lo = lo + Math.imul(al7, bl5) | 0;
          mid = mid + Math.imul(al7, bh5) | 0;
          mid = mid + Math.imul(ah7, bl5) | 0;
          hi = hi + Math.imul(ah7, bh5) | 0;
          lo = lo + Math.imul(al6, bl6) | 0;
          mid = mid + Math.imul(al6, bh6) | 0;
          mid = mid + Math.imul(ah6, bl6) | 0;
          hi = hi + Math.imul(ah6, bh6) | 0;
          lo = lo + Math.imul(al5, bl7) | 0;
          mid = mid + Math.imul(al5, bh7) | 0;
          mid = mid + Math.imul(ah5, bl7) | 0;
          hi = hi + Math.imul(ah5, bh7) | 0;
          lo = lo + Math.imul(al4, bl8) | 0;
          mid = mid + Math.imul(al4, bh8) | 0;
          mid = mid + Math.imul(ah4, bl8) | 0;
          hi = hi + Math.imul(ah4, bh8) | 0;
          lo = lo + Math.imul(al3, bl9) | 0;
          mid = mid + Math.imul(al3, bh9) | 0;
          mid = mid + Math.imul(ah3, bl9) | 0;
          hi = hi + Math.imul(ah3, bh9) | 0;
          var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
          w12 &= 67108863;
          lo = Math.imul(al9, bl4);
          mid = Math.imul(al9, bh4);
          mid = mid + Math.imul(ah9, bl4) | 0;
          hi = Math.imul(ah9, bh4);
          lo = lo + Math.imul(al8, bl5) | 0;
          mid = mid + Math.imul(al8, bh5) | 0;
          mid = mid + Math.imul(ah8, bl5) | 0;
          hi = hi + Math.imul(ah8, bh5) | 0;
          lo = lo + Math.imul(al7, bl6) | 0;
          mid = mid + Math.imul(al7, bh6) | 0;
          mid = mid + Math.imul(ah7, bl6) | 0;
          hi = hi + Math.imul(ah7, bh6) | 0;
          lo = lo + Math.imul(al6, bl7) | 0;
          mid = mid + Math.imul(al6, bh7) | 0;
          mid = mid + Math.imul(ah6, bl7) | 0;
          hi = hi + Math.imul(ah6, bh7) | 0;
          lo = lo + Math.imul(al5, bl8) | 0;
          mid = mid + Math.imul(al5, bh8) | 0;
          mid = mid + Math.imul(ah5, bl8) | 0;
          hi = hi + Math.imul(ah5, bh8) | 0;
          lo = lo + Math.imul(al4, bl9) | 0;
          mid = mid + Math.imul(al4, bh9) | 0;
          mid = mid + Math.imul(ah4, bl9) | 0;
          hi = hi + Math.imul(ah4, bh9) | 0;
          var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
          w13 &= 67108863;
          lo = Math.imul(al9, bl5);
          mid = Math.imul(al9, bh5);
          mid = mid + Math.imul(ah9, bl5) | 0;
          hi = Math.imul(ah9, bh5);
          lo = lo + Math.imul(al8, bl6) | 0;
          mid = mid + Math.imul(al8, bh6) | 0;
          mid = mid + Math.imul(ah8, bl6) | 0;
          hi = hi + Math.imul(ah8, bh6) | 0;
          lo = lo + Math.imul(al7, bl7) | 0;
          mid = mid + Math.imul(al7, bh7) | 0;
          mid = mid + Math.imul(ah7, bl7) | 0;
          hi = hi + Math.imul(ah7, bh7) | 0;
          lo = lo + Math.imul(al6, bl8) | 0;
          mid = mid + Math.imul(al6, bh8) | 0;
          mid = mid + Math.imul(ah6, bl8) | 0;
          hi = hi + Math.imul(ah6, bh8) | 0;
          lo = lo + Math.imul(al5, bl9) | 0;
          mid = mid + Math.imul(al5, bh9) | 0;
          mid = mid + Math.imul(ah5, bl9) | 0;
          hi = hi + Math.imul(ah5, bh9) | 0;
          var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
          w14 &= 67108863;
          lo = Math.imul(al9, bl6);
          mid = Math.imul(al9, bh6);
          mid = mid + Math.imul(ah9, bl6) | 0;
          hi = Math.imul(ah9, bh6);
          lo = lo + Math.imul(al8, bl7) | 0;
          mid = mid + Math.imul(al8, bh7) | 0;
          mid = mid + Math.imul(ah8, bl7) | 0;
          hi = hi + Math.imul(ah8, bh7) | 0;
          lo = lo + Math.imul(al7, bl8) | 0;
          mid = mid + Math.imul(al7, bh8) | 0;
          mid = mid + Math.imul(ah7, bl8) | 0;
          hi = hi + Math.imul(ah7, bh8) | 0;
          lo = lo + Math.imul(al6, bl9) | 0;
          mid = mid + Math.imul(al6, bh9) | 0;
          mid = mid + Math.imul(ah6, bl9) | 0;
          hi = hi + Math.imul(ah6, bh9) | 0;
          var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
          w15 &= 67108863;
          lo = Math.imul(al9, bl7);
          mid = Math.imul(al9, bh7);
          mid = mid + Math.imul(ah9, bl7) | 0;
          hi = Math.imul(ah9, bh7);
          lo = lo + Math.imul(al8, bl8) | 0;
          mid = mid + Math.imul(al8, bh8) | 0;
          mid = mid + Math.imul(ah8, bl8) | 0;
          hi = hi + Math.imul(ah8, bh8) | 0;
          lo = lo + Math.imul(al7, bl9) | 0;
          mid = mid + Math.imul(al7, bh9) | 0;
          mid = mid + Math.imul(ah7, bl9) | 0;
          hi = hi + Math.imul(ah7, bh9) | 0;
          var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
          w16 &= 67108863;
          lo = Math.imul(al9, bl8);
          mid = Math.imul(al9, bh8);
          mid = mid + Math.imul(ah9, bl8) | 0;
          hi = Math.imul(ah9, bh8);
          lo = lo + Math.imul(al8, bl9) | 0;
          mid = mid + Math.imul(al8, bh9) | 0;
          mid = mid + Math.imul(ah8, bl9) | 0;
          hi = hi + Math.imul(ah8, bh9) | 0;
          var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
          w17 &= 67108863;
          lo = Math.imul(al9, bl9);
          mid = Math.imul(al9, bh9);
          mid = mid + Math.imul(ah9, bl9) | 0;
          hi = Math.imul(ah9, bh9);
          var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
          w18 &= 67108863;
          o[0] = w0;
          o[1] = w1;
          o[2] = w2;
          o[3] = w3;
          o[4] = w4;
          o[5] = w5;
          o[6] = w6;
          o[7] = w7;
          o[8] = w8;
          o[9] = w9;
          o[10] = w10;
          o[11] = w11;
          o[12] = w12;
          o[13] = w13;
          o[14] = w14;
          o[15] = w15;
          o[16] = w16;
          o[17] = w17;
          o[18] = w18;
          if (c !== 0) {
            o[19] = c;
            out.length++;
          }
          return out;
        };
        if (!Math.imul) {
          comb10MulTo = smallMulTo;
        }
        function bigMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          out.length = self.length + num.length;
          var carry = 0;
          var hncarry = 0;
          for (var k = 0; k < out.length - 1; k++) {
            var ncarry = hncarry;
            hncarry = 0;
            var rword = carry & 67108863;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j;
              var a = self.words[i] | 0;
              var b = num.words[j] | 0;
              var r = a * b;
              var lo = r & 67108863;
              ncarry = ncarry + (r / 67108864 | 0) | 0;
              lo = lo + rword | 0;
              rword = lo & 67108863;
              ncarry = ncarry + (lo >>> 26) | 0;
              hncarry += ncarry >>> 26;
              ncarry &= 67108863;
            }
            out.words[k] = rword;
            carry = ncarry;
            ncarry = hncarry;
          }
          if (carry !== 0) {
            out.words[k] = carry;
          } else {
            out.length--;
          }
          return out.strip();
        }
        function jumboMulTo(self, num, out) {
          var fftm = new FFTM();
          return fftm.mulp(self, num, out);
        }
        BN.prototype.mulTo = function mulTo(num, out) {
          var res;
          var len = this.length + num.length;
          if (this.length === 10 && num.length === 10) {
            res = comb10MulTo(this, num, out);
          } else if (len < 63) {
            res = smallMulTo(this, num, out);
          } else if (len < 1024) {
            res = bigMulTo(this, num, out);
          } else {
            res = jumboMulTo(this, num, out);
          }
          return res;
        };
        function FFTM(x, y) {
          this.x = x;
          this.y = y;
        }
        FFTM.prototype.makeRBT = function makeRBT(N) {
          var t = new Array(N);
          var l = BN.prototype._countBits(N) - 1;
          for (var i = 0; i < N; i++) {
            t[i] = this.revBin(i, l, N);
          }
          return t;
        };
        FFTM.prototype.revBin = function revBin(x, l, N) {
          if (x === 0 || x === N - 1) return x;
          var rb = 0;
          for (var i = 0; i < l; i++) {
            rb |= (x & 1) << l - i - 1;
            x >>= 1;
          }
          return rb;
        };
        FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
          for (var i = 0; i < N; i++) {
            rtws[i] = rws[rbt[i]];
            itws[i] = iws[rbt[i]];
          }
        };
        FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
          this.permute(rbt, rws, iws, rtws, itws, N);
          for (var s = 1; s < N; s <<= 1) {
            var l = s << 1;
            var rtwdf = Math.cos(2 * Math.PI / l);
            var itwdf = Math.sin(2 * Math.PI / l);
            for (var p = 0; p < N; p += l) {
              var rtwdf_ = rtwdf;
              var itwdf_ = itwdf;
              for (var j = 0; j < s; j++) {
                var re = rtws[p + j];
                var ie = itws[p + j];
                var ro = rtws[p + j + s];
                var io = itws[p + j + s];
                var rx = rtwdf_ * ro - itwdf_ * io;
                io = rtwdf_ * io + itwdf_ * ro;
                ro = rx;
                rtws[p + j] = re + ro;
                itws[p + j] = ie + io;
                rtws[p + j + s] = re - ro;
                itws[p + j + s] = ie - io;
                if (j !== l) {
                  rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                  itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                  rtwdf_ = rx;
                }
              }
            }
          }
        };
        FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
          var N = Math.max(m, n) | 1;
          var odd = N & 1;
          var i = 0;
          for (N = N / 2 | 0; N; N = N >>> 1) {
            i++;
          }
          return 1 << i + 1 + odd;
        };
        FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
          if (N <= 1) return;
          for (var i = 0; i < N / 2; i++) {
            var t = rws[i];
            rws[i] = rws[N - i - 1];
            rws[N - i - 1] = t;
            t = iws[i];
            iws[i] = -iws[N - i - 1];
            iws[N - i - 1] = -t;
          }
        };
        FFTM.prototype.normalize13b = function normalize13b(ws, N) {
          var carry = 0;
          for (var i = 0; i < N / 2; i++) {
            var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
            ws[i] = w & 67108863;
            if (w < 67108864) {
              carry = 0;
            } else {
              carry = w / 67108864 | 0;
            }
          }
          return ws;
        };
        FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
          var carry = 0;
          for (var i = 0; i < len; i++) {
            carry = carry + (ws[i] | 0);
            rws[2 * i] = carry & 8191;
            carry = carry >>> 13;
            rws[2 * i + 1] = carry & 8191;
            carry = carry >>> 13;
          }
          for (i = 2 * len; i < N; ++i) {
            rws[i] = 0;
          }
          assert(carry === 0);
          assert((carry & ~8191) === 0);
        };
        FFTM.prototype.stub = function stub(N) {
          var ph = new Array(N);
          for (var i = 0; i < N; i++) {
            ph[i] = 0;
          }
          return ph;
        };
        FFTM.prototype.mulp = function mulp(x, y, out) {
          var N = 2 * this.guessLen13b(x.length, y.length);
          var rbt = this.makeRBT(N);
          var _ = this.stub(N);
          var rws = new Array(N);
          var rwst = new Array(N);
          var iwst = new Array(N);
          var nrws = new Array(N);
          var nrwst = new Array(N);
          var niwst = new Array(N);
          var rmws = out.words;
          rmws.length = N;
          this.convert13b(x.words, x.length, rws, N);
          this.convert13b(y.words, y.length, nrws, N);
          this.transform(rws, _, rwst, iwst, N, rbt);
          this.transform(nrws, _, nrwst, niwst, N, rbt);
          for (var i = 0; i < N; i++) {
            var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
            iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
            rwst[i] = rx;
          }
          this.conjugate(rwst, iwst, N);
          this.transform(rwst, iwst, rmws, _, N, rbt);
          this.conjugate(rmws, _, N);
          this.normalize13b(rmws, N);
          out.negative = x.negative ^ y.negative;
          out.length = x.length + y.length;
          return out.strip();
        };
        BN.prototype.mul = function mul(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return this.mulTo(num, out);
        };
        BN.prototype.mulf = function mulf(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return jumboMulTo(this, num, out);
        };
        BN.prototype.imul = function imul(num) {
          return this.clone().mulTo(num, this);
        };
        BN.prototype.imuln = function imuln(num) {
          assert(typeof num === "number");
          assert(num < 67108864);
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = (this.words[i] | 0) * num;
            var lo = (w & 67108863) + (carry & 67108863);
            carry >>= 26;
            carry += w / 67108864 | 0;
            carry += lo >>> 26;
            this.words[i] = lo & 67108863;
          }
          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }
          return this;
        };
        BN.prototype.muln = function muln(num) {
          return this.clone().imuln(num);
        };
        BN.prototype.sqr = function sqr() {
          return this.mul(this);
        };
        BN.prototype.isqr = function isqr() {
          return this.imul(this.clone());
        };
        BN.prototype.pow = function pow(num) {
          var w = toBitArray(num);
          if (w.length === 0) return new BN(1);
          var res = this;
          for (var i = 0; i < w.length; i++, res = res.sqr()) {
            if (w[i] !== 0) break;
          }
          if (++i < w.length) {
            for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
              if (w[i] === 0) continue;
              res = res.mul(q);
            }
          }
          return res;
        };
        BN.prototype.iushln = function iushln(bits) {
          assert(typeof bits === "number" && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;
          var carryMask = 67108863 >>> 26 - r << 26 - r;
          var i;
          if (r !== 0) {
            var carry = 0;
            for (i = 0; i < this.length; i++) {
              var newCarry = this.words[i] & carryMask;
              var c = (this.words[i] | 0) - newCarry << r;
              this.words[i] = c | carry;
              carry = newCarry >>> 26 - r;
            }
            if (carry) {
              this.words[i] = carry;
              this.length++;
            }
          }
          if (s !== 0) {
            for (i = this.length - 1; i >= 0; i--) {
              this.words[i + s] = this.words[i];
            }
            for (i = 0; i < s; i++) {
              this.words[i] = 0;
            }
            this.length += s;
          }
          return this.strip();
        };
        BN.prototype.ishln = function ishln(bits) {
          assert(this.negative === 0);
          return this.iushln(bits);
        };
        BN.prototype.iushrn = function iushrn(bits, hint, extended) {
          assert(typeof bits === "number" && bits >= 0);
          var h;
          if (hint) {
            h = (hint - hint % 26) / 26;
          } else {
            h = 0;
          }
          var r = bits % 26;
          var s = Math.min((bits - r) / 26, this.length);
          var mask = 67108863 ^ 67108863 >>> r << r;
          var maskedWords = extended;
          h -= s;
          h = Math.max(0, h);
          if (maskedWords) {
            for (var i = 0; i < s; i++) {
              maskedWords.words[i] = this.words[i];
            }
            maskedWords.length = s;
          }
          if (s === 0) {} else if (this.length > s) {
            this.length -= s;
            for (i = 0; i < this.length; i++) {
              this.words[i] = this.words[i + s];
            }
          } else {
            this.words[0] = 0;
            this.length = 1;
          }
          var carry = 0;
          for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
            var word = this.words[i] | 0;
            this.words[i] = carry << 26 - r | word >>> r;
            carry = word & mask;
          }
          if (maskedWords && carry !== 0) {
            maskedWords.words[maskedWords.length++] = carry;
          }
          if (this.length === 0) {
            this.words[0] = 0;
            this.length = 1;
          }
          return this.strip();
        };
        BN.prototype.ishrn = function ishrn(bits, hint, extended) {
          assert(this.negative === 0);
          return this.iushrn(bits, hint, extended);
        };
        BN.prototype.shln = function shln(bits) {
          return this.clone().ishln(bits);
        };
        BN.prototype.ushln = function ushln(bits) {
          return this.clone().iushln(bits);
        };
        BN.prototype.shrn = function shrn(bits) {
          return this.clone().ishrn(bits);
        };
        BN.prototype.ushrn = function ushrn(bits) {
          return this.clone().iushrn(bits);
        };
        BN.prototype.testn = function testn(bit) {
          assert(typeof bit === "number" && bit >= 0);
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;
          if (this.length <= s) return false;
          var w = this.words[s];
          return !!(w & q);
        };
        BN.prototype.imaskn = function imaskn(bits) {
          assert(typeof bits === "number" && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;
          assert(this.negative === 0, "imaskn works only with positive numbers");
          if (this.length <= s) {
            return this;
          }
          if (r !== 0) {
            s++;
          }
          this.length = Math.min(s, this.length);
          if (r !== 0) {
            var mask = 67108863 ^ 67108863 >>> r << r;
            this.words[this.length - 1] &= mask;
          }
          return this.strip();
        };
        BN.prototype.maskn = function maskn(bits) {
          return this.clone().imaskn(bits);
        };
        BN.prototype.iaddn = function iaddn(num) {
          assert(typeof num === "number");
          assert(num < 67108864);
          if (num < 0) return this.isubn(-num);
          if (this.negative !== 0) {
            if (this.length === 1 && (this.words[0] | 0) < num) {
              this.words[0] = num - (this.words[0] | 0);
              this.negative = 0;
              return this;
            }
            this.negative = 0;
            this.isubn(num);
            this.negative = 1;
            return this;
          }
          return this._iaddn(num);
        };
        BN.prototype._iaddn = function _iaddn(num) {
          this.words[0] += num;
          for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
            this.words[i] -= 67108864;
            if (i === this.length - 1) {
              this.words[i + 1] = 1;
            } else {
              this.words[i + 1]++;
            }
          }
          this.length = Math.max(this.length, i + 1);
          return this;
        };
        BN.prototype.isubn = function isubn(num) {
          assert(typeof num === "number");
          assert(num < 67108864);
          if (num < 0) return this.iaddn(-num);
          if (this.negative !== 0) {
            this.negative = 0;
            this.iaddn(num);
            this.negative = 1;
            return this;
          }
          this.words[0] -= num;
          if (this.length === 1 && this.words[0] < 0) {
            this.words[0] = -this.words[0];
            this.negative = 1;
          } else {
            for (var i = 0; i < this.length && this.words[i] < 0; i++) {
              this.words[i] += 67108864;
              this.words[i + 1] -= 1;
            }
          }
          return this.strip();
        };
        BN.prototype.addn = function addn(num) {
          return this.clone().iaddn(num);
        };
        BN.prototype.subn = function subn(num) {
          return this.clone().isubn(num);
        };
        BN.prototype.iabs = function iabs() {
          this.negative = 0;
          return this;
        };
        BN.prototype.abs = function abs() {
          return this.clone().iabs();
        };
        BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
          var len = num.length + shift;
          var i;
          this._expand(len);
          var w;
          var carry = 0;
          for (i = 0; i < num.length; i++) {
            w = (this.words[i + shift] | 0) + carry;
            var right = (num.words[i] | 0) * mul;
            w -= right & 67108863;
            carry = (w >> 26) - (right / 67108864 | 0);
            this.words[i + shift] = w & 67108863;
          }
          for (; i < this.length - shift; i++) {
            w = (this.words[i + shift] | 0) + carry;
            carry = w >> 26;
            this.words[i + shift] = w & 67108863;
          }
          if (carry === 0) return this.strip();
          assert(carry === -1);
          carry = 0;
          for (i = 0; i < this.length; i++) {
            w = -(this.words[i] | 0) + carry;
            carry = w >> 26;
            this.words[i] = w & 67108863;
          }
          this.negative = 1;
          return this.strip();
        };
        BN.prototype._wordDiv = function _wordDiv(num, mode) {
          var shift = this.length - num.length;
          var a = this.clone();
          var b = num;
          var bhi = b.words[b.length - 1] | 0;
          var bhiBits = this._countBits(bhi);
          shift = 26 - bhiBits;
          if (shift !== 0) {
            b = b.ushln(shift);
            a.iushln(shift);
            bhi = b.words[b.length - 1] | 0;
          }
          var m = a.length - b.length;
          var q;
          if (mode !== "mod") {
            q = new BN(null);
            q.length = m + 1;
            q.words = new Array(q.length);
            for (var i = 0; i < q.length; i++) {
              q.words[i] = 0;
            }
          }
          var diff = a.clone()._ishlnsubmul(b, 1, m);
          if (diff.negative === 0) {
            a = diff;
            if (q) {
              q.words[m] = 1;
            }
          }
          for (var j = m - 1; j >= 0; j--) {
            var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
            qj = Math.min(qj / bhi | 0, 67108863);
            a._ishlnsubmul(b, qj, j);
            while (a.negative !== 0) {
              qj--;
              a.negative = 0;
              a._ishlnsubmul(b, 1, j);
              if (!a.isZero()) {
                a.negative ^= 1;
              }
            }
            if (q) {
              q.words[j] = qj;
            }
          }
          if (q) {
            q.strip();
          }
          a.strip();
          if (mode !== "div" && shift !== 0) {
            a.iushrn(shift);
          }
          return {
            div: q || null,
            mod: a
          };
        };
        BN.prototype.divmod = function divmod(num, mode, positive) {
          assert(!num.isZero());
          if (this.isZero()) {
            return {
              div: new BN(0),
              mod: new BN(0)
            };
          }
          var div, mod, res;
          if (this.negative !== 0 && num.negative === 0) {
            res = this.neg().divmod(num, mode);
            if (mode !== "mod") {
              div = res.div.neg();
            }
            if (mode !== "div") {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.iadd(num);
              }
            }
            return {
              div,
              mod
            };
          }
          if (this.negative === 0 && num.negative !== 0) {
            res = this.divmod(num.neg(), mode);
            if (mode !== "mod") {
              div = res.div.neg();
            }
            return {
              div,
              mod: res.mod
            };
          }
          if ((this.negative & num.negative) !== 0) {
            res = this.neg().divmod(num.neg(), mode);
            if (mode !== "div") {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.isub(num);
              }
            }
            return {
              div: res.div,
              mod
            };
          }
          if (num.length > this.length || this.cmp(num) < 0) {
            return {
              div: new BN(0),
              mod: this
            };
          }
          if (num.length === 1) {
            if (mode === "div") {
              return {
                div: this.divn(num.words[0]),
                mod: null
              };
            }
            if (mode === "mod") {
              return {
                div: null,
                mod: new BN(this.modn(num.words[0]))
              };
            }
            return {
              div: this.divn(num.words[0]),
              mod: new BN(this.modn(num.words[0]))
            };
          }
          return this._wordDiv(num, mode);
        };
        BN.prototype.div = function div(num) {
          return this.divmod(num, "div", false).div;
        };
        BN.prototype.mod = function mod(num) {
          return this.divmod(num, "mod", false).mod;
        };
        BN.prototype.umod = function umod(num) {
          return this.divmod(num, "mod", true).mod;
        };
        BN.prototype.divRound = function divRound(num) {
          var dm = this.divmod(num);
          if (dm.mod.isZero()) return dm.div;
          var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
          var half = num.ushrn(1);
          var r2 = num.andln(1);
          var cmp = mod.cmp(half);
          if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
          return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        };
        BN.prototype.modn = function modn(num) {
          assert(num <= 67108863);
          var p = (1 << 26) % num;
          var acc = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            acc = (p * acc + (this.words[i] | 0)) % num;
          }
          return acc;
        };
        BN.prototype.idivn = function idivn(num) {
          assert(num <= 67108863);
          var carry = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var w = (this.words[i] | 0) + carry * 67108864;
            this.words[i] = w / num | 0;
            carry = w % num;
          }
          return this.strip();
        };
        BN.prototype.divn = function divn(num) {
          return this.clone().idivn(num);
        };
        BN.prototype.egcd = function egcd(p) {
          assert(p.negative === 0);
          assert(!p.isZero());
          var x = this;
          var y = p.clone();
          if (x.negative !== 0) {
            x = x.umod(p);
          } else {
            x = x.clone();
          }
          var A = new BN(1);
          var B = new BN(0);
          var C = new BN(0);
          var D = new BN(1);
          var g = 0;
          while (x.isEven() && y.isEven()) {
            x.iushrn(1);
            y.iushrn(1);
            ++g;
          }
          var yp = y.clone();
          var xp = x.clone();
          while (!x.isZero()) {
            for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
            if (i > 0) {
              x.iushrn(i);
              while (i-- > 0) {
                if (A.isOdd() || B.isOdd()) {
                  A.iadd(yp);
                  B.isub(xp);
                }
                A.iushrn(1);
                B.iushrn(1);
              }
            }
            for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
            if (j > 0) {
              y.iushrn(j);
              while (j-- > 0) {
                if (C.isOdd() || D.isOdd()) {
                  C.iadd(yp);
                  D.isub(xp);
                }
                C.iushrn(1);
                D.iushrn(1);
              }
            }
            if (x.cmp(y) >= 0) {
              x.isub(y);
              A.isub(C);
              B.isub(D);
            } else {
              y.isub(x);
              C.isub(A);
              D.isub(B);
            }
          }
          return {
            a: C,
            b: D,
            gcd: y.iushln(g)
          };
        };
        BN.prototype._invmp = function _invmp(p) {
          assert(p.negative === 0);
          assert(!p.isZero());
          var a = this;
          var b = p.clone();
          if (a.negative !== 0) {
            a = a.umod(p);
          } else {
            a = a.clone();
          }
          var x1 = new BN(1);
          var x2 = new BN(0);
          var delta = b.clone();
          while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
            for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
            if (i > 0) {
              a.iushrn(i);
              while (i-- > 0) {
                if (x1.isOdd()) {
                  x1.iadd(delta);
                }
                x1.iushrn(1);
              }
            }
            for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
            if (j > 0) {
              b.iushrn(j);
              while (j-- > 0) {
                if (x2.isOdd()) {
                  x2.iadd(delta);
                }
                x2.iushrn(1);
              }
            }
            if (a.cmp(b) >= 0) {
              a.isub(b);
              x1.isub(x2);
            } else {
              b.isub(a);
              x2.isub(x1);
            }
          }
          var res;
          if (a.cmpn(1) === 0) {
            res = x1;
          } else {
            res = x2;
          }
          if (res.cmpn(0) < 0) {
            res.iadd(p);
          }
          return res;
        };
        BN.prototype.gcd = function gcd(num) {
          if (this.isZero()) return num.abs();
          if (num.isZero()) return this.abs();
          var a = this.clone();
          var b = num.clone();
          a.negative = 0;
          b.negative = 0;
          for (var shift = 0; a.isEven() && b.isEven(); shift++) {
            a.iushrn(1);
            b.iushrn(1);
          }
          do {
            while (a.isEven()) {
              a.iushrn(1);
            }
            while (b.isEven()) {
              b.iushrn(1);
            }
            var r = a.cmp(b);
            if (r < 0) {
              var t = a;
              a = b;
              b = t;
            } else if (r === 0 || b.cmpn(1) === 0) {
              break;
            }
            a.isub(b);
          } while (true);
          return b.iushln(shift);
        };
        BN.prototype.invm = function invm(num) {
          return this.egcd(num).a.umod(num);
        };
        BN.prototype.isEven = function isEven() {
          return (this.words[0] & 1) === 0;
        };
        BN.prototype.isOdd = function isOdd() {
          return (this.words[0] & 1) === 1;
        };
        BN.prototype.andln = function andln(num) {
          return this.words[0] & num;
        };
        BN.prototype.bincn = function bincn(bit) {
          assert(typeof bit === "number");
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;
          if (this.length <= s) {
            this._expand(s + 1);
            this.words[s] |= q;
            return this;
          }
          var carry = q;
          for (var i = s; carry !== 0 && i < this.length; i++) {
            var w = this.words[i] | 0;
            w += carry;
            carry = w >>> 26;
            w &= 67108863;
            this.words[i] = w;
          }
          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }
          return this;
        };
        BN.prototype.isZero = function isZero() {
          return this.length === 1 && this.words[0] === 0;
        };
        BN.prototype.cmpn = function cmpn(num) {
          var negative = num < 0;
          if (this.negative !== 0 && !negative) return -1;
          if (this.negative === 0 && negative) return 1;
          this.strip();
          var res;
          if (this.length > 1) {
            res = 1;
          } else {
            if (negative) {
              num = -num;
            }
            assert(num <= 67108863, "Number is too big");
            var w = this.words[0] | 0;
            res = w === num ? 0 : w < num ? -1 : 1;
          }
          if (this.negative !== 0) return -res | 0;
          return res;
        };
        BN.prototype.cmp = function cmp(num) {
          if (this.negative !== 0 && num.negative === 0) return -1;
          if (this.negative === 0 && num.negative !== 0) return 1;
          var res = this.ucmp(num);
          if (this.negative !== 0) return -res | 0;
          return res;
        };
        BN.prototype.ucmp = function ucmp(num) {
          if (this.length > num.length) return 1;
          if (this.length < num.length) return -1;
          var res = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var a = this.words[i] | 0;
            var b = num.words[i] | 0;
            if (a === b) continue;
            if (a < b) {
              res = -1;
            } else if (a > b) {
              res = 1;
            }
            break;
          }
          return res;
        };
        BN.prototype.gtn = function gtn(num) {
          return this.cmpn(num) === 1;
        };
        BN.prototype.gt = function gt(num) {
          return this.cmp(num) === 1;
        };
        BN.prototype.gten = function gten(num) {
          return this.cmpn(num) >= 0;
        };
        BN.prototype.gte = function gte(num) {
          return this.cmp(num) >= 0;
        };
        BN.prototype.ltn = function ltn(num) {
          return this.cmpn(num) === -1;
        };
        BN.prototype.lt = function lt(num) {
          return this.cmp(num) === -1;
        };
        BN.prototype.lten = function lten(num) {
          return this.cmpn(num) <= 0;
        };
        BN.prototype.lte = function lte(num) {
          return this.cmp(num) <= 0;
        };
        BN.prototype.eqn = function eqn(num) {
          return this.cmpn(num) === 0;
        };
        BN.prototype.eq = function eq(num) {
          return this.cmp(num) === 0;
        };
        BN.red = function red(num) {
          return new Red(num);
        };
        BN.prototype.toRed = function toRed(ctx) {
          assert(!this.red, "Already a number in reduction context");
          assert(this.negative === 0, "red works only with positives");
          return ctx.convertTo(this)._forceRed(ctx);
        };
        BN.prototype.fromRed = function fromRed() {
          assert(this.red, "fromRed works only with numbers in reduction context");
          return this.red.convertFrom(this);
        };
        BN.prototype._forceRed = function _forceRed(ctx) {
          this.red = ctx;
          return this;
        };
        BN.prototype.forceRed = function forceRed(ctx) {
          assert(!this.red, "Already a number in reduction context");
          return this._forceRed(ctx);
        };
        BN.prototype.redAdd = function redAdd(num) {
          assert(this.red, "redAdd works only with red numbers");
          return this.red.add(this, num);
        };
        BN.prototype.redIAdd = function redIAdd(num) {
          assert(this.red, "redIAdd works only with red numbers");
          return this.red.iadd(this, num);
        };
        BN.prototype.redSub = function redSub(num) {
          assert(this.red, "redSub works only with red numbers");
          return this.red.sub(this, num);
        };
        BN.prototype.redISub = function redISub(num) {
          assert(this.red, "redISub works only with red numbers");
          return this.red.isub(this, num);
        };
        BN.prototype.redShl = function redShl(num) {
          assert(this.red, "redShl works only with red numbers");
          return this.red.shl(this, num);
        };
        BN.prototype.redMul = function redMul(num) {
          assert(this.red, "redMul works only with red numbers");
          this.red._verify2(this, num);
          return this.red.mul(this, num);
        };
        BN.prototype.redIMul = function redIMul(num) {
          assert(this.red, "redMul works only with red numbers");
          this.red._verify2(this, num);
          return this.red.imul(this, num);
        };
        BN.prototype.redSqr = function redSqr() {
          assert(this.red, "redSqr works only with red numbers");
          this.red._verify1(this);
          return this.red.sqr(this);
        };
        BN.prototype.redISqr = function redISqr() {
          assert(this.red, "redISqr works only with red numbers");
          this.red._verify1(this);
          return this.red.isqr(this);
        };
        BN.prototype.redSqrt = function redSqrt() {
          assert(this.red, "redSqrt works only with red numbers");
          this.red._verify1(this);
          return this.red.sqrt(this);
        };
        BN.prototype.redInvm = function redInvm() {
          assert(this.red, "redInvm works only with red numbers");
          this.red._verify1(this);
          return this.red.invm(this);
        };
        BN.prototype.redNeg = function redNeg() {
          assert(this.red, "redNeg works only with red numbers");
          this.red._verify1(this);
          return this.red.neg(this);
        };
        BN.prototype.redPow = function redPow(num) {
          assert(this.red && !num.red, "redPow(normalNum)");
          this.red._verify1(this);
          return this.red.pow(this, num);
        };
        var primes = {
          k256: null,
          p224: null,
          p192: null,
          p25519: null
        };
        function MPrime(name, p) {
          this.name = name;
          this.p = new BN(p, 16);
          this.n = this.p.bitLength();
          this.k = new BN(1).iushln(this.n).isub(this.p);
          this.tmp = this._tmp();
        }
        MPrime.prototype._tmp = function _tmp() {
          var tmp = new BN(null);
          tmp.words = new Array(Math.ceil(this.n / 13));
          return tmp;
        };
        MPrime.prototype.ireduce = function ireduce(num) {
          var r = num;
          var rlen;
          do {
            this.split(r, this.tmp);
            r = this.imulK(r);
            r = r.iadd(this.tmp);
            rlen = r.bitLength();
          } while (rlen > this.n);
          var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
          if (cmp === 0) {
            r.words[0] = 0;
            r.length = 1;
          } else if (cmp > 0) {
            r.isub(this.p);
          } else {
            r.strip();
          }
          return r;
        };
        MPrime.prototype.split = function split(input, out) {
          input.iushrn(this.n, 0, out);
        };
        MPrime.prototype.imulK = function imulK(num) {
          return num.imul(this.k);
        };
        function K256() {
          MPrime.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f");
        }
        inherits(K256, MPrime);
        K256.prototype.split = function split(input, output) {
          var mask = 4194303;
          var outLen = Math.min(input.length, 9);
          for (var i = 0; i < outLen; i++) {
            output.words[i] = input.words[i];
          }
          output.length = outLen;
          if (input.length <= 9) {
            input.words[0] = 0;
            input.length = 1;
            return;
          }
          var prev = input.words[9];
          output.words[output.length++] = prev & mask;
          for (i = 10; i < input.length; i++) {
            var next = input.words[i] | 0;
            input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
            prev = next;
          }
          prev >>>= 22;
          input.words[i - 10] = prev;
          if (prev === 0 && input.length > 10) {
            input.length -= 10;
          } else {
            input.length -= 9;
          }
        };
        K256.prototype.imulK = function imulK(num) {
          num.words[num.length] = 0;
          num.words[num.length + 1] = 0;
          num.length += 2;
          var lo = 0;
          for (var i = 0; i < num.length; i++) {
            var w = num.words[i] | 0;
            lo += w * 977;
            num.words[i] = lo & 67108863;
            lo = w * 64 + (lo / 67108864 | 0);
          }
          if (num.words[num.length - 1] === 0) {
            num.length--;
            if (num.words[num.length - 1] === 0) {
              num.length--;
            }
          }
          return num;
        };
        function P224() {
          MPrime.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
        }
        inherits(P224, MPrime);
        function P192() {
          MPrime.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
        }
        inherits(P192, MPrime);
        function P25519() {
          MPrime.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed");
        }
        inherits(P25519, MPrime);
        P25519.prototype.imulK = function imulK(num) {
          var carry = 0;
          for (var i = 0; i < num.length; i++) {
            var hi = (num.words[i] | 0) * 19 + carry;
            var lo = hi & 67108863;
            hi >>>= 26;
            num.words[i] = lo;
            carry = hi;
          }
          if (carry !== 0) {
            num.words[num.length++] = carry;
          }
          return num;
        };
        BN._prime = function prime(name) {
          if (primes[name]) return primes[name];
          var prime2;
          if (name === "k256") {
            prime2 = new K256();
          } else if (name === "p224") {
            prime2 = new P224();
          } else if (name === "p192") {
            prime2 = new P192();
          } else if (name === "p25519") {
            prime2 = new P25519();
          } else {
            throw new Error("Unknown prime " + name);
          }
          primes[name] = prime2;
          return prime2;
        };
        function Red(m) {
          if (typeof m === "string") {
            var prime = BN._prime(m);
            this.m = prime.p;
            this.prime = prime;
          } else {
            assert(m.gtn(1), "modulus must be greater than 1");
            this.m = m;
            this.prime = null;
          }
        }
        Red.prototype._verify1 = function _verify1(a) {
          assert(a.negative === 0, "red works only with positives");
          assert(a.red, "red works only with red numbers");
        };
        Red.prototype._verify2 = function _verify2(a, b) {
          assert((a.negative | b.negative) === 0, "red works only with positives");
          assert(a.red && a.red === b.red, "red works only with red numbers");
        };
        Red.prototype.imod = function imod(a) {
          if (this.prime) return this.prime.ireduce(a)._forceRed(this);
          return a.umod(this.m)._forceRed(this);
        };
        Red.prototype.neg = function neg(a) {
          if (a.isZero()) {
            return a.clone();
          }
          return this.m.sub(a)._forceRed(this);
        };
        Red.prototype.add = function add(a, b) {
          this._verify2(a, b);
          var res = a.add(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res._forceRed(this);
        };
        Red.prototype.iadd = function iadd(a, b) {
          this._verify2(a, b);
          var res = a.iadd(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res;
        };
        Red.prototype.sub = function sub(a, b) {
          this._verify2(a, b);
          var res = a.sub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res._forceRed(this);
        };
        Red.prototype.isub = function isub(a, b) {
          this._verify2(a, b);
          var res = a.isub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res;
        };
        Red.prototype.shl = function shl(a, num) {
          this._verify1(a);
          return this.imod(a.ushln(num));
        };
        Red.prototype.imul = function imul(a, b) {
          this._verify2(a, b);
          return this.imod(a.imul(b));
        };
        Red.prototype.mul = function mul(a, b) {
          this._verify2(a, b);
          return this.imod(a.mul(b));
        };
        Red.prototype.isqr = function isqr(a) {
          return this.imul(a, a.clone());
        };
        Red.prototype.sqr = function sqr(a) {
          return this.mul(a, a);
        };
        Red.prototype.sqrt = function sqrt(a) {
          if (a.isZero()) return a.clone();
          var mod3 = this.m.andln(3);
          assert(mod3 % 2 === 1);
          if (mod3 === 3) {
            var pow = this.m.add(new BN(1)).iushrn(2);
            return this.pow(a, pow);
          }
          var q = this.m.subn(1);
          var s = 0;
          while (!q.isZero() && q.andln(1) === 0) {
            s++;
            q.iushrn(1);
          }
          assert(!q.isZero());
          var one = new BN(1).toRed(this);
          var nOne = one.redNeg();
          var lpow = this.m.subn(1).iushrn(1);
          var z = this.m.bitLength();
          z = new BN(2 * z * z).toRed(this);
          while (this.pow(z, lpow).cmp(nOne) !== 0) {
            z.redIAdd(nOne);
          }
          var c = this.pow(z, q);
          var r = this.pow(a, q.addn(1).iushrn(1));
          var t = this.pow(a, q);
          var m = s;
          while (t.cmp(one) !== 0) {
            var tmp = t;
            for (var i = 0; tmp.cmp(one) !== 0; i++) {
              tmp = tmp.redSqr();
            }
            assert(i < m);
            var b = this.pow(c, new BN(1).iushln(m - i - 1));
            r = r.redMul(b);
            c = b.redSqr();
            t = t.redMul(c);
            m = i;
          }
          return r;
        };
        Red.prototype.invm = function invm(a) {
          var inv = a._invmp(this.m);
          if (inv.negative !== 0) {
            inv.negative = 0;
            return this.imod(inv).redNeg();
          } else {
            return this.imod(inv);
          }
        };
        Red.prototype.pow = function pow(a, num) {
          if (num.isZero()) return new BN(1);
          if (num.cmpn(1) === 0) return a.clone();
          var windowSize = 4;
          var wnd = new Array(1 << windowSize);
          wnd[0] = new BN(1).toRed(this);
          wnd[1] = a;
          for (var i = 2; i < wnd.length; i++) {
            wnd[i] = this.mul(wnd[i - 1], a);
          }
          var res = wnd[0];
          var current = 0;
          var currentLen = 0;
          var start = num.bitLength() % 26;
          if (start === 0) {
            start = 26;
          }
          for (i = num.length - 1; i >= 0; i--) {
            var word = num.words[i];
            for (var j = start - 1; j >= 0; j--) {
              var bit = word >> j & 1;
              if (res !== wnd[0]) {
                res = this.sqr(res);
              }
              if (bit === 0 && current === 0) {
                currentLen = 0;
                continue;
              }
              current <<= 1;
              current |= bit;
              currentLen++;
              if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
              res = this.mul(res, wnd[current]);
              currentLen = 0;
              current = 0;
            }
            start = 26;
          }
          return res;
        };
        Red.prototype.convertTo = function convertTo(num) {
          var r = num.umod(this.m);
          return r === num ? r.clone() : r;
        };
        Red.prototype.convertFrom = function convertFrom(num) {
          var res = num.clone();
          res.red = null;
          return res;
        };
        BN.mont = function mont(num) {
          return new Mont(num);
        };
        function Mont(m) {
          Red.call(this, m);
          this.shift = this.m.bitLength();
          if (this.shift % 26 !== 0) {
            this.shift += 26 - this.shift % 26;
          }
          this.r = new BN(1).iushln(this.shift);
          this.r2 = this.imod(this.r.sqr());
          this.rinv = this.r._invmp(this.m);
          this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
          this.minv = this.minv.umod(this.r);
          this.minv = this.r.sub(this.minv);
        }
        inherits(Mont, Red);
        Mont.prototype.convertTo = function convertTo(num) {
          return this.imod(num.ushln(this.shift));
        };
        Mont.prototype.convertFrom = function convertFrom(num) {
          var r = this.imod(num.mul(this.rinv));
          r.red = null;
          return r;
        };
        Mont.prototype.imul = function imul(a, b) {
          if (a.isZero() || b.isZero()) {
            a.words[0] = 0;
            a.length = 1;
            return a;
          }
          var t = a.imul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;
          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }
          return res._forceRed(this);
        };
        Mont.prototype.mul = function mul(a, b) {
          if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
          var t = a.mul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;
          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }
          return res._forceRed(this);
        };
        Mont.prototype.invm = function invm(a) {
          var res = this.imod(a._invmp(this.m).mul(this.r2));
          return res._forceRed(this);
        };
      })(typeof module === "undefined" || module, exports);
    }
  });

  // node_modules/bittorrent-tracker/lib/client/udp-tracker.js
  var require_udp_tracker = __commonJS({
    "node_modules/bittorrent-tracker/lib/client/udp-tracker.js"(exports, module) {
      module.exports = UDPTracker;
      var BN = require_bn();
      var compact2string2 = require_compact2string();
      var debug = require_src()("bittorrent-tracker:udp-tracker");
      var dgram = __require("dgram");
      var hat = require_hat();
      var inherits = require_inherits();
      var url = __require("url");
      var common = require_common3();
      var Tracker = require_tracker();
      var TIMEOUT = 15e3;
      inherits(UDPTracker, Tracker);
      function UDPTracker(client, announceUrl, opts) {
        var self = this;
        Tracker.call(self, client, announceUrl);
        debug("new udp tracker %s", announceUrl);
        self.cleanupFns = [];
      }
      UDPTracker.prototype.DEFAULT_ANNOUNCE_INTERVAL = 30 * 60 * 1e3;
      UDPTracker.prototype.announce = function (opts) {
        var self = this;
        if (self.destroyed) return;
        self._request(opts);
      };
      UDPTracker.prototype.scrape = function (opts) {
        var self = this;
        if (self.destroyed) return;
        opts._scrape = true;
        self._request(opts);
      };
      UDPTracker.prototype.destroy = function (cb) {
        var self = this;
        if (self.destroyed) return cb(null);
        self.destroyed = true;
        clearInterval(self.interval);
        self.cleanupFns.slice(0).forEach(function (cleanup) {
          cleanup();
        });
        self.cleanupFns = [];
        cb(null);
      };
      UDPTracker.prototype._request = function (opts) {
        var self = this;
        if (!opts) opts = {};
        var parsedUrl = url.parse(self.announceUrl);
        var transactionId = genTransactionId();
        var socket = dgram.createSocket("udp4");
        var _cleanup = function cleanup() {
          if (!socket) return;
          self.cleanupFns.splice(self.cleanupFns.indexOf(_cleanup), 1);
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          socket.removeListener("error", onError);
          socket.removeListener("message", onSocketMessage);
          socket.on("error", noop);
          try {
            socket.close();
          } catch (err) {}
          socket = null;
        };
        self.cleanupFns.push(_cleanup);
        var ms = opts.event === "stopped" ? TIMEOUT / 10 : TIMEOUT;
        var timeout = setTimeout(function () {
          timeout = null;
          if (opts.event === "stopped") _cleanup();else onError(new Error("tracker request timed out (" + opts.event + ")"));
        }, ms);
        if (timeout.unref) timeout.unref();
        send(Buffer.concat([common.CONNECTION_ID, common.toUInt32(common.ACTIONS.CONNECT), transactionId]));
        socket.on("error", onError);
        socket.on("message", onSocketMessage);
        function onSocketMessage(msg) {
          if (self.destroyed) return;
          if (msg.length < 8 || msg.readUInt32BE(4) !== transactionId.readUInt32BE(0)) {
            return onError(new Error("tracker sent invalid transaction id"));
          }
          var action = msg.readUInt32BE(0);
          debug("UDP response %s, action %s", self.announceUrl, action);
          switch (action) {
            case 0:
              if (msg.length < 16) return onError(new Error("invalid udp handshake"));
              if (opts._scrape) scrape(msg.slice(8, 16));else announce(msg.slice(8, 16), opts);
              return;
            case 1:
              _cleanup();
              if (msg.length < 20) return onError(new Error("invalid announce message"));
              var interval = msg.readUInt32BE(8);
              if (interval) self.setInterval(interval * 1e3);
              self.client.emit("update", {
                announce: self.announceUrl,
                complete: msg.readUInt32BE(16),
                incomplete: msg.readUInt32BE(12)
              });
              var addrs;
              try {
                addrs = compact2string2.multi(msg.slice(20));
              } catch (err) {
                return self.client.emit("warning", err);
              }
              addrs.forEach(function (addr) {
                self.client.emit("peer", addr);
              });
              break;
            case 2:
              _cleanup();
              if (msg.length < 20 || (msg.length - 8) % 12 !== 0) {
                return onError(new Error("invalid scrape message"));
              }
              var infoHashes = Array.isArray(opts.infoHash) && opts.infoHash.length > 0 ? opts.infoHash.map(function (infoHash) {
                return infoHash.toString("hex");
              }) : [opts.infoHash && opts.infoHash.toString("hex") || self.client.infoHash];
              for (var i = 0, len = (msg.length - 8) / 12; i < len; i += 1) {
                self.client.emit("scrape", {
                  announce: self.announceUrl,
                  infoHash: infoHashes[i],
                  complete: msg.readUInt32BE(8 + i * 12),
                  downloaded: msg.readUInt32BE(12 + i * 12),
                  incomplete: msg.readUInt32BE(16 + i * 12)
                });
              }
              break;
            case 3:
              _cleanup();
              if (msg.length < 8) return onError(new Error("invalid error message"));
              self.client.emit("warning", new Error(msg.slice(8).toString()));
              break;
            default:
              onError(new Error("tracker sent invalid action"));
              break;
          }
        }
        function onError(err) {
          if (self.destroyed) return;
          _cleanup();
          if (err.message) err.message += " (" + self.announceUrl + ")";
          self.client.emit("warning", err);
        }
        function send(message) {
          if (!parsedUrl.port) {
            parsedUrl.port = 80;
          }
          socket.send(message, 0, message.length, parsedUrl.port, parsedUrl.hostname);
        }
        function announce(connectionId, opts2) {
          transactionId = genTransactionId();
          send(Buffer.concat([connectionId, common.toUInt32(common.ACTIONS.ANNOUNCE), transactionId, self.client.infoHashBuffer, self.client.peerIdBuffer, toUInt64(opts2.downloaded), opts2.left != null ? toUInt64(opts2.left) : new Buffer("FFFFFFFFFFFFFFFF", "hex"), toUInt64(opts2.uploaded), common.toUInt32(common.EVENTS[opts2.event] || 0), common.toUInt32(0),
          // ip address (optional)
          common.toUInt32(0),
          // key (optional)
          common.toUInt32(opts2.numwant), toUInt16(self.client._port)]));
        }
        function scrape(connectionId) {
          transactionId = genTransactionId();
          var infoHash = Array.isArray(opts.infoHash) && opts.infoHash.length > 0 ? Buffer.concat(opts.infoHash) : opts.infoHash || self.client.infoHashBuffer;
          send(Buffer.concat([connectionId, common.toUInt32(common.ACTIONS.SCRAPE), transactionId, infoHash]));
        }
      };
      function genTransactionId() {
        return new Buffer(hat(32), "hex");
      }
      function toUInt16(n) {
        var buf = new Buffer(2);
        buf.writeUInt16BE(n, 0);
        return buf;
      }
      var MAX_UINT = 4294967295;
      function toUInt64(n) {
        if (n > MAX_UINT || typeof n === "string") {
          var bytes = new BN(n).toArray();
          while (bytes.length < 8) {
            bytes.unshift(0);
          }
          return new Buffer(bytes);
        }
        return Buffer.concat([common.toUInt32(0), common.toUInt32(n)]);
      }
      function noop() {}
    }
  });

  // node_modules/get-browser-rtc/index.js
  var require_get_browser_rtc = __commonJS({
    "node_modules/get-browser-rtc/index.js"(exports, module) {
      module.exports = function getBrowserRTC() {
        if (typeof window === "undefined") return null;
        var wrtc = {
          RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
          RTCSessionDescription: window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription,
          RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
        };
        if (!wrtc.RTCPeerConnection) return null;
        return wrtc;
      };
    }
  });

  // node_modules/simple-peer/index.js
  var require_simple_peer = __commonJS({
    "node_modules/simple-peer/index.js"(exports, module) {
      module.exports = Peer;
      var debug = require_src()("simple-peer");
      var getBrowserRTC = require_get_browser_rtc();
      var inherits = require_inherits();
      var randombytes = require_randombytes();
      var stream = require_readable();
      inherits(Peer, stream.Duplex);
      function Peer(opts) {
        var self = this;
        if (!(self instanceof Peer)) return new Peer(opts);
        self._id = randombytes(4).toString("hex").slice(0, 7);
        self._debug("new peer %o", opts);
        opts = Object.assign({}, {
          allowHalfOpen: false,
          highWaterMark: 1024 * 1024
        }, opts);
        stream.Duplex.call(self, opts);
        self.channelName = opts.initiator ? opts.channelName || randombytes(20).toString("hex") : null;
        self.initiator = opts.initiator || false;
        self.channelConfig = opts.channelConfig || Peer.channelConfig;
        self.config = opts.config || Peer.config;
        self.constraints = opts.constraints || Peer.constraints;
        self.offerConstraints = opts.offerConstraints || {};
        self.answerConstraints = opts.answerConstraints || {};
        self.reconnectTimer = opts.reconnectTimer || false;
        self.sdpTransform = opts.sdpTransform || function (sdp) {
          return sdp;
        };
        self.stream = opts.stream || false;
        self.trickle = opts.trickle !== void 0 ? opts.trickle : true;
        self.destroyed = false;
        self.connected = false;
        self.remoteAddress = void 0;
        self.remoteFamily = void 0;
        self.remotePort = void 0;
        self.localAddress = void 0;
        self.localPort = void 0;
        self._isWrtc = !!opts.wrtc;
        self._wrtc = opts.wrtc && _typeof(opts.wrtc) === "object" ? opts.wrtc : getBrowserRTC();
        if (!self._wrtc) {
          if (typeof window === "undefined") {
            throw new Error("No WebRTC support: Specify `opts.wrtc` option in this environment");
          } else {
            throw new Error("No WebRTC support: Not a supported browser");
          }
        }
        self._maxBufferedAmount = opts.highWaterMark;
        self._pcReady = false;
        self._channelReady = false;
        self._iceComplete = false;
        self._channel = null;
        self._pendingCandidates = [];
        self._chunk = null;
        self._cb = null;
        self._interval = null;
        self._reconnectTimeout = null;
        self._pc = new self._wrtc.RTCPeerConnection(self.config, self.constraints);
        self._pc.oniceconnectionstatechange = function () {
          self._onIceConnectionStateChange();
        };
        self._pc.onsignalingstatechange = function () {
          self._onSignalingStateChange();
        };
        self._pc.onicecandidate = function (event) {
          self._onIceCandidate(event);
        };
        if (self.stream) self._pc.addStream(self.stream);
        if ("ontrack" in self._pc) {
          self._pc.ontrack = function (event) {
            self._onTrack(event);
          };
        } else {
          self._pc.onaddstream = function (event) {
            self._onAddStream(event);
          };
        }
        if (self.initiator) {
          self._setupData({
            channel: self._pc.createDataChannel(self.channelName, self.channelConfig)
          });
          var createdOffer = false;
          self._pc.onnegotiationneeded = function () {
            if (!createdOffer) self._createOffer();
            createdOffer = true;
          };
          if (typeof window === "undefined" || !window.webkitRTCPeerConnection) {
            self._pc.onnegotiationneeded();
          }
        } else {
          self._pc.ondatachannel = function (event) {
            self._setupData(event);
          };
        }
        self.on("finish", function () {
          if (self.connected) {
            setTimeout(function () {
              self._destroy();
            }, 100);
          } else {
            self.once("connect", function () {
              setTimeout(function () {
                self._destroy();
              }, 100);
            });
          }
        });
      }
      Peer.WEBRTC_SUPPORT = !!getBrowserRTC();
      Peer.config = {
        iceServers: [{
          url: "stun:23.21.150.121",
          // deprecated, replaced by `urls`
          urls: "stun:23.21.150.121"
        }]
      };
      Peer.constraints = {};
      Peer.channelConfig = {};
      Object.defineProperty(Peer.prototype, "bufferSize", {
        get: function get() {
          var self = this;
          return self._channel && self._channel.bufferedAmount || 0;
        }
      });
      Peer.prototype.address = function () {
        var self = this;
        return {
          port: self.localPort,
          family: "IPv4",
          address: self.localAddress
        };
      };
      Peer.prototype.signal = function (data) {
        var self = this;
        if (self.destroyed) throw new Error("cannot signal after peer is destroyed");
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (err) {
            data = {};
          }
        }
        self._debug("signal()");
        function addIceCandidate(candidate) {
          try {
            self._pc.addIceCandidate(new self._wrtc.RTCIceCandidate(candidate), noop, function (err) {
              self._onError(err);
            });
          } catch (err) {
            self._destroy(new Error("error adding candidate: " + err.message));
          }
        }
        if (data.sdp) {
          self._pc.setRemoteDescription(new self._wrtc.RTCSessionDescription(data), function () {
            if (self.destroyed) return;
            if (self._pc.remoteDescription.type === "offer") self._createAnswer();
            self._pendingCandidates.forEach(addIceCandidate);
            self._pendingCandidates = [];
          }, function (err) {
            self._onError(err);
          });
        }
        if (data.candidate) {
          if (self._pc.remoteDescription) addIceCandidate(data.candidate);else self._pendingCandidates.push(data.candidate);
        }
        if (!data.sdp && !data.candidate) {
          self._destroy(new Error("signal() called with invalid signal data"));
        }
      };
      Peer.prototype.send = function (chunk) {
        var self = this;
        if (Buffer.isBuffer(chunk) && self._isWrtc) {
          chunk = new Uint8Array(chunk);
        }
        var len = chunk.length || chunk.byteLength || chunk.size;
        self._channel.send(chunk);
        self._debug("write: %d bytes", len);
      };
      Peer.prototype.destroy = function (onclose) {
        var self = this;
        self._destroy(null, onclose);
      };
      Peer.prototype._destroy = function (err, onclose) {
        var self = this;
        if (self.destroyed) return;
        if (onclose) self.once("close", onclose);
        self._debug("destroy (error: %s)", err && err.message);
        self.readable = self.writable = false;
        if (!self._readableState.ended) self.push(null);
        if (!self._writableState.finished) self.end();
        self.destroyed = true;
        self.connected = false;
        self._pcReady = false;
        self._channelReady = false;
        self._chunk = null;
        self._cb = null;
        clearInterval(self._interval);
        clearTimeout(self._reconnectTimeout);
        if (self._pc) {
          try {
            self._pc.close();
          } catch (err2) {}
          self._pc.oniceconnectionstatechange = null;
          self._pc.onsignalingstatechange = null;
          self._pc.onicecandidate = null;
          if ("ontrack" in self._pc) {
            self._pc.ontrack = null;
          } else {
            self._pc.onaddstream = null;
          }
          self._pc.onnegotiationneeded = null;
          self._pc.ondatachannel = null;
        }
        if (self._channel) {
          try {
            self._channel.close();
          } catch (err2) {}
          self._channel.onmessage = null;
          self._channel.onopen = null;
          self._channel.onclose = null;
        }
        self._pc = null;
        self._channel = null;
        if (err) self.emit("error", err);
        self.emit("close");
      };
      Peer.prototype._setupData = function (event) {
        var self = this;
        self._channel = event.channel;
        self.channelName = self._channel.label;
        self._channel.binaryType = "arraybuffer";
        self._channel.onmessage = function (event2) {
          self._onChannelMessage(event2);
        };
        self._channel.onopen = function () {
          self._onChannelOpen();
        };
        self._channel.onclose = function () {
          self._onChannelClose();
        };
      };
      Peer.prototype._read = function () {};
      Peer.prototype._write = function (chunk, encoding, cb) {
        var self = this;
        if (self.destroyed) return cb(new Error("cannot write after peer is destroyed"));
        if (self.connected) {
          try {
            self.send(chunk);
          } catch (err) {
            return self._onError(err);
          }
          if (self._channel.bufferedAmount > self._maxBufferedAmount) {
            self._debug("start backpressure: bufferedAmount %d", self._channel.bufferedAmount);
            self._cb = cb;
          } else {
            cb(null);
          }
        } else {
          self._debug("write before connect");
          self._chunk = chunk;
          self._cb = cb;
        }
      };
      Peer.prototype._createOffer = function () {
        var self = this;
        if (self.destroyed) return;
        self._pc.createOffer(function (offer) {
          if (self.destroyed) return;
          offer.sdp = self.sdpTransform(offer.sdp);
          self._pc.setLocalDescription(offer, noop, function (err) {
            self._onError(err);
          });
          var sendOffer = function sendOffer() {
            var signal = self._pc.localDescription || offer;
            self._debug("signal");
            self.emit("signal", {
              type: signal.type,
              sdp: signal.sdp
            });
          };
          if (self.trickle || self._iceComplete) sendOffer();else self.once("_iceComplete", sendOffer);
        }, function (err) {
          self._onError(err);
        }, self.offerConstraints);
      };
      Peer.prototype._createAnswer = function () {
        var self = this;
        if (self.destroyed) return;
        self._pc.createAnswer(function (answer) {
          if (self.destroyed) return;
          answer.sdp = self.sdpTransform(answer.sdp);
          self._pc.setLocalDescription(answer, noop, function (err) {
            self._onError(err);
          });
          var sendAnswer = function sendAnswer() {
            var signal = self._pc.localDescription || answer;
            self._debug("signal");
            self.emit("signal", {
              type: signal.type,
              sdp: signal.sdp
            });
          };
          if (self.trickle || self._iceComplete) sendAnswer();else self.once("_iceComplete", sendAnswer);
        }, function (err) {
          self._onError(err);
        }, self.answerConstraints);
      };
      Peer.prototype._onIceConnectionStateChange = function () {
        var self = this;
        if (self.destroyed) return;
        var iceGatheringState = self._pc.iceGatheringState;
        var iceConnectionState = self._pc.iceConnectionState;
        self._debug("iceConnectionStateChange %s %s", iceGatheringState, iceConnectionState);
        self.emit("iceConnectionStateChange", iceGatheringState, iceConnectionState);
        if (iceConnectionState === "connected" || iceConnectionState === "completed") {
          clearTimeout(self._reconnectTimeout);
          self._pcReady = true;
          self._maybeReady();
        }
        if (iceConnectionState === "disconnected") {
          if (self.reconnectTimer) {
            clearTimeout(self._reconnectTimeout);
            self._reconnectTimeout = setTimeout(function () {
              self._destroy();
            }, self.reconnectTimer);
          } else {
            self._destroy();
          }
        }
        if (iceConnectionState === "failed") {
          self._destroy(new Error("Ice connection failed."));
        }
        if (iceConnectionState === "closed") {
          self._destroy();
        }
      };
      Peer.prototype.getStats = function (cb) {
        var self = this;
        if (!self._pc.getStats) {
          cb([]);
        } else if (typeof window !== "undefined" && !!window.mozRTCPeerConnection) {
          self._pc.getStats(null, function (res) {
            var items = [];
            res.forEach(function (item) {
              items.push(item);
            });
            cb(items);
          }, function (err) {
            self._onError(err);
          });
        } else {
          self._pc.getStats(function (res) {
            var items = [];
            res.result().forEach(function (result) {
              var item = {};
              result.names().forEach(function (name) {
                item[name] = result.stat(name);
              });
              item.id = result.id;
              item.type = result.type;
              item.timestamp = result.timestamp;
              items.push(item);
            });
            cb(items);
          });
        }
      };
      Peer.prototype._maybeReady = function () {
        var self = this;
        self._debug("maybeReady pc %s channel %s", self._pcReady, self._channelReady);
        if (self.connected || self._connecting || !self._pcReady || !self._channelReady) return;
        self._connecting = true;
        self.getStats(function (items) {
          self._connecting = false;
          self.connected = true;
          var remoteCandidates = {};
          var localCandidates = {};
          function setActiveCandidates(item) {
            var local = localCandidates[item.localCandidateId];
            var remote = remoteCandidates[item.remoteCandidateId];
            if (local) {
              self.localAddress = local.ipAddress;
              self.localPort = Number(local.portNumber);
            } else if (typeof item.googLocalAddress === "string") {
              local = item.googLocalAddress.split(":");
              self.localAddress = local[0];
              self.localPort = Number(local[1]);
            }
            self._debug("connect local: %s:%s", self.localAddress, self.localPort);
            if (remote) {
              self.remoteAddress = remote.ipAddress;
              self.remotePort = Number(remote.portNumber);
              self.remoteFamily = "IPv4";
            } else if (typeof item.googRemoteAddress === "string") {
              remote = item.googRemoteAddress.split(":");
              self.remoteAddress = remote[0];
              self.remotePort = Number(remote[1]);
              self.remoteFamily = "IPv4";
            }
            self._debug("connect remote: %s:%s", self.remoteAddress, self.remotePort);
          }
          items.forEach(function (item) {
            if (item.type === "remotecandidate") remoteCandidates[item.id] = item;
            if (item.type === "localcandidate") localCandidates[item.id] = item;
          });
          items.forEach(function (item) {
            var isCandidatePair = item.type === "googCandidatePair" && item.googActiveConnection === "true" || item.type === "candidatepair" && item.selected;
            if (isCandidatePair) setActiveCandidates(item);
          });
          if (self._chunk) {
            try {
              self.send(self._chunk);
            } catch (err) {
              return self._onError(err);
            }
            self._chunk = null;
            self._debug('sent chunk from "write before connect"');
            var cb = self._cb;
            self._cb = null;
            cb(null);
          }
          self._interval = setInterval(function () {
            if (!self._cb || !self._channel || self._channel.bufferedAmount > self._maxBufferedAmount) return;
            self._debug("ending backpressure: bufferedAmount %d", self._channel.bufferedAmount);
            var cb2 = self._cb;
            self._cb = null;
            cb2(null);
          }, 150);
          if (self._interval.unref) self._interval.unref();
          self._debug("connect");
          self.emit("connect");
        });
      };
      Peer.prototype._onSignalingStateChange = function () {
        var self = this;
        if (self.destroyed) return;
        self._debug("signalingStateChange %s", self._pc.signalingState);
        self.emit("signalingStateChange", self._pc.signalingState);
      };
      Peer.prototype._onIceCandidate = function (event) {
        var self = this;
        if (self.destroyed) return;
        if (event.candidate && self.trickle) {
          self.emit("signal", {
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            }
          });
        } else if (!event.candidate) {
          self._iceComplete = true;
          self.emit("_iceComplete");
        }
      };
      Peer.prototype._onChannelMessage = function (event) {
        var self = this;
        if (self.destroyed) return;
        var data = event.data;
        self._debug("read: %d bytes", data.byteLength || data.length);
        if (data instanceof ArrayBuffer) data = new Buffer(data);
        self.push(data);
      };
      Peer.prototype._onChannelOpen = function () {
        var self = this;
        if (self.connected || self.destroyed) return;
        self._debug("on channel open");
        self._channelReady = true;
        self._maybeReady();
      };
      Peer.prototype._onChannelClose = function () {
        var self = this;
        if (self.destroyed) return;
        self._debug("on channel close");
        self._destroy();
      };
      Peer.prototype._onAddStream = function (event) {
        var self = this;
        if (self.destroyed) return;
        self._debug("on add stream");
        self.emit("stream", event.stream);
      };
      Peer.prototype._onTrack = function (event) {
        var self = this;
        if (self.destroyed) return;
        self._debug("on track");
        self.emit("stream", event.streams[0]);
      };
      Peer.prototype._onError = function (err) {
        var self = this;
        if (self.destroyed) return;
        self._debug("error %s", err.message || err);
        self._destroy(err);
      };
      Peer.prototype._debug = function () {
        var self = this;
        var args = [].slice.call(arguments);
        args[0] = "[" + self._id + "] " + args[0];
        debug.apply(null, args);
      };
      function noop() {}
    }
  });

  // node_modules/ultron/index.js
  var require_ultron = __commonJS({
    "node_modules/ultron/index.js"(exports, module) {
      "use strict";

      var has = Object.prototype.hasOwnProperty;
      var id = 0;
      function Ultron(ee) {
        if (!(this instanceof Ultron)) return new Ultron(ee);
        this.id = id++;
        this.ee = ee;
      }
      Ultron.prototype.on = function on(event, fn, context) {
        fn.__ultron = this.id;
        this.ee.on(event, fn, context);
        return this;
      };
      Ultron.prototype.once = function once(event, fn, context) {
        fn.__ultron = this.id;
        this.ee.once(event, fn, context);
        return this;
      };
      Ultron.prototype.remove = function remove() {
        var args = arguments,
          event;
        if (args.length === 1 && "string" === typeof args[0]) {
          args = args[0].split(/[, ]+/);
        } else if (!args.length) {
          args = [];
          for (event in this.ee._events) {
            if (has.call(this.ee._events, event)) args.push(event);
          }
        }
        for (var i = 0; i < args.length; i++) {
          var listeners = this.ee.listeners(args[i]);
          for (var j = 0; j < listeners.length; j++) {
            event = listeners[j];
            if (event.listener) {
              if (event.listener.__ultron !== this.id) continue;
              delete event.listener.__ultron;
            } else {
              if (event.__ultron !== this.id) continue;
              delete event.__ultron;
            }
            this.ee.removeListener(args[i], event);
          }
        }
        return this;
      };
      Ultron.prototype.destroy = function destroy() {
        if (!this.ee) return false;
        this.remove();
        this.ee = null;
        return true;
      };
      module.exports = Ultron;
    }
  });

  // node_modules/options/lib/options.js
  var require_options = __commonJS({
    "node_modules/options/lib/options.js"(exports, module) {
      var fs = __require("fs");
      function Options(defaults) {
        var internalValues = {};
        var values = this.value = {};
        Object.keys(defaults).forEach(function (key) {
          internalValues[key] = defaults[key];
          Object.defineProperty(values, key, {
            get: function get() {
              return internalValues[key];
            },
            configurable: false,
            enumerable: true
          });
        });
        this.reset = function () {
          Object.keys(defaults).forEach(function (key) {
            internalValues[key] = defaults[key];
          });
          return this;
        };
        this.merge = function (options, required) {
          options = options || {};
          if (Object.prototype.toString.call(required) === "[object Array]") {
            var missing = [];
            for (var i = 0, l = required.length; i < l; ++i) {
              var key = required[i];
              if (!(key in options)) {
                missing.push(key);
              }
            }
            if (missing.length > 0) {
              if (missing.length > 1) {
                throw new Error("options " + missing.slice(0, missing.length - 1).join(", ") + " and " + missing[missing.length - 1] + " must be defined");
              } else throw new Error("option " + missing[0] + " must be defined");
            }
          }
          Object.keys(options).forEach(function (key2) {
            if (key2 in internalValues) {
              internalValues[key2] = options[key2];
            }
          });
          return this;
        };
        this.copy = function (keys) {
          var obj = {};
          Object.keys(defaults).forEach(function (key) {
            if (keys.indexOf(key) !== -1) {
              obj[key] = values[key];
            }
          });
          return obj;
        };
        this.read = function (filename, cb) {
          if (typeof cb == "function") {
            var self = this;
            fs.readFile(filename, function (error, data) {
              if (error) return cb(error);
              var conf2 = JSON.parse(data);
              self.merge(conf2);
              cb();
            });
          } else {
            var conf = JSON.parse(fs.readFileSync(filename));
            this.merge(conf);
          }
          return this;
        };
        this.isDefined = function (key) {
          return typeof values[key] != "undefined";
        };
        this.isDefinedAndNonNull = function (key) {
          return typeof values[key] != "undefined" && values[key] !== null;
        };
        Object.freeze(values);
        Object.freeze(this);
      }
      module.exports = Options;
    }
  });

  // node_modules/ws/lib/ErrorCodes.js
  var require_ErrorCodes = __commonJS({
    "node_modules/ws/lib/ErrorCodes.js"(exports, module) {
      module.exports = {
        isValidErrorCode: function isValidErrorCode(code) {
          return code >= 1e3 && code <= 1011 && code != 1004 && code != 1005 && code != 1006 || code >= 3e3 && code <= 4999;
        },
        1e3: "normal",
        1001: "going away",
        1002: "protocol error",
        1003: "unsupported data",
        1004: "reserved",
        1005: "reserved for extensions",
        1006: "reserved for extensions",
        1007: "inconsistent or invalid data",
        1008: "policy violation",
        1009: "message too big",
        1010: "extension handshake missing",
        1011: "an unexpected condition prevented the request from being fulfilled"
      };
    }
  });

  // node_modules/ws/lib/BufferUtil.fallback.js
  var require_BufferUtil_fallback = __commonJS({
    "node_modules/ws/lib/BufferUtil.fallback.js"(exports) {
      exports.BufferUtil = {
        merge: function merge(mergedBuffer, buffers) {
          var offset = 0;
          for (var i = 0, l = buffers.length; i < l; ++i) {
            var buf = buffers[i];
            buf.copy(mergedBuffer, offset);
            offset += buf.length;
          }
        },
        mask: function mask(source, _mask, output, offset, length) {
          var maskNum = _mask.readUInt32LE(0, true);
          var i = 0;
          for (; i < length - 3; i += 4) {
            var num = maskNum ^ source.readUInt32LE(i, true);
            if (num < 0) num = 4294967296 + num;
            output.writeUInt32LE(num, offset + i, true);
          }
          switch (length % 4) {
            case 3:
              output[offset + i + 2] = source[i + 2] ^ _mask[2];
            case 2:
              output[offset + i + 1] = source[i + 1] ^ _mask[1];
            case 1:
              output[offset + i] = source[i] ^ _mask[0];
            case 0:
              ;
          }
        },
        unmask: function unmask(data, mask) {
          var maskNum = mask.readUInt32LE(0, true);
          var length = data.length;
          var i = 0;
          for (; i < length - 3; i += 4) {
            var num = maskNum ^ data.readUInt32LE(i, true);
            if (num < 0) num = 4294967296 + num;
            data.writeUInt32LE(num, i, true);
          }
          switch (length % 4) {
            case 3:
              data[i + 2] = data[i + 2] ^ mask[2];
            case 2:
              data[i + 1] = data[i + 1] ^ mask[1];
            case 1:
              data[i] = data[i] ^ mask[0];
            case 0:
              ;
          }
        }
      };
    }
  });

  // node_modules/ws/lib/BufferUtil.js
  var require_BufferUtil = __commonJS({
    "node_modules/ws/lib/BufferUtil.js"(exports, module) {
      "use strict";

      try {
        module.exports = __require("bufferutil");
      } catch (e) {
        module.exports = require_BufferUtil_fallback();
      }
    }
  });

  // node_modules/ws/lib/PerMessageDeflate.js
  var require_PerMessageDeflate = __commonJS({
    "node_modules/ws/lib/PerMessageDeflate.js"(exports, module) {
      var zlib = __require("zlib");
      var AVAILABLE_WINDOW_BITS = [8, 9, 10, 11, 12, 13, 14, 15];
      var DEFAULT_WINDOW_BITS = 15;
      var DEFAULT_MEM_LEVEL = 8;
      PerMessageDeflate.extensionName = "permessage-deflate";
      function PerMessageDeflate(options, isServer, maxPayload) {
        if (this instanceof PerMessageDeflate === false) {
          throw new TypeError("Classes can't be function-called");
        }
        this._options = options || {};
        this._isServer = !!isServer;
        this._inflate = null;
        this._deflate = null;
        this.params = null;
        this._maxPayload = maxPayload || 0;
      }
      PerMessageDeflate.prototype.offer = function () {
        var params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      };
      PerMessageDeflate.prototype.accept = function (paramsList) {
        paramsList = this.normalizeParams(paramsList);
        var params;
        if (this._isServer) {
          params = this.acceptAsServer(paramsList);
        } else {
          params = this.acceptAsClient(paramsList);
        }
        this.params = params;
        return params;
      };
      PerMessageDeflate.prototype.cleanup = function () {
        if (this._inflate) {
          if (this._inflate.writeInProgress) {
            this._inflate.pendingClose = true;
          } else {
            if (this._inflate.close) this._inflate.close();
            this._inflate = null;
          }
        }
        if (this._deflate) {
          if (this._deflate.writeInProgress) {
            this._deflate.pendingClose = true;
          } else {
            if (this._deflate.close) this._deflate.close();
            this._deflate = null;
          }
        }
      };
      PerMessageDeflate.prototype.acceptAsServer = function (paramsList) {
        var accepted = {};
        var result = paramsList.some(function (params) {
          accepted = {};
          if (this._options.serverNoContextTakeover === false && params.server_no_context_takeover) {
            return;
          }
          if (this._options.serverMaxWindowBits === false && params.server_max_window_bits) {
            return;
          }
          if (typeof this._options.serverMaxWindowBits === "number" && typeof params.server_max_window_bits === "number" && this._options.serverMaxWindowBits > params.server_max_window_bits) {
            return;
          }
          if (typeof this._options.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return;
          }
          if (this._options.serverNoContextTakeover || params.server_no_context_takeover) {
            accepted.server_no_context_takeover = true;
          }
          if (this._options.clientNoContextTakeover) {
            accepted.client_no_context_takeover = true;
          }
          if (this._options.clientNoContextTakeover !== false && params.client_no_context_takeover) {
            accepted.client_no_context_takeover = true;
          }
          if (typeof this._options.serverMaxWindowBits === "number") {
            accepted.server_max_window_bits = this._options.serverMaxWindowBits;
          } else if (typeof params.server_max_window_bits === "number") {
            accepted.server_max_window_bits = params.server_max_window_bits;
          }
          if (typeof this._options.clientMaxWindowBits === "number") {
            accepted.client_max_window_bits = this._options.clientMaxWindowBits;
          } else if (this._options.clientMaxWindowBits !== false && typeof params.client_max_window_bits === "number") {
            accepted.client_max_window_bits = params.client_max_window_bits;
          }
          return true;
        }, this);
        if (!result) {
          throw new Error("Doesn't support the offered configuration");
        }
        return accepted;
      };
      PerMessageDeflate.prototype.acceptAsClient = function (paramsList) {
        var params = paramsList[0];
        if (this._options.clientNoContextTakeover != null) {
          if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
            throw new Error('Invalid value for "client_no_context_takeover"');
          }
        }
        if (this._options.clientMaxWindowBits != null) {
          if (this._options.clientMaxWindowBits === false && params.client_max_window_bits) {
            throw new Error('Invalid value for "client_max_window_bits"');
          }
          if (typeof this._options.clientMaxWindowBits === "number" && (!params.client_max_window_bits || params.client_max_window_bits > this._options.clientMaxWindowBits)) {
            throw new Error('Invalid value for "client_max_window_bits"');
          }
        }
        return params;
      };
      PerMessageDeflate.prototype.normalizeParams = function (paramsList) {
        return paramsList.map(function (params) {
          Object.keys(params).forEach(function (key) {
            var value = params[key];
            if (value.length > 1) {
              throw new Error("Multiple extension parameters for " + key);
            }
            value = value[0];
            switch (key) {
              case "server_no_context_takeover":
              case "client_no_context_takeover":
                if (value !== true) {
                  throw new Error("invalid extension parameter value for " + key + " (" + value + ")");
                }
                params[key] = true;
                break;
              case "server_max_window_bits":
              case "client_max_window_bits":
                if (typeof value === "string") {
                  value = parseInt(value, 10);
                  if (!~AVAILABLE_WINDOW_BITS.indexOf(value)) {
                    throw new Error("invalid extension parameter value for " + key + " (" + value + ")");
                  }
                }
                if (!this._isServer && value === true) {
                  throw new Error("Missing extension parameter value for " + key);
                }
                params[key] = value;
                break;
              default:
                throw new Error("Not defined extension parameter (" + key + ")");
            }
          }, this);
          return params;
        }, this);
      };
      PerMessageDeflate.prototype.decompress = function (data, fin, callback) {
        var endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          var maxWindowBits = this.params[endpoint + "_max_window_bits"];
          this._inflate = zlib.createInflateRaw({
            windowBits: "number" === typeof maxWindowBits ? maxWindowBits : DEFAULT_WINDOW_BITS
          });
        }
        this._inflate.writeInProgress = true;
        var self = this;
        var buffers = [];
        var cumulativeBufferLength = 0;
        this._inflate.on("error", onError).on("data", onData);
        this._inflate.write(data);
        if (fin) {
          this._inflate.write(new Buffer([0, 0, 255, 255]));
        }
        this._inflate.flush(function () {
          cleanup();
          callback(null, Buffer.concat(buffers));
        });
        function onError(err) {
          cleanup();
          callback(err);
        }
        function onData(data2) {
          if (self._maxPayload !== void 0 && self._maxPayload !== null && self._maxPayload > 0) {
            cumulativeBufferLength += data2.length;
            if (cumulativeBufferLength > self._maxPayload) {
              buffers = [];
              cleanup();
              var err = {
                type: 1009
              };
              callback(err);
              return;
            }
          }
          buffers.push(data2);
        }
        function cleanup() {
          if (!self._inflate) return;
          self._inflate.removeListener("error", onError);
          self._inflate.removeListener("data", onData);
          self._inflate.writeInProgress = false;
          if (fin && self.params[endpoint + "_no_context_takeover"] || self._inflate.pendingClose) {
            if (self._inflate.close) self._inflate.close();
            self._inflate = null;
          }
        }
      };
      PerMessageDeflate.prototype.compress = function (data, fin, callback) {
        var endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          var maxWindowBits = this.params[endpoint + "_max_window_bits"];
          this._deflate = zlib.createDeflateRaw({
            flush: zlib.Z_SYNC_FLUSH,
            windowBits: "number" === typeof maxWindowBits ? maxWindowBits : DEFAULT_WINDOW_BITS,
            memLevel: this._options.memLevel || DEFAULT_MEM_LEVEL
          });
        }
        this._deflate.writeInProgress = true;
        var self = this;
        var buffers = [];
        this._deflate.on("error", onError).on("data", onData);
        this._deflate.write(data);
        this._deflate.flush(function () {
          cleanup();
          var data2 = Buffer.concat(buffers);
          if (fin) {
            data2 = data2.slice(0, data2.length - 4);
          }
          callback(null, data2);
        });
        function onError(err) {
          cleanup();
          callback(err);
        }
        function onData(data2) {
          buffers.push(data2);
        }
        function cleanup() {
          if (!self._deflate) return;
          self._deflate.removeListener("error", onError);
          self._deflate.removeListener("data", onData);
          self._deflate.writeInProgress = false;
          if (fin && self.params[endpoint + "_no_context_takeover"] || self._deflate.pendingClose) {
            if (self._deflate.close) self._deflate.close();
            self._deflate = null;
          }
        }
      };
      module.exports = PerMessageDeflate;
    }
  });

  // node_modules/ws/lib/Sender.js
  var require_Sender = __commonJS({
    "node_modules/ws/lib/Sender.js"(exports, module) {
      var events = __require("events");
      var util = __require("util");
      var EventEmitter = events.EventEmitter;
      var ErrorCodes = require_ErrorCodes();
      var bufferUtil = require_BufferUtil().BufferUtil;
      var PerMessageDeflate = require_PerMessageDeflate();
      function Sender(socket, extensions) {
        if (this instanceof Sender === false) {
          throw new TypeError("Classes can't be function-called");
        }
        events.EventEmitter.call(this);
        this._socket = socket;
        this.extensions = extensions || {};
        this.firstFragment = true;
        this.compress = false;
        this.messageHandlers = [];
        this.processing = false;
      }
      util.inherits(Sender, events.EventEmitter);
      Sender.prototype.close = function (code, data, mask, cb) {
        if (typeof code !== "undefined") {
          if (typeof code !== "number" || !ErrorCodes.isValidErrorCode(code)) throw new Error("first argument must be a valid error code number");
        }
        code = code || 1e3;
        var dataBuffer = new Buffer(2 + (data ? Buffer.byteLength(data) : 0));
        writeUInt16BE.call(dataBuffer, code, 0);
        if (dataBuffer.length > 2) dataBuffer.write(data, 2);
        var self = this;
        this.messageHandlers.push(function (callback) {
          self.frameAndSend(8, dataBuffer, true, mask);
          callback();
          if (typeof cb == "function") cb();
        });
        this.flush();
      };
      Sender.prototype.ping = function (data, options) {
        var mask = options && options.mask;
        var self = this;
        this.messageHandlers.push(function (callback) {
          self.frameAndSend(9, data || "", true, mask);
          callback();
        });
        this.flush();
      };
      Sender.prototype.pong = function (data, options) {
        var mask = options && options.mask;
        var self = this;
        this.messageHandlers.push(function (callback) {
          self.frameAndSend(10, data || "", true, mask);
          callback();
        });
        this.flush();
      };
      Sender.prototype.send = function (data, options, cb) {
        var finalFragment = options && options.fin === false ? false : true;
        var mask = options && options.mask;
        var compress = options && options.compress;
        var opcode = options && options.binary ? 2 : 1;
        if (this.firstFragment === false) {
          opcode = 0;
          compress = false;
        } else {
          this.firstFragment = false;
          this.compress = compress;
        }
        if (finalFragment) this.firstFragment = true;
        var compressFragment = this.compress;
        var self = this;
        this.messageHandlers.push(function (callback) {
          self.applyExtensions(data, finalFragment, compressFragment, function (err, data2) {
            if (err) {
              if (typeof cb == "function") cb(err);else self.emit("error", err);
              return;
            }
            self.frameAndSend(opcode, data2, finalFragment, mask, compress, cb);
            callback();
          });
        });
        this.flush();
      };
      Sender.prototype.frameAndSend = function (opcode, data, finalFragment, maskData, compressed, cb) {
        var canModifyData = false;
        if (!data) {
          try {
            this._socket.write(new Buffer([opcode | (finalFragment ? 128 : 0), 0 | (maskData ? 128 : 0)].concat(maskData ? [0, 0, 0, 0] : [])), "binary", cb);
          } catch (e) {
            if (typeof cb == "function") cb(e);else this.emit("error", e);
          }
          return;
        }
        if (!Buffer.isBuffer(data)) {
          canModifyData = true;
          if (data && (typeof data.byteLength !== "undefined" || typeof data.buffer !== "undefined")) {
            data = getArrayBuffer(data);
          } else {
            if (typeof data === "number") data = data.toString();
            data = new Buffer(data);
          }
        }
        var dataLength = data.length,
          dataOffset = maskData ? 6 : 2,
          secondByte = dataLength;
        if (dataLength >= 65536) {
          dataOffset += 8;
          secondByte = 127;
        } else if (dataLength > 125) {
          dataOffset += 2;
          secondByte = 126;
        }
        var mergeBuffers = dataLength < 32768 || maskData && !canModifyData;
        var totalLength = mergeBuffers ? dataLength + dataOffset : dataOffset;
        var outputBuffer = new Buffer(totalLength);
        outputBuffer[0] = finalFragment ? opcode | 128 : opcode;
        if (compressed) outputBuffer[0] |= 64;
        switch (secondByte) {
          case 126:
            writeUInt16BE.call(outputBuffer, dataLength, 2);
            break;
          case 127:
            writeUInt32BE.call(outputBuffer, 0, 2);
            writeUInt32BE.call(outputBuffer, dataLength, 6);
        }
        if (maskData) {
          outputBuffer[1] = secondByte | 128;
          var mask = getRandomMask();
          outputBuffer[dataOffset - 4] = mask[0];
          outputBuffer[dataOffset - 3] = mask[1];
          outputBuffer[dataOffset - 2] = mask[2];
          outputBuffer[dataOffset - 1] = mask[3];
          if (mergeBuffers) {
            bufferUtil.mask(data, mask, outputBuffer, dataOffset, dataLength);
            try {
              this._socket.write(outputBuffer, "binary", cb);
            } catch (e) {
              if (typeof cb == "function") cb(e);else this.emit("error", e);
            }
          } else {
            bufferUtil.mask(data, mask, data, 0, dataLength);
            try {
              this._socket.write(outputBuffer, "binary");
              this._socket.write(data, "binary", cb);
            } catch (e) {
              if (typeof cb == "function") cb(e);else this.emit("error", e);
            }
          }
        } else {
          outputBuffer[1] = secondByte;
          if (mergeBuffers) {
            data.copy(outputBuffer, dataOffset);
            try {
              this._socket.write(outputBuffer, "binary", cb);
            } catch (e) {
              if (typeof cb == "function") cb(e);else this.emit("error", e);
            }
          } else {
            try {
              this._socket.write(outputBuffer, "binary");
              this._socket.write(data, "binary", cb);
            } catch (e) {
              if (typeof cb == "function") cb(e);else this.emit("error", e);
            }
          }
        }
      };
      Sender.prototype.flush = function () {
        if (this.processing) return;
        var handler = this.messageHandlers.shift();
        if (!handler) return;
        this.processing = true;
        var self = this;
        handler(function () {
          self.processing = false;
          self.flush();
        });
      };
      Sender.prototype.applyExtensions = function (data, fin, compress, callback) {
        if (compress && data) {
          if ((data.buffer || data) instanceof ArrayBuffer) {
            data = getArrayBuffer(data);
          }
          this.extensions[PerMessageDeflate.extensionName].compress(data, fin, callback);
        } else {
          callback(null, data);
        }
      };
      module.exports = Sender;
      function writeUInt16BE(value, offset) {
        this[offset] = (value & 65280) >> 8;
        this[offset + 1] = value & 255;
      }
      function writeUInt32BE(value, offset) {
        this[offset] = (value & 4278190080) >> 24;
        this[offset + 1] = (value & 16711680) >> 16;
        this[offset + 2] = (value & 65280) >> 8;
        this[offset + 3] = value & 255;
      }
      function getArrayBuffer(data) {
        var array = new Uint8Array(data.buffer || data),
          l = data.byteLength || data.length,
          o = data.byteOffset || 0,
          buffer = new Buffer(l);
        for (var i = 0; i < l; ++i) {
          buffer[i] = array[o + i];
        }
        return buffer;
      }
      function getRandomMask() {
        return new Buffer([~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255)]);
      }
    }
  });

  // node_modules/ws/lib/Validation.fallback.js
  var require_Validation_fallback = __commonJS({
    "node_modules/ws/lib/Validation.fallback.js"(exports) {
      exports.Validation = {
        isValidUTF8: function isValidUTF8(buffer) {
          return true;
        }
      };
    }
  });

  // node_modules/ws/lib/Validation.js
  var require_Validation = __commonJS({
    "node_modules/ws/lib/Validation.js"(exports, module) {
      "use strict";

      try {
        module.exports = __require("utf-8-validate");
      } catch (e) {
        module.exports = require_Validation_fallback();
      }
    }
  });

  // node_modules/ws/lib/BufferPool.js
  var require_BufferPool = __commonJS({
    "node_modules/ws/lib/BufferPool.js"(exports, module) {
      var util = __require("util");
      function BufferPool(initialSize, growStrategy, shrinkStrategy) {
        if (this instanceof BufferPool === false) {
          throw new TypeError("Classes can't be function-called");
        }
        if (typeof initialSize === "function") {
          shrinkStrategy = growStrategy;
          growStrategy = initialSize;
          initialSize = 0;
        } else if (typeof initialSize === "undefined") {
          initialSize = 0;
        }
        this._growStrategy = (growStrategy || function (db, size) {
          return db.used + size;
        }).bind(null, this);
        this._shrinkStrategy = (shrinkStrategy || function (db) {
          return initialSize;
        }).bind(null, this);
        this._buffer = initialSize ? new Buffer(initialSize) : null;
        this._offset = 0;
        this._used = 0;
        this._changeFactor = 0;
        this.__defineGetter__("size", function () {
          return this._buffer == null ? 0 : this._buffer.length;
        });
        this.__defineGetter__("used", function () {
          return this._used;
        });
      }
      BufferPool.prototype.get = function (length) {
        if (this._buffer == null || this._offset + length > this._buffer.length) {
          var newBuf = new Buffer(this._growStrategy(length));
          this._buffer = newBuf;
          this._offset = 0;
        }
        this._used += length;
        var buf = this._buffer.slice(this._offset, this._offset + length);
        this._offset += length;
        return buf;
      };
      BufferPool.prototype.reset = function (forceNewBuffer) {
        var len = this._shrinkStrategy();
        if (len < this.size) this._changeFactor -= 1;
        if (forceNewBuffer || this._changeFactor < -2) {
          this._changeFactor = 0;
          this._buffer = len ? new Buffer(len) : null;
        }
        this._offset = 0;
        this._used = 0;
      };
      module.exports = BufferPool;
    }
  });

  // node_modules/ws/lib/Receiver.js
  var require_Receiver = __commonJS({
    "node_modules/ws/lib/Receiver.js"(exports, module) {
      var util = __require("util");
      var Validation = require_Validation().Validation;
      var ErrorCodes = require_ErrorCodes();
      var BufferPool = require_BufferPool();
      var bufferUtil = require_BufferUtil().BufferUtil;
      var PerMessageDeflate = require_PerMessageDeflate();
      function Receiver(extensions, maxPayload) {
        if (this instanceof Receiver === false) {
          throw new TypeError("Classes can't be function-called");
        }
        if (typeof extensions === "number") {
          maxPayload = extensions;
          extensions = {};
        }
        var fragmentedPoolPrevUsed = -1;
        this.fragmentedBufferPool = new BufferPool(1024, function (db, length) {
          return db.used + length;
        }, function (db) {
          return fragmentedPoolPrevUsed = fragmentedPoolPrevUsed >= 0 ? Math.ceil((fragmentedPoolPrevUsed + db.used) / 2) : db.used;
        });
        var unfragmentedPoolPrevUsed = -1;
        this.unfragmentedBufferPool = new BufferPool(1024, function (db, length) {
          return db.used + length;
        }, function (db) {
          return unfragmentedPoolPrevUsed = unfragmentedPoolPrevUsed >= 0 ? Math.ceil((unfragmentedPoolPrevUsed + db.used) / 2) : db.used;
        });
        this.extensions = extensions || {};
        this.maxPayload = maxPayload || 0;
        this.currentPayloadLength = 0;
        this.state = {
          activeFragmentedOperation: null,
          lastFragment: false,
          masked: false,
          opcode: 0,
          fragmentedOperation: false
        };
        this.overflow = [];
        this.headerBuffer = new Buffer(10);
        this.expectOffset = 0;
        this.expectBuffer = null;
        this.expectHandler = null;
        this.currentMessage = [];
        this.currentMessageLength = 0;
        this.messageHandlers = [];
        this.expectHeader(2, this.processPacket);
        this.dead = false;
        this.processing = false;
        this.onerror = function () {};
        this.ontext = function () {};
        this.onbinary = function () {};
        this.onclose = function () {};
        this.onping = function () {};
        this.onpong = function () {};
      }
      module.exports = Receiver;
      Receiver.prototype.add = function (data) {
        if (this.dead) return;
        var dataLength = data.length;
        if (dataLength == 0) return;
        if (this.expectBuffer == null) {
          this.overflow.push(data);
          return;
        }
        var toRead = Math.min(dataLength, this.expectBuffer.length - this.expectOffset);
        fastCopy(toRead, data, this.expectBuffer, this.expectOffset);
        this.expectOffset += toRead;
        if (toRead < dataLength) {
          this.overflow.push(data.slice(toRead));
        }
        while (this.expectBuffer && this.expectOffset == this.expectBuffer.length) {
          var bufferForHandler = this.expectBuffer;
          this.expectBuffer = null;
          this.expectOffset = 0;
          this.expectHandler.call(this, bufferForHandler);
        }
      };
      Receiver.prototype.cleanup = function () {
        this.dead = true;
        this.overflow = null;
        this.headerBuffer = null;
        this.expectBuffer = null;
        this.expectHandler = null;
        this.unfragmentedBufferPool = null;
        this.fragmentedBufferPool = null;
        this.state = null;
        this.currentMessage = null;
        this.onerror = null;
        this.ontext = null;
        this.onbinary = null;
        this.onclose = null;
        this.onping = null;
        this.onpong = null;
      };
      Receiver.prototype.expectHeader = function (length, handler) {
        if (length == 0) {
          handler(null);
          return;
        }
        this.expectBuffer = this.headerBuffer.slice(this.expectOffset, this.expectOffset + length);
        this.expectHandler = handler;
        var toRead = length;
        while (toRead > 0 && this.overflow.length > 0) {
          var fromOverflow = this.overflow.pop();
          if (toRead < fromOverflow.length) this.overflow.push(fromOverflow.slice(toRead));
          var read = Math.min(fromOverflow.length, toRead);
          fastCopy(read, fromOverflow, this.expectBuffer, this.expectOffset);
          this.expectOffset += read;
          toRead -= read;
        }
      };
      Receiver.prototype.expectData = function (length, handler) {
        if (length == 0) {
          handler(null);
          return;
        }
        this.expectBuffer = this.allocateFromPool(length, this.state.fragmentedOperation);
        this.expectHandler = handler;
        var toRead = length;
        while (toRead > 0 && this.overflow.length > 0) {
          var fromOverflow = this.overflow.pop();
          if (toRead < fromOverflow.length) this.overflow.push(fromOverflow.slice(toRead));
          var read = Math.min(fromOverflow.length, toRead);
          fastCopy(read, fromOverflow, this.expectBuffer, this.expectOffset);
          this.expectOffset += read;
          toRead -= read;
        }
      };
      Receiver.prototype.allocateFromPool = function (length, isFragmented) {
        return (isFragmented ? this.fragmentedBufferPool : this.unfragmentedBufferPool).get(length);
      };
      Receiver.prototype.processPacket = function (data) {
        if (this.extensions[PerMessageDeflate.extensionName]) {
          if ((data[0] & 48) != 0) {
            this.error("reserved fields (2, 3) must be empty", 1002);
            return;
          }
        } else {
          if ((data[0] & 112) != 0) {
            this.error("reserved fields must be empty", 1002);
            return;
          }
        }
        this.state.lastFragment = (data[0] & 128) == 128;
        this.state.masked = (data[1] & 128) == 128;
        var compressed = (data[0] & 64) == 64;
        var opcode = data[0] & 15;
        if (opcode === 0) {
          if (compressed) {
            this.error("continuation frame cannot have the Per-message Compressed bits", 1002);
            return;
          }
          this.state.fragmentedOperation = true;
          this.state.opcode = this.state.activeFragmentedOperation;
          if (!(this.state.opcode == 1 || this.state.opcode == 2)) {
            this.error("continuation frame cannot follow current opcode", 1002);
            return;
          }
        } else {
          if (opcode < 3 && this.state.activeFragmentedOperation != null) {
            this.error("data frames after the initial data frame must have opcode 0", 1002);
            return;
          }
          if (opcode >= 8 && compressed) {
            this.error("control frames cannot have the Per-message Compressed bits", 1002);
            return;
          }
          this.state.compressed = compressed;
          this.state.opcode = opcode;
          if (this.state.lastFragment === false) {
            this.state.fragmentedOperation = true;
            this.state.activeFragmentedOperation = opcode;
          } else this.state.fragmentedOperation = false;
        }
        var handler = opcodes[this.state.opcode];
        if (typeof handler == "undefined") this.error("no handler for opcode " + this.state.opcode, 1002);else {
          handler.start.call(this, data);
        }
      };
      Receiver.prototype.endPacket = function () {
        if (this.dead) return;
        if (!this.state.fragmentedOperation) this.unfragmentedBufferPool.reset(true);else if (this.state.lastFragment) this.fragmentedBufferPool.reset(true);
        this.expectOffset = 0;
        this.expectBuffer = null;
        this.expectHandler = null;
        if (this.state.lastFragment && this.state.opcode === this.state.activeFragmentedOperation) {
          this.state.activeFragmentedOperation = null;
        }
        this.currentPayloadLength = 0;
        this.state.lastFragment = false;
        this.state.opcode = this.state.activeFragmentedOperation != null ? this.state.activeFragmentedOperation : 0;
        this.state.masked = false;
        this.expectHeader(2, this.processPacket);
      };
      Receiver.prototype.reset = function () {
        if (this.dead) return;
        this.state = {
          activeFragmentedOperation: null,
          lastFragment: false,
          masked: false,
          opcode: 0,
          fragmentedOperation: false
        };
        this.fragmentedBufferPool.reset(true);
        this.unfragmentedBufferPool.reset(true);
        this.expectOffset = 0;
        this.expectBuffer = null;
        this.expectHandler = null;
        this.overflow = [];
        this.currentMessage = [];
        this.currentMessageLength = 0;
        this.messageHandlers = [];
        this.currentPayloadLength = 0;
      };
      Receiver.prototype.unmask = function (mask, buf, binary) {
        if (mask != null && buf != null) bufferUtil.unmask(buf, mask);
        if (binary) return buf;
        return buf != null ? buf.toString("utf8") : "";
      };
      Receiver.prototype.error = function (reason, protocolErrorCode) {
        if (this.dead) return;
        this.reset();
        if (typeof reason == "string") {
          this.onerror(new Error(reason), protocolErrorCode);
        } else if (reason.constructor == Error) {
          this.onerror(reason, protocolErrorCode);
        } else {
          this.onerror(new Error("An error occured"), protocolErrorCode);
        }
        return this;
      };
      Receiver.prototype.flush = function () {
        if (this.processing || this.dead) return;
        var handler = this.messageHandlers.shift();
        if (!handler) return;
        this.processing = true;
        var self = this;
        handler(function () {
          self.processing = false;
          self.flush();
        });
      };
      Receiver.prototype.applyExtensions = function (messageBuffer, fin, compressed, callback) {
        var self = this;
        if (compressed) {
          this.extensions[PerMessageDeflate.extensionName].decompress(messageBuffer, fin, function (err, buffer) {
            if (self.dead) return;
            if (err) {
              callback(new Error("invalid compressed data"));
              return;
            }
            callback(null, buffer);
          });
        } else {
          callback(null, messageBuffer);
        }
      };
      Receiver.prototype.maxPayloadExceeded = function (length) {
        if (this.maxPayload === void 0 || this.maxPayload === null || this.maxPayload < 1) {
          return false;
        }
        var fullLength = this.currentPayloadLength + length;
        if (fullLength < this.maxPayload) {
          this.currentPayloadLength = fullLength;
          return false;
        }
        this.error("payload cannot exceed " + this.maxPayload + " bytes", 1009);
        this.messageBuffer = [];
        this.cleanup();
        return true;
      };
      function readUInt16BE(start) {
        return (this[start] << 8) + this[start + 1];
      }
      function readUInt32BE(start) {
        return (this[start] << 24) + (this[start + 1] << 16) + (this[start + 2] << 8) + this[start + 3];
      }
      function fastCopy(length, srcBuffer, dstBuffer, dstOffset) {
        switch (length) {
          default:
            srcBuffer.copy(dstBuffer, dstOffset, 0, length);
            break;
          case 16:
            dstBuffer[dstOffset + 15] = srcBuffer[15];
          case 15:
            dstBuffer[dstOffset + 14] = srcBuffer[14];
          case 14:
            dstBuffer[dstOffset + 13] = srcBuffer[13];
          case 13:
            dstBuffer[dstOffset + 12] = srcBuffer[12];
          case 12:
            dstBuffer[dstOffset + 11] = srcBuffer[11];
          case 11:
            dstBuffer[dstOffset + 10] = srcBuffer[10];
          case 10:
            dstBuffer[dstOffset + 9] = srcBuffer[9];
          case 9:
            dstBuffer[dstOffset + 8] = srcBuffer[8];
          case 8:
            dstBuffer[dstOffset + 7] = srcBuffer[7];
          case 7:
            dstBuffer[dstOffset + 6] = srcBuffer[6];
          case 6:
            dstBuffer[dstOffset + 5] = srcBuffer[5];
          case 5:
            dstBuffer[dstOffset + 4] = srcBuffer[4];
          case 4:
            dstBuffer[dstOffset + 3] = srcBuffer[3];
          case 3:
            dstBuffer[dstOffset + 2] = srcBuffer[2];
          case 2:
            dstBuffer[dstOffset + 1] = srcBuffer[1];
          case 1:
            dstBuffer[dstOffset] = srcBuffer[0];
        }
      }
      function clone(obj) {
        var cloned = {};
        for (var k in obj) {
          if (obj.hasOwnProperty(k)) {
            cloned[k] = obj[k];
          }
        }
        return cloned;
      }
      var opcodes = {
        // text
        "1": {
          start: function start(data) {
            var self = this;
            var firstLength = data[1] & 127;
            if (firstLength < 126) {
              if (self.maxPayloadExceeded(firstLength)) {
                self.error("Maximumpayload exceeded in compressed text message. Aborting...", 1009);
                return;
              }
              opcodes["1"].getData.call(self, firstLength);
            } else if (firstLength == 126) {
              self.expectHeader(2, function (data2) {
                var length = readUInt16BE.call(data2, 0);
                if (self.maxPayloadExceeded(length)) {
                  self.error("Maximumpayload exceeded in compressed text message. Aborting...", 1009);
                  return;
                }
                opcodes["1"].getData.call(self, length);
              });
            } else if (firstLength == 127) {
              self.expectHeader(8, function (data2) {
                if (readUInt32BE.call(data2, 0) != 0) {
                  self.error("packets with length spanning more than 32 bit is currently not supported", 1008);
                  return;
                }
                var length = readUInt32BE.call(data2, 4);
                if (self.maxPayloadExceeded(length)) {
                  self.error("Maximumpayload exceeded in compressed text message. Aborting...", 1009);
                  return;
                }
                opcodes["1"].getData.call(self, readUInt32BE.call(data2, 4));
              });
            }
          },
          getData: function getData(length) {
            var self = this;
            if (self.state.masked) {
              self.expectHeader(4, function (data) {
                var mask = data;
                self.expectData(length, function (data2) {
                  opcodes["1"].finish.call(self, mask, data2);
                });
              });
            } else {
              self.expectData(length, function (data) {
                opcodes["1"].finish.call(self, null, data);
              });
            }
          },
          finish: function finish(mask, data) {
            var self = this;
            var packet = this.unmask(mask, data, true) || new Buffer(0);
            var state = clone(this.state);
            this.messageHandlers.push(function (callback) {
              self.applyExtensions(packet, state.lastFragment, state.compressed, function (err, buffer) {
                if (err) {
                  if (err.type === 1009) {
                    return self.error("Maximumpayload exceeded in compressed text message. Aborting...", 1009);
                  }
                  return self.error(err.message, 1007);
                }
                if (buffer != null) {
                  if (self.maxPayload == 0 || self.maxPayload > 0 && self.currentMessageLength + buffer.length < self.maxPayload) {
                    self.currentMessage.push(buffer);
                  } else {
                    self.currentMessage = null;
                    self.currentMessage = [];
                    self.currentMessageLength = 0;
                    self.error(new Error("Maximum payload exceeded. maxPayload: " + self.maxPayload), 1009);
                    return;
                  }
                  self.currentMessageLength += buffer.length;
                }
                if (state.lastFragment) {
                  var messageBuffer = Buffer.concat(self.currentMessage);
                  self.currentMessage = [];
                  self.currentMessageLength = 0;
                  if (!Validation.isValidUTF8(messageBuffer)) {
                    self.error("invalid utf8 sequence", 1007);
                    return;
                  }
                  self.ontext(messageBuffer.toString("utf8"), {
                    masked: state.masked,
                    buffer: messageBuffer
                  });
                }
                callback();
              });
            });
            this.flush();
            this.endPacket();
          }
        },
        // binary
        "2": {
          start: function start(data) {
            var self = this;
            var firstLength = data[1] & 127;
            if (firstLength < 126) {
              if (self.maxPayloadExceeded(firstLength)) {
                self.error("Max payload exceeded in compressed text message. Aborting...", 1009);
                return;
              }
              opcodes["2"].getData.call(self, firstLength);
            } else if (firstLength == 126) {
              self.expectHeader(2, function (data2) {
                var length = readUInt16BE.call(data2, 0);
                if (self.maxPayloadExceeded(length)) {
                  self.error("Max payload exceeded in compressed text message. Aborting...", 1009);
                  return;
                }
                opcodes["2"].getData.call(self, length);
              });
            } else if (firstLength == 127) {
              self.expectHeader(8, function (data2) {
                if (readUInt32BE.call(data2, 0) != 0) {
                  self.error("packets with length spanning more than 32 bit is currently not supported", 1008);
                  return;
                }
                var length = readUInt32BE.call(data2, 4, true);
                if (self.maxPayloadExceeded(length)) {
                  self.error("Max payload exceeded in compressed text message. Aborting...", 1009);
                  return;
                }
                opcodes["2"].getData.call(self, length);
              });
            }
          },
          getData: function getData(length) {
            var self = this;
            if (self.state.masked) {
              self.expectHeader(4, function (data) {
                var mask = data;
                self.expectData(length, function (data2) {
                  opcodes["2"].finish.call(self, mask, data2);
                });
              });
            } else {
              self.expectData(length, function (data) {
                opcodes["2"].finish.call(self, null, data);
              });
            }
          },
          finish: function finish(mask, data) {
            var self = this;
            var packet = this.unmask(mask, data, true) || new Buffer(0);
            var state = clone(this.state);
            this.messageHandlers.push(function (callback) {
              self.applyExtensions(packet, state.lastFragment, state.compressed, function (err, buffer) {
                if (err) {
                  if (err.type === 1009) {
                    return self.error("Max payload exceeded in compressed binary message. Aborting...", 1009);
                  }
                  return self.error(err.message, 1007);
                }
                if (buffer != null) {
                  if (self.maxPayload == 0 || self.maxPayload > 0 && self.currentMessageLength + buffer.length < self.maxPayload) {
                    self.currentMessage.push(buffer);
                  } else {
                    self.currentMessage = null;
                    self.currentMessage = [];
                    self.currentMessageLength = 0;
                    self.error(new Error("Maximum payload exceeded"), 1009);
                    return;
                  }
                  self.currentMessageLength += buffer.length;
                }
                if (state.lastFragment) {
                  var messageBuffer = Buffer.concat(self.currentMessage);
                  self.currentMessage = [];
                  self.currentMessageLength = 0;
                  self.onbinary(messageBuffer, {
                    masked: state.masked,
                    buffer: messageBuffer
                  });
                }
                callback();
              });
            });
            this.flush();
            this.endPacket();
          }
        },
        // close
        "8": {
          start: function start(data) {
            var self = this;
            if (self.state.lastFragment == false) {
              self.error("fragmented close is not supported", 1002);
              return;
            }
            var firstLength = data[1] & 127;
            if (firstLength < 126) {
              opcodes["8"].getData.call(self, firstLength);
            } else {
              self.error("control frames cannot have more than 125 bytes of data", 1002);
            }
          },
          getData: function getData(length) {
            var self = this;
            if (self.state.masked) {
              self.expectHeader(4, function (data) {
                var mask = data;
                self.expectData(length, function (data2) {
                  opcodes["8"].finish.call(self, mask, data2);
                });
              });
            } else {
              self.expectData(length, function (data) {
                opcodes["8"].finish.call(self, null, data);
              });
            }
          },
          finish: function finish(mask, data) {
            var self = this;
            data = self.unmask(mask, data, true);
            var state = clone(this.state);
            this.messageHandlers.push(function () {
              if (data && data.length == 1) {
                self.error("close packets with data must be at least two bytes long", 1002);
                return;
              }
              var code = data && data.length > 1 ? readUInt16BE.call(data, 0) : 1e3;
              if (!ErrorCodes.isValidErrorCode(code)) {
                self.error("invalid error code", 1002);
                return;
              }
              var message = "";
              if (data && data.length > 2) {
                var messageBuffer = data.slice(2);
                if (!Validation.isValidUTF8(messageBuffer)) {
                  self.error("invalid utf8 sequence", 1007);
                  return;
                }
                message = messageBuffer.toString("utf8");
              }
              self.onclose(code, message, {
                masked: state.masked
              });
              self.reset();
            });
            this.flush();
          }
        },
        // ping
        "9": {
          start: function start(data) {
            var self = this;
            if (self.state.lastFragment == false) {
              self.error("fragmented ping is not supported", 1002);
              return;
            }
            var firstLength = data[1] & 127;
            if (firstLength < 126) {
              opcodes["9"].getData.call(self, firstLength);
            } else {
              self.error("control frames cannot have more than 125 bytes of data", 1002);
            }
          },
          getData: function getData(length) {
            var self = this;
            if (self.state.masked) {
              self.expectHeader(4, function (data) {
                var mask = data;
                self.expectData(length, function (data2) {
                  opcodes["9"].finish.call(self, mask, data2);
                });
              });
            } else {
              self.expectData(length, function (data) {
                opcodes["9"].finish.call(self, null, data);
              });
            }
          },
          finish: function finish(mask, data) {
            var self = this;
            data = this.unmask(mask, data, true);
            var state = clone(this.state);
            this.messageHandlers.push(function (callback) {
              self.onping(data, {
                masked: state.masked,
                binary: true
              });
              callback();
            });
            this.flush();
            this.endPacket();
          }
        },
        // pong
        "10": {
          start: function start(data) {
            var self = this;
            if (self.state.lastFragment == false) {
              self.error("fragmented pong is not supported", 1002);
              return;
            }
            var firstLength = data[1] & 127;
            if (firstLength < 126) {
              opcodes["10"].getData.call(self, firstLength);
            } else {
              self.error("control frames cannot have more than 125 bytes of data", 1002);
            }
          },
          getData: function getData(length) {
            var self = this;
            if (this.state.masked) {
              this.expectHeader(4, function (data) {
                var mask = data;
                self.expectData(length, function (data2) {
                  opcodes["10"].finish.call(self, mask, data2);
                });
              });
            } else {
              this.expectData(length, function (data) {
                opcodes["10"].finish.call(self, null, data);
              });
            }
          },
          finish: function finish(mask, data) {
            var self = this;
            data = self.unmask(mask, data, true);
            var state = clone(this.state);
            this.messageHandlers.push(function (callback) {
              self.onpong(data, {
                masked: state.masked,
                binary: true
              });
              callback();
            });
            this.flush();
            this.endPacket();
          }
        }
      };
    }
  });

  // node_modules/ws/lib/Sender.hixie.js
  var require_Sender_hixie = __commonJS({
    "node_modules/ws/lib/Sender.hixie.js"(exports, module) {
      var events = __require("events");
      var util = __require("util");
      var EventEmitter = events.EventEmitter;
      function Sender(socket) {
        if (this instanceof Sender === false) {
          throw new TypeError("Classes can't be function-called");
        }
        events.EventEmitter.call(this);
        this.socket = socket;
        this.continuationFrame = false;
        this.isClosed = false;
      }
      module.exports = Sender;
      util.inherits(Sender, events.EventEmitter);
      Sender.prototype.send = function (data, options, cb) {
        if (this.isClosed) return;
        var isString = typeof data == "string",
          length = isString ? Buffer.byteLength(data) : data.length,
          lengthbytes = length > 127 ? 2 : 1,
          writeStartMarker = this.continuationFrame == false,
          writeEndMarker = !options || !(typeof options.fin != "undefined" && !options.fin),
          buffer = new Buffer((writeStartMarker ? options && options.binary ? 1 + lengthbytes : 1 : 0) + length + (writeEndMarker && !(options && options.binary) ? 1 : 0)),
          offset = writeStartMarker ? 1 : 0;
        if (writeStartMarker) {
          if (options && options.binary) {
            buffer.write("", "binary");
            if (lengthbytes > 1) buffer.write(String.fromCharCode(128 + length / 128), offset++, "binary");
            buffer.write(String.fromCharCode(length & 127), offset++, "binary");
          } else buffer.write("\0", "binary");
        }
        if (isString) buffer.write(data, offset, "utf8");else data.copy(buffer, offset, 0);
        if (writeEndMarker) {
          if (options && options.binary) {} else buffer.write("ÿ", offset + length, "binary");
          this.continuationFrame = false;
        } else this.continuationFrame = true;
        try {
          this.socket.write(buffer, "binary", cb);
        } catch (e) {
          this.error(e.toString());
        }
      };
      Sender.prototype.close = function (code, data, mask, cb) {
        if (this.isClosed) return;
        this.isClosed = true;
        try {
          if (this.continuationFrame) this.socket.write(new Buffer([255], "binary"));
          this.socket.write(new Buffer([255, 0]), "binary", cb);
        } catch (e) {
          this.error(e.toString());
        }
      };
      Sender.prototype.ping = function (data, options) {};
      Sender.prototype.pong = function (data, options) {};
      Sender.prototype.error = function (reason) {
        this.emit("error", reason);
        return this;
      };
    }
  });

  // node_modules/ws/lib/Receiver.hixie.js
  var require_Receiver_hixie = __commonJS({
    "node_modules/ws/lib/Receiver.hixie.js"(exports, module) {
      var util = __require("util");
      var EMPTY = 0;
      var BODY = 1;
      var BINARYLENGTH = 2;
      var BINARYBODY = 3;
      function Receiver() {
        if (this instanceof Receiver === false) {
          throw new TypeError("Classes can't be function-called");
        }
        this.state = EMPTY;
        this.buffers = [];
        this.messageEnd = -1;
        this.spanLength = 0;
        this.dead = false;
        this.onerror = function () {};
        this.ontext = function () {};
        this.onbinary = function () {};
        this.onclose = function () {};
        this.onping = function () {};
        this.onpong = function () {};
      }
      module.exports = Receiver;
      Receiver.prototype.add = function (data) {
        if (this.dead) return;
        var self = this;
        function doAdd() {
          if (self.state === EMPTY) {
            if (data.length == 2 && data[0] == 255 && data[1] == 0) {
              self.reset();
              self.onclose();
              return;
            }
            if (data[0] === 128) {
              self.messageEnd = 0;
              self.state = BINARYLENGTH;
              data = data.slice(1);
            } else {
              if (data[0] !== 0) {
                self.error("payload must start with 0x00 byte", true);
                return;
              }
              data = data.slice(1);
              self.state = BODY;
            }
          }
          if (self.state === BINARYLENGTH) {
            var i = 0;
            while (i < data.length && data[i] & 128) {
              self.messageEnd = 128 * self.messageEnd + (data[i] & 127);
              ++i;
            }
            if (i < data.length) {
              self.messageEnd = 128 * self.messageEnd + (data[i] & 127);
              self.state = BINARYBODY;
              ++i;
            }
            if (i > 0) data = data.slice(i);
          }
          if (self.state === BINARYBODY) {
            var dataleft = self.messageEnd - self.spanLength;
            if (data.length >= dataleft) {
              self.buffers.push(data);
              self.spanLength += dataleft;
              self.messageEnd = dataleft;
              return self.parse();
            }
            self.buffers.push(data);
            self.spanLength += data.length;
            return;
          }
          self.buffers.push(data);
          if ((self.messageEnd = bufferIndex(data, 255)) != -1) {
            self.spanLength += self.messageEnd;
            return self.parse();
          } else self.spanLength += data.length;
        }
        while (data) data = doAdd();
      };
      Receiver.prototype.cleanup = function () {
        this.dead = true;
        this.state = EMPTY;
        this.buffers = [];
      };
      Receiver.prototype.parse = function () {
        var output = new Buffer(this.spanLength);
        var outputIndex = 0;
        for (var bi = 0, bl = this.buffers.length; bi < bl - 1; ++bi) {
          var buffer = this.buffers[bi];
          buffer.copy(output, outputIndex);
          outputIndex += buffer.length;
        }
        var lastBuffer = this.buffers[this.buffers.length - 1];
        if (this.messageEnd > 0) lastBuffer.copy(output, outputIndex, 0, this.messageEnd);
        if (this.state !== BODY) --this.messageEnd;
        var tail = null;
        if (this.messageEnd < lastBuffer.length - 1) {
          tail = lastBuffer.slice(this.messageEnd + 1);
        }
        this.reset();
        this.ontext(output.toString("utf8"));
        return tail;
      };
      Receiver.prototype.error = function (reason, terminate) {
        if (this.dead) return;
        this.reset();
        if (typeof reason == "string") {
          this.onerror(new Error(reason), terminate);
        } else if (reason.constructor == Error) {
          this.onerror(reason, terminate);
        } else {
          this.onerror(new Error("An error occured"), terminate);
        }
        return this;
      };
      Receiver.prototype.reset = function (reason) {
        if (this.dead) return;
        this.state = EMPTY;
        this.buffers = [];
        this.messageEnd = -1;
        this.spanLength = 0;
      };
      function bufferIndex(buffer, byte) {
        for (var i = 0, l = buffer.length; i < l; ++i) {
          if (buffer[i] === byte) return i;
        }
        return -1;
      }
    }
  });

  // node_modules/ws/lib/Extensions.js
  var require_Extensions = __commonJS({
    "node_modules/ws/lib/Extensions.js"(exports) {
      var util = __require("util");
      exports.parse = parse;
      exports.format = format;
      function parse(value) {
        value = value || "";
        var extensions = {};
        value.split(",").forEach(function (v) {
          var params = v.split(";");
          var token = params.shift().trim();
          var paramsList = extensions[token] = extensions[token] || [];
          var parsedParams = {};
          params.forEach(function (param) {
            var parts = param.trim().split("=");
            var key = parts[0];
            var value2 = parts[1];
            if (typeof value2 === "undefined") {
              value2 = true;
            } else {
              if (value2[0] === '"') {
                value2 = value2.slice(1);
              }
              if (value2[value2.length - 1] === '"') {
                value2 = value2.slice(0, value2.length - 1);
              }
            }
            (parsedParams[key] = parsedParams[key] || []).push(value2);
          });
          paramsList.push(parsedParams);
        });
        return extensions;
      }
      function format(value) {
        return Object.keys(value).map(function (token) {
          var paramsList = value[token];
          if (!util.isArray(paramsList)) {
            paramsList = [paramsList];
          }
          return paramsList.map(function (params) {
            return [token].concat(Object.keys(params).map(function (k) {
              var p = params[k];
              if (!util.isArray(p)) p = [p];
              return p.map(function (v) {
                return v === true ? k : k + "=" + v;
              }).join("; ");
            })).join("; ");
          }).join(", ");
        }).join(", ");
      }
    }
  });

  // node_modules/ws/lib/WebSocket.js
  var require_WebSocket = __commonJS({
    "node_modules/ws/lib/WebSocket.js"(exports, module) {
      "use strict";

      var url = __require("url");
      var util = __require("util");
      var http = __require("http");
      var https = __require("https");
      var crypto = __require("crypto");
      var stream = __require("stream");
      var Ultron = require_ultron();
      var Options = require_options();
      var Sender = require_Sender();
      var Receiver = require_Receiver();
      var SenderHixie = require_Sender_hixie();
      var ReceiverHixie = require_Receiver_hixie();
      var Extensions = require_Extensions();
      var PerMessageDeflate = require_PerMessageDeflate();
      var EventEmitter = __require("events").EventEmitter;
      var protocolVersion = 13;
      var closeTimeout = 30 * 1e3;
      function WebSocket2(address, protocols, options) {
        if (this instanceof WebSocket2 === false) {
          return new WebSocket2(address, protocols, options);
        }
        EventEmitter.call(this);
        if (protocols && !Array.isArray(protocols) && "object" === _typeof(protocols)) {
          options = protocols;
          protocols = null;
        }
        if ("string" === typeof protocols) {
          protocols = [protocols];
        }
        if (!Array.isArray(protocols)) {
          protocols = [];
        }
        this._socket = null;
        this._ultron = null;
        this._closeReceived = false;
        this.bytesReceived = 0;
        this.readyState = null;
        this.supports = {};
        this.extensions = {};
        this._binaryType = "nodebuffer";
        if (Array.isArray(address)) {
          initAsServerClient.apply(this, address.concat(options));
        } else {
          initAsClient.apply(this, [address, protocols, options]);
        }
      }
      util.inherits(WebSocket2, EventEmitter);
      ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function each(state, index) {
        WebSocket2.prototype[state] = WebSocket2[state] = index;
      });
      WebSocket2.prototype.close = function close(code, data) {
        if (this.readyState === WebSocket2.CLOSED) return;
        if (this.readyState === WebSocket2.CONNECTING) {
          this.readyState = WebSocket2.CLOSED;
          return;
        }
        if (this.readyState === WebSocket2.CLOSING) {
          if (this._closeReceived && this._isServer) {
            this.terminate();
          }
          return;
        }
        var self = this;
        try {
          this.readyState = WebSocket2.CLOSING;
          this._closeCode = code;
          this._closeMessage = data;
          var mask = !this._isServer;
          this._sender.close(code, data, mask, function (err) {
            if (err) self.emit("error", err);
            if (self._closeReceived && self._isServer) {
              self.terminate();
            } else {
              clearTimeout(self._closeTimer);
              self._closeTimer = setTimeout(cleanupWebsocketResources.bind(self, true), closeTimeout);
            }
          });
        } catch (e) {
          this.emit("error", e);
        }
      };
      WebSocket2.prototype.pause = function pauser() {
        if (this.readyState !== WebSocket2.OPEN) throw new Error("not opened");
        return this._socket.pause();
      };
      WebSocket2.prototype.ping = function ping(data, options, dontFailWhenClosed) {
        if (this.readyState !== WebSocket2.OPEN) {
          if (dontFailWhenClosed === true) return;
          throw new Error("not opened");
        }
        options = options || {};
        if (typeof options.mask === "undefined") options.mask = !this._isServer;
        this._sender.ping(data, options);
      };
      WebSocket2.prototype.pong = function (data, options, dontFailWhenClosed) {
        if (this.readyState !== WebSocket2.OPEN) {
          if (dontFailWhenClosed === true) return;
          throw new Error("not opened");
        }
        options = options || {};
        if (typeof options.mask === "undefined") options.mask = !this._isServer;
        this._sender.pong(data, options);
      };
      WebSocket2.prototype.resume = function resume() {
        if (this.readyState !== WebSocket2.OPEN) throw new Error("not opened");
        return this._socket.resume();
      };
      WebSocket2.prototype.send = function send(data, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (this.readyState !== WebSocket2.OPEN) {
          if (typeof cb === "function") cb(new Error("not opened"));else throw new Error("not opened");
          return;
        }
        if (!data) data = "";
        if (this._queue) {
          var self = this;
          this._queue.push(function () {
            self.send(data, options, cb);
          });
          return;
        }
        options = options || {};
        options.fin = true;
        if (typeof options.binary === "undefined") {
          options.binary = data instanceof ArrayBuffer || data instanceof Buffer || data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Uint32Array || data instanceof Int8Array || data instanceof Int16Array || data instanceof Int32Array || data instanceof Float32Array || data instanceof Float64Array;
        }
        if (typeof options.mask === "undefined") options.mask = !this._isServer;
        if (typeof options.compress === "undefined") options.compress = true;
        if (!this.extensions[PerMessageDeflate.extensionName]) {
          options.compress = false;
        }
        var readable = typeof stream.Readable === "function" ? stream.Readable : stream.Stream;
        if (data instanceof readable) {
          startQueue(this);
          var self = this;
          sendStream(this, data, options, function send2(error) {
            process.nextTick(function tock() {
              executeQueueSends(self);
            });
            if (typeof cb === "function") cb(error);
          });
        } else {
          this._sender.send(data, options, cb);
        }
      };
      WebSocket2.prototype.stream = function stream2(options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        var self = this;
        if (typeof cb !== "function") throw new Error("callback must be provided");
        if (this.readyState !== WebSocket2.OPEN) {
          if (typeof cb === "function") cb(new Error("not opened"));else throw new Error("not opened");
          return;
        }
        if (this._queue) {
          this._queue.push(function () {
            self.stream(options, cb);
          });
          return;
        }
        options = options || {};
        if (typeof options.mask === "undefined") options.mask = !this._isServer;
        if (typeof options.compress === "undefined") options.compress = true;
        if (!this.extensions[PerMessageDeflate.extensionName]) {
          options.compress = false;
        }
        startQueue(this);
        function send(data, final) {
          try {
            if (self.readyState !== WebSocket2.OPEN) throw new Error("not opened");
            options.fin = final === true;
            self._sender.send(data, options);
            if (!final) process.nextTick(cb.bind(null, null, send));else executeQueueSends(self);
          } catch (e) {
            if (typeof cb === "function") cb(e);else {
              delete self._queue;
              self.emit("error", e);
            }
          }
        }
        process.nextTick(cb.bind(null, null, send));
      };
      WebSocket2.prototype.terminate = function terminate() {
        if (this.readyState === WebSocket2.CLOSED) return;
        if (this._socket) {
          this.readyState = WebSocket2.CLOSING;
          try {
            this._socket.end();
          } catch (e) {
            cleanupWebsocketResources.call(this, true);
            return;
          }
          if (this._closeTimer) {
            clearTimeout(this._closeTimer);
          }
          this._closeTimer = setTimeout(cleanupWebsocketResources.bind(this, true), closeTimeout);
        } else if (this.readyState === WebSocket2.CONNECTING) {
          cleanupWebsocketResources.call(this, true);
        }
      };
      Object.defineProperty(WebSocket2.prototype, "bufferedAmount", {
        get: function get() {
          var amount = 0;
          if (this._socket) {
            amount = this._socket.bufferSize || 0;
          }
          return amount;
        }
      });
      Object.defineProperty(WebSocket2.prototype, "binaryType", {
        get: function get() {
          return this._binaryType;
        },
        set: function set(type) {
          if (type === "arraybuffer" || type === "nodebuffer") this._binaryType = type;else throw new SyntaxError('unsupported binaryType: must be either "nodebuffer" or "arraybuffer"');
        }
      });
      ["open", "error", "close", "message"].forEach(function (method) {
        Object.defineProperty(WebSocket2.prototype, "on" + method, {
          /**
           * Returns the current listener
           *
           * @returns {Mixed} the set function or undefined
           * @api public
           */
          get: function get() {
            var listener = this.listeners(method)[0];
            return listener ? listener._listener ? listener._listener : listener : void 0;
          },
          /**
           * Start listening for events
           *
           * @param {Function} listener the listener
           * @returns {Mixed} the set function or undefined
           * @api public
           */
          set: function set(listener) {
            this.removeAllListeners(method);
            this.addEventListener(method, listener);
          }
        });
      });
      WebSocket2.prototype.addEventListener = function (method, listener) {
        var target = this;
        function onMessage(data, flags) {
          if (flags.binary && this.binaryType === "arraybuffer") data = new Uint8Array(data).buffer;
          listener.call(target, new MessageEvent(data, !!flags.binary, target));
        }
        function onClose(code, message) {
          listener.call(target, new CloseEvent(code, message, target));
        }
        function onError(event) {
          event.type = "error";
          event.target = target;
          listener.call(target, event);
        }
        function onOpen() {
          listener.call(target, new OpenEvent(target));
        }
        if (typeof listener === "function") {
          if (method === "message") {
            onMessage._listener = listener;
            this.on(method, onMessage);
          } else if (method === "close") {
            onClose._listener = listener;
            this.on(method, onClose);
          } else if (method === "error") {
            onError._listener = listener;
            this.on(method, onError);
          } else if (method === "open") {
            onOpen._listener = listener;
            this.on(method, onOpen);
          } else {
            this.on(method, listener);
          }
        }
      };
      module.exports = WebSocket2;
      module.exports.buildHostHeader = buildHostHeader;
      function MessageEvent(dataArg, isBinary, target) {
        this.type = "message";
        this.data = dataArg;
        this.target = target;
        this.binary = isBinary;
      }
      function CloseEvent(code, reason, target) {
        this.type = "close";
        this.wasClean = typeof code === "undefined" || code === 1e3;
        this.code = code;
        this.reason = reason;
        this.target = target;
      }
      function OpenEvent(target) {
        this.type = "open";
        this.target = target;
      }
      function buildHostHeader(isSecure, hostname, port) {
        var headerHost = hostname;
        if (hostname) {
          if (isSecure && port != 443 || !isSecure && port != 80) {
            headerHost = headerHost + ":" + port;
          }
        }
        return headerHost;
      }
      function initAsServerClient(req, socket, upgradeHead, options) {
        options = new Options({
          protocolVersion,
          protocol: null,
          extensions: {},
          maxPayload: 0
        }).merge(options);
        this.protocol = options.value.protocol;
        this.protocolVersion = options.value.protocolVersion;
        this.extensions = options.value.extensions;
        this.supports.binary = this.protocolVersion !== "hixie-76";
        this.upgradeReq = req;
        this.readyState = WebSocket2.CONNECTING;
        this._isServer = true;
        this.maxPayload = options.value.maxPayload;
        if (options.value.protocolVersion === "hixie-76") {
          establishConnection.call(this, ReceiverHixie, SenderHixie, socket, upgradeHead);
        } else {
          establishConnection.call(this, Receiver, Sender, socket, upgradeHead);
        }
      }
      function initAsClient(address, protocols, options) {
        options = new Options({
          origin: null,
          protocolVersion,
          host: null,
          headers: null,
          protocol: protocols.join(","),
          agent: null,
          // ssl-related options
          pfx: null,
          key: null,
          passphrase: null,
          cert: null,
          ca: null,
          ciphers: null,
          rejectUnauthorized: null,
          perMessageDeflate: true,
          localAddress: null
        }).merge(options);
        if (options.value.protocolVersion !== 8 && options.value.protocolVersion !== 13) {
          throw new Error("unsupported protocol version");
        }
        var serverUrl = url.parse(address);
        var isUnixSocket = serverUrl.protocol === "ws+unix:";
        if (!serverUrl.host && !isUnixSocket) throw new Error("invalid url");
        var isSecure = serverUrl.protocol === "wss:" || serverUrl.protocol === "https:";
        var httpObj = isSecure ? https : http;
        var port = serverUrl.port || (isSecure ? 443 : 80);
        var auth = serverUrl.auth;
        var extensionsOffer = {};
        var perMessageDeflate;
        if (options.value.perMessageDeflate) {
          perMessageDeflate = new PerMessageDeflate(_typeof(options.value.perMessageDeflate) !== true ? options.value.perMessageDeflate : {}, false);
          extensionsOffer[PerMessageDeflate.extensionName] = perMessageDeflate.offer();
        }
        this._isServer = false;
        this.url = address;
        this.protocolVersion = options.value.protocolVersion;
        this.supports.binary = this.protocolVersion !== "hixie-76";
        var key = new Buffer(options.value.protocolVersion + "-" + Date.now()).toString("base64");
        var shasum = crypto.createHash("sha1");
        shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        var expectedServerKey = shasum.digest("base64");
        var agent = options.value.agent;
        var headerHost = buildHostHeader(isSecure, serverUrl.hostname, port);
        var requestOptions = {
          port,
          host: serverUrl.hostname,
          headers: {
            "Connection": "Upgrade",
            "Upgrade": "websocket",
            "Host": headerHost,
            "Sec-WebSocket-Version": options.value.protocolVersion,
            "Sec-WebSocket-Key": key
          }
        };
        if (auth) {
          requestOptions.headers.Authorization = "Basic " + new Buffer(auth).toString("base64");
        }
        if (options.value.protocol) {
          requestOptions.headers["Sec-WebSocket-Protocol"] = options.value.protocol;
        }
        if (options.value.host) {
          requestOptions.headers.Host = options.value.host;
        }
        if (options.value.headers) {
          for (var header in options.value.headers) {
            if (options.value.headers.hasOwnProperty(header)) {
              requestOptions.headers[header] = options.value.headers[header];
            }
          }
        }
        if (Object.keys(extensionsOffer).length) {
          requestOptions.headers["Sec-WebSocket-Extensions"] = Extensions.format(extensionsOffer);
        }
        if (options.isDefinedAndNonNull("pfx") || options.isDefinedAndNonNull("key") || options.isDefinedAndNonNull("passphrase") || options.isDefinedAndNonNull("cert") || options.isDefinedAndNonNull("ca") || options.isDefinedAndNonNull("ciphers") || options.isDefinedAndNonNull("rejectUnauthorized")) {
          if (options.isDefinedAndNonNull("pfx")) requestOptions.pfx = options.value.pfx;
          if (options.isDefinedAndNonNull("key")) requestOptions.key = options.value.key;
          if (options.isDefinedAndNonNull("passphrase")) requestOptions.passphrase = options.value.passphrase;
          if (options.isDefinedAndNonNull("cert")) requestOptions.cert = options.value.cert;
          if (options.isDefinedAndNonNull("ca")) requestOptions.ca = options.value.ca;
          if (options.isDefinedAndNonNull("ciphers")) requestOptions.ciphers = options.value.ciphers;
          if (options.isDefinedAndNonNull("rejectUnauthorized")) requestOptions.rejectUnauthorized = options.value.rejectUnauthorized;
          if (!agent) {
            agent = new httpObj.Agent(requestOptions);
          }
        }
        requestOptions.path = serverUrl.path || "/";
        if (agent) {
          requestOptions.agent = agent;
        }
        if (isUnixSocket) {
          requestOptions.socketPath = serverUrl.pathname;
        }
        if (options.value.localAddress) {
          requestOptions.localAddress = options.value.localAddress;
        }
        if (options.value.origin) {
          if (options.value.protocolVersion < 13) requestOptions.headers["Sec-WebSocket-Origin"] = options.value.origin;else requestOptions.headers.Origin = options.value.origin;
        }
        var self = this;
        var req = httpObj.request(requestOptions);
        req.on("error", function onerror(error) {
          self.emit("error", error);
          cleanupWebsocketResources.call(self, error);
        });
        req.once("response", function response(res) {
          var error;
          if (!self.emit("unexpected-response", req, res)) {
            error = new Error("unexpected server response (" + res.statusCode + ")");
            req.abort();
            self.emit("error", error);
          }
          cleanupWebsocketResources.call(self, error);
        });
        req.once("upgrade", function upgrade(res, socket, upgradeHead) {
          if (self.readyState === WebSocket2.CLOSED) {
            self.emit("close");
            self.removeAllListeners();
            socket.end();
            return;
          }
          var serverKey = res.headers["sec-websocket-accept"];
          if (typeof serverKey === "undefined" || serverKey !== expectedServerKey) {
            self.emit("error", "invalid server key");
            self.removeAllListeners();
            socket.end();
            return;
          }
          var serverProt = res.headers["sec-websocket-protocol"];
          var protList = (options.value.protocol || "").split(/, */);
          var protError = null;
          if (!options.value.protocol && serverProt) {
            protError = "server sent a subprotocol even though none requested";
          } else if (options.value.protocol && !serverProt) {
            protError = "server sent no subprotocol even though requested";
          } else if (serverProt && protList.indexOf(serverProt) === -1) {
            protError = "server responded with an invalid protocol";
          }
          if (protError) {
            self.emit("error", protError);
            self.removeAllListeners();
            socket.end();
            return;
          } else if (serverProt) {
            self.protocol = serverProt;
          }
          var serverExtensions = Extensions.parse(res.headers["sec-websocket-extensions"]);
          if (perMessageDeflate && serverExtensions[PerMessageDeflate.extensionName]) {
            try {
              perMessageDeflate.accept(serverExtensions[PerMessageDeflate.extensionName]);
            } catch (err) {
              self.emit("error", "invalid extension parameter");
              self.removeAllListeners();
              socket.end();
              return;
            }
            self.extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
          }
          establishConnection.call(self, Receiver, Sender, socket, upgradeHead);
          req.removeAllListeners();
          req = null;
          agent = null;
        });
        req.end();
        this.readyState = WebSocket2.CONNECTING;
      }
      function establishConnection(ReceiverClass, SenderClass, socket, upgradeHead) {
        var ultron = this._ultron = new Ultron(socket),
          called = false,
          self = this;
        socket.setTimeout(0);
        socket.setNoDelay(true);
        this._receiver = new ReceiverClass(this.extensions, this.maxPayload);
        this._socket = socket;
        ultron.on("end", cleanupWebsocketResources.bind(this));
        ultron.on("close", cleanupWebsocketResources.bind(this));
        ultron.on("error", cleanupWebsocketResources.bind(this));
        function firstHandler(data) {
          if (called || self.readyState === WebSocket2.CLOSED) return;
          called = true;
          socket.removeListener("data", firstHandler);
          ultron.on("data", realHandler);
          if (upgradeHead && upgradeHead.length > 0) {
            realHandler(upgradeHead);
            upgradeHead = null;
          }
          if (data) realHandler(data);
        }
        function realHandler(data) {
          self.bytesReceived += data.length;
          self._receiver.add(data);
        }
        ultron.on("data", firstHandler);
        process.nextTick(firstHandler);
        self._receiver.ontext = function ontext(data, flags) {
          flags = flags || {};
          self.emit("message", data, flags);
        };
        self._receiver.onbinary = function onbinary(data, flags) {
          flags = flags || {};
          flags.binary = true;
          self.emit("message", data, flags);
        };
        self._receiver.onping = function onping(data, flags) {
          flags = flags || {};
          self.pong(data, {
            mask: !self._isServer,
            binary: flags.binary === true
          }, true);
          self.emit("ping", data, flags);
        };
        self._receiver.onpong = function onpong(data, flags) {
          self.emit("pong", data, flags || {});
        };
        self._receiver.onclose = function onclose(code, data, flags) {
          flags = flags || {};
          self._closeReceived = true;
          self.close(code, data);
        };
        self._receiver.onerror = function onerror(reason, errorCode) {
          self.close(typeof errorCode !== "undefined" ? errorCode : 1002, "");
          self.emit("error", reason instanceof Error ? reason : new Error(reason));
        };
        this._sender = new SenderClass(socket, this.extensions);
        this._sender.on("error", function onerror(error) {
          self.close(1002, "");
          self.emit("error", error);
        });
        this.readyState = WebSocket2.OPEN;
        this.emit("open");
      }
      function startQueue(instance) {
        instance._queue = instance._queue || [];
      }
      function executeQueueSends(instance) {
        var queue = instance._queue;
        if (typeof queue === "undefined") return;
        delete instance._queue;
        for (var i = 0, l = queue.length; i < l; ++i) {
          queue[i]();
        }
      }
      function sendStream(instance, stream2, options, cb) {
        stream2.on("data", function incoming(data) {
          if (instance.readyState !== WebSocket2.OPEN) {
            if (typeof cb === "function") cb(new Error("not opened"));else {
              delete instance._queue;
              instance.emit("error", new Error("not opened"));
            }
            return;
          }
          options.fin = false;
          instance._sender.send(data, options);
        });
        stream2.on("end", function end() {
          if (instance.readyState !== WebSocket2.OPEN) {
            if (typeof cb === "function") cb(new Error("not opened"));else {
              delete instance._queue;
              instance.emit("error", new Error("not opened"));
            }
            return;
          }
          options.fin = true;
          instance._sender.send(null, options);
          if (typeof cb === "function") cb(null);
        });
      }
      function cleanupWebsocketResources(error) {
        if (this.readyState === WebSocket2.CLOSED) return;
        this.readyState = WebSocket2.CLOSED;
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
        if (error || !this._closeReceived) {
          this._closeCode = 1006;
        }
        this.emit("close", this._closeCode || 1e3, this._closeMessage || "");
        if (this._socket) {
          if (this._ultron) this._ultron.destroy();
          this._socket.on("error", function onerror() {
            try {
              this.destroy();
            } catch (e) {}
          });
          try {
            if (!error) this._socket.end();else this._socket.destroy();
          } catch (e) {}
          this._socket = null;
          this._ultron = null;
        }
        if (this._sender) {
          this._sender.removeAllListeners();
          this._sender = null;
        }
        if (this._receiver) {
          this._receiver.cleanup();
          this._receiver = null;
        }
        if (this.extensions[PerMessageDeflate.extensionName]) {
          this.extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this.extensions = null;
        this.removeAllListeners();
        this.on("error", function onerror() {});
        delete this._queue;
      }
    }
  });

  // node_modules/ws/lib/WebSocketServer.js
  var require_WebSocketServer = __commonJS({
    "node_modules/ws/lib/WebSocketServer.js"(exports, module) {
      var util = __require("util");
      var events = __require("events");
      var http = __require("http");
      var crypto = __require("crypto");
      var Options = require_options();
      var WebSocket2 = require_WebSocket();
      var Extensions = require_Extensions();
      var PerMessageDeflate = require_PerMessageDeflate();
      var tls = __require("tls");
      var url = __require("url");
      function WebSocketServer(options, callback) {
        if (this instanceof WebSocketServer === false) {
          return new WebSocketServer(options, callback);
        }
        events.EventEmitter.call(this);
        options = new Options({
          host: "0.0.0.0",
          port: null,
          server: null,
          verifyClient: null,
          handleProtocols: null,
          path: null,
          noServer: false,
          disableHixie: false,
          clientTracking: true,
          perMessageDeflate: true,
          maxPayload: 100 * 1024 * 1024
        }).merge(options);
        if (!options.isDefinedAndNonNull("port") && !options.isDefinedAndNonNull("server") && !options.value.noServer) {
          throw new TypeError("`port` or a `server` must be provided");
        }
        var self = this;
        if (options.isDefinedAndNonNull("port")) {
          this._server = http.createServer(function (req, res) {
            var body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.allowHalfOpen = false;
          this._server.listen(options.value.port, options.value.host, callback);
          this._closeServer = function () {
            if (self._server) self._server.close();
          };
        } else if (options.value.server) {
          this._server = options.value.server;
          if (options.value.path) {
            if (this._server._webSocketPaths && options.value.server._webSocketPaths[options.value.path]) {
              throw new Error("two instances of WebSocketServer cannot listen on the same http server path");
            }
            if (_typeof(this._server._webSocketPaths) !== "object") {
              this._server._webSocketPaths = {};
            }
            this._server._webSocketPaths[options.value.path] = 1;
          }
        }
        if (this._server) {
          this._onceServerListening = function () {
            self.emit("listening");
          };
          this._server.once("listening", this._onceServerListening);
        }
        if (typeof this._server != "undefined") {
          this._onServerError = function (error) {
            self.emit("error", error);
          };
          this._server.on("error", this._onServerError);
          this._onServerUpgrade = function (req, socket, upgradeHead) {
            var head = new Buffer(upgradeHead.length);
            upgradeHead.copy(head);
            self.handleUpgrade(req, socket, head, function (client) {
              self.emit("connection" + req.url, client);
              self.emit("connection", client);
            });
          };
          this._server.on("upgrade", this._onServerUpgrade);
        }
        this.options = options.value;
        this.path = options.value.path;
        this.clients = [];
      }
      util.inherits(WebSocketServer, events.EventEmitter);
      WebSocketServer.prototype.close = function (callback) {
        var error = null;
        try {
          for (var i = 0, l = this.clients.length; i < l; ++i) {
            this.clients[i].terminate();
          }
        } catch (e) {
          error = e;
        }
        if (this.path && this._server._webSocketPaths) {
          delete this._server._webSocketPaths[this.path];
          if (Object.keys(this._server._webSocketPaths).length == 0) {
            delete this._server._webSocketPaths;
          }
        }
        try {
          if (typeof this._closeServer !== "undefined") {
            this._closeServer();
          }
        } finally {
          if (this._server) {
            this._server.removeListener("listening", this._onceServerListening);
            this._server.removeListener("error", this._onServerError);
            this._server.removeListener("upgrade", this._onServerUpgrade);
          }
          delete this._server;
        }
        if (callback) callback(error);else if (error) throw error;
      };
      WebSocketServer.prototype.handleUpgrade = function (req, socket, upgradeHead, cb) {
        if (this.options.path) {
          var u = url.parse(req.url);
          if (u && u.pathname !== this.options.path) return;
        }
        if (typeof req.headers.upgrade === "undefined" || req.headers.upgrade.toLowerCase() !== "websocket") {
          abortConnection(socket, 400, "Bad Request");
          return;
        }
        if (req.headers["sec-websocket-key1"]) handleHixieUpgrade.apply(this, arguments);else handleHybiUpgrade.apply(this, arguments);
      };
      module.exports = WebSocketServer;
      function handleHybiUpgrade(req, socket, upgradeHead, cb) {
        var errorHandler = function errorHandler() {
          try {
            socket.destroy();
          } catch (e) {}
        };
        socket.on("error", errorHandler);
        if (!req.headers["sec-websocket-key"]) {
          abortConnection(socket, 400, "Bad Request");
          return;
        }
        var version = parseInt(req.headers["sec-websocket-version"]);
        if ([8, 13].indexOf(version) === -1) {
          abortConnection(socket, 400, "Bad Request");
          return;
        }
        var protocols = req.headers["sec-websocket-protocol"];
        var origin = version < 13 ? req.headers["sec-websocket-origin"] : req.headers["origin"];
        var extensionsOffer = Extensions.parse(req.headers["sec-websocket-extensions"]);
        var self = this;
        var completeHybiUpgrade2 = function completeHybiUpgrade2(protocol) {
          var key = req.headers["sec-websocket-key"];
          var shasum = crypto.createHash("sha1");
          shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
          key = shasum.digest("base64");
          var headers = ["HTTP/1.1 101 Switching Protocols", "Upgrade: websocket", "Connection: Upgrade", "Sec-WebSocket-Accept: " + key];
          if (typeof protocol != "undefined") {
            headers.push("Sec-WebSocket-Protocol: " + protocol);
          }
          var extensions = {};
          try {
            extensions = acceptExtensions.call(self, extensionsOffer);
          } catch (err) {
            abortConnection(socket, 400, "Bad Request");
            return;
          }
          if (Object.keys(extensions).length) {
            var serverExtensions = {};
            Object.keys(extensions).forEach(function (token) {
              serverExtensions[token] = [extensions[token].params];
            });
            headers.push("Sec-WebSocket-Extensions: " + Extensions.format(serverExtensions));
          }
          self.emit("headers", headers);
          socket.setTimeout(0);
          socket.setNoDelay(true);
          try {
            socket.write(headers.concat("", "").join("\r\n"));
          } catch (e) {
            try {
              socket.destroy();
            } catch (e2) {}
            return;
          }
          var client = new WebSocket2([req, socket, upgradeHead], {
            protocolVersion: version,
            protocol,
            extensions,
            maxPayload: self.options.maxPayload
          });
          if (self.options.clientTracking) {
            self.clients.push(client);
            client.on("close", function () {
              var index = self.clients.indexOf(client);
              if (index != -1) {
                self.clients.splice(index, 1);
              }
            });
          }
          socket.removeListener("error", errorHandler);
          cb(client);
        };
        var completeHybiUpgrade1 = function completeHybiUpgrade1() {
          if (typeof self.options.handleProtocols == "function") {
            var protList = (protocols || "").split(/, */);
            var callbackCalled = false;
            var res = self.options.handleProtocols(protList, function (result, protocol) {
              callbackCalled = true;
              if (!result) abortConnection(socket, 401, "Unauthorized");else completeHybiUpgrade2(protocol);
            });
            if (!callbackCalled) {
              abortConnection(socket, 501, "Could not process protocols");
            }
            return;
          } else {
            if (typeof protocols !== "undefined") {
              completeHybiUpgrade2(protocols.split(/, */)[0]);
            } else {
              completeHybiUpgrade2();
            }
          }
        };
        if (typeof this.options.verifyClient == "function") {
          var info = {
            origin,
            secure: typeof req.connection.authorized !== "undefined" || typeof req.connection.encrypted !== "undefined",
            req
          };
          if (this.options.verifyClient.length == 2) {
            this.options.verifyClient(info, function (result, code, name) {
              if (typeof code === "undefined") code = 401;
              if (typeof name === "undefined") name = http.STATUS_CODES[code];
              if (!result) abortConnection(socket, code, name);else completeHybiUpgrade1();
            });
            return;
          } else if (!this.options.verifyClient(info)) {
            abortConnection(socket, 401, "Unauthorized");
            return;
          }
        }
        completeHybiUpgrade1();
      }
      function handleHixieUpgrade(req, socket, upgradeHead, cb) {
        var errorHandler = function errorHandler() {
          try {
            socket.destroy();
          } catch (e) {}
        };
        socket.on("error", errorHandler);
        if (this.options.disableHixie) {
          abortConnection(socket, 401, "Hixie support disabled");
          return;
        }
        if (!req.headers["sec-websocket-key2"]) {
          abortConnection(socket, 400, "Bad Request");
          return;
        }
        var origin = req.headers["origin"],
          self = this;
        var onClientVerified = function onClientVerified() {
          var wshost;
          if (!req.headers["x-forwarded-host"]) wshost = req.headers.host;else wshost = req.headers["x-forwarded-host"];
          var location = (req.headers["x-forwarded-proto"] === "https" || socket.encrypted ? "wss" : "ws") + "://" + wshost + req.url,
            protocol = req.headers["sec-websocket-protocol"];
          var buildResponseHeader = function buildResponseHeader() {
            var headers = ["HTTP/1.1 101 Switching Protocols", "Upgrade: WebSocket", "Connection: Upgrade", "Sec-WebSocket-Location: " + location];
            if (typeof protocol != "undefined") headers.push("Sec-WebSocket-Protocol: " + protocol);
            if (typeof origin != "undefined") headers.push("Sec-WebSocket-Origin: " + origin);
            return new Buffer(headers.concat("", "").join("\r\n"));
          };
          var handshakeResponse = function handshakeResponse() {
            socket.setTimeout(0);
            socket.setNoDelay(true);
            var headerBuffer = buildResponseHeader();
            try {
              socket.write(headerBuffer, "binary", function (err) {
                if (err) socket.removeListener("data", _handler);
                return;
              });
            } catch (e) {
              try {
                socket.destroy();
              } catch (e2) {}
              return;
            }
            ;
          };
          var completeHandshake = function completeHandshake(nonce2, rest2, headerBuffer) {
            var k1 = req.headers["sec-websocket-key1"],
              k2 = req.headers["sec-websocket-key2"],
              md5 = crypto.createHash("md5");
            [k1, k2].forEach(function (k) {
              var n = parseInt(k.replace(/[^\d]/g, "")),
                spaces = k.replace(/[^ ]/g, "").length;
              if (spaces === 0 || n % spaces !== 0) {
                abortConnection(socket, 400, "Bad Request");
                return;
              }
              n /= spaces;
              md5.update(String.fromCharCode(n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, n & 255));
            });
            md5.update(nonce2.toString("binary"));
            socket.setTimeout(0);
            socket.setNoDelay(true);
            try {
              var hashBuffer = new Buffer(md5.digest("binary"), "binary");
              var handshakeBuffer = new Buffer(headerBuffer.length + hashBuffer.length);
              headerBuffer.copy(handshakeBuffer, 0);
              hashBuffer.copy(handshakeBuffer, headerBuffer.length);
              socket.write(handshakeBuffer, "binary", function (err) {
                if (err) return;
                var client = new WebSocket2([req, socket, rest2], {
                  protocolVersion: "hixie-76",
                  protocol
                });
                if (self.options.clientTracking) {
                  self.clients.push(client);
                  client.on("close", function () {
                    var index = self.clients.indexOf(client);
                    if (index != -1) {
                      self.clients.splice(index, 1);
                    }
                  });
                }
                socket.removeListener("error", errorHandler);
                cb(client);
              });
            } catch (e) {
              try {
                socket.destroy();
              } catch (e2) {}
              return;
            }
          };
          var nonceLength = 8;
          if (upgradeHead && upgradeHead.length >= nonceLength) {
            var nonce = upgradeHead.slice(0, nonceLength);
            var rest = upgradeHead.length > nonceLength ? upgradeHead.slice(nonceLength) : null;
            completeHandshake.call(self, nonce, rest, buildResponseHeader());
          } else {
            var nonce = new Buffer(nonceLength);
            upgradeHead.copy(nonce, 0);
            var received = upgradeHead.length;
            var rest = null;
            var _handler = function handler(data) {
              var toRead = Math.min(data.length, nonceLength - received);
              if (toRead === 0) return;
              data.copy(nonce, received, 0, toRead);
              received += toRead;
              if (received == nonceLength) {
                socket.removeListener("data", _handler);
                if (toRead < data.length) rest = data.slice(toRead);
                completeHandshake.call(self, nonce, rest, new Buffer(0));
              }
            };
            socket.on("data", _handler);
            handshakeResponse();
          }
        };
        if (typeof this.options.verifyClient == "function") {
          var info = {
            origin,
            secure: typeof req.connection.authorized !== "undefined" || typeof req.connection.encrypted !== "undefined",
            req
          };
          if (this.options.verifyClient.length == 2) {
            var self = this;
            this.options.verifyClient(info, function (result, code, name) {
              if (typeof code === "undefined") code = 401;
              if (typeof name === "undefined") name = http.STATUS_CODES[code];
              if (!result) abortConnection(socket, code, name);else onClientVerified.apply(self);
            });
            return;
          } else if (!this.options.verifyClient(info)) {
            abortConnection(socket, 401, "Unauthorized");
            return;
          }
        }
        onClientVerified();
      }
      function acceptExtensions(offer) {
        var extensions = {};
        var options = this.options.perMessageDeflate;
        var maxPayload = this.options.maxPayload;
        if (options && offer[PerMessageDeflate.extensionName]) {
          var perMessageDeflate = new PerMessageDeflate(options !== true ? options : {}, true, maxPayload);
          perMessageDeflate.accept(offer[PerMessageDeflate.extensionName]);
          extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        return extensions;
      }
      function abortConnection(socket, code, name) {
        try {
          var response = ["HTTP/1.1 " + code + " " + name, "Content-type: text/html"];
          socket.write(response.concat("", "").join("\r\n"));
        } catch (e) {} finally {
          try {
            socket.destroy();
          } catch (e) {}
        }
      }
    }
  });

  // node_modules/ws/index.js
  var require_ws = __commonJS({
    "node_modules/ws/index.js"(exports, module) {
      "use strict";

      var WS = module.exports = require_WebSocket();
      WS.Server = require_WebSocketServer();
      WS.Sender = require_Sender();
      WS.Receiver = require_Receiver();
      WS.createServer = function createServer(options, fn) {
        var server = new WS.Server(options);
        if (typeof fn === "function") {
          server.on("connection", fn);
        }
        return server;
      };
      WS.connect = WS.createConnection = function connect(address, fn) {
        var client = new WS(address);
        if (typeof fn === "function") {
          client.on("open", fn);
        }
        return client;
      };
    }
  });

  // node_modules/simple-websocket/index.js
  var require_simple_websocket = __commonJS({
    "node_modules/simple-websocket/index.js"(exports, module) {
      module.exports = Socket;
      var debug = require_src()("simple-websocket");
      var inherits = require_inherits();
      var stream = require_readable();
      var ws = require_ws();
      var _WebSocket = typeof WebSocket !== "undefined" ? WebSocket : ws;
      inherits(Socket, stream.Duplex);
      function Socket(url, opts) {
        var self = this;
        if (!(self instanceof Socket)) return new Socket(url, opts);
        if (!opts) opts = {};
        debug("new websocket: %s %o", url, opts);
        opts.allowHalfOpen = false;
        if (opts.highWaterMark == null) opts.highWaterMark = 1024 * 1024;
        stream.Duplex.call(self, opts);
        self.url = url;
        self.connected = false;
        self.destroyed = false;
        self._maxBufferedAmount = opts.highWaterMark;
        self._chunk = null;
        self._cb = null;
        self._interval = null;
        try {
          if (typeof WebSocket === "undefined") {
            self._ws = new _WebSocket(self.url, opts);
          } else {
            self._ws = new _WebSocket(self.url);
          }
        } catch (err) {
          process.nextTick(function () {
            self._onError(err);
          });
          return;
        }
        self._ws.binaryType = "arraybuffer";
        self._ws.onopen = function () {
          self._onOpen();
        };
        self._ws.onmessage = function (event) {
          self._onMessage(event);
        };
        self._ws.onclose = function () {
          self._onClose();
        };
        self._ws.onerror = function () {
          self._onError(new Error("connection error to " + self.url));
        };
        self.on("finish", function () {
          if (self.connected) {
            setTimeout(function () {
              self._destroy();
            }, 100);
          } else {
            self.once("connect", function () {
              setTimeout(function () {
                self._destroy();
              }, 100);
            });
          }
        });
      }
      Socket.WEBSOCKET_SUPPORT = !!_WebSocket;
      Socket.prototype.send = function (chunk) {
        var self = this;
        var len = chunk.length || chunk.byteLength || chunk.size;
        self._ws.send(chunk);
        debug("write: %d bytes", len);
      };
      Socket.prototype.destroy = function (onclose) {
        var self = this;
        self._destroy(null, onclose);
      };
      Socket.prototype._destroy = function (err, onclose) {
        var self = this;
        if (self.destroyed) return;
        if (onclose) self.once("close", onclose);
        debug("destroy (error: %s)", err && err.message);
        this.readable = this.writable = false;
        if (!self._readableState.ended) self.push(null);
        if (!self._writableState.finished) self.end();
        self.connected = false;
        self.destroyed = true;
        clearInterval(self._interval);
        self._interval = null;
        self._chunk = null;
        self._cb = null;
        if (self._ws) {
          var ws2 = self._ws;
          var onClose = function onClose() {
            ws2.onclose = null;
            self.emit("close");
          };
          if (ws2.readyState === _WebSocket.CLOSED) {
            onClose();
          } else {
            try {
              ws2.onclose = onClose;
              ws2.close();
            } catch (err2) {
              onClose();
            }
          }
          ws2.onopen = null;
          ws2.onmessage = null;
          ws2.onerror = null;
        }
        self._ws = null;
        if (err) self.emit("error", err);
      };
      Socket.prototype._read = function () {};
      Socket.prototype._write = function (chunk, encoding, cb) {
        var self = this;
        if (self.destroyed) return cb(new Error("cannot write after socket is destroyed"));
        if (self.connected) {
          try {
            self.send(chunk);
          } catch (err) {
            return self._onError(err);
          }
          if (typeof ws !== "function" && self._ws.bufferedAmount > self._maxBufferedAmount) {
            debug("start backpressure: bufferedAmount %d", self._ws.bufferedAmount);
            self._cb = cb;
          } else {
            cb(null);
          }
        } else {
          debug("write before connect");
          self._chunk = chunk;
          self._cb = cb;
        }
      };
      Socket.prototype._onMessage = function (event) {
        var self = this;
        if (self.destroyed) return;
        var data = event.data;
        debug("read: %d bytes", data.byteLength || data.length);
        if (data instanceof ArrayBuffer) data = new Buffer(data);
        self.push(data);
      };
      Socket.prototype._onOpen = function () {
        var self = this;
        if (self.connected || self.destroyed) return;
        self.connected = true;
        if (self._chunk) {
          try {
            self.send(self._chunk);
          } catch (err) {
            return self._onError(err);
          }
          self._chunk = null;
          debug('sent chunk from "write before connect"');
          var cb = self._cb;
          self._cb = null;
          cb(null);
        }
        if (typeof ws !== "function") {
          self._interval = setInterval(function () {
            if (!self._cb || !self._ws || self._ws.bufferedAmount > self._maxBufferedAmount) {
              return;
            }
            debug("ending backpressure: bufferedAmount %d", self._ws.bufferedAmount);
            var cb2 = self._cb;
            self._cb = null;
            cb2(null);
          }, 150);
          if (self._interval.unref) self._interval.unref();
        }
        debug("connect");
        self.emit("connect");
      };
      Socket.prototype._onClose = function () {
        var self = this;
        if (self.destroyed) return;
        debug("on close");
        self._destroy();
      };
      Socket.prototype._onError = function (err) {
        var self = this;
        if (self.destroyed) return;
        debug("error: %s", err.message || err);
        self._destroy(err);
      };
    }
  });

  // node_modules/bittorrent-tracker/lib/client/websocket-tracker.js
  var require_websocket_tracker = __commonJS({
    "node_modules/bittorrent-tracker/lib/client/websocket-tracker.js"(exports, module) {
      module.exports = WebSocketTracker;
      var debug = require_src()("bittorrent-tracker:websocket-tracker");
      var extend = require_immutable();
      var hat = require_hat();
      var inherits = require_inherits();
      var Peer = require_simple_peer();
      var Socket = require_simple_websocket();
      var common = require_common3();
      var Tracker = require_tracker();
      var socketPool = {};
      var RECONNECT_MINIMUM = 15 * 1e3;
      var RECONNECT_MAXIMUM = 30 * 60 * 1e3;
      var RECONNECT_VARIANCE = 30 * 1e3;
      var OFFER_TIMEOUT = 50 * 1e3;
      inherits(WebSocketTracker, Tracker);
      function WebSocketTracker(client, announceUrl, opts) {
        var self = this;
        Tracker.call(self, client, announceUrl);
        debug("new websocket tracker %s", announceUrl);
        self.peers = {};
        self.socket = null;
        self.reconnecting = false;
        self.retries = 0;
        self.reconnectTimer = null;
        self._openSocket();
      }
      WebSocketTracker.prototype.DEFAULT_ANNOUNCE_INTERVAL = 30 * 1e3;
      WebSocketTracker.prototype.announce = function (opts) {
        var self = this;
        if (self.destroyed || self.reconnecting) return;
        if (!self.socket.connected) {
          self.socket.once("connect", function () {
            self.announce(opts);
          });
          return;
        }
        var params = extend(opts, {
          action: "announce",
          info_hash: self.client._infoHashBinary,
          peer_id: self.client._peerIdBinary
        });
        if (self._trackerId) params.trackerid = self._trackerId;
        if (opts.event === "stopped") {
          self._send(params);
        } else {
          var numwant = Math.min(opts.numwant, 5);
          self._generateOffers(numwant, function (offers) {
            params.numwant = numwant;
            params.offers = offers;
            self._send(params);
          });
        }
      };
      WebSocketTracker.prototype.scrape = function (opts) {
        var self = this;
        if (self.destroyed || self.reconnecting) return;
        if (!self.socket.connected) {
          self.socket.once("connect", function () {
            self.scrape(opts);
          });
          return;
        }
        var infoHashes = Array.isArray(opts.infoHash) && opts.infoHash.length > 0 ? opts.infoHash.map(function (infoHash) {
          return infoHash.toString("binary");
        }) : opts.infoHash && opts.infoHash.toString("binary") || self.client._infoHashBinary;
        var params = {
          action: "scrape",
          info_hash: infoHashes
        };
        self._send(params);
      };
      WebSocketTracker.prototype.destroy = function (cb) {
        var self = this;
        if (!cb) cb = noop;
        if (self.destroyed) return cb(null);
        self.destroyed = true;
        clearInterval(self.interval);
        clearTimeout(self.reconnectTimer);
        if (self.socket) {
          self.socket.removeListener("connect", self._onSocketConnectBound);
          self.socket.removeListener("data", self._onSocketDataBound);
          self.socket.removeListener("close", self._onSocketCloseBound);
          self.socket.removeListener("error", self._onSocketErrorBound);
        }
        self._onSocketConnectBound = null;
        self._onSocketErrorBound = null;
        self._onSocketDataBound = null;
        self._onSocketCloseBound = null;
        for (var peerId in self.peers) {
          var peer = self.peers[peerId];
          clearTimeout(peer.trackerTimeout);
          peer.destroy();
        }
        self.peers = null;
        if (socketPool[self.announceUrl]) {
          socketPool[self.announceUrl].consumers -= 1;
        }
        if (socketPool[self.announceUrl].consumers === 0) {
          delete socketPool[self.announceUrl];
          try {
            self.socket.on("error", noop);
            self.socket.destroy(cb);
          } catch (err) {
            cb(null);
          }
        }
        self.socket = null;
      };
      WebSocketTracker.prototype._openSocket = function () {
        var self = this;
        self.destroyed = false;
        if (!self.peers) self.peers = {};
        self._onSocketConnectBound = function () {
          self._onSocketConnect();
        };
        self._onSocketErrorBound = function (err) {
          self._onSocketError(err);
        };
        self._onSocketDataBound = function (data) {
          self._onSocketData(data);
        };
        self._onSocketCloseBound = function () {
          self._onSocketClose();
        };
        self.socket = socketPool[self.announceUrl];
        if (self.socket) {
          socketPool[self.announceUrl].consumers += 1;
        } else {
          self.socket = socketPool[self.announceUrl] = new Socket(self.announceUrl);
          self.socket.consumers = 1;
          self.socket.on("connect", self._onSocketConnectBound);
        }
        self.socket.on("data", self._onSocketDataBound);
        self.socket.on("close", self._onSocketCloseBound);
        self.socket.on("error", self._onSocketErrorBound);
      };
      WebSocketTracker.prototype._onSocketConnect = function () {
        var self = this;
        if (self.destroyed) return;
        if (self.reconnecting) {
          self.reconnecting = false;
          self.retries = 0;
          self.announce(self.client._defaultAnnounceOpts());
        }
      };
      WebSocketTracker.prototype._onSocketData = function (data) {
        var self = this;
        if (self.destroyed) return;
        try {
          data = JSON.parse(data);
        } catch (err) {
          self.client.emit("warning", new Error("Invalid tracker response"));
          return;
        }
        if (data.action === "announce") {
          self._onAnnounceResponse(data);
        } else if (data.action === "scrape") {
          self._onScrapeResponse(data);
        } else {
          self._onSocketError(new Error("invalid action in WS response: " + data.action));
        }
      };
      WebSocketTracker.prototype._onAnnounceResponse = function (data) {
        var self = this;
        if (data.info_hash !== self.client._infoHashBinary) {
          debug("ignoring websocket data from %s for %s (looking for %s: reused socket)", self.announceUrl, common.binaryToHex(data.info_hash), self.client.infoHash);
          return;
        }
        if (data.peer_id && data.peer_id === self.client._peerIdBinary) {
          return;
        }
        debug("received %s from %s for %s", JSON.stringify(data), self.announceUrl, self.client.infoHash);
        var failure = data["failure reason"];
        if (failure) return self.client.emit("warning", new Error(failure));
        var warning = data["warning message"];
        if (warning) self.client.emit("warning", new Error(warning));
        var interval = data.interval || data["min interval"];
        if (interval) self.setInterval(interval * 1e3);
        var trackerId = data["tracker id"];
        if (trackerId) {
          self._trackerId = trackerId;
        }
        if (data.complete != null) {
          self.client.emit("update", {
            announce: self.announceUrl,
            complete: data.complete,
            incomplete: data.incomplete
          });
        }
        var peer;
        if (data.offer && data.peer_id) {
          debug("creating peer (from remote offer)");
          peer = new Peer({
            trickle: false,
            config: self.client._rtcConfig,
            wrtc: self.client._wrtc
          });
          peer.id = common.binaryToHex(data.peer_id);
          peer.once("signal", function (answer) {
            var params = {
              action: "announce",
              info_hash: self.client._infoHashBinary,
              peer_id: self.client._peerIdBinary,
              to_peer_id: data.peer_id,
              answer,
              offer_id: data.offer_id
            };
            if (self._trackerId) params.trackerid = self._trackerId;
            self._send(params);
          });
          peer.signal(data.offer);
          self.client.emit("peer", peer);
        }
        if (data.answer && data.peer_id) {
          var offerId = common.binaryToHex(data.offer_id);
          peer = self.peers[offerId];
          if (peer) {
            peer.id = common.binaryToHex(data.peer_id);
            peer.signal(data.answer);
            self.client.emit("peer", peer);
            clearTimeout(peer.trackerTimeout);
            peer.trackerTimeout = null;
            delete self.peers[offerId];
          } else {
            debug("got unexpected answer: " + JSON.stringify(data.answer));
          }
        }
      };
      WebSocketTracker.prototype._onScrapeResponse = function (data) {
        var self = this;
        data = data.files || {};
        var keys = Object.keys(data);
        if (keys.length === 0) {
          self.client.emit("warning", new Error("invalid scrape response"));
          return;
        }
        keys.forEach(function (infoHash) {
          var response = data[infoHash];
          self.client.emit("scrape", {
            announce: self.announceUrl,
            infoHash: common.binaryToHex(infoHash),
            complete: response.complete,
            incomplete: response.incomplete,
            downloaded: response.downloaded
          });
        });
      };
      WebSocketTracker.prototype._onSocketClose = function () {
        var self = this;
        if (self.destroyed) return;
        self.destroy();
        self._startReconnectTimer();
      };
      WebSocketTracker.prototype._onSocketError = function (err) {
        var self = this;
        if (self.destroyed) return;
        self.destroy();
        self.client.emit("warning", err);
        self._startReconnectTimer();
      };
      WebSocketTracker.prototype._startReconnectTimer = function () {
        var self = this;
        var ms = Math.floor(Math.random() * RECONNECT_VARIANCE) + Math.min(Math.pow(2, self.retries) * RECONNECT_MINIMUM, RECONNECT_MAXIMUM);
        self.reconnecting = true;
        clearTimeout(self.reconnectTimer);
        self.reconnectTimer = setTimeout(function () {
          self.retries++;
          self._openSocket();
        }, ms);
        if (self.reconnectTimer.unref) self.reconnectTimer.unref();
        debug("reconnecting socket in %s ms", ms);
      };
      WebSocketTracker.prototype._send = function (params) {
        var self = this;
        if (self.destroyed) return;
        var message = JSON.stringify(params);
        debug("send %s", message);
        self.socket.send(message);
      };
      WebSocketTracker.prototype._generateOffers = function (numwant, cb) {
        var self = this;
        var offers = [];
        debug("generating %s offers", numwant);
        for (var i = 0; i < numwant; ++i) {
          generateOffer();
        }
        checkDone();
        function generateOffer() {
          var offerId = hat(160);
          debug("creating peer (from _generateOffers)");
          var peer = self.peers[offerId] = new Peer({
            initiator: true,
            trickle: false,
            config: self.client._rtcConfig,
            wrtc: self.client._wrtc
          });
          peer.once("signal", function (offer) {
            offers.push({
              offer,
              offer_id: common.hexToBinary(offerId)
            });
            checkDone();
          });
          peer.trackerTimeout = setTimeout(function () {
            debug("tracker timeout: destroying peer");
            peer.trackerTimeout = null;
            delete self.peers[offerId];
            peer.destroy();
          }, OFFER_TIMEOUT);
          if (peer.trackerTimeout.unref) peer.trackerTimeout.unref();
        }
        function checkDone() {
          if (offers.length === numwant) {
            debug("generated %s offers", numwant);
            cb(offers);
          }
        }
      };
      function noop() {}
    }
  });

  // node_modules/bittorrent-tracker/client.js
  var require_client2 = __commonJS({
    "node_modules/bittorrent-tracker/client.js"(exports, module) {
      module.exports = Client;
      var debug = require_src()("bittorrent-tracker");
      var EventEmitter = __require("events").EventEmitter;
      var extend = require_immutable();
      var inherits = require_inherits();
      var once = require_once();
      var parallel = require_run_parallel();
      var uniq = require_uniq();
      var url = __require("url");
      var common = require_common3();
      var HTTPTracker = require_http_tracker();
      var UDPTracker = require_udp_tracker();
      var WebSocketTracker = require_websocket_tracker();
      inherits(Client, EventEmitter);
      function Client(peerId, port, torrent, opts) {
        var self = this;
        if (!(self instanceof Client)) return new Client(peerId, port, torrent, opts);
        EventEmitter.call(self);
        if (!opts) opts = {};
        self.peerId = typeof peerId === "string" ? peerId : peerId.toString("hex");
        self.peerIdBuffer = new Buffer(self.peerId, "hex");
        self._peerIdBinary = self.peerIdBuffer.toString("binary");
        self.infoHash = typeof torrent.infoHash === "string" ? torrent.infoHash : torrent.infoHash.toString("hex");
        self.infoHashBuffer = new Buffer(self.infoHash, "hex");
        self._infoHashBinary = self.infoHashBuffer.toString("binary");
        self.torrentLength = torrent.length;
        self.destroyed = false;
        self._port = port;
        self._rtcConfig = opts.rtcConfig;
        self._wrtc = opts.wrtc;
        self._getAnnounceOpts = opts.getAnnounceOpts;
        debug("new client %s", self.infoHash);
        var webrtcSupport = !!self._wrtc || typeof window !== "undefined";
        var announce = typeof torrent.announce === "string" ? [torrent.announce] : torrent.announce == null ? [] : torrent.announce;
        announce = announce.map(function (announceUrl) {
          announceUrl = announceUrl.toString();
          if (announceUrl[announceUrl.length - 1] === "/") {
            announceUrl = announceUrl.substring(0, announceUrl.length - 1);
          }
          return announceUrl;
        });
        announce = uniq(announce);
        self._trackers = announce.map(function (announceUrl) {
          var protocol = url.parse(announceUrl).protocol;
          if ((protocol === "http:" || protocol === "https:") && typeof HTTPTracker === "function") {
            return new HTTPTracker(self, announceUrl);
          } else if (protocol === "udp:" && typeof UDPTracker === "function") {
            return new UDPTracker(self, announceUrl);
          } else if ((protocol === "ws:" || protocol === "wss:") && webrtcSupport) {
            if (protocol === "ws:" && typeof window !== "undefined" && window.location.protocol === "https:") {
              nextTickWarn(new Error("Unsupported tracker protocol: " + announceUrl));
              return null;
            }
            return new WebSocketTracker(self, announceUrl);
          } else {
            nextTickWarn(new Error("Unsupported tracker protocol: " + announceUrl));
            return null;
          }
        }).filter(Boolean);
        function nextTickWarn(err) {
          process.nextTick(function () {
            self.emit("warning", err);
          });
        }
      }
      Client.scrape = function (announceUrl, infoHash, cb) {
        cb = once(cb);
        var peerId = new Buffer("01234567890123456789");
        var port = 6881;
        var torrent = {
          infoHash: Array.isArray(infoHash) ? infoHash[0] : infoHash,
          announce: [announceUrl]
        };
        var client = new Client(peerId, port, torrent);
        client.once("error", cb);
        var len = Array.isArray(infoHash) ? infoHash.length : 1;
        var results = {};
        client.on("scrape", function (data) {
          len -= 1;
          results[data.infoHash] = data;
          if (len === 0) {
            client.destroy();
            var keys = Object.keys(results);
            if (keys.length === 1) {
              cb(null, results[keys[0]]);
            } else {
              cb(null, results);
            }
          }
        });
        infoHash = Array.isArray(infoHash) ? infoHash.map(function (infoHash2) {
          return new Buffer(infoHash2, "hex");
        }) : new Buffer(infoHash, "hex");
        client.scrape({
          infoHash
        });
      };
      Client.prototype.start = function (opts) {
        var self = this;
        debug("send `start`");
        opts = self._defaultAnnounceOpts(opts);
        opts.event = "started";
        self._announce(opts);
        self._trackers.forEach(function (tracker) {
          tracker.setInterval();
        });
      };
      Client.prototype.stop = function (opts) {
        var self = this;
        debug("send `stop`");
        opts = self._defaultAnnounceOpts(opts);
        opts.event = "stopped";
        self._announce(opts);
      };
      Client.prototype.complete = function (opts) {
        var self = this;
        debug("send `complete`");
        if (!opts) opts = {};
        if (opts.downloaded == null && self.torrentLength != null) {
          opts.downloaded = self.torrentLength;
        }
        opts = self._defaultAnnounceOpts(opts);
        opts.event = "completed";
        self._announce(opts);
      };
      Client.prototype.update = function (opts) {
        var self = this;
        debug("send `update`");
        opts = self._defaultAnnounceOpts(opts);
        if (opts.event) delete opts.event;
        self._announce(opts);
      };
      Client.prototype._announce = function (opts) {
        var self = this;
        self._trackers.forEach(function (tracker) {
          tracker.announce(opts);
        });
      };
      Client.prototype.scrape = function (opts) {
        var self = this;
        debug("send `scrape`");
        if (!opts) opts = {};
        self._trackers.forEach(function (tracker) {
          tracker.scrape(opts);
        });
      };
      Client.prototype.setInterval = function (intervalMs) {
        var self = this;
        debug("setInterval %d", intervalMs);
        self._trackers.forEach(function (tracker) {
          tracker.setInterval(intervalMs);
        });
      };
      Client.prototype.destroy = function (cb) {
        var self = this;
        if (self.destroyed) return;
        self.destroyed = true;
        debug("destroy");
        var tasks = self._trackers.map(function (tracker) {
          return function (cb2) {
            tracker.destroy(cb2);
          };
        });
        parallel(tasks, cb);
        self._trackers = [];
      };
      Client.prototype._defaultAnnounceOpts = function (opts) {
        var self = this;
        if (!opts) opts = {};
        if (opts.numwant == null) opts.numwant = common.DEFAULT_ANNOUNCE_PEERS;
        if (opts.uploaded == null) opts.uploaded = 0;
        if (opts.downloaded == null) opts.downloaded = 0;
        if (opts.left == null && self.torrentLength != null) {
          opts.left = self.torrentLength - opts.downloaded;
        }
        if (self._getAnnounceOpts) opts = extend(opts, self._getAnnounceOpts());
        return opts;
      };
    }
  });

  // node_modules/torrent-discovery/index.js
  var require_torrent_discovery = __commonJS({
    "node_modules/torrent-discovery/index.js"(exports, module) {
      module.exports = Discovery;
      var debug = require_src()("torrent-discovery");
      var DHT = require_client();
      var EventEmitter = __require("events").EventEmitter;
      var extend = require_immutable();
      var inherits = require_inherits();
      var parallel = require_run_parallel();
      var reemit = require_re_emitter();
      var Tracker = require_client2();
      inherits(Discovery, EventEmitter);
      function Discovery(opts) {
        var self = this;
        if (!(self instanceof Discovery)) return new Discovery(opts);
        EventEmitter.call(self);
        self.announce = opts.announce || [];
        self.rtcConfig = opts.rtcConfig;
        self.peerId = opts.peerId;
        self.port = opts.port || 0;
        self.wrtc = opts.wrtc;
        self.intervalMs = opts.intervalMs || 15 * 60 * 1e3;
        self.destroyed = false;
        if (!self.peerId) throw new Error("peerId required");
        if (!process.browser && !self.port) throw new Error("port required");
        self.infoHash = null;
        self.infoHashBuffer = null;
        self.torrent = null;
        self._dhtAnnouncing = false;
        self._dhtTimeout = false;
        self._internalDHT = false;
        if (opts.tracker === false) {
          self.tracker = false;
        } else {
          self.tracker = true;
        }
        if (opts.dht === false) {
          self.dht = false;
        } else if (_typeof(opts.dht) === "object") {
          self.dht = opts.dht;
        } else {
          self.dht = createDHT();
        }
        if (self.dht) {
          self.dht.on("peer", onPeer);
        }
        function createDHT() {
          if (typeof DHT !== "function") return false;
          self._internalDHT = true;
          var dht = new DHT();
          reemit(dht, self, ["error", "warning"]);
          dht.listen(opts.dhtPort);
          return dht;
        }
        function onPeer(peer, infoHash) {
          if (infoHash.toString("hex") !== self.infoHash) return;
          self.emit("peer", peer.host + ":" + peer.port);
        }
      }
      Discovery.prototype.setTorrent = function (torrent) {
        var self = this;
        if (!self.infoHash && (typeof torrent === "string" || Buffer.isBuffer(torrent))) {
          self.infoHash = typeof torrent === "string" ? torrent : torrent.toString("hex");
        } else if (!self.torrent && torrent && torrent.infoHash) {
          self.torrent = torrent;
          self.infoHash = typeof torrent.infoHash === "string" ? torrent.infoHash : torrent.infoHash.toString("hex");
        } else {
          return;
        }
        self.infoHashBuffer = new Buffer(self.infoHash, "hex");
        debug("setTorrent %s", self.infoHash);
        if (self.tracker && self.tracker !== true) {
          self.tracker.torrentLength = torrent.length;
        } else {
          self._createTracker();
        }
        self._dhtAnnounce();
      };
      Discovery.prototype.updatePort = function (port) {
        var self = this;
        if (port === self.port) return;
        self.port = port;
        self._dhtAnnounce();
        if (self.tracker && self.tracker !== true) {
          self.tracker.stop();
          self.tracker.destroy(function () {
            self._createTracker();
          });
        }
      };
      Discovery.prototype.stop = function (cb) {
        var self = this;
        self.destroyed = true;
        clearTimeout(self._dhtTimeout);
        var tasks = [];
        if (self.tracker && self.tracker !== true) {
          self.tracker.stop();
          tasks.push(function (cb2) {
            self.tracker.destroy(cb2);
          });
        }
        if (self._internalDHT) {
          tasks.push(function (cb2) {
            self.dht.destroy(cb2);
          });
        }
        parallel(tasks, cb);
      };
      Discovery.prototype._createTracker = function () {
        var self = this;
        if (!self.tracker) return;
        var torrent = self.torrent ? extend({
          announce: []
        }, self.torrent) : {
          infoHash: self.infoHash,
          announce: []
        };
        if (self.announce) torrent.announce = torrent.announce.concat(self.announce);
        var trackerOpts = {
          rtcConfig: self.rtcConfig,
          wrtc: self.wrtc
        };
        self.tracker = new Tracker(self.peerId, self.port, torrent, trackerOpts);
        reemit(self.tracker, self, ["peer", "warning", "error"]);
        self.tracker.setInterval(self.intervalMs);
        self.tracker.on("update", onUpdate);
        self.tracker.start();
        function onUpdate(data) {
          self.emit("trackerAnnounce", data);
        }
      };
      Discovery.prototype._dhtAnnounce = function () {
        var self = this;
        if (!self.port || !self.infoHash || !self.dht || self._dhtAnnouncing) return;
        debug("dht announce");
        self._dhtAnnouncing = true;
        clearTimeout(self._dhtTimeout);
        self.dht.announce(self.infoHash, self.port, function (err) {
          self._dhtAnnouncing = false;
          debug("dht announce complete");
          if (err) self.emit("warning", err);
          self.emit("dhtAnnounce");
          if (!self.destroyed) {
            self._dhtTimeout = setTimeout(function () {
              self._dhtAnnounce();
            }, getRandomTimeout());
          }
        });
        function getRandomTimeout() {
          return self.intervalMs + Math.floor(Math.random() * self.intervalMs / 5);
        }
      };
    }
  });

  // node_modules/ip/lib/ip.js
  var require_ip = __commonJS({
    "node_modules/ip/lib/ip.js"(exports) {
      "use strict";

      var ip = exports;
      var Buffer2 = __require("buffer").Buffer;
      var os = __require("os");
      ip.toBuffer = function (ip2, buff, offset) {
        offset = ~~offset;
        var result;
        if (this.isV4Format(ip2)) {
          result = buff || new Buffer2(offset + 4);
          ip2.split(/\./g).map(function (byte) {
            result[offset++] = parseInt(byte, 10) & 255;
          });
        } else if (this.isV6Format(ip2)) {
          var sections = ip2.split(":", 8);
          var i;
          for (i = 0; i < sections.length; i++) {
            var isv4 = this.isV4Format(sections[i]);
            var v4Buffer;
            if (isv4) {
              v4Buffer = this.toBuffer(sections[i]);
              sections[i] = v4Buffer.slice(0, 2).toString("hex");
            }
            if (v4Buffer && ++i < 8) {
              sections.splice(i, 0, v4Buffer.slice(2, 4).toString("hex"));
            }
          }
          if (sections[0] === "") {
            while (sections.length < 8) sections.unshift("0");
          } else if (sections[sections.length - 1] === "") {
            while (sections.length < 8) sections.push("0");
          } else if (sections.length < 8) {
            for (i = 0; i < sections.length && sections[i] !== ""; i++);
            var argv = [i, 1];
            for (i = 9 - sections.length; i > 0; i--) {
              argv.push("0");
            }
            sections.splice.apply(sections, argv);
          }
          result = buff || new Buffer2(offset + 16);
          for (i = 0; i < sections.length; i++) {
            var word = parseInt(sections[i], 16);
            result[offset++] = word >> 8 & 255;
            result[offset++] = word & 255;
          }
        }
        if (!result) {
          throw Error("Invalid ip address: " + ip2);
        }
        return result;
      };
      ip.toString = function (buff, offset, length) {
        offset = ~~offset;
        length = length || buff.length - offset;
        var result = [];
        if (length === 4) {
          for (var i = 0; i < length; i++) {
            result.push(buff[offset + i]);
          }
          result = result.join(".");
        } else if (length === 16) {
          for (var i = 0; i < length; i += 2) {
            result.push(buff.readUInt16BE(offset + i).toString(16));
          }
          result = result.join(":");
          result = result.replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3");
          result = result.replace(/:{3,4}/, "::");
        }
        return result;
      };
      var ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
      var ipv6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;
      ip.isV4Format = function (ip2) {
        return ipv4Regex.test(ip2);
      };
      ip.isV6Format = function (ip2) {
        return ipv6Regex.test(ip2);
      };
      function _normalizeFamily(family) {
        return family ? family.toLowerCase() : "ipv4";
      }
      ip.fromPrefixLen = function (prefixlen, family) {
        if (prefixlen > 32) {
          family = "ipv6";
        } else {
          family = _normalizeFamily(family);
        }
        var len = 4;
        if (family === "ipv6") {
          len = 16;
        }
        var buff = new Buffer2(len);
        for (var i = 0, n = buff.length; i < n; ++i) {
          var bits = 8;
          if (prefixlen < 8) {
            bits = prefixlen;
          }
          prefixlen -= bits;
          buff[i] = ~(255 >> bits) & 255;
        }
        return ip.toString(buff);
      };
      ip.mask = function (addr, mask) {
        addr = ip.toBuffer(addr);
        mask = ip.toBuffer(mask);
        var result = new Buffer2(Math.max(addr.length, mask.length));
        if (addr.length === mask.length) {
          for (var i = 0; i < addr.length; i++) {
            result[i] = addr[i] & mask[i];
          }
        } else if (mask.length === 4) {
          for (var i = 0; i < mask.length; i++) {
            result[i] = addr[addr.length - 4 + i] & mask[i];
          }
        } else {
          for (var i = 0; i < result.length - 6; i++) {
            result[i] = 0;
          }
          result[10] = 255;
          result[11] = 255;
          for (var i = 0; i < addr.length; i++) {
            result[i + 12] = addr[i] & mask[i + 12];
          }
        }
        return ip.toString(result);
      };
      ip.cidr = function (cidrString) {
        var cidrParts = cidrString.split("/");
        var addr = cidrParts[0];
        if (cidrParts.length !== 2) throw new Error("invalid CIDR subnet: " + addr);
        var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));
        return ip.mask(addr, mask);
      };
      ip.subnet = function (addr, mask) {
        var networkAddress = ip.toLong(ip.mask(addr, mask));
        var maskBuffer = ip.toBuffer(mask);
        var maskLength = 0;
        for (var i = 0; i < maskBuffer.length; i++) {
          if (maskBuffer[i] === 255) {
            maskLength += 8;
          } else {
            var octet = maskBuffer[i] & 255;
            while (octet) {
              octet = octet << 1 & 255;
              maskLength++;
            }
          }
        }
        var numberOfAddresses = Math.pow(2, 32 - maskLength);
        return {
          networkAddress: ip.fromLong(networkAddress),
          firstAddress: numberOfAddresses <= 2 ? ip.fromLong(networkAddress) : ip.fromLong(networkAddress + 1),
          lastAddress: numberOfAddresses <= 2 ? ip.fromLong(networkAddress + numberOfAddresses - 1) : ip.fromLong(networkAddress + numberOfAddresses - 2),
          broadcastAddress: ip.fromLong(networkAddress + numberOfAddresses - 1),
          subnetMask: mask,
          subnetMaskLength: maskLength,
          numHosts: numberOfAddresses <= 2 ? numberOfAddresses : numberOfAddresses - 2,
          length: numberOfAddresses,
          contains: function contains(other) {
            return networkAddress === ip.toLong(ip.mask(other, mask));
          }
        };
      };
      ip.cidrSubnet = function (cidrString) {
        var cidrParts = cidrString.split("/");
        var addr = cidrParts[0];
        if (cidrParts.length !== 2) throw new Error("invalid CIDR subnet: " + addr);
        var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));
        return ip.subnet(addr, mask);
      };
      ip.not = function (addr) {
        var buff = ip.toBuffer(addr);
        for (var i = 0; i < buff.length; i++) {
          buff[i] = 255 ^ buff[i];
        }
        return ip.toString(buff);
      };
      ip.or = function (a, b) {
        a = ip.toBuffer(a);
        b = ip.toBuffer(b);
        if (a.length === b.length) {
          for (var i = 0; i < a.length; ++i) {
            a[i] |= b[i];
          }
          return ip.toString(a);
        } else {
          var buff = a;
          var other = b;
          if (b.length > a.length) {
            buff = b;
            other = a;
          }
          var offset = buff.length - other.length;
          for (var i = offset; i < buff.length; ++i) {
            buff[i] |= other[i - offset];
          }
          return ip.toString(buff);
        }
      };
      ip.isEqual = function (a, b) {
        a = ip.toBuffer(a);
        b = ip.toBuffer(b);
        if (a.length === b.length) {
          for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
          }
          return true;
        }
        if (b.length === 4) {
          var t = b;
          b = a;
          a = t;
        }
        for (var i = 0; i < 10; i++) {
          if (b[i] !== 0) return false;
        }
        var word = b.readUInt16BE(10);
        if (word !== 0 && word !== 65535) return false;
        for (var i = 0; i < 4; i++) {
          if (a[i] !== b[i + 12]) return false;
        }
        return true;
      };
      ip.isPrivate = function (addr) {
        return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^f[cd][0-9a-f]{2}:/i.test(addr) || /^fe80:/i.test(addr) || /^::1$/.test(addr) || /^::$/.test(addr);
      };
      ip.isPublic = function (addr) {
        return !ip.isPrivate(addr);
      };
      ip.isLoopback = function (addr) {
        return /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(addr) || /^fe80::1$/.test(addr) || /^::1$/.test(addr) || /^::$/.test(addr);
      };
      ip.loopback = function (family) {
        family = _normalizeFamily(family);
        if (family !== "ipv4" && family !== "ipv6") {
          throw new Error("family must be ipv4 or ipv6");
        }
        return family === "ipv4" ? "127.0.0.1" : "fe80::1";
      };
      ip.address = function (name, family) {
        var interfaces = os.networkInterfaces();
        var all;
        family = _normalizeFamily(family);
        if (name && name !== "private" && name !== "public") {
          var res = interfaces[name].filter(function (details) {
            var itemFamily = details.family.toLowerCase();
            return itemFamily === family;
          });
          if (res.length === 0) return void 0;
          return res[0].address;
        }
        var all = Object.keys(interfaces).map(function (nic) {
          var addresses = interfaces[nic].filter(function (details) {
            details.family = details.family.toLowerCase();
            if (details.family !== family || ip.isLoopback(details.address)) {
              return false;
            } else if (!name) {
              return true;
            }
            return name === "public" ? ip.isPrivate(details.address) : ip.isPublic(details.address);
          });
          return addresses.length ? addresses[0].address : void 0;
        }).filter(Boolean);
        return !all.length ? ip.loopback(family) : all[0];
      };
      ip.toLong = function (ip2) {
        var ipl = 0;
        ip2.split(".").forEach(function (octet) {
          ipl <<= 8;
          ipl += parseInt(octet);
        });
        return ipl >>> 0;
      };
      ip.fromLong = function (ipl) {
        return (ipl >>> 24) + "." + (ipl >> 16 & 255) + "." + (ipl >> 8 & 255) + "." + (ipl & 255);
      };
    }
  });

  // node_modules/ip-set/index.js
  var require_ip_set = __commonJS({
    "node_modules/ip-set/index.js"(exports, module) {
      var ip = require_ip();
      function IPSet(start, end) {
        this.start = start;
        this.end = end;
        this.max = end;
        this.depth = 1;
        this.left = null;
        this.right = null;
      }
      IPSet.prototype.add = function (start, end) {
        var d = start - this.start;
        var update = false;
        if (d === 0 && this.end < end) {
          this.end = end;
          update = true;
        } else if (d < 0) {
          if (this.left) {
            update = this.left.add(start, end);
            if (update) this._balance();
          } else {
            this.left = new IPSet(start, end);
            update = true;
          }
        } else if (d > 0) {
          if (this.right) {
            update = this.right.add(start, end);
            if (update) this._balance();
          } else {
            this.right = new IPSet(start, end);
            update = true;
          }
        }
        if (update) this._update();
        return update;
      };
      IPSet.prototype.contains = function (addr) {
        var node = this;
        while (node && !(addr >= node.start && addr <= node.end)) {
          if (node.left && node.left.max >= addr) node = node.left;else node = node.right;
        }
        return !!node;
      };
      IPSet.prototype._balance = function () {
        var ldepth = this.left ? this.left.depth : 0;
        var rdepth = this.right ? this.right.depth : 0;
        if (ldepth > rdepth + 1) {
          var lldepth = this.left.left ? this.left.left.depth : 0;
          var lrdepth = this.left.right ? this.left.right.depth : 0;
          if (lldepth < lrdepth) this.left._rotateRR();
          this._rotateLL();
        } else if (ldepth + 1 < rdepth) {
          var rrdepth = this.right.right ? this.right.right.depth : 0;
          var rldepth = this.right.left ? this.right.left.depth : 0;
          if (rldepth > rrdepth) this.right._rotateLL();
          this._rotateRR();
        }
      };
      IPSet.prototype._rotateLL = function () {
        var _start = this.start;
        var _end = this.end;
        var _right = this.right;
        this.start = this.left.start;
        this.end = this.left.end;
        this.right = this.left;
        this.left = this.left.left;
        this.right.left = this.right.right;
        this.right.right = _right;
        this.right.start = _start;
        this.right.end = _end;
        this.right._update();
        this._update();
      };
      IPSet.prototype._rotateRR = function () {
        var _start = this.start;
        var _end = this.end;
        var _left = this.left;
        this.start = this.right.start;
        this.end = this.right.end;
        this.end = this.right.end;
        this.left = this.right;
        this.right = this.right.right;
        this.left.right = this.left.left;
        this.left.left = _left;
        this.left.start = _start;
        this.left.end = _end;
        this.left._update();
        this._update();
      };
      IPSet.prototype._update = function () {
        this.depth = 1;
        if (this.left) this.depth = this.left.depth + 1;
        if (this.right && this.depth <= this.right.depth) this.depth = this.right.depth + 1;
        this.max = Math.max(this.end, this.left ? this.left.max : 0, this.right ? this.right.max : 0);
      };
      module.exports = function (blocklist) {
        var tree = null;
        var self = {};
        self.add = function (start, end) {
          if (!start) return;
          if (_typeof(start) === "object") {
            end = start.end;
            start = start.start;
          }
          if (typeof start !== "number") start = ip.toLong(start);
          if (!end) end = start;
          if (typeof end !== "number") end = ip.toLong(end);
          if (start < 0 || end > 4294967295 || end < start) throw new Error("Invalid block range");
          if (tree) tree.add(start, end);else tree = new IPSet(start, end);
        };
        self.contains = function (addr) {
          if (!tree) return false;
          if (typeof addr !== "number") addr = ip.toLong(addr);
          return tree.contains(addr);
        };
        if (Array.isArray(blocklist)) {
          blocklist.forEach(function (block) {
            self.add(block);
          });
        }
        return self;
      };
    }
  });

  // service/vendor/torrent-stream/lib/exchange-metadata.cjs
  var require_exchange_metadata = __commonJS({
    "service/vendor/torrent-stream/lib/exchange-metadata.cjs"(exports, module) {
      var bncode = require_bncode();
      var crypto = __require("crypto");
      var METADATA_BLOCK_SIZE = 1 << 14;
      var METADATA_MAX_SIZE = 1 << 22;
      var EXTENSIONS = {
        m: {
          ut_metadata: 1,
          // Kai: BEP 11 peer exchange (receive only), as in WebTorrent's ut_pex.
          ut_pex: 2
        }
      };
      var sha1 = function sha1(data) {
        return crypto.createHash("sha1").update(data).digest("hex");
      };
      module.exports = function (engine, callback) {
        var sharedBySize = {};
        function accept(metadata) {
          engine.metadata = metadata;
          engine.emit("metadata-accepted", metadata.length);
          try {
            callback(metadata);
          } catch (err) {
            engine.emit("error", new Error("Torrent metadata verified, but file initialization failed: " + (err.message || err)));
          }
        }
        return function (wire) {
          var metadataPieces = [];
          var retries = 0;
          var metadata = engine.metadata;
          wire.on("extended", function (id, ext) {
            if (id !== EXTENSIONS.m.ut_pex) return;
            var added = module.exports.pexPeers(ext);
            for (var i = 0; i < added.length; i++) {
              engine.emit("pex-peer", added[i]);
              engine.connect(added[i]);
            }
          });
          wire.once("extended", function (id, handshake) {
            try {
              handshake = bncode.decode(handshake);
            } catch (err) {
              return;
            }
            if (!id && typeof handshake.reqq === "number" && handshake.reqq > 0) wire.peerReqq = handshake.reqq;
            if (id || !handshake.m || handshake.m.ut_metadata === void 0) return;
            var channel = handshake.m.ut_metadata;
            var size = handshake.metadata_size;
            engine.emit("metadata-peer", size);
            wire.on("extended", function (id2, ext) {
              if (id2 !== EXTENSIONS.m.ut_metadata) return;
              var metadata2 = engine.metadata;
              var delimiter, message, piece;
              try {
                delimiter = ext.toString("ascii").indexOf("ee");
                message = bncode.decode(ext.slice(0, delimiter === -1 ? ext.length : delimiter + 2));
                piece = message.piece;
              } catch (err) {
                return;
              }
              if (piece < 0) return;
              if (message.msg_type === 2) return;
              if (message.msg_type === 0) {
                if (!metadata2) return wire.extended(channel, {
                  msg_type: 2,
                  piece
                });
                var offset = piece * METADATA_BLOCK_SIZE;
                var buf = metadata2.slice(offset, offset + METADATA_BLOCK_SIZE);
                wire.extended(channel, Buffer.concat([bncode.encode({
                  msg_type: 1,
                  piece
                }), buf]));
                return;
              }
              if (message.msg_type === 1 && !metadata2) {
                if (!(size > 0 && size <= METADATA_MAX_SIZE) || piece >= Math.ceil(size / METADATA_BLOCK_SIZE)) return;
                var payload = ext.slice(delimiter + 2);
                if (payload.length !== Math.min(METADATA_BLOCK_SIZE, size - piece * METADATA_BLOCK_SIZE)) return;
                metadataPieces[piece] = payload;
                engine.emit("metadata-piece", piece, size);
                var shared = sharedBySize[size];
                if (!shared) {
                  shared = [];
                  if (Object.keys(sharedBySize).length < 2) sharedBySize[size] = shared;
                }
                shared[piece] = payload;
                var complete = true;
                for (var block = 0; block * METADATA_BLOCK_SIZE < size; block++) {
                  if (!shared[block]) {
                    complete = false;
                    break;
                  }
                }
                if (complete) {
                  var combined = Buffer.concat(shared);
                  if (engine.infoHash === sha1(combined)) {
                    accept(combined);
                    return;
                  }
                }
                for (var i2 = 0; i2 * METADATA_BLOCK_SIZE < size; i2++) {
                  if (!metadataPieces[i2]) return;
                }
                metadata2 = Buffer.concat(metadataPieces);
                if (engine.infoHash !== sha1(metadata2)) {
                  metadataPieces = [];
                  metadata2 = null;
                  engine.emit("metadata-invalid");
                  if (retries++ < 1) {
                    for (var retryPiece = 0; retryPiece * METADATA_BLOCK_SIZE < size; retryPiece++) {
                      wire.extended(channel, {
                        msg_type: 0,
                        piece: retryPiece
                      });
                    }
                  }
                  return;
                }
                accept(metadata2);
              }
            });
            if (size > METADATA_MAX_SIZE) return;
            if (!size || metadata) return;
            for (var i = 0; i * METADATA_BLOCK_SIZE < size; i++) {
              if (metadataPieces[i]) continue;
              wire.extended(channel, {
                msg_type: 0,
                piece: i
              });
            }
          });
          if (!wire.peerExtensions.extended) return;
          wire.extended(0, metadata ? {
            m: {
              ut_metadata: 1,
              ut_pex: 2
            },
            metadata_size: metadata.length
          } : {
            m: {
              ut_metadata: 1,
              ut_pex: 2
            }
          });
        };
      };
      module.exports.pexPeers = function (ext) {
        var message;
        try {
          message = bncode.decode(ext);
        } catch (err) {
          return [];
        }
        var added = message && message.added;
        if (!added || !Buffer.isBuffer(added)) return [];
        var out = [];
        for (var i = 0; i + 6 <= added.length && out.length < 50; i += 6) {
          var port = added.readUInt16BE(i + 4);
          if (!port) continue;
          out.push(added[i] + "." + added[i + 1] + "." + added[i + 2] + "." + added[i + 3] + ":" + port);
        }
        return out;
      };
    }
  });

  // service/vendor/torrent-stream/lib/file-stream.cjs
  var require_file_stream = __commonJS({
    "service/vendor/torrent-stream/lib/file-stream.cjs"(exports, module) {
      var stream = __require("stream");
      var util = __require("util");
      var _FileStream = function FileStream(engine, file, opts) {
        if (!(this instanceof _FileStream)) return new _FileStream(engine, file, opts);
        stream.Readable.call(this);
        if (!opts) opts = {};
        if (!opts.start) opts.start = 0;
        if (!opts.end && typeof opts.end !== "number") opts.end = file.length - 1;
        var offset = opts.start + file.offset;
        var pieceLength = engine.torrent.pieceLength;
        this.length = opts.end - opts.start + 1;
        this.startPiece = offset / pieceLength | 0;
        this.endPiece = (opts.end + file.offset) / pieceLength | 0;
        this._destroyed = false;
        this._engine = engine;
        this._piece = this.startPiece;
        this._missing = this.length;
        this._reading = false;
        this._notifying = false;
        this._critical = Math.min(1024 * 1024 / pieceLength, 2) | 0;
        this._offset = offset - this.startPiece * pieceLength;
      };
      util.inherits(_FileStream, stream.Readable);
      _FileStream.prototype._read = function () {
        if (this._reading) return;
        this._reading = true;
        this.notify();
      };
      _FileStream.prototype.notify = function () {
        if (!this._reading || !this._missing) return;
        if (!this._engine.bitfield.get(this._piece)) return this._engine.critical(this._piece, this._critical);
        var self = this;
        if (this._notifying) return;
        this._notifying = true;
        this._engine.store.get(this._piece++, function (err, buffer) {
          self._notifying = false;
          if (self._destroyed || !self._reading) return;
          if (err) return self.destroy(err);
          if (self._offset) {
            buffer = buffer.slice(self._offset);
            self._offset = 0;
          }
          if (self._missing < buffer.length) buffer = buffer.slice(0, self._missing);
          self._missing -= buffer.length;
          if (!self._missing) {
            self.push(buffer);
            self.push(null);
            return;
          }
          self._reading = false;
          self.push(buffer);
        });
      };
      _FileStream.prototype.destroy = function () {
        if (this._destroyed) return;
        this._destroyed = true;
        this.emit("close");
      };
      module.exports = _FileStream;
    }
  });

  // service/vendor/torrent-stream/lib/stream-policy.cjs
  var require_stream_policy = __commonJS({
    "service/vendor/torrent-stream/lib/stream-policy.cjs"(exports) {
      exports.MAX_PEER_BLOCKS = 250;
      exports.pipeline = function (speed, reqq) {
        var length = !(speed > 0) || !isFinite(speed) ? 5 : Math.min(exports.MAX_PEER_BLOCKS, 2 + Math.ceil(speed * 3 / 16384));
        if (typeof reqq === "number" && reqq > 0) length = Math.min(length, reqq);
        return Math.max(1, length);
      };
      exports.recovery = function (requests, wires, urgent, now) {
        for (var i = 0; i < requests.length; i++) {
          var request = requests[i];
          if (!urgent[request.index] || request.retried) continue;
          var oldSpeed = request.wire.downloadSpeed() || 0;
          var deadline = Math.max(4e3, Math.min(15e3, 2 * 16384 / Math.max(1, oldSpeed) * 1e3));
          if (now - request.at < deadline) continue;
          var best = null;
          for (var j = 0; j < wires.length; j++) {
            var wire = wires[j],
              speed = wire.downloadSpeed() || 0;
            if (wire === request.wire || wire.peerChoking || !wire.peerPieces[request.index]) continue;
            if (speed <= Math.max(16384, oldSpeed * 1.5) || wire.requests.length >= exports.pipeline(speed, wire.peerReqq)) continue;
            if (wire.requests.some(function (r) {
              return r.piece === request.index && r.offset === request.offset;
            })) continue;
            if (!best || speed > best.downloadSpeed()) best = wire;
          }
          if (best) return {
            request,
            wire: best
          };
        }
        return null;
      };
      exports.criticalLimit = function (speed, reqq) {
        var pipeline = exports.pipeline(speed, reqq);
        if (!(speed > 0) || !isFinite(speed)) return pipeline;
        return Math.max(2, Math.min(pipeline, Math.ceil(speed * 2 / 16384)));
      };
      exports.criticalCount = function (requests, critical) {
        var count = 0;
        for (var i = 0; i < requests.length; i++) if (critical[requests[i].piece]) count++;
        return count;
      };
      exports.SNUB_MS = 2e4;
      exports.snubCandidates = function (wires, now) {
        var active = false;
        var out = [];
        for (var i = 0; i < wires.length; i++) {
          var w = wires[i];
          if (!w.requests.length) {
            w.waitSince = 0;
            continue;
          }
          if (!w.waitSince) w.waitSince = now;
        }
        for (i = 0; i < wires.length; i++) {
          var other = wires[i];
          if (!other.snubbed && !other.peerChoking && other.lastPieceAt && now - other.lastPieceAt < exports.SNUB_MS) active = true;
        }
        if (!active) return out;
        for (i = 0; i < wires.length; i++) {
          var wire = wires[i];
          if (wire.snubbed || wire.peerChoking || !wire.requests.length) continue;
          var since = Math.max(wire.lastPieceAt || 0, wire.waitSince || now);
          if (now - since > exports.SNUB_MS) out.push(wire);
        }
        return out;
      };
    }
  });

  // service/vendor/torrent-stream/index.cjs
  var require_index = __commonJS({
    "service/vendor/torrent-stream/index.cjs"(exports, module) {
      var hat = require_hat();
      var pws = require_peer_wire_swarm();
      var bncode = require_bncode();
      var crypto = __require("crypto");
      var bitfield = require_bitfield();
      var parseTorrent = require_parse_torrent();
      var mkdirp = require_mkdirp();
      var events = __require("events");
      var path = __require("path");
      var fs = __require("fs");
      var os = __require("os");
      var eos = require_end_of_stream();
      var piece = require_torrent_piece();
      var rimraf = require_rimraf();
      var FSChunkStore = require_fs_chunk_store();
      var ImmediateChunkStore = require_immediate_chunk_store();
      var peerDiscovery = require_torrent_discovery();
      var blocklist = require_ip_set();
      var exchangeMetadata = require_exchange_metadata();
      var fileStream = require_file_stream();
      var streamPolicy = require_stream_policy();
      var MAX_ACTIVE_BLOCKS = 512;
      var CHOKE_TIMEOUT = 15e3;
      var REQUEST_TIMEOUT = 3e4;
      var SPEED_THRESHOLD = 3 * piece.BLOCK_LENGTH;
      var DEFAULT_PORT = 6881;
      var BAD_PIECE_STRIKES_MAX = 3;
      var BAD_PIECE_STRIKES_DURATION = 12e4;
      var RECHOKE_INTERVAL = 1e4;
      var RECHOKE_OPTIMISTIC_DURATION = 2;
      var TMP = fs.existsSync("/tmp") ? "/tmp" : os.tmpDir();
      var noop = function noop() {};
      var sha1 = function sha1(data) {
        return crypto.createHash("sha1").update(data).digest("hex");
      };
      var thruthy = function thruthy() {
        return true;
      };
      var falsy = function falsy() {
        return false;
      };
      var toNumber = function toNumber(val) {
        return val === true ? 1 : val || 0;
      };
      var _torrentStream = function torrentStream(link, opts, cb) {
        if (typeof opts === "function") return _torrentStream(link, null, opts);
        link = parseTorrent(link);
        var metadata = link.infoBuffer || null;
        var infoHash = link.infoHash;
        if (!opts) opts = {};
        if (!opts.id) opts.id = "-TS0008-" + hat(48);
        if (!opts.tmp) opts.tmp = TMP;
        if (!opts.name) opts.name = "torrent-stream";
        if (!opts.flood) opts.flood = 0;
        if (!opts.pulse) opts.pulse = Number.MAX_SAFE_INTEGER;
        var usingTmp = false;
        var destroyed = false;
        if (!opts.path) {
          usingTmp = true;
          opts.path = path.join(opts.tmp, opts.name, infoHash);
        }
        var engine = new events.EventEmitter();
        var swarm = pws(infoHash, opts.id, {
          size: opts.connections || opts.size,
          speed: 10,
          connectTimeout: opts.connectTimeout || 5e3,
          utpFallback: !!opts.utpFallback
        });
        swarm.on("utp-fallback", function (addr) {
          engine.emit("utp-fallback", addr);
        });
        var torrentPath = path.join(opts.tmp, opts.name, infoHash + ".torrent");
        if (cb) engine.on("ready", cb.bind(null, engine));
        engine.ready = function (cb2) {
          if (engine.torrent) cb2();else engine.once("ready", cb2);
        };
        var wires = swarm.wires;
        var critical = [];
        var refresh = noop;
        var rechokeSlots = opts.uploads === false || opts.uploads === 0 ? 0 : +opts.uploads || 10;
        var rechokeOptimistic = null;
        var rechokeOptimisticTime = 0;
        var activeRequests = [];
        var retriedBlocks = {};
        var recoveryIntervalId;
        var criticalRetries = 0;
        var rechokeIntervalId;
        engine.infoHash = infoHash;
        engine.metadata = metadata;
        engine.path = opts.path;
        engine.files = [];
        engine.selection = [];
        engine.torrent = null;
        engine.bitfield = null;
        engine.amInterested = false;
        engine.store = null;
        engine.swarm = swarm;
        engine.streamingStats = function () {
          return {
            activeBlocks: activeRequests.length,
            criticalRetries
          };
        };
        engine._flood = opts.flood;
        engine._pulse = opts.pulse;
        var discovery = peerDiscovery({
          peerId: new Buffer(opts.id),
          dht: opts.dht !== void 0 ? opts.dht : true,
          tracker: opts.tracker !== void 0 ? opts.tracker : true,
          port: DEFAULT_PORT,
          announce: opts.trackers
        });
        var blocked = blocklist(opts.blocklist);
        discovery.on("peer", function (addr) {
          if (blocked.contains(addr.split(":")[0])) {
            engine.emit("blocked-peer", addr);
          } else {
            engine.emit("peer", addr);
            engine.connect(addr);
          }
        });
        var ontorrent = function ontorrent(torrent) {
          var storage = opts.storage || FSChunkStore;
          engine.store = ImmediateChunkStore(storage(torrent.pieceLength, {
            files: torrent.files.map(function (file) {
              return {
                path: path.join(opts.path, file.path),
                length: file.length,
                offset: file.offset
              };
            })
          }));
          engine.torrent = torrent;
          engine.bitfield = bitfield(torrent.pieces.length);
          var requestedAt = engine.pieceRequestedAt = {};
          var pieceLength = torrent.pieceLength;
          var pieceRemainder = torrent.length % pieceLength || pieceLength;
          var pieces = torrent.pieces.map(function (hash, i) {
            return piece(i === torrent.pieces.length - 1 ? pieceRemainder : pieceLength);
          });
          engine.pieceStats = function (indices) {
            return indices.slice(0, 4).map(function (index) {
              var p = pieces[index],
                active = 0,
                oldest = 0,
                available = 0,
                unchoked = 0;
              activeRequests.forEach(function (r) {
                if (r.index !== index) return;
                active++;
                oldest = Math.max(oldest, Date.now() - r.at);
              });
              wires.forEach(function (w) {
                if (!w.peerPieces[index]) return;
                available++;
                if (!w.peerChoking) unchoked++;
              });
              return {
                index,
                verified: !!engine.bitfield.get(index),
                received: p ? p.length - p.missing : 0,
                missing: p ? p.missing : 0,
                active,
                oldestMs: oldest,
                available,
                unchoked
              };
            });
          };
          var reservations = torrent.pieces.map(function () {
            return [];
          });
          process.nextTick(function () {
            discovery.setTorrent(torrent);
          });
          engine.files = torrent.files.map(function (file) {
            file = Object.create(file);
            var offsetPiece = file.offset / torrent.pieceLength | 0;
            var endPiece = (file.offset + file.length - 1) / torrent.pieceLength | 0;
            file.deselect = function () {
              engine.deselect(offsetPiece, endPiece, false);
            };
            file.select = function () {
              engine.select(offsetPiece, endPiece, false);
            };
            file.createReadStream = function (opts2) {
              var stream = fileStream(engine, file, opts2);
              var notify = stream.notify.bind(stream);
              engine.select(stream.startPiece, stream.endPiece, true, notify);
              eos(stream, function () {
                engine.deselect(stream.startPiece, stream.endPiece, true, notify);
              });
              return stream;
            };
            return file;
          });
          var oninterestchange = function oninterestchange() {
            var prev = engine.amInterested;
            engine.amInterested = !!engine.selection.length;
            wires.forEach(function (wire) {
              if (engine.amInterested) wire.interested();else wire.uninterested();
            });
            if (prev === engine.amInterested) return;
            if (engine.amInterested) engine.emit("interested");else engine.emit("uninterested");
          };
          var gc = function gc() {
            for (var i = 0; i < engine.selection.length; i++) {
              var s = engine.selection[i];
              var oldOffset = s.offset;
              while (!pieces[s.from + s.offset] && s.from + s.offset < s.to) s.offset++;
              if (oldOffset !== s.offset) s.notify();
              if (s.to !== s.from + s.offset) continue;
              if (pieces[s.from + s.offset]) continue;
              engine.selection.splice(i, 1);
              i--;
              s.notify();
              oninterestchange();
            }
            if (!engine.selection.length) engine.emit("idle");
          };
          engine.release = function (index) {
            if (!engine.bitfield || index < 0 || index >= torrent.pieces.length) return false;
            if (!engine.bitfield.get(index)) return false;
            engine.bitfield.set(index, false);
            pieces[index] = piece(index === torrent.pieces.length - 1 ? pieceRemainder : pieceLength);
            reservations[index] = [];
            return true;
          };
          var onpiececomplete = function onpiececomplete(index, buffer) {
            if (!pieces[index]) return;
            pieces[index] = null;
            reservations[index] = null;
            engine.bitfield.set(index, true);
            Object.keys(retriedBlocks).forEach(function (key) {
              if (key.split(":")[0] === String(index)) delete retriedBlocks[key];
            });
            for (var i = 0; i < wires.length; i++) wires[i].have(index);
            engine.emit("verify", index);
            engine.emit("download", index, buffer);
            engine.store.put(index, buffer);
            gc();
          };
          var onhotswap = opts.hotswap === false ? falsy : function (wire, index) {
            var speed = wire.downloadSpeed();
            if (speed < piece.BLOCK_LENGTH) return;
            if (!reservations[index] || !pieces[index]) return;
            var r = reservations[index];
            var minSpeed = Infinity;
            var min;
            for (var i = 0; i < r.length; i++) {
              var other = r[i];
              if (!other || other === wire) continue;
              var otherSpeed = other.downloadSpeed();
              if (otherSpeed >= SPEED_THRESHOLD) continue;
              if (2 * otherSpeed > speed || otherSpeed > minSpeed) continue;
              min = other;
              minSpeed = otherSpeed;
            }
            if (!min) return false;
            for (i = 0; i < r.length; i++) {
              if (r[i] === min) r[i] = null;
            }
            var pending = min.requests.slice();
            for (i = 0; i < pending.length; i++) {
              var req = pending[i];
              if (req.piece !== index) continue;
              pieces[index].cancel(req.offset / piece.BLOCK_LENGTH | 0);
              min.cancel(req.piece, req.offset, req.length);
            }
            engine.emit("hotswap", min, wire, index);
            return true;
          };
          var onupdatetick = function onupdatetick() {
            process.nextTick(onupdate);
          };
          var onrequest = function onrequest(wire, index, hotswap) {
            if (!pieces[index] || activeRequests.length >= MAX_ACTIVE_BLOCKS) return false;
            if (!requestedAt[index]) requestedAt[index] = Date.now();
            var p = pieces[index];
            var reservation = p.reserve();
            if (reservation === -1 && hotswap && onhotswap(wire, index)) reservation = p.reserve();
            if (reservation === -1) return false;
            var r = reservations[index] || [];
            var offset = p.chunkOffset(reservation);
            var size = p.chunkLength(reservation);
            var i = r.indexOf(null);
            if (i === -1) i = r.length;
            r[i] = wire;
            var requestKey = index + ":" + offset;
            var active = {
              wire,
              index,
              offset,
              size,
              at: Date.now(),
              retried: !!retriedBlocks[requestKey]
            };
            activeRequests.push(active);
            wire.request(index, offset, size, function (err, block) {
              var activeAt = activeRequests.indexOf(active);
              if (activeAt >= 0) activeRequests.splice(activeAt, 1);
              var ownsReservation = r[i] === wire;
              if (ownsReservation) r[i] = null;
              if (p !== pieces[index]) return onupdatetick();
              if (err) {
                if (ownsReservation) p.cancel(reservation);
                onupdatetick();
                return;
              }
              if (!p.set(reservation, block, wire)) return onupdatetick();
              var sources = p.sources;
              var buffer = p.flush();
              if (sha1(buffer) !== torrent.pieces[index]) {
                pieces[index] = piece(p.length);
                engine.emit("invalid-piece", index, buffer);
                onupdatetick();
                sources.forEach(function (wire2) {
                  var now = Date.now();
                  wire2.badPieceStrikes = wire2.badPieceStrikes.filter(function (strike) {
                    return now - strike < BAD_PIECE_STRIKES_DURATION;
                  });
                  wire2.badPieceStrikes.push(now);
                  if (wire2.badPieceStrikes.length > BAD_PIECE_STRIKES_MAX) {
                    engine.block(wire2.peerAddress);
                  }
                });
                return;
              }
              onpiececomplete(index, buffer);
              onupdatetick();
            });
            return true;
          };
          var onvalidatewire = function onvalidatewire(wire) {
            if (wire.requests.length) return;
            for (var i = 0; i < engine.selection.length; i++) {
              var next = engine.selection[i];
              for (var j = next.from + next.offset; j <= next.to; j++) {
                if (!wire.peerPieces[j]) continue;
                if (onrequest(wire, j, false)) return;
              }
            }
          };
          var speedRanker = function speedRanker(wire) {
            var speed = wire.downloadSpeed() || 1;
            if (speed > SPEED_THRESHOLD) return thruthy;
            var secs = streamPolicy.pipeline(speed, wire.peerReqq) * piece.BLOCK_LENGTH / speed;
            var tries = 10;
            var ptr = 0;
            return function (index) {
              if (!tries || !pieces[index]) return true;
              var missing = pieces[index].missing;
              for (; ptr < wires.length; ptr++) {
                var other = wires[ptr];
                var otherSpeed = other.downloadSpeed();
                if (otherSpeed < SPEED_THRESHOLD) continue;
                if (otherSpeed <= speed || !other.peerPieces[index]) continue;
                if ((missing -= otherSpeed * secs) > 0) continue;
                tries--;
                return false;
              }
              return true;
            };
          };
          var shufflePriority = function shufflePriority(i) {
            var last = i;
            for (var j = i; j < engine.selection.length && engine.selection[j].priority === engine.selection[i].priority; j++) {
              last = j;
            }
            var tmp = engine.selection[i];
            engine.selection[i] = engine.selection[last];
            engine.selection[last] = tmp;
          };
          var select = function select(wire, hotswap) {
            var pipeline = streamPolicy.pipeline(wire.downloadSpeed(), wire.peerReqq);
            if (wire.requests.length >= pipeline) return true;
            if (swarm.downloaded > engine._flood && swarm.downloadSpeed() > engine._pulse) {
              return true;
            }
            var rank = speedRanker(wire);
            var criticalLimit = streamPolicy.criticalLimit(wire.downloadSpeed(), wire.peerReqq);
            var criticalHeld = streamPolicy.criticalCount(wire.requests, critical);
            if (wire.snubbed) {
              if (wire.requests.length >= 1) return true;
              pipeline = 1;
              criticalLimit = 0;
            }
            for (var i = 0; i < engine.selection.length; i++) {
              var next = engine.selection[i];
              for (var j = next.from + next.offset; j <= next.to; j++) {
                if (!wire.peerPieces[j] || !rank(j)) continue;
                if (critical[j]) {
                  while (wire.requests.length < pipeline && criticalHeld < criticalLimit && onrequest(wire, j, true)) criticalHeld++;
                  if (wire.requests.length < pipeline) continue;
                  if (next.priority) shufflePriority(i);
                  return true;
                }
                while (wire.requests.length < pipeline && onrequest(wire, j, hotswap)) {}
                if (wire.requests.length < pipeline) continue;
                if (next.priority) shufflePriority(i);
                return true;
              }
            }
            return false;
          };
          var onupdatewire = function onupdatewire(wire) {
            if (wire.peerChoking) return;
            if (!wire.downloaded) return onvalidatewire(wire);
            select(wire, false) || select(wire, true);
          };
          var onupdate = function onupdate() {
            wires.forEach(onupdatewire);
          };
          var onwire = function onwire(wire) {
            wire.setTimeout(opts.timeout || REQUEST_TIMEOUT, function () {
              engine.emit("timeout", wire);
              wire.destroy();
            });
            if (engine.selection.length) wire.interested();
            var timeout = CHOKE_TIMEOUT;
            var id;
            var _onchoketimeout = function onchoketimeout() {
              if (swarm.queued > 2 * (swarm.size - swarm.wires.length) && wire.amInterested) return wire.destroy();
              id = setTimeout(_onchoketimeout, timeout);
            };
            wire.on("close", function () {
              clearTimeout(id);
            });
            wire.on("choke", function () {
              clearTimeout(id);
              id = setTimeout(_onchoketimeout, timeout);
            });
            wire.on("unchoke", function () {
              clearTimeout(id);
            });
            wire.on("request", function (index, offset, length, cb2) {
              if (!engine.bitfield.get(index)) return;
              engine.store.get(index, {
                offset,
                length
              }, function (err, buffer) {
                if (err) return cb2(err);
                engine.emit("upload", index, offset, length);
                cb2(null, buffer);
              });
            });
            wire.on("unchoke", onupdate);
            wire.on("bitfield", onupdate);
            wire.on("download", function () {
              wire.lastPieceAt = Date.now();
              if (wire.snubbed) {
                wire.snubbed = false;
                engine.emit("unsnub", wire);
              }
            });
            wire.on("have", onupdate);
            wire.isSeeder = false;
            var i = 0;
            var checkseeder = function checkseeder() {
              if (wire.peerPieces.length !== torrent.pieces.length) return;
              for (; i < torrent.pieces.length; ++i) {
                if (!wire.peerPieces[i]) return;
              }
              wire.isSeeder = true;
            };
            wire.on("bitfield", checkseeder);
            wire.on("have", checkseeder);
            checkseeder();
            wire.badPieceStrikes = [];
            id = setTimeout(_onchoketimeout, timeout);
          };
          var rechokeSort = function rechokeSort(a, b) {
            if (a.downSpeed !== b.downSpeed) return a.downSpeed > b.downSpeed ? -1 : 1;
            if (a.upSpeed !== b.upSpeed) return a.upSpeed > b.upSpeed ? -1 : 1;
            if (a.wasChoked !== b.wasChoked) return a.wasChoked ? 1 : -1;
            return a.salt - b.salt;
          };
          var onrechoke = function onrechoke() {
            if (rechokeOptimisticTime > 0) --rechokeOptimisticTime;else rechokeOptimistic = null;
            var peers = [];
            wires.forEach(function (wire) {
              if (wire.isSeeder) {
                if (!wire.amChoking) wire.choke();
              } else if (wire !== rechokeOptimistic) {
                peers.push({
                  wire,
                  downSpeed: wire.downloadSpeed(),
                  upSpeed: wire.uploadSpeed(),
                  salt: Math.random(),
                  interested: wire.peerInterested,
                  wasChoked: wire.amChoking,
                  isChoked: true
                });
              }
            });
            peers.sort(rechokeSort);
            var i = 0;
            var unchokeInterested = 0;
            for (; i < peers.length && unchokeInterested < rechokeSlots; ++i) {
              peers[i].isChoked = false;
              if (peers[i].interested) ++unchokeInterested;
            }
            if (!rechokeOptimistic && i < peers.length && rechokeSlots) {
              var candidates = peers.slice(i).filter(function (peer) {
                return peer.interested;
              });
              var optimistic = candidates[Math.random() * candidates.length | 0];
              if (optimistic) {
                optimistic.isChoked = false;
                rechokeOptimistic = optimistic.wire;
                rechokeOptimisticTime = RECHOKE_OPTIMISTIC_DURATION;
              }
            }
            peers.forEach(function (peer) {
              if (peer.wasChoked !== peer.isChoked) {
                if (peer.isChoked) peer.wire.choke();else peer.wire.unchoke();
              }
            });
          };
          var onready = function onready() {
            swarm.on("wire", onwire);
            swarm.wires.forEach(onwire);
            refresh = function refresh() {
              process.nextTick(gc);
              oninterestchange();
              onupdate();
            };
            rechokeIntervalId = setInterval(onrechoke, RECHOKE_INTERVAL);
            recoveryIntervalId = setInterval(function () {
              var snubAt = Date.now();
              var snub = streamPolicy.snubCandidates(wires, snubAt);
              for (var s = 0; s < snub.length; s++) {
                var slow = snub[s];
                slow.snubbed = true;
                var pendingRequests = slow.requests.slice();
                for (var q = 0; q < pendingRequests.length; q++) slow.cancel(pendingRequests[q].piece, pendingRequests[q].offset, pendingRequests[q].length);
                engine.emit("snub", slow);
              }
              var urgent = {};
              engine.selection.forEach(function (selection) {
                if (selection.priority < 2) return;
                for (var i = selection.from; i <= selection.to; i++) urgent[i] = true;
              });
              var recovery = streamPolicy.recovery(activeRequests, wires, urgent, Date.now());
              if (!recovery) return;
              var request = recovery.request;
              retriedBlocks[request.index + ":" + request.offset] = true;
              request.wire.cancel(request.index, request.offset, request.size);
              onrequest(recovery.wire, request.index, false);
              criticalRetries++;
              engine.emit("critical-retry", request.index, request.offset);
            }, 1e3);
            process.nextTick(function () {
              engine.emit("ready");
              refresh();
            });
          };
          if (opts.verify === false) return onready();
          engine.emit("verifying");
          var _loop2 = function loop(i) {
            if (i >= torrent.pieces.length) return onready();
            engine.store.get(i, function (_, buf) {
              if (!buf || sha1(buf) !== torrent.pieces[i] || !pieces[i]) return _loop2(i + 1);
              pieces[i] = null;
              engine.bitfield.set(i, true);
              engine.emit("verify", i);
              _loop2(i + 1);
            });
          };
          _loop2(0);
        };
        var exchange = exchangeMetadata(engine, function (metadata2) {
          var buf = Buffer.concat([new Buffer("d4:info"), metadata2, new Buffer("e")]);
          ontorrent(parseTorrent(buf));
          if (opts.cache === false) return;
          mkdirp(path.dirname(torrentPath), function (err) {
            if (err) return engine.emit("error", err);
            fs.writeFile(torrentPath, buf, function (err2) {
              if (err2) engine.emit("error", err2);
            });
          });
        });
        swarm.on("wire", function (wire) {
          engine.emit("wire", wire);
          exchange(wire);
          if (engine.bitfield) wire.bitfield(engine.bitfield);
        });
        swarm.pause();
        if (link.files && engine.metadata) {
          swarm.resume();
          ontorrent(link);
        } else if (opts.cache === false) {
          swarm.resume();
          discovery.setTorrent(link);
        } else {
          fs.readFile(torrentPath, function (_, buf) {
            if (destroyed) return;
            swarm.resume();
            if (!buf) return discovery.setTorrent(link);
            var torrent = parseTorrent(buf);
            if (torrent.infoHash !== infoHash) return discovery.setTorrent(link);
            if (!torrent.announce || !torrent.announce.length) {
              opts.trackers = [].concat(opts.trackers || []).concat(link.announce || []);
            }
            engine.metadata = torrent.infoBuffer;
            ontorrent(torrent);
          });
        }
        engine.critical = function (piece2, width) {
          for (var i = 0; i < (width || 1); i++) critical[piece2 + i] = true;
        };
        engine.select = function (from, to, priority, notify) {
          engine.selection.push({
            from,
            to,
            offset: 0,
            priority: toNumber(priority),
            notify: notify || noop
          });
          engine.selection.sort(function (a, b) {
            return b.priority - a.priority;
          });
          refresh();
        };
        engine.deselect = function (from, to, priority, notify) {
          notify = notify || noop;
          for (var i = 0; i < engine.selection.length; i++) {
            var s = engine.selection[i];
            if (s.from !== from || s.to !== to) continue;
            if (s.priority !== toNumber(priority)) continue;
            if (s.notify !== notify) continue;
            engine.selection.splice(i, 1);
            i--;
            break;
          }
          refresh();
        };
        engine.setPulse = function (bps) {
          engine._pulse = bps;
        };
        engine.setFlood = function (b) {
          engine._flood = b + swarm.downloaded;
        };
        engine.setFloodedPulse = function (b, bps) {
          engine.setFlood(b);
          engine.setPulse(bps);
        };
        engine.flood = function () {
          engine._flood = 0;
          engine._pulse = Number.MAX_SAFE_INTEGER;
        };
        engine.connect = function (addr) {
          swarm.add(addr);
        };
        engine.disconnect = function (addr) {
          swarm.remove(addr);
        };
        engine.block = function (addr) {
          blocked.add(addr.split(":")[0]);
          engine.disconnect(addr);
          engine.emit("blocking", addr);
        };
        var removeTorrent = function removeTorrent(cb2) {
          fs.unlink(torrentPath, function (err) {
            if (err) return cb2(err);
            fs.rmdir(path.dirname(torrentPath), function (err2) {
              if (err2 && err2.code !== "ENOTEMPTY") return cb2(err2);
              cb2();
            });
          });
        };
        var removeTmp = function removeTmp(cb2) {
          if (!usingTmp) return removeTorrent(cb2);
          rimraf(opts.path, function (err) {
            if (err) return cb2(err);
            removeTorrent(cb2);
          });
        };
        engine.remove = function (keepPieces, cb2) {
          if (typeof keepPieces === "function") {
            cb2 = keepPieces;
            keepPieces = false;
          }
          if (keepPieces || !engine.store || !engine.store.destroy) return removeTmp(cb2);
          engine.store.destroy(function (err) {
            if (err) return cb2(err);
            removeTmp(cb2);
          });
        };
        engine.destroy = function (cb2) {
          destroyed = true;
          swarm.destroy();
          clearInterval(rechokeIntervalId);
          clearInterval(recoveryIntervalId);
          discovery.stop();
          if (engine.store && engine.store.close) {
            engine.store.close(cb2);
          } else if (cb2) {
            process.nextTick(cb2);
          }
        };
        var _findPort = function findPort(def, cb2) {
          var net = __require("net");
          var s = net.createServer();
          s.on("error", function () {
            _findPort(0, cb2);
          });
          s.listen(def, function () {
            var port = s.address().port;
            s.close(function () {
              engine.listen(port, cb2);
            });
          });
        };
        engine.listen = function (port, cb2) {
          if (typeof port === "function") return engine.listen(0, port);
          if (!port) return _findPort(opts.port || DEFAULT_PORT, cb2);
          engine.port = port;
          swarm.listen(engine.port, cb2);
          discovery.updatePort(engine.port);
        };
        return engine;
      };
      module.exports = _torrentStream;
      module.exports.DHT = require_client();
    }
  });
  return require_index();
}();
// Minimal UPnP IGD client for the TV player service (Node 4, no dependencies).
// Finds the home router (SSDP), reads its WANIPConnection / WANPPPConnection control URL and maps
// the torrent listening port so peers behind other routers can connect to the TV. libtorrent and
// WebTorrent (Node) do the same by default. Mappings carry a lease and are removed on shutdown.
var TV_UPNP = (function () {
  var dgram = require('dgram');
  var http = require('http');
  var os = require('os');
  var urlLib = require('url');

  var SSDP_HOST = '239.255.255.250';
  var SSDP_PORT = 1900;
  var SEARCH_TARGETS = [
    'urn:schemas-upnp-org:service:WANIPConnection:1',
    'urn:schemas-upnp-org:service:WANPPPConnection:1',
    'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
  ];
  var SERVICE_RE = /urn:schemas-upnp-org:service:WAN(IP|PPP)Connection:\d/;

  // Tests point discovery at a local fake gateway instead of the multicast group.
  var options = { ssdpHost: SSDP_HOST, ssdpPort: SSDP_PORT, timeout: 3000 };
  var cached = null;

  function configure(next) {
    Object.keys(next || {}).forEach(function (k) { options[k] = next[k]; });
    cached = null;
  }

  function discover(cb) {
    var socket = dgram.createSocket('udp4');
    var done = false;
    var locations = [];
    var timer = setTimeout(finish, options.timeout);
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { socket.close(); } catch (e) { /* closed */ }
      if (!locations.length) return cb(new Error('no UPnP gateway answered'));
      cb(null, locations[0]);
    }
    socket.on('error', function (err) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { socket.close(); } catch (e) { /* closed */ }
      cb(err);
    });
    socket.on('message', function (msg) {
      var text = msg.toString();
      var match = /^location:\s*(\S+)/im.exec(text);
      if (!match || locations.indexOf(match[1]) >= 0) return;
      locations.push(match[1]);
      // The first answer is enough; give others a moment only if this one is not a gateway.
      setTimeout(finish, 300);
    });
    socket.bind(0, function () {
      SEARCH_TARGETS.forEach(function (st) {
        var message = new Buffer('M-SEARCH * HTTP/1.1\r\nHOST: ' + SSDP_HOST + ':' + SSDP_PORT + '\r\n' +
          'MAN: "ssdp:discover"\r\nMX: 2\r\nST: ' + st + '\r\n\r\n');
        socket.send(message, 0, message.length, options.ssdpPort, options.ssdpHost);
      });
    });
  }

  function get(location, cb) {
    var req = http.get(location, function (res) {
      var body = '';
      res.setEncoding('utf8');
      res.on('data', function (d) { body += d; if (body.length > 256 * 1024) req.abort(); });
      res.on('end', function () { cb(res.statusCode === 200 ? null : new Error('HTTP ' + res.statusCode), body); });
    });
    req.setTimeout(options.timeout, function () { req.abort(); });
    req.on('error', cb);
  }

  function tag(xml, name) {
    var m = new RegExp('<(?:\\w+:)?' + name + '>\\s*([^<]*?)\\s*</(?:\\w+:)?' + name + '>', 'i').exec(xml);
    return m ? m[1] : '';
  }

  // The first WANIPConnection / WANPPPConnection service in the device description.
  function parseDescription(xml, location) {
    var services = xml.split(/<service>/i).slice(1);
    for (var i = 0; i < services.length; i++) {
      var type = tag(services[i], 'serviceType');
      var control = tag(services[i], 'controlURL');
      if (SERVICE_RE.test(type) && control) {
        var base = tag(xml, 'URLBase') || location;
        return { serviceType: type, controlUrl: urlLib.resolve(base, control) };
      }
    }
    return null;
  }

  function gateway(cb) {
    if (cached) return process.nextTick(function () { cb(null, cached); });
    discover(function (err, location) {
      if (err) return cb(err);
      get(location, function (err2, xml) {
        if (err2) return cb(err2);
        var service = parseDescription(xml, location);
        if (!service) return cb(new Error('gateway has no WAN connection service'));
        service.location = location;
        cached = service;
        cb(null, service);
      });
    });
  }

  function escapeXml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function soap(service, action, args, cb) {
    var body = '<?xml version="1.0"?>\r\n<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" ' +
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:' + action + ' xmlns:u="' + service.serviceType + '">' +
      Object.keys(args).map(function (k) { return '<' + k + '>' + escapeXml(args[k]) + '</' + k + '>'; }).join('') +
      '</u:' + action + '></s:Body></s:Envelope>';
    var target = urlLib.parse(service.controlUrl);
    var req = http.request({
      hostname: target.hostname, port: target.port || 80, path: target.path, method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'Content-Length': Buffer.byteLength(body),
        SOAPAction: '"' + service.serviceType + '#' + action + '"'
      }
    }, function (res) {
      var text = '';
      res.setEncoding('utf8');
      res.on('data', function (d) { text += d; });
      res.on('end', function () {
        if (res.statusCode !== 200) {
          var code = tag(text, 'errorCode');
          var description = tag(text, 'errorDescription');
          return cb(new Error('UPnP ' + action + ' failed: HTTP ' + res.statusCode + (code ? ' ' + code : '') + (description ? ' ' + description : '')));
        }
        cb(null, text);
      });
    });
    req.setTimeout(options.timeout, function () { req.abort(); });
    req.on('error', cb);
    req.end(body);
  }

  // The TV's IPv4 address on the router's network (same /24 when possible).
  function localAddress(gatewayHost) {
    var nets = os.networkInterfaces();
    var candidates = [];
    Object.keys(nets).forEach(function (name) {
      (nets[name] || []).forEach(function (n) {
        if (n.family === 'IPv4' && !n.internal) candidates.push(n.address);
      });
    });
    var prefix = String(gatewayHost || '').split('.').slice(0, 3).join('.') + '.';
    for (var i = 0; i < candidates.length; i++) if (candidates[i].indexOf(prefix) === 0) return candidates[i];
    return candidates[0] || null;
  }

  function map(port, protocols, leaseSeconds, description, cb) {
    gateway(function (err, service) {
      if (err) return cb(err);
      var client = localAddress(urlLib.parse(service.controlUrl).hostname);
      if (!client) return cb(new Error('no local IPv4 address'));
      var pending = protocols.slice();
      var mapped = [];
      (function next() {
        if (!pending.length) return cb(null, { port: port, protocols: mapped, client: client });
        var protocol = pending.shift();
        soap(service, 'AddPortMapping', {
          NewRemoteHost: '', NewExternalPort: port, NewProtocol: protocol, NewInternalPort: port,
          NewInternalClient: client, NewEnabled: 1, NewPortMappingDescription: description,
          NewLeaseDuration: leaseSeconds
        }, function (err2) {
          if (err2) return cb(err2);
          mapped.push(protocol);
          next();
        });
      })();
    });
  }

  function unmap(port, protocols, cb) {
    gateway(function (err, service) {
      if (err) return cb && cb(err);
      var pending = protocols.slice();
      (function next() {
        if (!pending.length) return cb && cb(null);
        soap(service, 'DeletePortMapping', { NewRemoteHost: '', NewExternalPort: port, NewProtocol: pending.shift() }, function () { next(); });
      })();
    });
  }

  function externalIp(cb) {
    gateway(function (err, service) {
      if (err) return cb(err);
      soap(service, 'GetExternalIPAddress', {}, function (err2, text) {
        if (err2) return cb(err2);
        cb(null, tag(text, 'NewExternalIPAddress'));
      });
    });
  }

  return { configure: configure, gateway: gateway, map: map, unmap: unmap, externalIp: externalIp,
    parseDescription: parseDescription, localAddress: localAddress };
})();
if (typeof module !== 'undefined' && module.exports && typeof PLAYER_SERVICE === 'undefined') module.exports = TV_UPNP;

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
  var FIRST_OPEN_TIMEOUT_MS = 45000;
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
      if (wire.incoming) d.incoming = (d.incoming || 0) + 1;
      if (wire.transport === 'utp') d.utpWires = (d.utpWires || 0) + 1;
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
    engine.on('pex-peer', function () { d.pexPeers = (d.pexPeers || 0) + 1; });
    engine.on('snub', function () { d.snubs = (d.snubs || 0) + 1; });
    engine.on('utp-fallback', function () { d.utpTries = (d.utpTries || 0) + 1; });
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
  // Retries go behind peers never tried: only when the swarm's queue is nearly empty, and a few
  // at a time. A TV trace re-queued 100+ peers at once, which delayed untried peers and made the
  // engine drop choked connections sooner (its drop rule depends on the queue length).
  var PEER_RETRY_QUEUE_MAX = 10;
  var PEER_RETRY_BATCH = 20;
  function retryFailedPeers(engine, now) {
    var known = {};
    engine.peerRetries = known;
    engine.on('peer', function (addr) {
      if (typeof addr === 'string' && !known[addr]) known[addr] = { tries: 0, at: (now || Date.now)() };
    });
    var timer = setInterval(function () {
      var swarm = engine.swarm;
      if (!swarm || !swarm._peers || swarm.wires.length >= PEER_RETRY_BELOW) return;
      if ((swarm.queued || 0) > PEER_RETRY_QUEUE_MAX) return;
      var t = (now || Date.now)();
      var batch = 0;
      Object.keys(known).forEach(function (addr) {
        var entry = known[addr];
        if (batch >= PEER_RETRY_BATCH) return;
        if (swarm._peers[addr] || entry.tries >= PEER_RETRY_WAIT.length) return;
        if (t - entry.at < PEER_RETRY_WAIT[entry.tries]) return;
        entry.tries++;
        entry.at = t;
        batch++;
        if (engine.diag) engine.diag.peerRetries = (engine.diag.peerRetries || 0) + 1;
        engine.connect(addr);
      });
    }, 2500);
    if (timer && timer.unref) timer.unref();
    onEngineDestroy(engine, function () { if (timer) clearInterval(timer); });
  }

  // Runs fn when the engine is destroyed (in addition to its own cleanup).
  function onEngineDestroy(engine, fn) {
    var destroy = engine.destroy;
    engine.destroy = function () {
      try { fn(); } catch (e) { /* cleanup must not block destroy */ }
      return destroy.apply(engine, arguments);
    };
  }

  // ---- Reachability: one shared DHT, a listening port and a UPnP mapping ----
  // Each engine used to start its own DHT from the public bootstrap routers, so every torrent
  // (and the first one after a TV restart) waited for a cold DHT. One DHT now serves all engines
  // for the service's lifetime, seeded with nodes the app saved from the previous run
  // (libtorrent saves its DHT state the same way).
  var DHT_BOOTSTRAP = ['router.bittorrent.com:6881', 'router.utorrent.com:6881', 'dht.transmissionbt.com:6881'];
  var NODE_RE = /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|[a-z0-9.-]+):[0-9]{1,5}$/i;
  var sharedDht = null;
  function dhtFor(nodes) {
    if (sharedDht && !sharedDht.destroyed) return sharedDht;
    var DHT = typeof TorrentEngine !== 'undefined' && TorrentEngine && TorrentEngine.DHT;
    if (typeof DHT !== 'function') return undefined;
    var boot = (Array.isArray(nodes) ? nodes : []).filter(function (n) { return NODE_RE.test(String(n)); }).slice(0, 100);
    try {
      sharedDht = new DHT({ bootstrap: boot.concat(DHT_BOOTSTRAP) });
    } catch (e) {
      return undefined;
    }
    if (sharedDht.setMaxListeners) sharedDht.setMaxListeners(0);
    sharedDht.on('error', noop);
    sharedDht.on('warning', noop);
    sharedDht.listen();
    return sharedDht;
  }
  function dhtNodes() {
    if (!sharedDht || sharedDht.destroyed || typeof sharedDht.toArray !== 'function') return [];
    return sharedDht.toArray().slice(0, 100).map(function (n) { return n.host + ':' + n.port; })
      .filter(function (n) { return NODE_RE.test(n); });
  }

  // The engine announced port 6881 to trackers and the DHT without listening on it, so peers that
  // tried to connect to the TV failed, and peers behind their own NAT were unreachable either way.
  // Listen (TCP, plus uTP for the fallback) and ask the router to forward the port, as libtorrent
  // and WebTorrent do by default. Without UPnP the engine keeps working with outgoing connections.
  var UPNP_LEASE = 3600;
  function openToPeers(engine) {
    var d = engine.diag || {};
    if (typeof engine.listen !== 'function') return;
    try {
      engine.listen(function (err) {
        if (err || !engine.port) { d.listen = 'failed'; return; }
        d.listenPort = engine.port;
        if (typeof TV_UPNP === 'undefined') { d.upnp = 'unavailable'; return; }
        var port = engine.port;
        var protocols = ['TCP', 'UDP'];
        var mapNow = function () {
          TV_UPNP.map(port, protocols, UPNP_LEASE, 'Kai Turbo TV torrent ' + port, function (e) {
            d.upnp = e ? 'failed: ' + String(e.message || e).slice(0, 80) : 'mapped';
          });
        };
        mapNow();
        var renew = setInterval(mapNow, UPNP_LEASE * 500);
        if (renew && renew.unref) renew.unref();
        onEngineDestroy(engine, function () {
          clearInterval(renew);
          TV_UPNP.unmap(port, protocols, noop);
        });
      });
    } catch (e) {
      d.listen = 'failed';
    }
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
    if (slots >= 3 && /\.(mp4|m4v|mov|mkv|webm)$/i.test(file.name)) {
      this.headerPieces.push(this.first);
      if (slots >= 4 && /\.(mp4|m4v|mov)$/i.test(file.name) && this.last !== this.first) this.headerPieces.push(this.last);
    }
    // Three-slot (16 MiB) sessions reserve head + tail during startup only.
    // Tail priority is lower than the playhead and cannot outrank its requests.
    this.startupTail = slots === 3 && this.headerPieces.length === 1 && this.last !== this.first ? this.last : null;
    if (this.startupTail !== null) this.headerPieces.push(this.startupTail);
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
      engine.select(index, index, index === self.startupTail ? 0 : 1, self.headerNotify);
    });
  }

  Session.prototype.finishStartup = function () {
    if (this.startupTail === null) return false;
    var tail = this.startupTail;
    this.engine.deselect(tail, tail, 0, this.headerNotify);
    this.headerPieces.splice(this.headerPieces.indexOf(tail), 1);
    this.startupTail = null;
    var slots = Math.max(1, Math.floor(CACHE_BYTES / this.pieceLength)) - this.headerPieces.length;
    this.behindPieces = Math.min(Math.ceil(BEHIND_BYTES / this.pieceLength), Math.max(0, slots - 2));
    this.aheadPieces = Math.min(Math.ceil(AHEAD_BYTES / this.pieceLength), Math.max(0, slots - this.behindPieces - 1));
    this.stepPieces = Math.max(1, Math.floor(this.aheadPieces / 4));
    return true;
  };

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
    if (this.reader) this.reader.destroy('replaced-range');
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
    this.headerPieces.forEach(function (index) { self.engine.deselect(index, index, index === self.startupTail ? 0 : 1, self.headerNotify); });
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

  Reader.prototype.destroy = function (reason) {
    if (this.destroyed) return;
    if (this.diag) this.diag.closeReason = reason || "session-cleanup";
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
    this.destroy('no-data-timeout');
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
      this.destroy('range-complete');
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
        if (self.diag) self.diag.readError = String(err.message || err).slice(0, 120);
        self.destroy('piece-read-error');
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
    var dht = dhtFor(body.dhtNodes);
    var dhtListeners = dht && dht.listeners ? dht.listeners('peer').slice() : [];
    try {
      engine = TorrentEngine(buildMagnet(infoHash, body.name, body.sources), {
        connections: 55,
        verify: false,
        cache: false, // no .torrent on the TV's small storage
        tmp: tmpDir(),
        storage: makeStorage(CACHE_BYTES),
        dht: dht,
        utpFallback: true
      });
    } catch (e) {
      return cb(e);
    }
    // The shared DHT outlives this engine: remove the peer listener its discovery added.
    if (dht && dht.listeners) {
      var added = dht.listeners('peer').filter(function (l) { return dhtListeners.indexOf(l) < 0; });
      onEngineDestroy(engine, function () {
        added.forEach(function (l) { dht.removeListener('peer', l); });
      });
    }
    attachDiag(engine);
    retryFailedPeers(engine);
    openToPeers(engine);
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
    function touchMetadata(ms) {
      if (done) return;
      clearTimeout(timer);
      timer = setTimeout(metadataDeadline, ms || OPEN_TIMEOUT_MS);
    }
    // A fresh service (after a TV restart) still has to bootstrap DHT and hear from trackers
    // before any peer can send metadata: the first wait is longer (TV trace: the first open after
    // a restart failed, the retry a minute later got metadata in about a second).
    touchMetadata(FIRST_OPEN_TIMEOUT_MS);

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
      reader.destroy('response-close');
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
    dhtFor: dhtFor,
    openToPeers: openToPeers,
    resumed: function (id) {
      var s = sessions[id];
      if (!s) return false;
      var tailReleased = s.finishStartup();
      if (s.resumePending || tailReleased) {
        s.resumePending = false;
        // Re-select the reader's piece so its normal read-ahead window starts now.
        if (s.reader && !s.reader.destroyed) s.ensureWindow(Math.floor((s.file.offset + s.reader.pos) / s.pieceLength), true);
      }
      return true;
    },
    stats: function (id) {
      var s = sessions[id];
      if (!s) return null;
      var requested = s.reader ? Math.floor((s.file.offset + s.reader.pos) / s.pieceLength) : s.first;
      var wanted = [requested];
      s.headerPieces.forEach(function (index) { if (wanted.indexOf(index) < 0) wanted.push(index); });
      return { requestedPiece: requested, wantedPieces: s.engine.pieceStats ? s.engine.pieceStats(wanted) : null,
        length: s.file.length, pieceLength: s.pieceLength, engineReused: s.engineReused,
        headerPieces: s.headerPieces, scheduler: s.engine.streamingStats ? s.engine.streamingStats() : null,
        downloaded: s.engine.swarm.downloaded, peers: s.engine.swarm.wires.length,
        cachedBytes: s.store.bytes, aheadBytes: aheadBytes(s), windowFrom: s.windowFrom, windowTo: s.windowTo,
        wires: wireSummary(s.engine), diag: s.engine.diag || null, resumePending: !!s.resumePending,
        goodPeers: s.engine.goodPeers || [], dhtNodes: dhtNodes(),
        ranges: s.requests || [] };
    },
    supported: supported,
    create: create,
    serve: serve,
    destroyAll: destroyAll
  };
})();

var REMOTE_PAGE = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover\">\n<meta name=\"theme-color\" content=\"#0d0b14\">\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<title>Stremio Kai remote</title>\n<style>\n  :root { --bg: #0d0b14; --card: #1b1826; --key: #262236; --text: #f2f0f8; --muted: #9a94ad; --accent: #7b5bf5; }\n  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }\n  html, body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.4 system-ui, -apple-system, \"Segoe UI\", Roboto, \"Noto Sans Arabic\", sans-serif; }\n  body { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)); }\n  header { width: 100%; max-width: 420px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }\n  .brand { font-size: 20px; } .brand b { color: #9d85ff; }\n  .status { font-size: 13px; color: var(--muted); }\n  .status.ok { color: #8fe3aa; } .status.bad { color: #ff8f8f; }\n  main { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 22px; }\n  button { font: inherit; color: var(--text); background: var(--key); border: 0; border-radius: 18px; cursor: pointer; touch-action: manipulation; user-select: none; -webkit-user-select: none; }\n  button:active { transform: scale(0.96); background: #332d47; }\n  .pad { position: relative; width: min(300px, 78vw); height: min(300px, 78vw); margin: 4px auto 0; border-radius: 50%; background: var(--card); }\n  .pad button { position: absolute; width: 33%; height: 33%; border-radius: 50%; background: transparent; font-size: 30px; color: #d8d2ea; }\n  .pad button:active { background: rgba(255,255,255,0.08); }\n  .pad .up { top: 2%; left: 33.5%; } .pad .down { bottom: 2%; left: 33.5%; }\n  .pad .left { left: 2%; top: 33.5%; } .pad .right { right: 2%; top: 33.5%; }\n  .pad .ok { left: 31%; top: 31%; width: 38%; height: 38%; background: var(--accent); color: #fff; font-size: 20px; font-weight: 700; }\n  .pad .ok:active { background: #6847e8; }\n  .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }\n  .row.two { grid-template-columns: 1fr 1fr; }\n  .row button { height: 58px; font-size: 22px; }\n  .row button small { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }\n  .type { display: flex; gap: 10px; }\n  .type input { flex: 1; min-width: 0; font: inherit; color: var(--text); background: var(--card); border: 2px solid #2d2840; border-radius: 16px; padding: 14px 16px; outline: none; }\n  .type input:focus { border-color: var(--accent); }\n  .type button { padding: 0 20px; background: var(--accent); font-weight: 700; }\n  .hint { color: var(--muted); font-size: 13px; text-align: center; margin: -10px 0 0; }\n  .tabs { width: 100%; max-width: 420px; display: flex; gap: 8px; margin-bottom: 18px; }\n  .tabs button { flex: 1; height: 42px; border-radius: 14px; font-weight: 600; }\n  .tabs button.on { background: var(--accent); }\n  body.locked .tabs { display: none; }\n  body.tab-browse main { display: none; }\n  .browse { width: 100%; max-width: 420px; }\n  .browse[hidden] { display: none; }\n  .browse h2 { font-size: 16px; margin: 6px 0 10px; }\n  .browse .strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }\n  .browse .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }\n  .browse .grid .item { max-width: none; }\n  .browse .item { flex: 0 0 31%; max-width: 31%; min-width: 0; overflow: hidden; scroll-snap-align: start; background: none; padding: 0; border-radius: 12px; text-align: left; color: var(--text); }\n  .browse .item img, .browse .item .ph { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 12px; background: var(--card); display: block; }\n  .browse .item .t { font-size: 12px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .browse .item .s { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .browse .item .bar { height: 3px; background: #2d2840; border-radius: 2px; margin-top: 4px; }\n  .browse .item .bar i { display: block; height: 100%; background: var(--accent); border-radius: 2px; }\n  .browse .empty { color: var(--muted); font-size: 14px; text-align: center; padding: 40px 0; }\n  .now { display: flex; gap: 14px; background: var(--card); border-radius: 18px; padding: 12px; }\n  .now[hidden] { display: none; }\n  .now img { width: 74px; height: 110px; object-fit: cover; border-radius: 10px; background: #2d2840; flex-shrink: 0; }\n  .np-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }\n  .np-title { font-weight: 700; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .np-ep { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 17px; }\n  .np-info input[type=range] { width: 100%; margin: 10px 0 4px; accent-color: var(--accent); }\n  .np-times { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }\n  .np-times button { width: 46px; height: 34px; border-radius: 12px; font-size: 16px; }\n  .type .mic { padding: 0 16px; background: var(--key); font-size: 22px; }\n  .type .mic.on { background: #e5484d; }\n  .pin { display: none; flex-direction: column; gap: 14px; align-items: center; text-align: center; padding-top: 30px; }\n  .pin input { width: 200px; text-align: center; font-size: 34px; letter-spacing: 12px; color: var(--text); background: var(--card); border: 2px solid #2d2840; border-radius: 16px; padding: 12px; outline: none; }\n  .pin button { padding: 14px 40px; background: var(--accent); font-weight: 700; }\n  body.locked main { display: none; } body.locked .pin { display: flex; }\n</style>\n</head>\n<body class=\"locked\">\n<header>\n  <div class=\"brand\">Stremio <b>Kai</b> remote</div>\n  <div class=\"status\" id=\"status\">…</div>\n</header>\n\n<section class=\"pin\">\n  <div>Enter the PIN shown on the TV<br><small style=\"color:var(--muted)\">Settings → Phone remote</small></div>\n  <input id=\"pin\" inputmode=\"numeric\" maxlength=\"4\" autocomplete=\"off\" placeholder=\"····\">\n  <button id=\"pinGo\">Connect</button>\n</section>\n\n<nav class=\"tabs\" id=\"tabs\">\n  <button class=\"on\" data-tab=\"remote\">Remote</button>\n  <button data-tab=\"browse\">Browse</button>\n</nav>\n\n<section class=\"browse\" id=\"browse\" hidden></section>\n\n<main>\n  <section class=\"now\" id=\"now\" hidden>\n    <img id=\"npPoster\" alt=\"\">\n    <div class=\"np-info\">\n      <div class=\"np-title\" id=\"npTitle\"></div>\n      <div class=\"np-ep\" id=\"npEp\"></div>\n      <input type=\"range\" id=\"npSeek\" min=\"0\" max=\"100\" value=\"0\">\n      <div class=\"np-times\"><span id=\"npPos\">0:00</span><button id=\"npPlay\" data-key=\"10252\">⏯</button><span id=\"npDur\">0:00</span></div>\n    </div>\n  </section>\n  <div class=\"pad\">\n    <button class=\"up\" data-key=\"38\" aria-label=\"Up\">▲</button>\n    <button class=\"left\" data-key=\"37\" aria-label=\"Left\">◀</button>\n    <button class=\"ok\" data-key=\"13\">OK</button>\n    <button class=\"right\" data-key=\"39\" aria-label=\"Right\">▶</button>\n    <button class=\"down\" data-key=\"40\" aria-label=\"Down\">▼</button>\n  </div>\n  <div class=\"row\">\n    <button data-key=\"10009\">↩<small>Back</small></button>\n    <button data-key=\"10252\">⏯<small>Play / pause</small></button>\n    <button data-key=\"413\">⏹<small>Stop</small></button>\n  </div>\n  <div class=\"row two\">\n    <button data-key=\"412\">⏪<small>Rewind</small></button>\n    <button data-key=\"417\">⏩<small>Forward</small></button>\n  </div>\n  <div class=\"row\">\n    <button data-vol=\"down\">🔉<small>Volume −</small></button>\n    <button data-vol=\"mute\">🔇<small>Mute</small></button>\n    <button data-vol=\"up\">🔊<small>Volume +</small></button>\n  </div>\n  <div class=\"row two\">\n    <button data-key=\"428\">⏪ Aa<small>Subtitles earlier</small></button>\n    <button data-key=\"427\">Aa ⏩<small>Subtitles later</small></button>\n  </div>\n  <form class=\"type\" id=\"searchForm\">\n    <input id=\"query\" type=\"search\" placeholder=\"Search on the TV…\" autocomplete=\"off\" enterkeyhint=\"search\">\n    <button type=\"button\" id=\"mic\" class=\"mic\" aria-label=\"Voice search\" hidden>🎤</button>\n    <button type=\"submit\">Search</button>\n  </form>\n  <p class=\"hint\" id=\"voiceHint\">Speak your search: tap 🎤 on your phone's keyboard, or the mic button.</p>\n  <form class=\"type\" id=\"typeForm\">\n    <input id=\"text\" placeholder=\"Type on the TV…\" autocomplete=\"off\" enterkeyhint=\"send\">\n    <button type=\"submit\">Send</button>\n  </form>\n  <p class=\"hint\">Typing fills the selected text box on the TV (search, sign-in…).</p>\n</main>\n\n<script>\n(function () {\n  var pin = '';\n  var statusEl = document.getElementById('status');\n  function status(text, cls) { statusEl.textContent = text; statusEl.className = 'status ' + (cls || ''); }\n\n  // The QR code on the TV opens this page with #pin=1234, so scanning connects straight away.\n  var m = location.hash.match(/pin=(\\d{4})/);\n  try { pin = (m && m[1]) || localStorage.getItem('kaiRemotePin') || ''; } catch (e) { pin = (m && m[1]) || ''; }\n  if (m) history.replaceState(null, '', location.pathname);\n\n  function check(p) {\n    return fetch('/api/check?pin=' + encodeURIComponent(p)).then(function (r) { return r.ok; }).catch(function () { return false; });\n  }\n  function unlock(p) {\n    return check(p).then(function (ok) {\n      if (!ok) { status('Wrong PIN', 'bad'); document.body.classList.add('locked'); return false; }\n      pin = p;\n      try { localStorage.setItem('kaiRemotePin', p); } catch (e) {}\n      document.body.classList.remove('locked');\n      status('Connected', 'ok');\n      refreshNow();\n      return true;\n    });\n  }\n  document.getElementById('pinGo').onclick = function () { unlock(document.getElementById('pin').value.trim()); };\n  document.getElementById('pin').onkeydown = function (e) { if (e.key === 'Enter') unlock(this.value.trim()); };\n\n  function post(url, body) {\n    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'pin=' + encodeURIComponent(pin), { method: 'POST', body: body || '' })\n      .then(function (r) {\n        if (r.status === 401) { status('PIN changed: enter it again', 'bad'); document.body.classList.add('locked'); }\n        else status('Connected', 'ok');\n      })\n      .catch(function () { status('TV not reachable', 'bad'); });\n  }\n\n  // Holding an arrow repeats it, like the real remote.\n  Array.prototype.forEach.call(document.querySelectorAll('[data-key]'), function (b) {\n    var code = b.getAttribute('data-key');\n    var repeat = null, delay = null;\n    var arrow = /^3[7-9]$|^40$/.test(code);\n    function stop() { clearTimeout(delay); clearInterval(repeat); delay = repeat = null; }\n    b.addEventListener('pointerdown', function (e) {\n      e.preventDefault();\n      if (navigator.vibrate) navigator.vibrate(10);\n      post('/api/key?code=' + code);\n      if (arrow) delay = setTimeout(function () { repeat = setInterval(function () { post('/api/key?code=' + code); }, 140); }, 400);\n    });\n    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });\n  });\n\n  document.getElementById('typeForm').onsubmit = function (e) {\n    e.preventDefault();\n    var input = document.getElementById('text');\n    if (!input.value) return;\n    post('/api/text?submit=1', input.value).then(function () { input.value = ''; });\n  };\n\n  // ---- Browse: Continue watching, New episodes and Library from the TV; tap to open on the TV ----\n  var browseEl = document.getElementById('browse');\n  Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) {\n    b.onclick = function () {\n      var browse = b.getAttribute('data-tab') === 'browse';\n      document.body.classList.toggle('tab-browse', browse);\n      browseEl.hidden = !browse;\n      Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x === b); });\n      if (browse) loadBrowse();\n    };\n  });\n  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }\n  function item(it) {\n    var b = el('button', 'item');\n    if (it.poster) { var im = el('img'); im.loading = 'lazy'; im.alt = ''; im.src = it.poster; b.appendChild(im); } else b.appendChild(el('div', 'ph'));\n    b.appendChild(el('div', 't', it.name));\n    if (it.sub) b.appendChild(el('div', 's', it.sub));\n    if (it.progress) { var bar = el('div', 'bar'), fill = el('i'); fill.style.width = Math.round(it.progress * 100) + '%'; bar.appendChild(fill); b.appendChild(bar); }\n    b.onclick = function () {\n      if (navigator.vibrate) navigator.vibrate(15);\n      post('/api/open?type=' + encodeURIComponent(it.type) + '&id=' + encodeURIComponent(it.id) + (it.video ? '&video=' + encodeURIComponent(it.video) : ''))\n        .then(function () { status('Opening on the TV…', 'ok'); });\n    };\n    return b;\n  }\n  function loadBrowse() {\n    fetch('/api/browse?pin=' + encodeURIComponent(pin)).then(function (r) { return r.json(); }).then(function (d) {\n      browseEl.innerHTML = '';\n      var labels = d.labels || {};\n      var any = false;\n      [['continueWatching', 'strip'], ['newEpisodes', 'strip'], ['library', 'grid']].forEach(function (sec) {\n        var list = d[sec[0]] || [];\n        if (!list.length) return;\n        any = true;\n        browseEl.appendChild(el('h2', '', labels[sec[0]] || sec[0]));\n        var box = el('div', sec[1]);\n        list.forEach(function (it) { box.appendChild(item(it)); });\n        browseEl.appendChild(box);\n      });\n      if (!any) browseEl.appendChild(el('div', 'empty', 'Nothing yet: open the app on the TV and sign in to your Stremio account.'));\n    }).catch(function () { status('TV not reachable', 'bad'); });\n  }\n\n  // Volume: the TV's own volume, through the TV.\n  Array.prototype.forEach.call(document.querySelectorAll('[data-vol]'), function (b) {\n    b.addEventListener('click', function () {\n      if (navigator.vibrate) navigator.vibrate(10);\n      fetch('/api/volume?dir=' + b.getAttribute('data-vol') + '&pin=' + encodeURIComponent(pin), { method: 'POST' })\n        .then(function (r) { return r.json(); })\n        .then(function (r) { if (r.ok) status('Connected', 'ok'); else status(/allow/.test(r.error || '') ? 'Allow the remote on the TV' : 'Volume not available', 'bad'); })\n        .catch(function () { status('TV not reachable', 'bad'); });\n    });\n  });\n\n  // Now playing: poster, title and a progress bar you can drag to jump.\n  var nowEl = document.getElementById('now'), seek = document.getElementById('npSeek'), dragging = false, lastPoster = '';\n  function fmt(sec) {\n    sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;\n    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;\n  }\n  function refreshNow() {\n    if (!pin || document.body.classList.contains('locked') || document.hidden) return;\n    fetch('/api/state?pin=' + encodeURIComponent(pin)).then(function (r) { return r.json(); }).then(function (r) {\n      var p = r.playing;\n      nowEl.hidden = !p;\n      if (!p) return;\n      document.getElementById('npTitle').textContent = p.title;\n      document.getElementById('npEp').textContent = p.episode || '';\n      if (p.poster && p.poster !== lastPoster) { document.getElementById('npPoster').src = lastPoster = p.poster; }\n      document.getElementById('npDur').textContent = fmt(p.duration);\n      document.getElementById('npPlay').textContent = p.paused ? '▶' : '⏸';\n      if (!dragging && p.duration) {\n        // The TV reports every few seconds; move the bar along in between.\n        var pos = p.paused ? p.position : p.position + (Date.now() - r.at) / 1000;\n        seek.max = p.duration; seek.value = Math.min(pos, p.duration);\n        document.getElementById('npPos').textContent = fmt(pos);\n      }\n    }).catch(function () {});\n  }\n  seek.addEventListener('input', function () { dragging = true; document.getElementById('npPos').textContent = fmt(seek.value); });\n  seek.addEventListener('change', function () {\n    dragging = false;\n    post('/api/seek?to=' + Math.floor(seek.value));\n  });\n  setInterval(refreshNow, 2000);\n\n  // Search on the TV from anywhere in the app (typed, keyboard dictation, or the mic button).\n  var query = document.getElementById('query');\n  function search(q) {\n    q = (q || '').trim();\n    if (q.length < 2) return;\n    post('/api/search', q).then(function () { query.value = ''; status('Searching on the TV…', 'ok'); });\n  }\n  document.getElementById('searchForm').onsubmit = function (e) { e.preventDefault(); search(query.value); };\n\n  // The browser's speech recognition only runs on secure (https) pages; on the TV's local\n  // address the keyboard's own dictation button does the same job, so the hint stays.\n  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;\n  if (!(Rec && window.isSecureContext)) document.getElementById('voiceHint').textContent = \"Speak your search: tap 🎤 on your phone's keyboard, then Search.\";\n  if (Rec && window.isSecureContext) {\n    var mic = document.getElementById('mic');\n    mic.hidden = false;\n    mic.onclick = function () {\n      var r = new Rec();\n      r.lang = navigator.language || 'en-US';\n      r.interimResults = false;\n      mic.classList.add('on');\n      r.onresult = function (e) { var q = e.results[0][0].transcript; query.value = q; search(q); };\n      r.onend = function () { mic.classList.remove('on'); };\n      r.onerror = function () { mic.classList.remove('on'); status('Mic not available: use the keyboard 🎤', 'bad'); };\n      r.start();\n    };\n  }\n\n  if (pin) unlock(pin); else status('Locked');\n})();\n</script>\n</body>\n</html>\n";
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
  if (url.pathname.indexOf('/torrent-resumed/') === 0) {
    if (!isLocal(req)) return send(res, 403, { error: 'local only' });
    if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
    var resumedId = url.pathname.slice('/torrent-resumed/'.length);
    if (!/^[a-f0-9]{16}$/.test(resumedId) || typeof TV_TORRENT === 'undefined' || !TV_TORRENT.resumed) return send(res, 404, { error: 'not available' });
    return send(res, TV_TORRENT.resumed(resumedId) ? 200 : 404, { ok: 1 });
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
