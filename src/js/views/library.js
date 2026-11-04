// Biblioteca da conta Stremio, com filtro por tipo e ordenação.
import { h, clear, loadVisibleImages } from '../lib/dom.js';
import * as nav from '../lib/nav.js';
import * as stremio from '../api/stremio.js';
import * as addons from '../api/addons.js';
import * as store from '../lib/store.js';
import { topbar, card, spinnerLine, menu } from '../ui.js';
import * as router from '../router.js';
import { openDetails } from './details.js';
import { t } from '../lib/i18n.js';

const FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'movie', label: 'Filmes' },
  { id: 'series', label: 'Séries' },
];

function str(v) {
  return String(v || '');
}
function byNewest(field) {
  return (a, b) => str(b[field]).localeCompare(str(a[field]));
}
function lastWatchedCmp(a, b) {
  return str(b.state && b.state.lastWatched).localeCompare(str(a.state && a.state.lastWatched)) || byNewest('_mtime')(a, b);
}
function nameCmp(a, b) {
  return str(a.name).localeCompare(str(b.name), undefined, { sensitivity: 'base' });
}
// Itens sem a informação vão para o fim, em ordem de último assistido.
function byInfo(key, dir) {
  return (a, b, info) => {
    const va = info[a._id] ? info[a._id][key] : null;
    const vb = info[b._id] ? info[b._id][key] : null;
    if (va == null && vb == null) return lastWatchedCmp(a, b);
    if (va == null) return 1;
    if (vb == null) return -1;
    return (vb - va) * dir || lastWatchedCmp(a, b);
  };
}

// Mesmas opções do stremio-core (LibraryWithFilters::Sort) + data de adição, lançamento e nota.
const SORTS = [
  { id: 'lastWatched', label: 'Último assistido', cmp: lastWatchedCmp },
  { id: 'added', label: 'Adicionado recentemente', cmp: byNewest('_ctime') },
  { id: 'name', label: 'Nome (A-Z)', cmp: nameCmp },
  { id: 'nameReverse', label: 'Nome (Z-A)', cmp: (a, b) => nameCmp(b, a) },
  {
    id: 'timesWatched',
    label: 'Mais assistidos',
    cmp: (a, b) => ((b.state && b.state.timesWatched) || 0) - ((a.state && a.state.timesWatched) || 0) || lastWatchedCmp(a, b),
  },
  { id: 'releasedNew', label: 'Lançamento (mais novo)', cmp: byInfo('d', 1), needsMeta: true },
  { id: 'releasedOld', label: 'Lançamento (mais antigo)', cmp: byInfo('d', -1), needsMeta: true },
  { id: 'rating', label: 'Nota (maior)', cmp: byInfo('r', 1), needsMeta: true },
];

// O item da biblioteca não guarda data de lançamento nem nota: busca o meta nos addons
// só quando essas ordenações são escolhidas e guarda o resumo no perfil.
function releaseTime(meta) {
  if (meta.released) {
    const t = new Date(meta.released).getTime();
    if (isFinite(t)) return t;
  }
  const m = /\d{4}/.exec(str(meta.releaseInfo || meta.year));
  return m ? Date.UTC(+m[0], 0, 1) : null;
}
function metaSummary(meta) {
  const r = parseFloat(meta.imdbRating);
  return { d: releaseTime(meta), r: isFinite(r) && r > 0 ? r : null };
}

