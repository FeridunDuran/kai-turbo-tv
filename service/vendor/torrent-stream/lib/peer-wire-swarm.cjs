// Vendored from peer-wire-swarm 0.12.x (MIT, Mathias Buus) for the Kai Turbo TV player service.
// Changes, all marked "Kai:":
// - incoming TCP connections record the remote peer address (upstream recorded the local one);
// - optional uTP fallback: a peer that refused or reset the TCP connection is tried once over uTP,
//   and incoming uTP connections are accepted when the fallback is enabled;
// - wires carry `incoming` and `transport` for diagnostics.
var utp = require('utp');
var net = require('net');
var fifo = require('fifo');
var once = require('once');
var speedometer = require('speedometer');
var peerWireProtocol = require('peer-wire-protocol');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var HANDSHAKE_TIMEOUT = 25000;
var CONNECTION_TIMEOUT = 3000;
var RECONNECT_WAIT = [1000, 5000, 15000];
var DEFAULT_SIZE = 100;

var toBuffer = function(str, encoding) {
	return Buffer.isBuffer(str) ? str : new Buffer(str, encoding);
};

var toAddress = function(wire) {
	if (typeof wire === 'string') return wire;
	return wire.peerAddress;
};

var onwire = function(swarm, connection, onhandshake, isServer) {
	var wire = peerWireProtocol(swarm._pwp);

	var destroy = function(phase) {
        if (swarm.kaiNetwork) {
            if (phase === 'connect') swarm.kaiNetwork.connectTimeouts++;
            else swarm.kaiNetwork.handshakeTimeouts++;
        }
        connection.destroy();
		connection.emit('timeout');
	};

	var connectTimeout = !isServer && setTimeout(function() { destroy('connect'); }, swarm.connectTimeout);
	var handshakeTimeout = setTimeout(function() { destroy('handshake'); }, swarm.handshakeTimeout);

	if (handshakeTimeout.unref) handshakeTimeout.unref();
	if (connectTimeout.unref) connectTimeout.unref();

	connection.on('connect', function() {
		clearTimeout(connectTimeout);
	});

	wire.once('handshake', function(infoHash, peerId) {
		clearTimeout(handshakeTimeout);
		onhandshake(infoHash, peerId);
	});

	connection.on('end', function() {
		connection.destroy();
	});

	connection.on('error', function() {
		connection.destroy();
	});

	connection.on('close', function() {
		clearTimeout(connectTimeout);
		clearTimeout(handshakeTimeout);
		wire.destroy();
	});

	connection.pipe(wire).pipe(connection);
	return wire;
};

var pools = {};

var leave = function(port, swarm) {
	if (!pools[port]) return;
	delete pools[port].swarms[swarm.infoHash.toString('hex')];

	if (Object.keys(pools[port].swarms).length) return;
	pools[port].servers.forEach(function(server) {
		// Kai: the uTP server has no close(); close its UDP socket instead (a TypeError here used
		// to crash the service whenever a torrent with a uTP listener was closed).
		try {
			if (typeof server.close === 'function') server.close();
			else if (server._socket) server._socket.close();
		} catch (err) { /* already closed */ }
	});
	delete pools[port];
};

var join = function(port, swarm) {
	var pool = pools[port];

	if (!pool) {
		var swarms = {};
		var servers = [];

		var onconnection = function(connection) {
			var wire = onwire(swarm, connection, function(infoHash, peerId) {
				var swarm = swarms[infoHash.toString('hex')];
				if (!swarm) return connection.destroy();
				swarm._onincoming(connection, wire);
			}, true);
		}

		servers.push(net.createServer(onconnection));
		// Kai: accept incoming uTP when either mode is enabled.
		if (swarm.utp || swarm.utpFallback) servers.push(utp.createServer(onconnection));

		// Kai: a server that cannot listen (UDP port unavailable for uTP, TCP port taken) used to
		// throw an unhandled 'error' and stop the whole service. It is now skipped: TCP-only
		// listening still works without the uTP server.
		var loop = function(i) {
			if (i < servers.length) {
				var next = once(loop.bind(null, i+1));
				var server = servers[i];
				server.on('error', function() {
					servers.splice(servers.indexOf(server), 1);
					next();
				});
				server.listen(port, next);
				if (server._socket) server._socket.on('error', function(err) { server.emit('error', err); });
				return;
			}
			pool.listening = true;
			Object.keys(swarms).forEach(function(infoHash) {
				swarms[infoHash].emit('listening');
			});
		}

		loop(0)

		pool = pools[port] = {
			servers: servers,
			swarms: swarms,
			listening: false
		};
	}

	var infoHash = swarm.infoHash.toString('hex');

	if (pool.listening) {
		process.nextTick(function() {
			swarm.emit('listening');
		});
	}
	if (pool.swarms[infoHash]) {
		process.nextTick(function() {
			swarm.emit('error', new Error('port and info hash already in use'));
		});
		return;
	}

	pool.swarms[infoHash] = swarm;
};

