import { JOURNAL_EDITORIAL_SERIES } from '../consts';

const SERIES_HIDDEN_CLASS = 'is-editorial-series-hidden';

type BlogFilterGlobal = typeof globalThis & {
  applyBlogFilters?: () => void;
  __journalSeriesFilterWrapped?: boolean;
};

function isJournalIndex(pathname: string) {
  return pathname === '/blog/' || pathname === '/blog' || pathname === '/en/blog/' || pathname === '/en/blog';
}

function buildSeriesHref(seriesId: string, english: boolean) {
  const url = new URL(window.location.href);
  url.pathname = english ? '/en/blog/' : '/blog/';
  url.searchParams.delete('q');
  if (seriesId) url.searchParams.set('series', seriesId);
  else url.searchParams.delete('series');
  return `${url.pathname}${url.search}`;
}

function replaceCardSeriesBadges(english: boolean) {
  const byLabel = new Map(JOURNAL_EDITORIAL_SERIES.map((series) => [series.label, series]));

  document.querySelectorAll<HTMLElement>('[data-blog-card]').forEach((card) => {
    const badge = card.querySelector<HTMLElement>('.blog-post-card-series-badge');
    const seriesName = card.dataset.series?.trim() ?? '';
    if (!badge || !seriesName) return;

    const meta = byLabel.get(seriesName);
    const replacement = document.createElement('span');
    replacement.className = 'blog-post-card-series-badge';
    replacement.textContent = english && meta ? meta.labelEn : seriesName;
    replacement.setAttribute('aria-label', english ? `Series: ${replacement.textContent}` : `시리즈: ${replacement.textContent}`);
    badge.replaceWith(replacement);
  });
}

function createSeriesNavigation(english: boolean) {
  const header = document.querySelector<HTMLElement>('.blog-header');
  const title = document.getElementById('blog-page-title');
  if (!header || !title || header.querySelector('[data-journal-series-filter]')) return;

  title.textContent = 'Journal';

  const intro = document.createElement('p');
  intro.className = 'journal-intro';
  intro.textContent = english
    ? 'Read aesthetic medicine through questions, cases, principles, decisions, and a doctor’s perspective.'
    : '질문·사례·원리·판단·관점으로 미용의학을 읽는 S-Reborn의 편집 콘텐츠입니다.';

  const nav = document.createElement('nav');
  nav.className = 'journal-series-filter';
  nav.setAttribute('aria-label', english ? 'Journal series' : 'Journal 시리즈');
  nav.setAttribute('data-journal-series-filter', '');

  const items = [{ id: '', label: english ? 'All' : '전체' }, ...JOURNAL_EDITORIAL_SERIES.map((series) => ({
    id: series.id,
    label: english ? series.labelEn : series.label,
  }))];

  for (const item of items) {
    const link = document.createElement('a');
    link.className = 'journal-series-filter__link';
    link.href = buildSeriesHref(item.id, english);
    link.textContent = item.label;
    link.dataset.journalSeriesId = item.id;
    nav.append(link);
  }

  title.after(intro, nav);
}

function appendSeriesFilterMeta(activeLabel: string, visibleCount: number, english: boolean) {
  const metaFilter = document.getElementById('blog-meta-filter');
  const chips = document.getElementById('blog-meta-filter-chips');
  const count = document.getElementById('blog-count-filter');
  if (!metaFilter || !chips || !count) return;

  chips.querySelectorAll('[data-journal-series-chip], [data-journal-series-sep]').forEach((node) => node.remove());

  if (chips.childNodes.length > 0) {
    const sep = document.createElement('span');
    sep.className = 'blog-filter-sep';
    sep.dataset.journalSeriesSep = '';
    sep.textContent = '·';
    chips.append(sep);
  }

  const chip = document.createElement('span');
  chip.className = 'blog-filter-chip';
  chip.dataset.journalSeriesChip = '';
  chip.textContent = activeLabel;
  chips.append(chip);

  count.textContent = english ? `${visibleCount} posts` : `${visibleCount}개`;
  metaFilter.removeAttribute('hidden');
}