export function LibraryView() {
  const el = h('div.view');
  const scroller = h('div.scroll-y', { 'data-scroll-y': '' });
  const bar = topbar('library', router.goTab);
  const filters = h('div.filters', { 'data-group': '' });
  const grid = h('div.grid');
  scroller.appendChild(bar);
  scroller.appendChild(filters);
  scroller.appendChild(status);
  scroller.appendChild(grid);
  el.appendChild(scroller);

  let filter = 'all';
  let sortId = store.get('librarySort', 'lastWatched');
  if (!SORTS.some((x) => x.id === sortId)) sortId = 'lastWatched';
  const info = store.get('libraryMetaInfo', {});
  let fetching = null; // { done, total }
  let alive = true;

  function currentSort() {
    return SORTS.find((x) => x.id === sortId) || SORTS[0];
  }

  function openSortMenu() {
    menu(
      t('Ordenar'),
      SORTS.map((x) => ({ label: t(x.label), value: x.id, checked: x.id === sortId })),
      {
        onPick: (id) => {
          sortId = id;
          store.set('librarySort', id);
          renderFilters();
          renderGrid();
          ensureMeta();
          nav.focus(filters.lastChild);
        },
      }
    );
  }

  function visibleItems() {
    return stremio.cachedLibrary().filter((it) => !it.removed && (filter === 'all' || it.type === filter));
  }

  // Máximo 2 pedidos ao mesmo tempo (a TV fica sem memória com mais).
  function ensureMeta() {
    if (!currentSort().needsMeta || fetching) return;
    const missing = visibleItems().filter((it) => !info[it._id] && it.type !== 'other');
    if (!missing.length) return;
    fetching = { done: 0, total: missing.length };
    renderStatus();
    let idx = 0;
    let redrawTimer = null;
    const finishOne = () => {
      fetching.done++;
      renderStatus();
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(() => alive && renderGrid(), 800);
    };
    const worker = () => {
      if (!alive || idx >= missing.length) return Promise.resolve();
      const it = missing[idx++];
      return addons
        .fetchMeta(it.type, it._id)
        .then((meta) => {
          info[it._id] = metaSummary(meta);
        })
        // Falha (addon fora do ar) não fica gravada: tenta de novo na próxima vez.
        .catch(() => null)
        .then(finishOne)
        .then(worker);
    };
    Promise.all([worker(), worker()]).then(() => {
      fetching = null;
      store.set('libraryMetaInfo', info);
      if (alive) {
        renderStatus();
        renderGrid();
      }
    });
  }

  const status = h('div.hint');
  function renderStatus() {
    status.textContent = fetching ? t('Carregando detalhes {done}/{total}...', { done: fetching.done, total: fetching.total }) : '';
    status.style.display = fetching ? '' : 'none';
  }

  function renderFilters() {
    clear(filters);
    FILTERS.forEach((f) =>
      filters.appendChild(
        h('div.chip', {
          focusable: true,
          cls: f.id === filter ? 'active' : '',
          text: t(f.label),
          onSelect: () => {
            filter = f.id;
            renderFilters();
            renderGrid();
            ensureMeta();
            nav.focus(filters.children[FILTERS.indexOf(f)]);
          },
        })
      )
    );
    filters.appendChild(
      h('div.chip', {
        focusable: true,
        text: t('Ordenar: {name}', { name: t(currentSort().label) }),
        onSelect: openSortMenu,
      })
    );
  }

  function renderGrid() {
    clear(grid);
    const cmp = currentSort().cmp;
    const items = visibleItems().sort((a, b) => cmp(a, b, info));
    if (!items.length) {
      grid.appendChild(h('div.hint', { text: stremio.isLoggedIn() ? t('Sua biblioteca está vazia.') : t('Entre na sua conta em Ajustes para ver a biblioteca.') }));
      return;
    }
    items.forEach((it) => grid.appendChild(card({ name: it.name, poster: it.poster }, { onSelect: () => openDetails(it.type, it._id) })));
    loadVisibleImages(el, 400);
  }

  renderFilters();
  renderStatus();
  grid.appendChild(spinnerLine(t('Carregando biblioteca...')));

  return {
    el: el,
    onShow: () => {
      renderGrid();
      stremio
        .getLibrary()
        .then(() => {
          renderGrid();
          ensureMeta();
        })
        .catch(() => {});
    },
    destroy: () => {
      alive = false;
      if (bar.__destroy) bar.__destroy();
    },
  };
}
