// Protocolo de addons do Stremio: catálogos, metadados, streams e legendas via HTTP/JSON.
import { cachedJSON, getJSON } from '../lib/http.js';
import * as stremio from './stremio.js';
import * as store from '../lib/store.js';
import { log } from '../lib/log.js';
import { t } from '../lib/i18n.js';

export const CINEMETA = 'https://v3-cinemeta.strem.io/manifest.json';
export const OPENSUBTITLES = 'https://opensubtitles-v3.strem.io/manifest.json';

let addons = null; // [{ transportUrl, manifest, base }]

function normalize(list) {
  return (list || [])
    .filter((a) => a && a.transportUrl && a.manifest)
    .filter((a) => /^https?:/.test(a.transportUrl))
    .map((a) => ({
      transportUrl: a.transportUrl,
      manifest: a.manifest,
      base: a.transportUrl.replace(/\/manifest\.json(\?.*)?$/, ''),
      query: (a.transportUrl.match(/\/manifest\.json(\?.*)$/) || [])[1] || '',
    }));
}

function defaultAddons() {
  const urls = [CINEMETA, OPENSUBTITLES].concat(store.settings().localAddons || []);
  return Promise.all(
    urls.map((u) =>
      getJSON(u)
        .then((m) => ({ transportUrl: u, manifest: m }))
        .catch(() => null)
    )
  ).then((list) => list.filter(Boolean));
}

export function load(force) {
  if (addons && !force) return Promise.resolve(addons);
  if (stremio.isLoggedIn()) {
    const cached = stremio.cachedAddons();
    const fresh = stremio.getAddonCollection().then((list) => (addons = normalize(list)));
    if (cached && cached.length && !force) {
      addons = normalize(cached);
      fresh.catch((e) => log.warn('Addons: usando cache', e.message));
      return Promise.resolve(addons);
    }
    return fresh.catch(() => {
      addons = normalize(cached || []);
      return addons;
    });
  }
  return defaultAddons().then((list) => (addons = normalize(list)));
}

export function list() {
  return addons || [];
}

function resourceMatch(addon, resource, type, id) {
  const m = addon.manifest;
  const resources = m.resources || [];
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i];
    const name = typeof r === 'string' ? r : r.name;
    if (name !== resource) continue;
    const types = (typeof r === 'object' && r.types) || m.types || [];
    if (type && types.length && types.indexOf(type) < 0) continue;
    const prefixes = (typeof r === 'object' && r.idPrefixes) || m.idPrefixes;
    if (id && prefixes && prefixes.length && !prefixes.some((p) => id.indexOf(p) === 0)) continue;
    return true;
  }
  return false;
}

export function withResource(resource, type, id) {
  return list().filter((a) => resourceMatch(a, resource, type, id));
}

function url(addon, resource, type, id, extra) {
  let path = '/' + resource + '/' + encodeURIComponent(type) + '/' + encodeURIComponent(id);
  if (extra) {
    const parts = Object.keys(extra)
      .filter((k) => extra[k] !== undefined && extra[k] !== null && extra[k] !== '')
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(extra[k]));
    if (parts.length) path += '/' + parts.join('&');
  }
  return addon.base + path + '.json' + addon.query;
}

// Catálogos que aparecem na tela inicial (sem "extra" obrigatório), como no Stremio.
// ---- Ordem e visibilidade das fileiras da tela inicial (por perfil, só neste app) ----
// { order: [chave], hidden: [chave] }. Catálogos novos (fora de "order") vão para o fim,
// na ordem dos addons da conta.
export function catalogKey(entry) {
  return entry.addon.transportUrl + '|' + entry.catalog.type + '|' + entry.catalog.id;
}
export function rowPrefs() {
  const p = store.get('homeRows', null) || {};
  return { order: Array.isArray(p.order) ? p.order : [], hidden: Array.isArray(p.hidden) ? p.hidden : [] };
}
let boardVersion = 0;
export function rowsVersion() {
  return boardVersion;
}
export function saveRowPrefs(p) {
  store.set('homeRows', { order: p.order, hidden: p.hidden });
  boardVersion++;
}
// Todas as fileiras possíveis, já na ordem escolhida (inclui as ocultas).
export function orderedCatalogs() {
  const all = rawBoardCatalogs();
  const order = rowPrefs().order;
  const pos = {};
  order.forEach((k, i) => (pos[k] = i));
  return all
    .map((e, i) => ({ e: e, k: catalogKey(e), i: i }))
    .sort((a, b) => {
      const pa = a.k in pos ? pos[a.k] : order.length + a.i;
      const pb = b.k in pos ? pos[b.k] : order.length + b.i;
      return pa - pb;
    })
    .map((x) => x.e);
}
export function boardCatalogs() {
  const hidden = rowPrefs().hidden;
  return orderedCatalogs().filter((e) => hidden.indexOf(catalogKey(e)) < 0);
}