var Swarm = function(infoHash, peerId, options) {
	if (!(this instanceof Swarm)) return new Swarm(infoHash, peerId, options);
	EventEmitter.call(this);

	options = options || {};
	this.handshake = options.handshake;

	this.port = 0;
	this.size = options.size || DEFAULT_SIZE;
	this.utp = options.utp || false;
	// Kai: try uTP once for a peer whose TCP connection never opened.
	this.utpFallback = options.utpFallback || false;
	this.handshakeTimeout = options.handshakeTimeout || HANDSHAKE_TIMEOUT;
	this.connectTimeout = options.connectTimeout || CONNECTION_TIMEOUT;
	
	this.infoHash = toBuffer(infoHash, 'hex');
	this.peerId = toBuffer(peerId, 'utf-8');

	this.downloaded = 0;
	this.uploaded = 0;
	this.kaiNetwork = { candidates: 0, accepted: 0, duplicates: 0, invalid: 0, attempts: 0,
        tcpAttempts: 0, utpAttempts: 0, outgoingConnected: 0, handshakes: 0, connectTimeouts: 0,
        handshakeTimeouts: 0, refused: 0, resets: 0, dns: 0, otherErrors: 0, closedBeforeHandshake: 0 };
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
	this._pwp = {speed:options.speed};
};

util.inherits(Swarm, EventEmitter);

Swarm.prototype.__defineGetter__('queued', function() {
	return this._queues.reduce(function(prev, queue) {
		return prev + queue.length;
	}, 0);
});

Swarm.prototype.pause = function() {
	this.paused = true;
};

Swarm.prototype.resume = function() {
	this.paused = false;
	this._drain();
};

Swarm.prototype.priority = function(addr, level) {
	addr = toAddress(addr);
	var peer = this._peers[addr];

	if (!peer) return 0;
	if (typeof level !== 'number' || peer.priority === level) return level;

	if (!this._queues[level]) this._queues[level] = fifo();

	if (peer.node) {
		this._queues[peer.priority].remove(peer.node);
		peer.node = this._queues[level].push(addr);
	}

	return peer.priority = level;
};

Swarm.prototype.add = function(addr) {
	this.kaiNetwork.candidates++;
    if (this._destroyed) return false;
    if (this._peers[addr]) { this.kaiNetwork.duplicates++; return false; }

    var port = Number(addr.split(':')[1]);
	if (!(port > 0 && port < 65535)) { this.kaiNetwork.invalid++; return false; }

	this._peers[addr] = {
		node: this._queues[0].push(addr),
		wire: null,
		timeout: null,
		reconnect: false,
		priority: 0,
		retries: 0,
		noUtp: false,
	};

	this.kaiNetwork.accepted++;
	this._drain();
	return true;
};

Swarm.prototype.remove = function(addr) {
	this._remove(toAddress(addr));
	this._drain();
};

Swarm.prototype.listen = function(port, onlistening) {
	if (onlistening) this.once('listening', onlistening);
	this.port = port;
	join(this.port, this);
};

Swarm.prototype.destroy = function() {
	this._destroyed = true;

	var self = this;
	Object.keys(this._peers).forEach(function(addr) {
		self._remove(addr);
	});

	this.wires.forEach(function (wire) {
		wire.destroy();
	});

	leave(this.port, this);
	process.nextTick(function() {
		self.emit('close');
	});
};

Swarm.prototype._remove = function(addr) {
	var peer = this._peers[addr];
	if (!peer) return;
	delete this._peers[addr];
	if (peer.node) this._queues[peer.priority].remove(peer.node);
	if (peer.timeout) clearTimeout(peer.timeout);
	if (peer.wire) peer.wire.destroy();
};

