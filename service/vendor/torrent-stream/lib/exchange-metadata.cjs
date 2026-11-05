var bncode = require('bncode')
var crypto = require('crypto')

var METADATA_BLOCK_SIZE = 1 << 14
var METADATA_MAX_SIZE = 1 << 22
var EXTENSIONS = {
  m: {
    ut_metadata: 1,
    // Kai: BEP 11 peer exchange (receive only), as in WebTorrent's ut_pex.
    ut_pex: 2
  }
}

var sha1 = function (data) {
  return crypto.createHash('sha1').update(data).digest('hex')
}

module.exports = function (engine, callback) {
  var sharedBySize = {}
  function accept(metadata) {
    engine.metadata = metadata
    engine.emit('metadata-accepted', metadata.length)
    try {
      callback(metadata)
    } catch (err) {
      engine.emit('error', new Error('Torrent metadata verified, but file initialization failed: ' + (err.message || err)))
    }
  }

  return function (wire) {
    var metadataPieces = []
    var retries = 0
    var metadata = engine.metadata
    // Kai: PEX messages arrive with our ut_pex id. "added" is compact IPv4 (6 bytes per peer).
    wire.on('extended', function (id, ext) {
      if (id !== EXTENSIONS.m.ut_pex) return
      var added = module.exports.pexPeers(ext)
      for (var i = 0; i < added.length; i++) {
        engine.emit('pex-peer', added[i])
        engine.connect(added[i], 'pex')
      }
    })
    wire.once('extended', function (id, handshake) {
      try {
        handshake = bncode.decode(handshake)
      } catch (err) {
        return
      }

      // BEP 10: the peer's limit on queued requests, used by the stream request pipeline.
      if (!id && typeof handshake.reqq === 'number' && handshake.reqq > 0) wire.peerReqq = handshake.reqq
      if (id || !handshake.m || handshake.m.ut_metadata === undefined) return

      var channel = handshake.m.ut_metadata
      var size = handshake.metadata_size
      engine.emit('metadata-peer', size)

      wire.on('extended', function (id, ext) {
        if (id !== EXTENSIONS.m.ut_metadata) return

        var metadata = engine.metadata
        var delimiter, message, piece
        try {
          delimiter = ext.toString('ascii').indexOf('ee')
          message = bncode.decode(ext.slice(0, delimiter === -1 ? ext.length : delimiter + 2))
          piece = message.piece
        } catch (err) {
          return
        }

        if (piece < 0) return
        if (message.msg_type === 2) return

        if (message.msg_type === 0) {
          if (!metadata) return wire.extended(channel, {msg_type: 2, piece: piece})
          var offset = piece * METADATA_BLOCK_SIZE
          var buf = metadata.slice(offset, offset + METADATA_BLOCK_SIZE)
          wire.extended(channel, Buffer.concat([bncode.encode({msg_type: 1, piece: piece}), buf]))
          return
        }

        if (message.msg_type === 1 && !metadata) {
          if (!(size > 0 && size <= METADATA_MAX_SIZE) || piece >= Math.ceil(size / METADATA_BLOCK_SIZE)) return
          var payload = ext.slice(delimiter + 2)
          if (payload.length !== Math.min(METADATA_BLOCK_SIZE, size - piece * METADATA_BLOCK_SIZE)) return
          metadataPieces[piece] = payload
          engine.emit('metadata-piece', piece, size)
          // Complementary blocks can arrive from different peers. Only combine
          // equal-sized metadata, and accept it only after checking the info hash.
          // Keep each peer's own copy so one bad peer cannot poison its recovery.
          var shared = sharedBySize[size]
          if (!shared) {
            shared = []
            if (Object.keys(sharedBySize).length < 2) sharedBySize[size] = shared
          }
          shared[piece] = payload
          var complete = true
          for (var block = 0; block * METADATA_BLOCK_SIZE < size; block++) {
            if (!shared[block]) { complete = false; break }
          }
          if (complete) {
            var combined = Buffer.concat(shared)
            if (engine.infoHash === sha1(combined)) {
              accept(combined)
              return
            }
          }
          for (var i = 0; i * METADATA_BLOCK_SIZE < size; i++) {
            if (!metadataPieces[i]) return
          }

          metadata = Buffer.concat(metadataPieces)

          if (engine.infoHash !== sha1(metadata)) {
            metadataPieces = []
            metadata = null
            engine.emit('metadata-invalid')
            if (retries++ < 1) {
              for (var retryPiece = 0; retryPiece * METADATA_BLOCK_SIZE < size; retryPiece++) {
                wire.extended(channel, {msg_type: 0, piece: retryPiece})
              }
            }
            return
          }

          accept(metadata)
        }
      })

      if (size > METADATA_MAX_SIZE) return
      if (!size || metadata) return

      for (var i = 0; i * METADATA_BLOCK_SIZE < size; i++) {
        if (metadataPieces[i]) continue
        wire.extended(channel, {msg_type: 0, piece: i})
      }
    })

    if (!wire.peerExtensions.extended) return
    wire.extended(0, metadata ? {m: {ut_metadata: 1, ut_pex: 2}, metadata_size: metadata.length} : {m: {ut_metadata: 1, ut_pex: 2}})
  }
}

// Peers from a ut_pex message: compact "added" IPv4 entries, at most 50 per message.
module.exports.pexPeers = function (ext) {
  var message
  try {
    message = bncode.decode(ext)
  } catch (err) {
    return []
  }
  var added = message && message.added
  if (!added || !Buffer.isBuffer(added)) return []
  var out = []
  for (var i = 0; i + 6 <= added.length && out.length < 50; i += 6) {
    var port = added.readUInt16BE(i + 4)
    if (!port) continue
    out.push(added[i] + '.' + added[i + 1] + '.' + added[i + 2] + '.' + added[i + 3] + ':' + port)
  }
  return out
}
