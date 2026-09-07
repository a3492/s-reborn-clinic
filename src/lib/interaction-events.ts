import type { SupabaseClient } from '@supabase/supabase-js';

export const INTERACTION_EVENT_NAMES = [
  'article.viewed',
  'article.engaged',
  'article.completed',
  'article.reacted',
  'article.bookmarked',
  'search.executed',
  'search.no_result',
  'search.result_clicked',
  'related.clicked',
  'primary_next.clicked',
  'question.submitted',
  'comment.submitted',
  'error.reported',
] as const;

export type InteractionEventName = (typeof INTERACTION_EVENT_NAMES)[number];

export interface InteractionContext {
  contentId?: string | null;
  slug?: string | null;
  pageType: string;
  locale?: string | null;
  source?: string | null;
  publicPath?: string | null;
}

export interface InteractionEventInput {
  eventName: InteractionEventName;
  context: InteractionContext;
  metadata?: Record<string, unknown>;
  eventId?: string;
  occurredAt?: string;
}

const SESSION_STORAGE_KEY = 'sreborn_reader_session_id';
const MAX_METADATA_BYTES = 8 * 1024;

export function getOrCreateReaderSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id || !id.trim()) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function safeMetadata(input: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!input) return {};
  try {
    const json = JSON.stringify(input);
    if (new TextEncoder().encode(json).byteLength <= MAX_METADATA_BYTES) return input;
  } catch {
    return {};
  }
  return { truncated: true };
}

/**
 * Append-only interaction event writer.
 *
 * This is deliberately best-effort: visitor analytics must never break the
 * primary reading/comment/reaction/bookmark action. During the IR-301 rollout,
 * old aggregate/current-state tables remain canonical for their existing UI.
 */
export async function recordInteractionEvent(
  supabase: SupabaseClient,
  input: InteractionEventInput,
): Promise<boolean> {
  const sessionId = getOrCreateReaderSessionId();
  const row = {
    event_id: input.eventId ?? crypto.randomUUID(),
    event_name: input.eventName,
    event_version: 1,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    content_id: input.context.contentId ?? null,
    slug: input.context.slug ?? null,
    page_type: input.context.pageType,
    session_id: sessionId,
    locale: input.context.locale || document.documentElement.lang || 'ko',
    source: input.context.source || 'web',
    public_path: input.context.publicPath || window.location.pathname,
    metadata: safeMetadata(input.metadata),
  };

  try {
    const { error } = await supabase.from('interaction_events').insert(row);
    if (error) {
      if (import.meta.env.DEV) console.debug('[interaction-events] write skipped:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    if (import.meta.env.DEV) console.debug('[interaction-events] write failed:', error);
    return false;
  }
}

export function recordInteractionEventBestEffort(
  supabase: SupabaseClient,
  input: InteractionEventInput,
): void {
  void recordInteractionEvent(supabase, input);
}