Swarm.prototype._drain = function() {
	if (this.connections.length >= this.size || this.paused) return;

	var self = this;
	var addr = this._shift();
	if (!addr) return;

	var peer = this._peers[addr];
	if (!peer) return;

	var repush = function() {
		peer.node = self._queues[peer.priority].push(addr);
		self._drain();
	};

	var parts = addr.split(':');
	var connection;

	var viaUtp = (this.utp && !peer.noUtp) || peer.useUtp;
    this.kaiNetwork.attempts++;
    if (viaUtp) this.kaiNetwork.utpAttempts++; else this.kaiNetwork.tcpAttempts++;
	if (peer.useUtp) {
		// Kai: one uTP attempt after TCP failed; no further fallback after it.
		peer.useUtp = false;
		connection = utp.connect(parts[1], parts[0]);
	} else if(this.utp && !peer.noUtp) {
		connection = utp.connect(parts[1], parts[0]);
		connection.on('timeout', function() {
			// Unable to connect to peer with uTP
			// Assume it doesn't support it.
			peer.noUtp = true;
			repush();
		});
	} else {
		connection = net.connect(parts[1], parts[0]);
	}

	if (peer.timeout) clearTimeout(peer.timeout);

	peer.node = null;
	peer.timeout = null;

	// Kai: remember whether the transport ever opened, to decide on the uTP fallback.
	// Only a definite TCP refusal/reset is retried over uTP: the host answered, so a uTP-only
	// peer is plausible. Timeouts (unreachable hosts) are not, which keeps connection slots free.
	var opened = false;
	var tcpRefused = false;
	var tcpTimedOut = false;
	connection.on("timeout", function() { tcpTimedOut = true; });
	connection.once('connect', function() { opened = true; self.kaiNetwork.outgoingConnected++; });
	var errorCounted = false;
    connection.on('error', function(err) {
        if (!errorCounted) {
            errorCounted = true;
            var code = err && err.code;
            var key = code === 'ECONNREFUSED' ? 'refused' : code === 'ECONNRESET' ? 'resets'
                : code === 'ENOTFOUND' || code === 'EAI_AGAIN' ? 'dns' : 'otherErrors';
            self.kaiNetwork[key]++;
        }
        if (err && (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET')) tcpRefused = true;
	});

	var wire = onwire(this, connection, function(infoHash) {
		if (infoHash.toString('hex') !== self.infoHash.toString('hex')) return connection.destroy();
		peer.reconnect = true;
		peer.retries = 0;
		wire.transport = viaUtp ? 'utp' : 'tcp';
        wire.kaiSource = peer.kaiSource || 'external';
		wire.incoming = false;
		self._onwire(connection, wire);
	});

	// Kai: upstream reacted only to the wire's readable 'end', which a closed or failed connection
	// never emits (Wire.destroy emits 'close'). Failed attempts therefore stayed registered forever
	// (never retried, never forgotten) and dropped peers never reconnected. Handle both, once.
	var ended = false;
	var onend = function() {
		if (ended) return;
		ended = true;
        if (self.kaiNetwork && !wire.kaiHandshake) self.kaiNetwork.closedBeforeHandshake++;
		if (peer.wire === wire) peer.wire = null;
		if (self._peers[addr] !== peer) return;
		var timeoutProbe = tcpTimedOut && (!self._lastUtpProbe || Date.now() - self._lastUtpProbe >= 15000);
		if (!opened && (tcpRefused || timeoutProbe) && !viaUtp && self.utpFallback && !peer.triedUtp && !self._destroyed) {
            if (timeoutProbe) self._lastUtpProbe = Date.now();
			peer.triedUtp = true;
			peer.useUtp = true;
			self.emit('utp-fallback', addr, timeoutProbe ? 'timeout' : 'refused');
			return repush();
		}
		if (!peer.reconnect || self._destroyed || peer.retries >= RECONNECT_WAIT.length) return self._remove(addr);
		peer.timeout = setTimeout(repush, RECONNECT_WAIT[peer.retries++]);
	};
	wire.on('end', onend);
	connection.once('close', onend);

	peer.wire = wire;
	self._onconnection(connection);

	wire.peerAddress = addr;
	wire.handshake(this.infoHash, this.peerId, this.handshake);
};

Swarm.prototype._shift = function() {
	for (var i = this._queues.length-1; i >= 0; i--) {
		if (this._queues[i] && this._queues[i].length) return this._queues[i].shift();
	}
	return null;
};

Swarm.prototype._onincoming = function(connection, wire) {
	// Kai: net.Socket.address() is the local end; the peer is remoteAddress/remotePort. The uTP
	// connection object's address() already returns the remote end.
	var remote = connection.remoteAddress ? { address: connection.remoteAddress, port: connection.remotePort } : connection.address();
	wire.peerAddress = String(remote.address).replace(/^::ffff:/, '') + ':' + remote.port;
	wire.incoming = true;
	wire.transport = connection.remoteAddress ? 'tcp' : 'utp';
	wire.handshake(this.infoHash, this.peerId, this.handshake);

	this._onconnection(connection);
	this._onwire(connection, wire);
};

Swarm.prototype._onconnection = function(connection) {
	var self = this;

	connection.once('close', function() {
		self.connections.splice(self.connections.indexOf(connection), 1);
		self._drain();
	});

	this.connections.push(connection);
};

Swarm.prototype._onwire = function(connection, wire) {
	var self = this;
    wire.kaiHandshake = true;
    this.kaiNetwork.handshakes++;

	wire.on('download', function(downloaded) {
		self.downloaded += downloaded;
		self.downloadSpeed(downloaded);
		self.emit('download', downloaded);
	});

	wire.on('upload', function(uploaded) {
		self.uploaded += uploaded;
		self.uploadSpeed(uploaded);
		self.emit('upload', uploaded);
	});

	var cleanup = once(function() {
		self.emit('wire-disconnect', wire, connection);
		self.wires.splice(self.wires.indexOf(wire), 1);
		connection.destroy();
	});

	connection.on('close', cleanup);
	connection.on('error', cleanup);
	connection.on('end', cleanup);
	wire.on('end', cleanup);
	wire.on('close', cleanup);
	wire.on('finish', cleanup);

	this.wires.push(wire);
	this.emit('wire', wire, connection);
};

module.exports = Swarm;
