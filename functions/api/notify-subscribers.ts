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
    headers: { 'Content-Type': 'application/json' },
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

const BATCH_SIZE = 100;

export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  const secret = env.NOTIFY_SUBSCRIBERS_SECRET?.trim();
  if (!secret) {
    return jsonResponse({ error: 'Notify endpoint is not configured.' }, 503);
  }
  if (request.headers.get('x-notify-secret')?.trim() !== secret) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }

  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    return jsonResponse({ error: 'Resend is not configured.' }, 500);
  }

  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? '').trim();
  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const postUrlInput = String(body?.postUrl ?? '').trim();

  if (!slug || !title) {
    return jsonResponse({ error: 'slug and title are required.' }, 400);
  }

  const listRes = await fetch(`${env.SUPABASE_URL}/rest/v1/lab_waitlist?select=email`, {
    headers: supabaseHeaders(env),
  });

  if (!listRes.ok) {
    const err = await safeJson(listRes);
    return jsonResponse({ error: err?.message || '구독자 목록 조회 실패' }, 502);
  }

  const rows = (await safeJson(listRes)) as { email?: string }[];
  const emails = Array.from(
    new Set(
      (Array.isArray(rows) ? rows : [])
        .map((r) => String(r?.email ?? '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  if (emails.length === 0) {
    return jsonResponse({ ok: true, sent: 0, message: 'No subscribers.' });
  }

  const site =
    env.PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    new URL(request.url).origin.replace(/\/$/, '');
  const postUrl =
    postUrlInput ||
    `${site}/blog/${slug
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/')}/`;

  const htmlBody = `
    <p>새 글이 발행되었습니다.</p>
    <p><strong>${escapeHtml(title)}</strong></p>
    ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    <p><a href="${escapeHtml(postUrl)}">글 읽으러 가기</a></p>
  `.trim();

  const textBody = [
    '새 글이 발행되었습니다.',
    title,
    description || '',
    postUrl,
  ]
    .filter(Boolean)
    .join('\n\n');

  let sent = 0;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const batchPayload = chunk.map((to) => ({
      from: env.FROM_EMAIL,
      to: [to],
      subject: `새 글: ${title.slice(0, 120)}`,
      html: htmlBody,
      text: textBody,
    }));

    const resendRes = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload),
    });

    if (!resendRes.ok) {
      const err = await safeJson(resendRes);
      return jsonResponse(
        {
          error: err?.message || 'Resend batch 실패',
          sent,
        },
        502,
      );
    }
    sent += chunk.length;
  }

  return jsonResponse({ ok: true, sent });
};

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
