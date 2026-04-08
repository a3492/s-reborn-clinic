import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** slug + category → 공개 글 URL (트레일링 슬래시) */
function postPublicUrl(siteBase: string, slug: string, category: string | null): string {
  const base = siteBase.replace(/\/$/, '');
  const enc = (path: string) => path.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  if (slug.startsWith('doctor-ai-academy/')) {
    const rest = slug.slice('doctor-ai-academy/'.length);
    return `${base}/doctor-ai-academy/${enc(rest)}/`;
  }
  if (category === 'doctor-ai' || slug.startsWith('doctor-ai/')) {
    const rest = slug.startsWith('doctor-ai/') ? slug.slice('doctor-ai/'.length) : slug;
    return `${base}/doctor-ai-academy/${enc(rest)}/`;
  }
  return `${base}/blog/${enc(slug)}/`;
}

async function authorize(
  req: Request,
  serviceClient: ReturnType<typeof createClient>,
): Promise<boolean> {
  const raw = req.headers.get('Authorization') ?? '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (payload?.role === 'service_role') return true;
  const sub = typeof payload?.sub === 'string' ? payload.sub : null;
  if (!sub) return false;
  const { data, error } = await serviceClient.from('admin_profiles').select('role').eq('id', sub).maybeSingle();
  return !error && !!data?.role;
}

function buildNewsletterHtml(
  siteUrl: string,
  articles: { title: string; description: string; url: string }[],
  unsubscribeUrl: string,
  dateLabel: string,
): string {
  const items = articles
    .map(
      (a) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e8e8e8;">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1a1a2e;">${escapeHtml(a.title)}</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#444;">${escapeHtml(a.description)}</p>
        <a href="${escapeHtml(a.url)}" style="display:inline-block;font-size:14px;font-weight:600;color:#8c6d45;text-decoration:none;">읽으러 가기 →</a>
      </td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr><td style="padding:28px 24px 8px;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:-0.02em;">S-Reborn AI Blog</p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#333;">안녕하세요. 이번 주 인기 글을 모아 보냅니다.</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}</table>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;background:#fafafa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#888;">더 이상 메일을 받고 싶지 않으시면 <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8c6d45;">구독 취소</a>를 눌러 주세요.</p>
          <p style="margin:8px 0 0;font-size:11px;color:#aaa;">${escapeHtml(dateLabel)} · S-Reborn Clinic</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNewsletterText(
  siteUrl: string,
  articles: { title: string; description: string; url: string }[],
  unsubscribeUrl: string,
): string {
  const lines = [
    'S-Reborn AI Blog',
    '',
    '이번 주 인기 글을 모아 보냅니다.',
    '',
    ...articles.flatMap((a) => [a.title, a.description || '', a.url, '']),
    `구독 취소: ${unsubscribeUrl}`,
    '',
    siteUrl,
  ];
  return lines.join('\n');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? '';
    const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!resendKey || !fromEmail || !siteUrl) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY, FROM_EMAIL, SITE_URL required' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const allowed = await authorize(req, supabase);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: postRows, error: postsError } = await supabase
      .from('posts')
      .select('slug, title, description, category, published_at')
      .eq('status', 'published')
      .gte('published_at', weekAgo)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('[weekly-newsletter] posts query:', postsError.message);
      return new Response(JSON.stringify({ error: postsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const posts = postRows ?? [];
    if (posts.length === 0) {
      console.log('[weekly-newsletter] skip: no posts in window');
      return new Response(JSON.stringify({ ok: true, skipped: 'no_posts', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slugs = [...new Set(posts.map((p) => p.slug).filter(Boolean))];
    const { data: viewRows } = await supabase.from('post_views').select('slug, view_count').in('slug', slugs);
    const viewMap = new Map<string, number>();
    for (const v of viewRows ?? []) {
      viewMap.set(v.slug as string, Number(v.view_count ?? 0));
    }

    const merged = posts.map((p) => ({
      slug: p.slug as string,
      title: String(p.title ?? ''),
      description: String(p.description ?? '').slice(0, 400),
      category: p.category as string | null,
      published_at: p.published_at as string,
      view_count: viewMap.get(p.slug as string) ?? 0,
    }));

    merged.sort((a, b) => {
      if (b.view_count !== a.view_count) return b.view_count - a.view_count;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    const top = merged.slice(0, 5);
    const articles = top.map((p) => ({
      title: p.title,
      description: p.description,
      url: postPublicUrl(siteUrl, p.slug, p.category),
    }));

    const { data: listRows, error: listError } = await supabase.from('lab_waitlist').select('email');
    if (listError) {
      console.error('[weekly-newsletter] lab_waitlist:', listError.message);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emails = Array.from(
      new Set(
        (listRows ?? [])
          .map((r) => String((r as { email?: string }).email ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    if (emails.length === 0) {
      console.log('[weekly-newsletter] skip: no subscribers');
      return new Response(JSON.stringify({ ok: true, skipped: 'no_subscribers', sent: 0, posts: top.length }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateLabel = new Date().toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = `이번 주 S-Reborn AI Blog — ${dateLabel}`;

    const BATCH = 100;
    let sent = 0;
    for (let i = 0; i < emails.length; i += BATCH) {
      const chunk = emails.slice(i, i + BATCH);
      const batchPayload = chunk.map((to) => {
        const unsub = `${siteUrl}/unsubscribe?email=${encodeURIComponent(to)}`;
        return {
          from: fromEmail,
          to: [to],
          subject,
          html: buildNewsletterHtml(siteUrl, articles, unsub, dateLabel),
          text: buildNewsletterText(siteUrl, articles, unsub),
        };
      });

      const resendRes = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error('[weekly-newsletter] Resend error:', resendRes.status, errText);
        return new Response(
          JSON.stringify({ error: 'Resend batch failed', detail: errText.slice(0, 300), sent }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      sent += chunk.length;
    }

    const nowIso = new Date().toISOString();
    const htmlForArchive = buildNewsletterHtml(
      siteUrl,
      articles,
      `${siteUrl}/unsubscribe`,
      dateLabel,
    );
    const { error: archiveErr } = await supabase.from('newsletter_archives').insert({
      subject,
      html_body: htmlForArchive,
      sent_at: nowIso,
      recipient_count: emails.length,
    });
    if (archiveErr) {
      console.error('[weekly-newsletter] newsletter_archives insert:', archiveErr.message);
    }

    const { error: upsertErr } = await supabase.from('site_settings').upsert(
      {
        key: 'newsletter',
        value_json: {
          last_sent_at: nowIso,
          last_post_count: top.length,
          last_recipient_count: sent,
          last_subject: subject,
        },
      },
      { onConflict: 'key' },
    );

    if (upsertErr) {
      console.warn('[weekly-newsletter] site_settings upsert:', upsertErr.message);
    }

    console.log(`[weekly-newsletter] sent ${sent} emails, ${top.length} articles`);
    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        posts: top.length,
        last_sent_at: nowIso,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[weekly-newsletter]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
