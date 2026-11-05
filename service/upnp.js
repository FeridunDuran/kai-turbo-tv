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
