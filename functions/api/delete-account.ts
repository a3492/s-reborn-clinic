async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
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

function getBearerToken(request: Request): string | null {
  const h = request.headers.get('Authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });

/**
 * 독자 계정 삭제: 클라이언트 JWT로 본인 확인 후 GoTrue Admin API로 auth.users 삭제.
 * 북마크·반응·댓글 등은 FK ON DELETE CASCADE로 정리됩니다.
 */
export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = env.SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }

  const jwt = getBearerToken(request);
  if (!jwt) {
    return jsonResponse({ error: 'Authorization Bearer token required.' }, 401);
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: anonKey,
    },
  });

  const userBody = await safeJson(userRes);
  if (!userRes.ok || !userBody || typeof userBody !== 'object') {
    return jsonResponse({ error: 'Invalid or expired session.' }, 401);
  }

  const userId = userBody.id;
  if (typeof userId !== 'string' || !userId) {
    return jsonResponse({ error: 'Invalid or expired session.' }, 401);
  }

  const delRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (!delRes.ok) {
    const errBody = await safeJson(delRes);
    const msg =
      typeof errBody?.msg === 'string'
        ? errBody.msg
        : typeof errBody?.message === 'string'
          ? errBody.message
          : 'Account deletion failed.';
    return jsonResponse({ error: msg }, 502);
  }

  return jsonResponse({ ok: true });
};