function showSeriesEmptyState(activeLabel: string, english: boolean) {
  const noMatches = document.getElementById('blog-no-matches');
  const noHint = document.getElementById('blog-no-matches-hint');
  const grid = document.getElementById('blog-grid');
  if (!noMatches || !grid) return;

  noMatches.removeAttribute('hidden');
  grid.classList.add('is-grid-empty');
  if (noHint) {
    noHint.textContent = english
      ? `No published posts are available in “${activeLabel}” yet.`
      : `「${activeLabel}」에 아직 공개된 글이 없습니다.`;
    noHint.removeAttribute('hidden');
  }
}

function applyEditorialSeriesFilter(english: boolean) {
  const url = new URL(window.location.href);
  const searchActive = Boolean((url.searchParams.get('q') ?? '').trim());
  const activeId = url.searchParams.get('series') ?? '';
  const activeSeries = JOURNAL_EDITORIAL_SERIES.find((series) => series.id === activeId) ?? null;
  const cards = [...document.querySelectorAll<HTMLElement>('[data-blog-card]')];
  const title = document.getElementById('blog-page-title');

  if (!searchActive && title) title.textContent = 'Journal';

  document.querySelectorAll<HTMLAnchorElement>('[data-journal-series-id]').forEach((link) => {
    const expectedId = searchActive ? '' : (activeSeries?.id ?? '');
    const active = (link.dataset.journalSeriesId ?? '') === expectedId;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  for (const card of cards) {
    const hidden = Boolean(activeSeries && !searchActive && (card.dataset.series ?? '').trim() !== activeSeries.label);
    card.classList.toggle(SERIES_HIDDEN_CLASS, hidden);
  }

  if (searchActive) return;

  const currentTitle = document.title;
  const pipeIndex = currentTitle.indexOf('|');
  const suffix = pipeIndex >= 0 ? currentTitle.slice(pipeIndex).trim() : '';

  if (!activeSeries) {
    document.title = suffix ? `Journal ${suffix}` : 'Journal';
    return;
  }

  const visibleCount = cards.filter(
    (card) => !card.classList.contains('is-filter-hidden') && !card.classList.contains(SERIES_HIDDEN_CLASS),
  ).length;
  const activeLabel = english ? activeSeries.labelEn : activeSeries.label;

  appendSeriesFilterMeta(activeLabel, visibleCount, english);

  if (visibleCount === 0) showSeriesEmptyState(activeLabel, english);

  document.title = suffix ? `${activeLabel} | Journal ${suffix}` : `${activeLabel} | Journal`;
}

function wrapLegacyBlogFilter(english: boolean) {
  const global = globalThis as BlogFilterGlobal;
  if (global.__journalSeriesFilterWrapped || typeof global.applyBlogFilters !== 'function') return;

  const originalApplyBlogFilters = global.applyBlogFilters;
  global.applyBlogFilters = () => {
    originalApplyBlogFilters();
    applyEditorialSeriesFilter(english);
  };
  global.__journalSeriesFilterWrapped = true;
}

function updateJournalNavigationLabel(english: boolean) {
  const expectedPath = english ? '/en/blog/' : '/blog/';
  document.querySelectorAll<HTMLAnchorElement>('.site-nav a, .site-mobile-nav a').forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === expectedPath || linkPath === expectedPath.replace(/\/$/, '')) {
      link.textContent = 'Journal';
    }
  });
}

function initJournalSeriesUi() {
  if (!isJournalIndex(window.location.pathname)) return;
  const english = window.location.pathname.startsWith('/en/');
  createSeriesNavigation(english);
  replaceCardSeriesBadges(english);
  wrapLegacyBlogFilter(english);
  applyEditorialSeriesFilter(english);
  updateJournalNavigationLabel(english);
  window.addEventListener('popstate', () => applyEditorialSeriesFilter(english));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJournalSeriesUi, { once: true });
} else {
  initJournalSeriesUi();
}
