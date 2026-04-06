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

const REPORT_TYPES = new Set(['typo', 'factual_error', 'outdated', 'other']);
const SLUG_RE = /^[a-zA-Z0-9/_-]+$/;
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

  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? '').trim().slice(0, 512);
  const reportType = String(body?.report_type ?? '').trim();
  const description = String(body?.description ?? '').trim().slice(0, 4000);
  const reporterEmailRaw = String(body?.reporter_email ?? '').trim().slice(0, 320);

  if (!slug || slug.length > 400 || !SLUG_RE.test(slug)) {
    return jsonResponse({ error: '유효하지 않은 글 경로입니다.' }, 400);
  }
  if (!REPORT_TYPES.has(reportType)) {
    return jsonResponse({ error: '신고 유형을 선택해 주세요.' }, 400);
  }
  if (reporterEmailRaw && !EMAIL_RE.test(reporterEmailRaw)) {
    return jsonResponse({ error: '이메일 형식을 확인해 주세요.' }, 400);
  }

  const row = {
    slug,
    report_type: reportType,
    description: description || null,
    reporter_email: reporterEmailRaw ? reporterEmailRaw.toLowerCase() : null,
    status: 'open',
  };

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/post_reports`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });

  if (!insertRes.ok) {
    const err = await safeJson(insertRes);
    return jsonResponse(
      { error: err?.message || err?.hint || '신고 저장에 실패했습니다.' },
      502,
    );
  }

  if (env.RESEND_API_KEY && env.FROM_EMAIL) {
    const adminRaw = (env.ADMIN_EMAIL || env.FROM_EMAIL).trim();
    const recipients = adminRaw
      .split(',')
      .map((e) => e.trim())
      .filter((e) => EMAIL_RE.test(e));
    const to = recipients.length ? recipients : [env.FROM_EMAIL.trim()].filter((e) => EMAIL_RE.test(e));

    if (to.length) {
      const lines = [
        `slug: ${slug}`,
        `유형: ${reportType}`,
        description ? `설명:\n${description}` : '설명: (없음)',
        reporterEmailRaw ? `회신 요청 이메일: ${reporterEmailRaw}` : '회신 이메일: (없음)',
      ];
      const text = lines.join('\n\n');
      const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;">${text.replace(/</g, '&lt;')}</pre>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to,
          subject: `[글 오류 신고] ${slug} · ${reportType}`,
          text,
          html,
        }),
      }).catch(() => null);
    }
  }

  return jsonResponse({ ok: true });
};
