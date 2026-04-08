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
    await fetch(`${env.SUPABASE_URL}/rest/v1/admin_notifications`, {
      method: 'POST',
      headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        type: row.type,
        title: row.title,
        body: row.body ?? null,
        resource_slug: row.resource_slug ?? null,
      }),
    });
  } catch (e) {
    console.error('[consult-submit] admin_notifications insert failed:', e);
  }
}

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
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: '요청 본문이 필요합니다.' }, 400);
  }

  const name = String(body.name ?? '').trim().slice(0, 100);
  const phone = String(body.phone ?? '').trim().slice(0, 30);
  const ageRange = String(body.ageRange ?? '').trim().slice(0, 20);
  const gender = String(body.gender ?? '').trim().slice(0, 20);
  const language = String(body.language ?? 'ko').trim().slice(0, 10);
  const preferredContact = String(body.preferredContact ?? '').trim().slice(0, 50);
  const aiSummary = String(body.aiSummary ?? '').trim().slice(0, 3000);

  const concerns = Array.isArray(body.concerns)
    ? (body.concerns as { id?: string; label?: string }[]).slice(0, 20)
    : [];
  const answers = typeof body.answers === 'object' && body.answers !== null ? body.answers : {};
  const aiRecommendations = Array.isArray(body.aiRecommendations) ? body.aiRecommendations.slice(0, 10) : [];

  if (!name) return jsonResponse({ error: '이름을 입력해 주세요.' }, 400);
  if (!phone) return jsonResponse({ error: '연락처를 입력해 주세요.' }, 400);

  const row = {
    name,
    phone,
    age_range: ageRange || null,
    gender: gender || null,
    language,
    preferred_contact: preferredContact || null,
    concerns: JSON.stringify(concerns),
    answers: JSON.stringify(answers),
    ai_summary: aiSummary || null,
    ai_recommendations: JSON.stringify(aiRecommendations),
    status: 'new',
  };

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/consult_requests`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });

  if (!insertRes.ok) {
    const err = await safeJson(insertRes);
    console.error('[consult-submit] insert failed:', err);
    return jsonResponse(
      { error: err?.message || err?.hint || '상담 신청 저장에 실패했습니다.' },
      502,
    );
  }

  // ── 관리자 알림 ─────────────────────────────────────────────────
  const concernLabels = concerns.map((c) => c.label ?? c.id ?? '').filter(Boolean).join(', ');
  await insertAdminNotification(env, {
    type: 'new_consult',
    title: `새 상담 신청: ${name}`,
    body: [
      `연락처: ${phone}`,
      concernLabels ? `고민: ${concernLabels}` : null,
      preferredContact ? `선호 연락: ${preferredContact}` : null,
      aiSummary ? `AI 요약: ${aiSummary.slice(0, 200)}` : null,
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000),
    resource_slug: null,
  });

  // ── 관리자 이메일 (Resend) ───────────────────────────────────────
  if (env.RESEND_API_KEY && env.FROM_EMAIL) {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const adminRaw = (env.ADMIN_EMAIL || env.FROM_EMAIL).trim();
    const to = adminRaw
      .split(',')
      .map((e) => e.trim())
      .filter((e) => EMAIL_RE.test(e));

    if (to.length) {
      const lines = [
        `이름: ${name}`,
        `연락처: ${phone}`,
        ageRange ? `연령대: ${ageRange}` : null,
        gender ? `성별: ${gender}` : null,
        concernLabels ? `고민: ${concernLabels}` : null,
        preferredContact ? `선호 연락 방법: ${preferredContact}` : null,
        aiSummary ? `\nAI 사전 분석:\n${aiSummary}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.7">${lines.replace(/</g, '&lt;')}</pre>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to,
          subject: `[상담 신청] ${name} · ${concernLabels || '고민 미기재'}`,
          text: lines,
          html,
        }),
      }).catch((e) => console.error('[consult-submit] resend error:', e));
    }
  }

  return jsonResponse({ ok: true });
};
