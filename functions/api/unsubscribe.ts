const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function supabaseHeaders(env: Record<string, string | undefined>) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** 구 메일의 GET /api/unsubscribe 링크 → 확인 페이지로만 보냄 (자동 삭제 방지) */
export const onRequestGet = async ({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) => {
  const url = new URL(request.url);
  const rawEmail = url.searchParams.get('email')?.trim() ?? '';
  const base = (env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (!base) {
    return new Response('PUBLIC_SITE_URL이 설정되지 않았습니다.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const path = rawEmail
    ? `/unsubscribe?email=${encodeURIComponent(rawEmail.toLowerCase())}`
    : '/unsubscribe';
  return Response.redirect(`${base}${path}`, 302);
};

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: '서버 설정 오류입니다.' }, 500);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'JSON 본문이 필요합니다.' }, 400);
  }

  const rawEmail = String(body.email ?? '').trim();
  const email = rawEmail.toLowerCase();

  if (!email) {
    return jsonResponse({ error: '이메일 주소가 필요합니다.' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: '이메일 형식이 올바르지 않습니다.' }, 400);
  }

  const delRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/lab_waitlist?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'DELETE',
      headers: {
        ...supabaseHeaders(env),
        Prefer: 'return=minimal',
      },
    },
  );

  if (!delRes.ok) {
    return jsonResponse({ error: '구독 목록을 갱신하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
  }

  return jsonResponse({ ok: true });
};
