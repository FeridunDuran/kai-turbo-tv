import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url),bencode=require('bencode'),parseTorrent=require('parse-torrent');
const source=fs.readFileSync(new URL('../../service/vendor/torrent-stream/index.cjs',import.meta.url),'utf8');
const block=source.slice(source.indexOf('var buf =',source.indexOf('var exchange = exchangeMetadata')),source.indexOf('    if (opts.cache === false) return',source.indexOf('var exchange = exchangeMetadata')));
const initialize=new Function('metadata','Buffer','parseTorrent','ontorrent',block);
test('verified multifile metadata preserves the info hash and produces an Array of files without bncode roundtrip',()=>{
 const metadata=bencode.encode({name:Buffer.from('Season 1'),files:[{length:4,path:[Buffer.from('S01E01.mp4')]},{length:4,path:[Buffer.from('S01E02.mp4')]}],'piece length':4,pieces:Buffer.alloc(40)});
 let torrent;initialize(metadata,Buffer,parseTorrent,value=>{torrent=value;});
 assert.equal(torrent.infoHash,crypto.createHash('sha1').update(metadata).digest('hex'));
 assert.ok(Array.isArray(torrent.info.files));assert.equal(torrent.files.length,2);
 assert.equal(torrent.files[0].name,'S01E01.mp4');assert.equal(torrent.files[1].offset,4);
 assert.deepEqual(torrent.infoBuffer,metadata);
});
