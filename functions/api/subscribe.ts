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

async function insertAdminNotification(
  env: Record<string, string | undefined>,
  row: { type: string; title: string; body?: string | null; resource_slug?: string | null },
) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/admin_notifications`, {
      method: 'POST',
      headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        type: row.type,
        title: row.title,
        body: row.body ?? null,
        resource_slug: row.resource_slug ?? null,
      }),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      console.error('[subscribe] admin_notifications insert failed:', err?.message || res.status);
    }
  } catch (e) {
    console.error('[subscribe] admin_notifications insert failed:', e);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const rawEmail = String(body?.email ?? '').trim();
  const source = String(body?.source ?? 'lab').trim().slice(0, 64) || 'lab';
  const email = rawEmail.toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: '유효한 이메일 주소를 입력해 주세요.' }, 400);
  }

  const upsertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/lab_waitlist?on_conflict=email`, {
    method: 'POST',
    headers: supabaseHeaders(env, {
      Prefer: 'return=minimal,resolution=merge-duplicates',
    }),
    body: JSON.stringify({ email, source, updated_at: new Date().toISOString() }),
  });

  if (!upsertRes.ok) {
    const err = await safeJson(upsertRes);
    return jsonResponse(
      { error: err?.message || err?.hint || '구독 저장에 실패했습니다.' },
      502,
    );
  }

  await insertAdminNotification(env, {
    type: 'new_subscriber',
    title: `새 구독자: ${email}`,
    body: `source: ${source}`,
    resource_slug: null,
  });

  if (env.RESEND_API_KEY && env.FROM_EMAIL) {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [email],
        subject: '에스리본 클리닉 — 구독해 주셔서 감사합니다',
        html: '<p>구독해 주셔서 감사합니다. 새 글이 올라오면 알려드릴게요.</p>',
        text: '구독해 주셔서 감사합니다. 새 글이 올라오면 알려드릴게요.',
      }),
    });

    if (!resendRes.ok) {
      const err = await safeJson(resendRes);
      return jsonResponse(
        {
          error: err?.message || '확인 이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        },
        502,
      );
    }
  }

  return jsonResponse({ ok: true });
};
