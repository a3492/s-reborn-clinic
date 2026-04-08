import { verifyTurnstile } from '../lib/turnstile';

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function supabaseHeaders(env: Record<string, string | undefined>, extra?: HeadersInit) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

const SLUG_RE = /^[a-zA-Z0-9/_-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });

export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return jsonResponse({ error: 'JSON 본문이 필요합니다.' }, 400);
  }

  const tsToken = String(body['cf-turnstile-response'] ?? '');
  const tsOk = await verifyTurnstile(tsToken, String(env.TURNSTILE_SECRET_KEY ?? ''), ip);
  if (!tsOk) {
    return jsonResponse({ error: '보안 검증 실패' }, 403);
  }

  const slug = String(body.slug ?? '').trim().slice(0, 512);
  const author_name = String(body.author_name ?? '').trim().slice(0, 50);
  const bodyText = String(body.body ?? '').trim();
  const parent_id_raw = String(body.parent_id ?? '').trim();
  const parent_id = parent_id_raw && UUID_RE.test(parent_id_raw) ? parent_id_raw : null;
  const author_email_raw = String(body.author_email ?? '').trim().slice(0, 320);

  if (!slug || slug.length > 400 || !SLUG_RE.test(slug)) {
    return jsonResponse({ error: '유효하지 않은 글 경로입니다.' }, 400);
  }
  if (!author_name) {
    return jsonResponse({ error: '이름을 입력해 주세요.' }, 400);
  }
  if (!bodyText || bodyText.length > 500) {
    return jsonResponse({ error: '내용은 1~500자로 입력해 주세요.' }, 400);
  }

  if (parent_id) {
    const parentRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/comments?id=eq.${encodeURIComponent(parent_id)}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      { headers: supabaseHeaders(env) },
    );
    if (!parentRes.ok) {
      return jsonResponse({ error: '답글 대상을 확인할 수 없습니다.' }, 502);
    }
    const rows = (await safeJson(parentRes)) as unknown[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return jsonResponse({ error: '답글 대상을 찾을 수 없습니다.' }, 400);
    }
  }

  let user_id: string | null = null;
  const authHeader = request.headers.get('Authorization') ?? '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const anonKey = String(env.SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (m?.[1] && anonKey) {
    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${m[1]}`,
        apikey: anonKey,
      },
    });
    if (userRes.ok) {
      const uj = await safeJson(userRes);
      if (uj?.id && typeof uj.id === 'string') user_id = uj.id;
    }
  }

  const row: Record<string, unknown> = {
    slug,
    author_name,
    body: bodyText,
    parent_id,
    is_approved: false,
  };
  if (author_email_raw) row.author_email = author_email_raw;
  if (user_id) row.user_id = user_id;
  else row.user_id = null;

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/comments`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });

  if (!insertRes.ok) {
    const err = await safeJson(insertRes);
    return jsonResponse(
      { error: err?.message || err?.hint || '댓글 저장에 실패했습니다.' },
      502,
    );
  }

  return jsonResponse({ ok: true });
};
