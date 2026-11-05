// Detalhes: informações à esquerda; à direita, episódios (séries) ou fontes (streams).
import { h, clear, loadVisibleImages } from '../lib/dom.js';
import * as nav from '../lib/nav.js';
import * as addons from '../api/addons.js';
import * as stremio from '../api/stremio.js';
import * as store from '../lib/store.js';
import * as server from '../api/server.js';
import * as tvproxy from '../api/tvproxy.js';
import * as hero from '../api/hero.js';
import { toast, spinnerLine, menu, fmtTime } from '../ui.js';
import * as router from '../router.js';
import { openPlayer } from './player.js';
import { PersonView } from './person.js';
import * as watched from '../lib/watched.js';
import { trailerIds, openTrailer } from './trailer.js';
import * as extras from '../api/extras.js';
import { smallThumb } from '../lib/img.js';
import { isAnime } from '../api/skip.js';
import { t, epLabel } from '../lib/i18n.js';

export function openDetails(type, id, opts) {
  router.push(DetailsView(type, id, opts || {}));
}

export function sortedVideos(meta) {
  return (meta.videos || [])
    .filter((v) => v && v.id)
    .slice()
    .sort((a, b) => {
      const sa = a.season === 0 ? 9999 : a.season || 0;
      const sb = b.season === 0 ? 9999 : b.season || 0;
      return sa - sb || (a.episode || 0) - (b.episode || 0);
    });
}

function sourceQuality(stream) {
  const text = [stream.resolution, stream.quality, stream.name, stream.title, stream.description,
    stream.behaviorHints && stream.behaviorHints.filename].join(' ');
  const resolutions = text.match(/\b(4320|2160|1440|1080|720|576|480|360|240)p?\b/gi) || [];
  let quality = resolutions.reduce((best, value) => Math.max(best, parseInt(value, 10)), 0);
  if (/\b8k\b/i.test(text)) quality = Math.max(quality, 4320);
  if (/\b4k\b|\buhd\b/i.test(text)) quality = Math.max(quality, 2160);
  if (/\bfhd\b|full\s*hd/i.test(text)) quality = Math.max(quality, 1080);
  return quality;
}

function sourceSeeds(stream) {
  const values = [stream.seeders, stream.seeds, stream.behaviorHints && stream.behaviorHints.seeders];
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && values[i] !== undefined && /^\d+$/.test(String(values[i]))) return Number(values[i]);
  }
  const text = [stream.name, stream.title, stream.description].join(' ');
  const match = /(?:👤\s*|\bseeders?\s*[:=]\s*)(\d+)/i.exec(text) || /\b(\d+)\s+seeders?\b/i.exec(text);
  return match ? Number(match[1]) : null;
}

function orderSources(streams) {
  const http = [], torrents = [];
  streams.forEach((stream, index) => (server.isTorrent(stream) ? torrents : http).push({ stream, index }));
  http.sort((a, b) => sourceQuality(b.stream) - sourceQuality(a.stream) || a.index - b.index);
  torrents.sort((a, b) => {
    const x = sourceSeeds(a.stream), y = sourceSeeds(b.stream);
    if (x === null || y === null) return x === y ? a.index - b.index : x === null ? 1 : -1;
    return y - x || a.index - b.index;
  });
  let h = 0, t = 0;
  return streams.map((stream) => (server.isTorrent(stream) ? torrents[t++] : http[h++]).stream);
}

// Smart Choice waits at most this long for slower add-ons, and keeps this many runners-up
// for the player to fall back on if a source won't play.
const SMART_WAIT_MS = 10000;
const SMART_FALLBACKS = 4;

