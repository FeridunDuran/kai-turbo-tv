// Servidor estático do dist/ para testar no navegador do PC (simula a TV em 1920x1080).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };

// Addon de teste (só para desenvolvimento): http://localhost:5173/test-addon/manifest.json
const TEST_VIDEO = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4';
const TEST_LONG = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'; // ~10 min (HLS)
function testAddon(p, req, res) {
  const json = (o) => {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(o));
  };
  if (p === '/test-addon/manifest.json') {
    return json({ id: 'kai.test', version: '1.0.0', name: 'Teste Kai', description: 'Fontes de teste', resources: ['stream', 'subtitles'], types: ['movie', 'series'], catalogs: [], idPrefixes: ['tt'] });
  }
  if (p.startsWith('/test-addon/stream/')) {
    return json({
      streams: [
        { name: 'Teste\nMP4 720p', title: 'Big Buck Bunny (10s)\nH.264 · AAC', url: TEST_VIDEO, behaviorHints: { bingeGroup: 'kai-test' } },
        { name: 'Teste\nHLS longo', title: 'Big Buck Bunny (10 min)\nHLS', url: TEST_LONG, behaviorHints: { bingeGroup: 'kai-test-long' } },
        // Request headers: without the PC server it must show as "Direct · may fail" and still play.
        { name: 'Teste\nHeaders', title: 'proxyHeaders.request (Referer)', url: TEST_VIDEO, behaviorHints: { proxyHeaders: { request: { Referer: 'https://example.com/' } } } },
        // This URL really checks Referer (403 without it), then redirects to the sample video.
        { name: 'Teste\nHeaders reais', title: 'proxyHeaders.request obrigatório', url: 'http://localhost:' + port + '/test-addon/needs-referer.mp4', behaviorHints: { proxyHeaders: { request: { Referer: 'https://example.com/' } } } },
        // Response headers only: must show as "Direct".
        { name: 'Teste\nResponse', title: 'proxyHeaders.response', url: TEST_VIDEO, behaviorHints: { proxyHeaders: { response: { 'Content-Type': 'video/mp4' } } } },
        // Torrent: without the PC server it must be hidden (count line only).
        { name: 'Teste\nTorrent', title: 'infoHash', infoHash: '0000000000000000000000000000000000000000' },
      ],
    });
  }
  if (p.startsWith('/test-addon/subtitles/')) {
    return json({ subtitles: [{ id: 'teste-pt', lang: 'pob', url: 'http://localhost:' + port + '/test-addon/teste.srt' }] });
  }
  if (p === '/test-addon/needs-referer.mp4') {
    // Direct playback sends the app's own Referer and gets 403; the TV header proxy sends
    // https://example.com/ and is redirected to the sample video.
    if (req.headers.referer !== 'https://example.com/') {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('referer required');
    }
    res.writeHead(302, { Location: TEST_VIDEO });
    return res.end();
  }
  if (p === '/test-addon/teste.srt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end('1\n00:00:01,000 --> 00:00:04,000\nLegenda de teste <i>em itálico</i>\n\n2\n00:00:05,000 --> 00:00:09,000\nSegunda linha\nquebrada em duas\n');
  }
  res.writeHead(404);
  res.end();
}

http
  .createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p.startsWith('/test-addon/')) return testAddon(p, req, res);
    const file = path.join(dist, p === '/' ? 'index.html' : p);
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`[serve] http://localhost:${port}`));
