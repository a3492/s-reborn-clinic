import { createClient } from '@supabase/supabase-js';
import {
  recordInteractionEventBestEffort,
  type InteractionContext,
} from './interaction-events';

const VIEW_PREFIX = 'sreborn_event_viewed:';
const ENGAGED_PREFIX = 'sreborn_event_engaged:';
const COMPLETED_PREFIX = 'sreborn_event_completed:';

function hasSessionFlag(prefix: string, slug: string): boolean {
  try {
    return sessionStorage.getItem(`${prefix}${slug}`) === '1';
  } catch {
    return false;
  }
}

function setSessionFlag(prefix: string, slug: string) {
  try {
    sessionStorage.setItem(`${prefix}${slug}`, '1');
  } catch {
    // Analytics dedupe is best-effort only.
  }
}

function targetPathFromAnchor(anchor: HTMLAnchorElement): string {
  try {
    return new URL(anchor.href, window.location.href).pathname;
  } catch {
    return anchor.getAttribute('href') || '';
  }
}

export function mountArticleInteractionTracker() {
  const article = document.querySelector('article.blog-post-article');
  if (!(article instanceof HTMLElement)) return;
  if (article.dataset.interactionTrackerMounted === 'true') return;
  article.dataset.interactionTrackerMounted = 'true';

  const slug = article.dataset.downloadSlug?.trim() || '';
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!slug || !url || !key) return;

  const supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  let context: InteractionContext = {
    slug,
    pageType: 'article',
    locale: document.documentElement.lang || 'ko',
    source: 'web',
    publicPath: window.location.pathname,
  };

  let visibleSeconds = 0;
  let engagedRecorded = hasSessionFlag(ENGAGED_PREFIX, slug);
  let completedRecorded = hasSessionFlag(COMPLETED_PREFIX, slug);

  const recordViewed = () => {
    if (hasSessionFlag(VIEW_PREFIX, slug)) return;
    setSessionFlag(VIEW_PREFIX, slug);
    recordInteractionEventBestEffort(supabase, {
      eventName: 'article.viewed',
      context,
      metadata: { referrer_present: Boolean(document.referrer) },
    });
  };

  const recordEngaged = () => {
    if (engagedRecorded) return;
    engagedRecorded = true;
    setSessionFlag(ENGAGED_PREFIX, slug);
    recordInteractionEventBestEffort(supabase, {
      eventName: 'article.engaged',
      context,
      metadata: { visible_seconds: visibleSeconds },
    });
  };

  const recordCompleted = () => {
    if (completedRecorded) return;
    completedRecorded = true;
    setSessionFlag(COMPLETED_PREFIX, slug);
    recordInteractionEventBestEffort(supabase, {
      eventName: 'article.completed',
      context,
      metadata: { completion_threshold: 0.9 },
    });
  };

  const checkCompletion = () => {
    if (completedRecorded) return;
    const rect = article.getBoundingClientRect();
    const consumed = Math.max(0, Math.min(rect.height, window.innerHeight - rect.top));
    const ratio = rect.height > 0 ? consumed / rect.height : 0;
    if (ratio >= 0.9) recordCompleted();
  };

  const visibleTimer = window.setInterval(() => {
    if (document.hidden) return;
    visibleSeconds += 1;
    if (visibleSeconds >= 10) recordEngaged();
  }, 1000);

  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const primaryNext = target.closest('a.journal-primary-next');
    if (primaryNext instanceof HTMLAnchorElement) {
      recordInteractionEventBestEffort(supabase, {
        eventName: 'primary_next.clicked',
        context,
        metadata: { target_path: targetPathFromAnchor(primaryNext) },
      });
      return;
    }

    const related = target.closest('a.journal-related-card, a.blog-post-related-link');
    if (related instanceof HTMLAnchorElement) {
      recordInteractionEventBestEffort(supabase, {
        eventName: 'related.clicked',
        context,
        metadata: {
          target_path: targetPathFromAnchor(related),
          source_type: related.classList.contains('journal-related-card') ? 'curated' : 'automatic',
        },
      });
    }
  };

  window.addEventListener('scroll', checkCompletion, { passive: true });
  window.addEventListener('resize', checkCompletion, { passive: true });
  document.addEventListener('click', onClick);
  window.addEventListener(
    'pagehide',
    () => {
      window.clearInterval(visibleTimer);
      window.removeEventListener('scroll', checkCompletion);
      window.removeEventListener('resize', checkCompletion);
      document.removeEventListener('click', onClick);
    },
    { once: true },
  );

  // content_id is deliberately resolved by the database trigger from slug.
  // Browser clients do not need SELECT access to the editorial posts table.
  recordViewed();
  checkCompletion();
}
