import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function client(outcome = 'success') {
  const posts = [];
  const context = { Promise, Date, encodeURIComponent, log: { info() {} },
    XMLHttpRequest: class {
      open(method, url) { this.method = method; this.url = url; this.headers = {}; }
      setRequestHeader(key, value) { this.headers[key.toLowerCase()] = value; }
      send(body) {
        queueMicrotask(() => {
          if (this.method === 'GET') {
            this.status = 200;
            this.responseText = JSON.stringify({ proxy: 1, torrent: this.url.includes(':8097/') ? 1 : 0 });
            this.onload(); return;
          }
          posts.push({ url: this.url, headers: this.headers, timeout: this.timeout, args: JSON.parse(body) });
          if (outcome === 'timeout') return this.ontimeout();
          if (outcome === 'network') return this.onerror();
          this.status = 200;
          this.responseText = JSON.stringify({ url: 'http://127.0.0.1:8097/torrent/fixture', viaServer: false });
          this.onload();
        });
      }
    },
  };
  const source = fs.readFileSync(new URL('../../src/js/api/tvproxy.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function ');
  vm.runInNewContext(source, context);
  return { api: context, posts };
}

test('ready TV service opens a torrent with a CORS-safelisted JSON body', async () => {
  const { api, posts } = client();
  assert.equal((await api.check()).torrent, true);
  const result = await api.openTorrent({ infoHash: 'a'.repeat(40), fileIdx: 2 });
  assert.match(posts[0].headers['content-type'], /^text\/plain(?:;|$)/);
  assert.equal(posts[0].args.infoHash, 'a'.repeat(40));
  assert.equal(posts[0].args.fileIdx, 2);
  assert.equal(posts[0].timeout, 25000);
  assert.equal(new URL(posts[0].url).port, '8097');
  assert.match(result.url, /\/torrent\//);
});

test('actual disconnects and timeouts clear stale torrent readiness without retrying the open', async () => {
  for (const outcome of ['network', 'timeout']) {
    const { api, posts } = client(outcome);
    await api.check();
    assert.equal(api.isTorrentAvailable(), true);
    await assert.rejects(api.openTorrent({ infoHash: 'a'.repeat(40) }), outcome === 'timeout' ? /25 seconds/ : /unreachable/);
    assert.equal(api.isTorrentAvailable(), false);
    assert.equal(posts.length, 1);
  }
});