function DetailsView(type, id, opts) {
  const el = h('div.view');
  const bg = h('img.details-bg', { alt: '' });
  const info = h('div.details-info', null, spinnerLine(t('Carregando...')));
  const panel = h('div.details-panel');
  el.appendChild(bg);
  el.appendChild(h('div.details-shade'));
  el.appendChild(info);
  el.appendChild(panel);

  let meta = null;
  let mode = 'none';
  let season = null;
  let streamsVideo = null;
  let alive = true;
  let watchBtn = null;
  let libBtn = null;
  let tmdbInfo = null;
  let lastTorrentError = '';

  const isSeries = () => meta && sortedVideos(meta).length > 0 && meta.type !== 'movie';

  function movieVideoId() {
    return (meta.behaviorHints && meta.behaviorHints.defaultVideoId) || meta.id;
  }

  function nextUpVideo() {
    const vids = sortedVideos(meta);
    const li = stremio.libraryItem(meta.id);
    if (li && li.state && li.state.video_id) {
      const i = vids.findIndex((v) => v.id === li.state.video_id);
      if (i >= 0) return vids[i];
    }
    return vids.filter((v) => v.season !== 0)[0] || vids[0];
  }

  function renderInfo() {
    clear(info);
    const logo = h('img.details-logo', { alt: '' });
    const title = h('div.details-title', { text: meta.name });
    title.style.display = 'none';
    logo.onerror = () => {
      logo.style.display = 'none';
      title.style.display = '';
    };
    logo.src = meta.logo || hero.logo(meta.id);
    const parts = [];
    if (meta.releaseInfo || meta.year) parts.push(meta.releaseInfo || meta.year);
    if (meta.runtime) parts.push(meta.runtime);
    if (isSeries()) {
      const seasons = uniqueSeasons().filter((s) => s !== 0);
      if (seasons.length) parts.push(t(seasons.length > 1 ? '{n} temporadas' : '{n} temporada', { n: seasons.length }));
    }
    const metaLine = h('div.details-meta', { text: parts.join('  ·  ') });
    const ratingsEl = h('div.ratings');
    renderRatings(ratingsEl, meta.imdbRating ? [{ cls: 'imdb', label: 'IMDb', value: String(meta.imdbRating) }] : []);
    const genres = h(
      'div.details-genres',
      null,
      (meta.genres || meta.genre || []).slice(0, 5).map((g) => h('span', { text: g }))
    );
    const desc = h('div.details-desc', { text: meta.description || '' });
    const cast = (meta.cast || []).slice(0, 5);
    const director = (meta.director || []).slice(0, 2);
    // Texto vindo do addon entra como texto, nunca como HTML (um addon malicioso não injeta código).
    const castLine = h('div.details-cast', null, [
      director.length ? h('b', { text: t('Direção: ') }) : null,
      director.length ? director.join(', ') + '   ' : null,
      cast.length ? h('b', { text: t('Elenco: ') }) : null,
      cast.length ? cast.join(', ') : null,
    ]);

    watchBtn = h('div.btn.primary', { focusable: true, 'data-autofocus': '', onSelect: () => onWatch(smartOn()) });
    libBtn = h('div.btn', { focusable: true, onSelect: toggleLibrary });
    // With Smart Choice on, Watch plays straight away; this opens the full source list instead.
    const sourcesBtn = smartOn() ? h('div.btn', { focusable: true, onSelect: () => onWatch(false) }, [h('span.ico', { text: '☰' }), t('Fontes')]) : null;
    const trailers = trailerIds(meta);
    const trailerBtn = trailers.length
      ? h('div.btn', { focusable: true, onSelect: () => openTrailer(trailers, meta.name) }, [h('span.ico', { text: '🎬' }), t('Trailer')])
      : null;
    updateButtons();
    info.appendChild(logo);
    info.appendChild(title);
    info.appendChild(metaLine);
    info.appendChild(ratingsEl);
    info.appendChild(genres);
    info.appendChild(desc);
    info.appendChild(castLine);
    info.appendChild(h('div.details-buttons', { 'data-group': '' }, [watchBtn, sourcesBtn, trailerBtn, libBtn]));
    loadExtras({ logo: logo, title: title, desc: desc, castLine: castLine, ratingsEl: ratingsEl });
  }

  function renderRatings(el, list) {
    clear(el);
    list.forEach((r) => el.appendChild(h('span.rating', { cls: r.cls }, [h('b', { text: r.label }), r.value])));
    el.style.display = list.length ? '' : 'none';
  }

  // Notas extras e dados em PT-BR (TMDB/MDBList opcionais, AniList sem chave).
  function loadExtras(ui) {
    extras
      .ratings(meta, isAnime(meta))
      .then((list) => alive && renderRatings(ui.ratingsEl, list))
      .catch(() => {});
    if (!extras.hasTmdb()) return;
    extras
      .localized(meta)
      .then((loc) => {
        if (!alive || !loc) return;
        tmdbInfo = loc;
        if (loc.overview) ui.desc.textContent = loc.overview;
        if (loc.title) ui.title.textContent = loc.title;
        if (loc.logo) {
          ui.logo.style.display = '';
          ui.title.style.display = 'none';
          ui.logo.src = loc.logo;
        }
        if (loc.cast.length) {
          // Each cast member opens their profile (photo, biography, films and series).
          const row = h(
            'div.cast-row',
            { 'data-group': '' },
            loc.cast.slice(0, 7).map((c) =>
              h('div.cast', { focusable: true, onSelect: () => router.push(PersonView(c.id, c.name)) }, [
                h('div.ph', null, c.photo ? h('img', { src: c.photo, alt: '' }) : null),
                h('div.nm', { text: c.name }),
                h('div.ch', { text: c.character }),
              ])
            )
          );
          ui.castLine.parentNode.replaceChild(row, ui.castLine);
        }
        if (mode === 'episodes') localizeEpisodes();
      })
      .catch(() => {});
  }

  // Troca títulos/sinopses dos episódios visíveis pelos do TMDB em PT-BR.
  function localizeEpisodes() {
    if (!tmdbInfo || tmdbInfo.tmdbType !== 'tv' || season === null) return;
    const forSeason = season;
    extras
      .seasonPt(tmdbInfo.tmdbId, season)
      .then((map) => {
        if (!alive || mode !== 'episodes' || forSeason !== season) return;
        Array.prototype.forEach.call(panel.querySelectorAll('.episode'), (row) => {
          const ep = map[row.__episode];
          if (!ep) return;
          if (ep.name) row.querySelector('.ep-title').textContent = row.__episode + '. ' + ep.name;
          if (ep.overview) row.querySelector('.ep-desc').textContent = ep.overview;
        });
      })
      .catch(() => {});
  }

  function updateButtons() {
    const li = stremio.libraryItem(meta.id);
    let label = t('Assistir');
    if (li && li.state && li.state.timeOffset > 0) {
      const ep = isSeries() ? sortedVideos(meta).find((v) => v.id === li.state.video_id) : null;
      label = t('Continuar') + (ep ? ' ' + epLabel(ep.season, ep.episode) : '');
    }
    watchBtn.innerHTML = '<span class="ico">▶</span>' + label;
    libBtn.innerHTML = stremio.isInLibrary(meta.id) ? '<span class="ico">✓</span>' + t('Na biblioteca') : '<span class="ico">＋</span>' + t('Biblioteca');
  }

  function smartOn() {
    return store.settings().smartChoice !== false;
  }

  function onWatch(smart) {
    if (isSeries()) {
      const v = nextUpVideo();
      if (v) showStreams(v, true, smart);
    } else {
      showStreams({ id: movieVideoId(), title: meta.name }, true, smart);
    }
  }

  function toggleLibrary() {
    const inLib = stremio.isInLibrary(meta.id);
    stremio.setInLibrary(meta, !inLib).then(() => {
      updateButtons();
      toast(inLib ? t('Removido da biblioteca') : t('Adicionado à biblioteca'));
    });
  }

  function uniqueSeasons() {
    const out = [];
    sortedVideos(meta).forEach((v) => {
      const s = v.season || 0;
      if (out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }

  // ---------- Episódios ----------
  function showEpisodes(focusVideoId) {
    mode = 'episodes';
    clear(panel);
    const seasons = uniqueSeasons();
    if (season === null) {
      const nu = nextUpVideo();
      season = nu ? nu.season || 0 : seasons[0];
    }
    panel.appendChild(h('div.panel-head', null, h('h2', { text: t('Episódios') })));
    const chips = h(
      'div.seasons',
      { 'data-scroll-x': '', 'data-group': '', 'data-pad': '60' },
      seasons.map((s) =>
        h('div.chip', {
          focusable: true,
          cls: s === season ? 'active' : '',
          text: s === 0 ? t('Especiais') : t('Temporada {n}', { n: s }),
          onSelect: () => {
            season = s;
            showEpisodes();
            const first = panel.querySelector('.episode');
            if (first) nav.focus(first);
          },
        })
      )
    );
    panel.appendChild(chips);
    const list = h('div.list', { 'data-scroll-y': '', 'data-pad-y': '120', 'data-group': '', 'data-vertical': '' });
    list.style.top = '190px';
    const li = stremio.libraryItem(meta.id);
    let focusEl = null;
    sortedVideos(meta)
      .filter((v) => (v.season || 0) === season)
      .forEach((v) => {
        const thumb = h('div.thumb');
        if (v.thumbnail) {
          const im = h('img', { alt: '' });
          im.setAttribute('data-lazy', smallThumb(v.thumbnail));
          im.onerror = () => (im.style.display = 'none');
          thumb.appendChild(im);
        }
        let sub = t('Episódio {n}', { n: v.episode || '?' });
        if (v.released) sub += ' · ' + formatDate(v.released);
        const inProgress = li && li.state && li.state.video_id === v.id && li.state.timeOffset > 0;
        if (inProgress) sub += ' · ' + t('parou em {time}', { time: fmtTime(li.state.timeOffset / 1000) });
        // Watched markers: a check on finished episodes, a bar on half-watched ones.
        const done = watched.isWatched(v.id);
        const part = done ? 0 : watched.progress(v.id) || (inProgress && li.state.duration ? li.state.timeOffset / li.state.duration : 0);
        if (done) thumb.appendChild(h('div.ep-watched', { text: '✓' }));
        else if (part > 0) thumb.appendChild(h('div.progress', null, h('i', { style: { width: Math.round(part * 100) + '%' } })));
        const row = h('div.episode', { focusable: true, cls: done ? 'watched' : '', onSelect: () => showStreams(v, true) }, [
          thumb,
          h('div.ep-info', null, [
            h('div.ep-title', { text: (v.episode ? v.episode + '. ' : '') + (v.name || v.title || t('Episódio')) }),
            h('div.ep-sub', { text: sub }),
            h('div.ep-desc', { text: v.overview || v.description || '' }),
          ]),
        ]);
        row.__episode = v.episode;
        if (v.id === focusVideoId || (!focusVideoId && inProgress)) focusEl = row;
        list.appendChild(row);
      });
    panel.appendChild(list);
    // Ao entrar na lista, cai no episódio em andamento (ou no primeiro), não no mais próximo.
    list.__last = focusEl || list.firstChild;
    localizeEpisodes();
    loadVisibleImages(panel, 300);
    if (focusEl && focusVideoId) setTimeout(() => nav.focus(focusEl), 0);
  }

  // ---------- Fontes (como no Kai do PC: filtro por addon, debrid primeiro) ----------
  function addonRank(a) {
    const n = (a.manifest.name || '') + ' ' + a.transportUrl;
    if (/realdebrid|alldebrid|premiumize|debridlink|torbox|easydebrid|offcloud|\bRD\b/i.test(n)) return 0;
    if (/torrentio/i.test(n)) return 1;
    return 2;
  }

  function runtimeMinutes() {
    const r = String(meta.runtime || '');
    const hMatch = r.match(/(\d+)\s*h/i);
    const mMatch = r.match(/(\d+)\s*min/i);
    const mins = (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
    return mins || (isSeries() ? 45 : 110);
  }

  // Estimativa da taxa do arquivo (tamanho ÷ duração): avisa o que pesa no Wi-Fi da TV (~34 Mbps medidos).
  function streamBadges(s) {
    const text = (s.name || '') + ' ' + (s.title || s.description || '');
    const out = [];
    if (/2160p|\b4k\b|uhd/i.test(text)) out.push({ t: '4K' });
    if (/dolby.?vision|\bdovi\b|\bdv\b/i.test(text)) out.push({ t: 'Dolby Vision', warn: true });
    else if (/hdr/i.test(text)) out.push({ t: 'HDR' });
    if (/remux/i.test(text)) out.push({ t: 'REMUX', warn: true });
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*(GB|MB)\b/i);
    if (m) {
      const mb = parseFloat(m[1].replace(',', '.')) * (m[2].toUpperCase() === 'GB' ? 1024 : 1);
      const mbps = Math.round((mb * 8) / (runtimeMinutes() * 60));
      if (mbps > 0) out.push({ t: '~' + mbps + ' Mbps', warn: mbps > 30 });
    }
    return out;
  }

  function showStreams(video, focusFirst, smart) {
    mode = 'streams';
    streamsVideo = video;
    clear(panel);
    const head = isSeries() ? epLabel(video.season, video.episode) + ' · ' + (video.name || video.title || '') : t('Fontes');
    const filterBtn = h('div.btn.small', { focusable: true, text: t('Todos ▾'), onSelect: () => filterMenu() });
    panel.appendChild(h('div.panel-head', { 'data-group': '' }, [h('h2', { text: head }), filterBtn]));
    const sub = h('div.panel-sub.details-sources-status');
    const barFill = h('i');
    panel.appendChild(sub);
    panel.appendChild(h('div.load-bar', null, barFill));
    const typeFilters = h('div.source-filters');
    panel.appendChild(typeFilters);
    const list = h('div.list', { 'data-scroll-y': '', 'data-pad-y': '120', 'data-group': '', 'data-vertical': '' });
    list.style.top = '226px';
    panel.appendChild(list);
    const srcs = addons
      .withResource('stream', meta.type, video.id)
      .map((a, i) => ({ a: a, i: i }))
      .sort((x, y) => addonRank(x.a) - addonRank(y.a) || x.i - y.i)
      .map((x) => x.a);
    if (!srcs.length) {
      list.appendChild(h('div.loading-line', { text: t('Nenhum addon de streams instalado (ex.: Torrentio). Instale pela sua conta Stremio.') }));
      return;
    }
    // Um grupo por addon, já na ordem de prioridade; os streams entram no grupo certo ao chegar.
    const groups = srcs.map((a) => {
      const heading = h('div.stream-group-head', { focusable: true, 'aria-expanded': 'false' });
      const title = h('span.stream-group-name', { text: a.manifest.name || a.manifest.id });
      const countEl = h('span.stream-group-count', { text: '0' });
      const toggleEl = h('span.stream-group-toggle', { text: '+' });
      heading.appendChild(title);
      heading.appendChild(countEl);
      heading.appendChild(toggleEl);
      const body = h('div.stream-group-body');
      body.style.display = 'none';
      const el = h('div.stream-group', null, [heading, body]);
      list.appendChild(el);
      const group = { addon: a, el: el, heading: heading, body: body, countEl: countEl, toggleEl: toggleEl, count: 0, done: false, collapsed: true, streams: [] };
      heading.__select = () => {
        group.collapsed = !group.collapsed;
        body.style.display = group.collapsed ? 'none' : '';
        heading.setAttribute('aria-expanded', group.collapsed ? 'false' : 'true');
        toggleEl.textContent = group.collapsed ? '+' : '−';
      };
      return group;
    });
    const loadingLine = spinnerLine(t('Buscando fontes nos addons...'));
    list.appendChild(loadingLine);
    let filter = 'all';
    let typeFilter = 'all';
    const typeChipEls = {};
    [['all', 'All types'], ['direct', 'Direct'], ['via-tv', 'Via TV'], ['torrent', 'Torrent']].forEach((entry) => {
      const chip = h('div.chip', { focusable: true, onSelect: () => { typeFilter = entry[0]; applyFilter(true); } });
      typeChipEls[entry[0]] = chip;
      typeFilters.appendChild(chip);
    });
    let pendingCount = srcs.length;
    const all = [];
    let autoFocused = null;
    let serverOk = server.isAvailable();
    let tvOk = tvproxy.isAvailable();
    let torrentOk = tvproxy.isTorrentAvailable();
    // Smart Choice: picks a source once the debrid add-ons answer (or after SMART_WAIT_MS),
    // unless the user moves the focus first.
    let smartActive = !!smart;
    const smartTimer = smartActive ? setTimeout(() => decideSmart(true), SMART_WAIT_MS) : null;

    function stopSmart() {
      smartActive = false;
      clearTimeout(smartTimer);
    }

    // Candidates in list order (add-on priority, then each add-on's own order), with the ones
    // that play best on the TV first: direct links before torrents, then Dolby Vision, REMUX and
    // very high bitrates (the badges marked as warnings) last, and 4K/HDR after 1080p (over Wi-Fi
    // the 2017 TVs break up on them).
    function smartCandidates() {
      const out = [];
      groups.forEach((g, gi) => {
        (g.streams || []).forEach((s, si) => {
          if (!server.isPlayableType(s)) return;
          if (server.isTorrent(s) && !torrentOk) return;
          // Header links only go last when neither the PC nor TV proxy can add the headers.
          const needs = server.isTorrent(s) || (server.needsHeaders(s) && !(serverOk || tvOk));
          const badges = streamBadges(s);
          const warn = badges.some((b) => b.warn);
          const heavy = badges.some((b) => b.t === '4K' || b.t === 'HDR');
          out.push({ s: s, key: [needs ? 1 : 0, warn ? 1 : 0, heavy ? 1 : 0, gi, si] });
        });
      });
      out.sort((x, y) => {
        for (let i = 0; i < 5; i++) if (x.key[i] !== y.key[i]) return x.key[i] - y.key[i];
        return 0;
      });
      return out.map((c) => c.s);
    }

    function decideSmart(timedOut) {
      if (!smartActive || !alive || streamsVideo !== video) return;
      if (focusFirst && autoFocused && nav.current() !== autoFocused) return stopSmart(); // user took over
      const list = smartCandidates();
      const debridPending = groups.some((g) => addonRank(g.addon) === 0 && !g.done);
      const best = list[0];
      const needsProxy = best && (server.isTorrent(best) || (server.needsHeaders(best) && !(serverOk || tvOk)));
      const clean = best && !needsProxy && !streamBadges(best).some((b) => b.warn);
      if (!best) {
        if (pendingCount <= 0 || timedOut) {
          stopSmart();
          if (pendingCount <= 0) toast(t('Escolha inteligente: nenhuma fonte que a TV toque. Escolha na lista.'), 5000);
        }
        return;
      }
      if (pendingCount > 0 && !timedOut && (debridPending || !clean)) return;
      stopSmart();
      play(video, best, all, list.slice(1, 1 + SMART_FALLBACKS));
    }

    function status() {
      if (smartActive) {
        sub.textContent = t('Escolha inteligente: procurando a melhor fonte...') + '  ·  ' + t('aperte uma seta para escolher você');
        barFill.style.width = Math.round(((srcs.length - pendingCount) / srcs.length) * 100) + '%';
        return;
      }
      const srv = torrentOk
        ? t('TV torrent player ready')
        : t('TV torrent player unavailable; torrent sources hidden');
      const proxyStatus = tvOk ? t('TV proxy available') : serverOk ? t('PC proxy available') : t('Direct links only');
      sub.textContent = srv + '  ·  ' + proxyStatus + (lastTorrentError ? '  ·  ' + lastTorrentError : '') + (pendingCount > 0 ? '  ·  ' + t('{n} addon(s) ainda carregando', { n: pendingCount }) : '  ·  ' + t('{n} fontes', { n: all.length }));
      barFill.style.width = Math.round(((srcs.length - pendingCount) / srcs.length) * 100) + '%';
      const g = groups.find((x) => x.addon.transportUrl === filter);
      filterBtn.textContent = (g ? g.addon.manifest.name : t('Todos')) + ' ▾';
      [['all', 'All types'], ['direct', 'Direct'], ['via-tv', 'Via TV'], ['torrent', 'Torrent']].forEach((entry) => {
        const value = entry[0];
        const count = all.filter((s) => value === 'all' || sourceType(s) === value).length;
        typeChipEls[value].textContent = t(entry[1]) + ' · ' + count;
        if (typeFilter === value) typeChipEls[value].classList.add('active');
        else typeChipEls[value].classList.remove('active');
      });
    }

    function sourceType(s) {
      if (server.isTorrent(s)) return 'torrent';
      if (server.needsHeaders(s) && tvOk && !serverOk) return 'via-tv';
      return 'direct';
    }

    function firstVisibleItem() {
      const items = list.querySelectorAll('.stream-group-head, .stream');
      for (let i = 0; i < items.length; i++) if (items[i].offsetParent !== null && !items[i].classList.contains('disabled')) return items[i];
      return null;
    }

    function applyFilter(moveFocus) {
      groups.forEach((g) => {
        const addonMatches = filter === 'all' || filter === g.addon.transportUrl;
        let matches = 0;
        const rows = g.body.querySelectorAll('.stream');
        for (let i = 0; i < rows.length; i++) {
          const visible = addonMatches && (typeFilter === 'all' || sourceType(g.streams[i]) === typeFilter);
          rows[i].style.display = visible ? '' : 'none';
          if (visible) matches++;
        }
        g.el.style.display = addonMatches && (matches > 0 || !g.done) ? '' : 'none';
      });
      list.scrollTop = 0;
      status();
      if (moveFocus) {
        const first = firstVisibleItem();
        if (first) nav.focus(first);
      }
    }

    function filterMenu() {
      const opts = [{ label: t('Todos'), sub: t('{n} fontes', { n: all.length }), value: 'all', checked: filter === 'all' }].concat(
        groups.map((g) => ({
          label: g.addon.manifest.name || g.addon.manifest.id,
          sub: g.done ? t('{n} fontes', { n: g.count }) : t('carregando...'),
          value: g.addon.transportUrl,
          checked: filter === g.addon.transportUrl,
        }))
      );
      menu(t('Mostrar fontes de'), opts, {
        onPick: (v) => {
          filter = v;
          applyFilter(true);
        },
      });
    }

    status();
    (serverOk ? Promise.resolve() : server.check().then((r) => (serverOk = r.ok)))
      .then(() => {
        if (tvOk && torrentOk) return null;
        return tvproxy.check(!torrentOk).then((r) => { tvOk = r.ok; torrentOk = r.torrent; });
      })
      .then(() => {
        status();
        return addons.fetchStreams(meta.type, video.id, (addon, streams) => {
          if (!alive || streamsVideo !== video) return;
          pendingCount--;
          const g = groups.find((x) => x.addon === addon);
          if (g) {
            g.done = true;
            // Hide torrents only when the TV engine is unavailable. Other playable links stay visible
            // and header-dependent links can still be tried directly.
            const shown = orderSources(streams.filter((s) => server.isPlayableType(s) && (server.isTorrent(s) ? torrentOk : server.canTryDirect(s))));
            const hidden = streams.length - shown.length;
            g.count = shown.length;
            g.streams = shown;
            g.countEl.textContent = String(shown.length);
            shown.forEach((s) => {
              all.push(s);
              g.body.appendChild(streamItem(s, addon.manifest.name || addon.manifest.id, video, serverOk, tvOk, torrentOk, all));
            });
            if (hidden) g.body.appendChild(h('div.loading-line', { text: t('{name}: {n} torrent sources hidden (TV torrent player unavailable)', { name: addon.manifest.name || addon.manifest.id, n: hidden }) }));
            applyFilter(false);
          }
          // Mantém o foco na primeira fonte (a de maior prioridade) enquanto o usuário não mexer.
          if (focusFirst && (!autoFocused || nav.current() === autoFocused)) {
            const first = firstVisibleItem();
            if (first) {
              autoFocused = first;
              nav.focus(first);
            }
          }
          if (pendingCount <= 0) {
            if (loadingLine.parentNode) list.removeChild(loadingLine);
            if (!all.length) list.appendChild(h('div.loading-line', { text: t('Nenhuma fonte encontrada.') }));
          }
          status();
          decideSmart(false);
        });
      })
      .catch(() => {});
  }

  function streamItem(s, addonName, video, serverOk, tvOk, torrentOk, all) {
    const playableType = server.isPlayableType(s);
    const needs = server.needsServer(s);
    const torrent = server.isTorrent(s);
    const disabled = !playableType || (torrent && !torrentOk);
    const tags = [];
    const seeds = torrent ? sourceSeeds(s) : null;
    if (seeds !== null) tags.push(h('span.s-tag', { text: t('Seeds: {n}', { n: seeds }) }));
    if (!playableType) tags.push(h('span.s-tag.warn', { text: t('Não suportado na TV') }));
    else if (needs) {
      const label = torrent
        ? torrentOk ? 'Torrent · via TV' : 'Torrent player unavailable'
        : serverOk ? 'Via PC' : tvOk ? 'Via TV' : 'Direto · pode falhar';
      const tagColor = torrent ? (torrentOk ? 'torrent' : 'warn') : serverOk ? 'via-pc' : tvOk ? 'via-tv' : 'warn';
      tags.push(h('span.s-tag', { cls: tagColor, text: t(label) }));
    }
    else tags.push(h('span.s-tag.direct', { text: t('Direto') }));
    streamBadges(s).forEach((b) => tags.push(h('span.s-tag', { cls: b.warn ? 'warn' : '', text: b.t })));
    return h(
      'div.stream',
      {
        focusable: true,
        cls: disabled ? 'disabled' : '',
        onSelect: () => {
          if (!playableType) return toast(t('Esse tipo de fonte não abre na TV.'));
          if (torrent && !torrentOk) return toast(t('TV torrent player unavailable.'), 5000);
          play(video, s, all, null, (error) => {
            if (!error || !error.torrentOpen) return;
            lastTorrentError = t('Torrent metadata hatası: {msg}', { msg: error.message });
            const currentStatus = el.querySelector('.details-sources-status');
            if (currentStatus) currentStatus.textContent += '  ·  ' + lastTorrentError;
          });
        },
      },
      [
        h('div.s-addon', { text: addonName }),
        h('div.s-body', null, [
          h('div.s-title', { text: (s.title || s.description || s.name || '').trim() }),
          h('div.s-detail', { text: (s.name && s.name !== s.title && s.name !== s.description) ? s.name.trim() : '' }),
          h('div.s-tags', null, tags),
        ]),
      ]
    );
  }

  function play(video, stream, all, fallbacks, onError) {
    const li = stremio.libraryItem(meta.id);
    const resumeMs = li && li.state && li.state.video_id === video.id ? li.state.timeOffset : 0;
    const start = (ms) =>
      openPlayer({ meta: meta, video: video, stream: stream, streams: all, startTime: ms, isSeries: isSeries(), fallbacks: fallbacks || [], onError: onError });
    if (resumeMs > 30000) {
      menu(
        t('Continuar de onde parou?'),
        [
          { label: t('Continuar de {time}', { time: fmtTime(resumeMs / 1000) }), value: resumeMs, checked: true },
          { label: t('Começar do início'), value: 0 },
        ],
        { center: true, onPick: (v) => start(v) }
      );
    } else start(0);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  addons
    .load()
    .then(() => addons.fetchMeta(type, id))
    .then((m) => {
      if (!alive) return;
      meta = m;
      if (!meta.type) meta.type = type;
      bg.onerror = () => (bg.style.display = 'none');
      // Fundo como imagem sob demanda: é liberado quando o player abre por cima.
      bg.setAttribute('data-lazy', meta.background || hero.background(meta.id));
      loadVisibleImages(el);
      renderInfo();
      if (isSeries()) {
        if (opts.videoId) {
          const v = sortedVideos(meta).find((x) => x.id === opts.videoId);
          if (v) season = v.season || 0;
          if (v && opts.autoStreams) {
            showStreams(v, true);
            return;
          }
        }
        showEpisodes(opts.videoId);
        if (opts.autoStreams) {
          const v = nextUpVideo();
          if (v) showStreams(v, true);
          return;
        }
      } else {
        showStreams({ id: movieVideoId(), title: meta.name }, !!opts.autoStreams);
      }
      if (!opts.autoStreams) nav.focus(watchBtn);
    })
    .catch((e) => {
      clear(info);
      info.appendChild(h('div.details-title', { text: t('Não foi possível abrir') }));
      info.appendChild(h('div.details-desc', { text: e.message }));
      info.appendChild(h('div.btn', { focusable: true, 'data-autofocus': '', text: t('Voltar'), onSelect: () => router.pop() }));
      nav.focusFirst(el);
    });

  return {
    el: el,
    onShow: () => {
      if (meta && watchBtn) updateButtons();
      loadVisibleImages(panel, 300);
    },
    onBack: () => {
      if (mode === 'streams' && isSeries()) {
        const v = streamsVideo;
        showEpisodes(v && v.id);
        return true;
      }
      return false;
    },
    destroy: () => {
      alive = false;
    },
  };
}
