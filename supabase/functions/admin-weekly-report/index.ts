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

async function authorize(req: Request, serviceClient: ReturnType<typeof createClient>): Promise<boolean> {
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

async function sumAllViewCounts(supabase: ReturnType<typeof createClient>): Promise<number> {
  let sum = 0;
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase.from('post_views').select('view_count').range(from, from + page - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const r of rows) sum += Number(r.view_count ?? 0);
    if (rows.length < page) break;
    from += page;
  }
  return sum;
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

    if (!resendKey || !fromEmail) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY and FROM_EMAIL required' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    if (!(await authorize(req, supabase))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const weekLaterIso = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const periodLabel = `${start.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} ~ ${end.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

    const { data: newPosts, error: npErr } = await supabase
      .from('posts')
      .select('title, slug, published_at')
      .eq('status', 'published')
      .gte('published_at', startIso)
      .lte('published_at', endIso)
      .order('published_at', { ascending: false });

    if (npErr) throw new Error(npErr.message);

    const { count: newSubs, error: subErr } = await supabase
      .from('lab_waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startIso);

    if (subErr) throw new Error(subErr.message);

    const { count: openReports, error: repErr } = await supabase
      .from('post_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (repErr) throw new Error(repErr.message);

    const { count: scheduledPending, error: spErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .not('scheduled_at', 'is', null)
      .gt('scheduled_at', endIso);

    if (spErr) throw new Error(spErr.message);

    const { data: weekScheduled, error: wsErr } = await supabase
      .from('posts')
      .select('title, slug, scheduled_at')
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', endIso)
      .lte('scheduled_at', weekLaterIso)
      .order('scheduled_at', { ascending: true });

    if (wsErr) throw new Error(wsErr.message);

    const { data: topViews, error: tvErr } = await supabase
      .from('post_views')
      .select('slug, view_count')
      .order('view_count', { ascending: false })
      .limit(5);

    if (tvErr) throw new Error(tvErr.message);

    const topSlugs = (topViews ?? []).map((r) => r.slug).filter(Boolean);
    let titleBySlug = new Map<string, string>();
    if (topSlugs.length) {
      const { data: titles, error: tErr } = await supabase.from('posts').select('slug, title').in('slug', topSlugs);
      if (tErr) throw new Error(tErr.message);
      titleBySlug = new Map((titles ?? []).map((r) => [r.slug as string, String(r.title ?? '')]));
    }

    const totalViews = await sumAllViewCounts(supabase);

    const { data: prevSetting } = await supabase.from('site_settings').select('value_json').eq('key', 'admin_weekly_report').maybeSingle();
    const prevSum = Number((prevSetting?.value_json as { total_views_sum?: number })?.total_views_sum ?? NaN);
    const deltaViews = Number.isFinite(prevSum) ? totalViews - prevSum : null;

    const postsList = (newPosts ?? []).length
      ? `<ul style="margin:8px 0;padding-left:20px;">${(newPosts ?? [])
          .map((p) => `<li>${escapeHtml(String(p.title ?? ''))} <span style="color:#666;font-size:13px;">(${escapeHtml(String(p.slug ?? ''))})</span></li>`)
          .join('')}</ul>`
      : '<p style="color:#666;">해당 기간 신규 발행 글이 없습니다.</p>';

    const topList = (topViews ?? []).length
      ? `<ol style="margin:8px 0;padding-left:20px;">${(topViews ?? [])
          .map(
            (r) =>
              `<li>${escapeHtml(titleBySlug.get(r.slug as string) || (r.slug as string))} — <strong>${Number(r.view_count ?? 0).toLocaleString('ko-KR')}</strong></li>`,
          )
          .join('')}</ol>`
      : '<p style="color:#666;">조회 데이터 없음</p>';

    const weekSchedHtml = (weekScheduled ?? []).length
      ? `<ul style="margin:8px 0;padding-left:20px;">${(weekScheduled ?? [])
          .map((p) => {
            const d = p.scheduled_at
              ? new Date(p.scheduled_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
              : '';
            return `<li>${escapeHtml(String(p.title ?? ''))} <span style="color:#666;">${escapeHtml(d)}</span></li>`;
          })
          .join('')}</ul>`
      : '<p style="color:#666;">예정된 글이 없습니다.</p>';

    const deltaLine =
      deltaViews === null
        ? '전주 스냅샷 없음 (다음 발송부터 증감 표시)'
        : `전주 대비 <strong>${deltaViews >= 0 ? '+' : ''}${deltaViews.toLocaleString('ko-KR')}</strong>`;

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;line-height:1.55;color:#1a1a2e;max-width:640px;">
  <h1 style="font-size:20px;margin:0 0 12px;">S-Reborn 주간 운영 리포트</h1>
  <p style="color:#666;margin:0 0 20px;">집계 구간(약 7일): ${escapeHtml(periodLabel)}</p>

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;">신규 발행</h2>
  <p><strong>${(newPosts ?? []).length}</strong>편</p>
  ${postsList}

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">조회수</h2>
  <p>전체 누적 합계: <strong>${totalViews.toLocaleString('ko-KR')}</strong></p>
  <p>${deltaLine}</p>

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">인기 글 TOP 5</h2>
  ${topList}

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">신규 구독자</h2>
  <p><strong>${newSubs ?? 0}</strong>명 <span style="color:#666;">(lab_waitlist 생성)</span></p>

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">미해결 오류 신고</h2>
  <p><strong>${openReports ?? 0}</strong>건</p>

  <h2 style="font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">예약 발행</h2>
  <p>대기 중(draft·예약일 미래): <strong>${scheduledPending ?? 0}</strong>편</p>
  <p style="margin-top:12px;">앞으로 7일 이내 예정:</p>
  ${weekSchedHtml}

  ${
    siteUrl
      ? `<p style="margin-top:28px;font-size:13px;color:#888;"><a href="${escapeHtml(siteUrl + '/admin/')}">관리자 패널</a></p>`
      : ''
  }
</body></html>`;

    const { data: owners, error: ownErr } = await supabase
      .from('admin_profiles')
      .select('email')
      .eq('role', 'owner')
      .eq('receive_report', true);

    if (ownErr) throw new Error(ownErr.message);

    const emails = Array.from(
      new Set(
        (owners ?? [])
          .map((r) => String((r as { email?: string }).email ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    if (emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_recipients', message: '수신 설정된 owner가 없습니다.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = `[S-Reborn] 주간 운영 리포트 — ${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(end)}`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: emails,
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const t = await resendRes.text();
      return new Response(JSON.stringify({ error: 'Resend failed', detail: t.slice(0, 400) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nowIso = end.toISOString();
    await supabase.from('site_settings').upsert(
      {
        key: 'admin_weekly_report',
        value_json: {
          last_sent_at: nowIso,
          total_views_sum: totalViews,
          period_start: startIso,
          period_end: endIso,
        },
      },
      { onConflict: 'key' },
    );

    return new Response(
      JSON.stringify({
        ok: true,
        sentTo: emails.length,
        last_sent_at: nowIso,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[admin-weekly-report]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
