const READER_SESSION_COOKIE = 'sreborn_reader_session_id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ServerInteractionEventName = 'comment.submitted' | 'error.reported';

export function readReaderSessionId(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName !== READER_SESSION_COOKIE) continue;
    const rawValue = rest.join('=');
    try {
      const value = decodeURIComponent(rawValue);
      return UUID_RE.test(value) ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function recordServerInteractionEvent(
  env: Record<string, string | undefined>,
  input: {
    eventName: ServerInteractionEventName;
    slug: string;
    sessionId: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  if (!input.sessionId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;

  const row = {
    event_id: crypto.randomUUID(),
    event_name: input.eventName,
    event_version: 1,
    occurred_at: new Date().toISOString(),
    content_id: null,
    slug: input.slug,
    public_path: null,
    page_type: 'article',
    session_id: input.sessionId,
    locale: 'ko',
    source: 'web',
    metadata: input.metadata ?? {},
  };

  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/interaction_events`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!response.ok) {
      console.warn('[interaction-events] server event write skipped:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[interaction-events] server event write failed:', error);
    return false;
  }
}