function rawBoardCatalogs() {
  const out = [];
  list().forEach((addon) => {
    (addon.manifest.catalogs || []).forEach((cat) => {
      const extras = cat.extra || [];
      const required = extras.some((e) => e.isRequired) || (cat.extraRequired && cat.extraRequired.length);
      if (required) return;
      out.push({ addon: addon, catalog: cat });
    });
  });
  return out;
}

export function searchCatalogs() {
  const out = [];
  list().forEach((addon) => {
    (addon.manifest.catalogs || []).forEach((cat) => {
      const extras = cat.extra || [];
      const supports = extras.some((e) => e.name === 'search') || (cat.extraSupported || []).indexOf('search') >= 0;
      if (supports) out.push({ addon: addon, catalog: cat });
    });
  });
  return out;
}

export function catalogTitle(entry) {
  const typeName = { movie: t('Filmes'), series: t('Séries'), anime: t('Animes'), channel: t('Canais'), tv: 'TV' }[entry.catalog.type] || entry.catalog.type;
  const name = entry.catalog.name || entry.catalog.id;
  return name + ' · ' + typeName;
}

export function fetchCatalog(entry, extra) {
  // Timeout menor: addon lento não segura a fila de fileiras.
  return cachedJSON(url(entry.addon, 'catalog', entry.catalog.type, entry.catalog.id, extra), 15 * 60000, { timeout: 12000 }).then(
    (r) => (r && r.metas) || []
  );
}

export function fetchMeta(type, id) {
  const sources = withResource('meta', type, id);
  if (!sources.length) return Promise.reject(new Error(t('Nenhum addon fornece detalhes para {id}', { id: id })));
  // Tenta na ordem de instalação; o primeiro que responder com meta vence.
  let i = 0;
  const next = () => {
    if (i >= sources.length) throw new Error(t('Detalhes não encontrados'));
    const a = sources[i++];
    return cachedJSON(url(a, 'meta', type, id), 30 * 60000)
      .then((r) => {
        if (r && r.meta) return r.meta;
        return next();
      })
      .catch(() => next());
  };
  return next();
}

// Streams de todos os addons em paralelo; onAddon é chamado à medida que chegam.
export function fetchStreams(type, id, onAddon) {
  const sources = withResource('stream', type, id);
  return Promise.all(
    sources.map((a) =>
      getJSON(url(a, 'stream', type, id), { timeout: 30000 })
        .then((r) => {
          const streams = ((r && r.streams) || []).map((s) => Object.assign({ addon: a.manifest.name || a.manifest.id }, s));
          if (onAddon) onAddon(a, streams);
          return streams;
        // Handle request failures only. A rendering callback exception must not
        // invoke the callback again and replace valid results with an empty list.
        }, (e) => {
          if (onAddon) onAddon(a, [], e);
          return [];
        })
    )
  ).then((all) => all.reduce((acc, x) => acc.concat(x), []));
}

// onAddon(lista) é chamado a cada addon que responde, para não esperar o mais lento.
export function fetchSubtitles(type, id, extra, onAddon) {
  const sources = withResource('subtitles', type, id);
  return Promise.all(
    sources.map((a) =>
      getJSON(url(a, 'subtitles', type, id, extra), { timeout: 15000 })
        .then((r) => ((r && r.subtitles) || []).map((s) => Object.assign({ addon: a.manifest.name }, s)))
        .catch(() => [])
        .then((list) => {
          if (onAddon) onAddon(list);
          return list;
        })
    )
  ).then((all) => all.reduce((acc, x) => acc.concat(x), []));
}
