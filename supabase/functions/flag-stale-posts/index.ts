import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PostRow = {
  id: string;
  slug: string | null;
  title: string | null;
  published_at: string | null;
  last_reviewed_at: string | null;
  review_interval_days: number | null;
};

function isStale(row: PostRow): boolean {
  if (!row.published_at) return false;
  const daysRaw = row.review_interval_days;
  const d = Number(daysRaw);
  const intervalDays = Number.isFinite(d) && d > 0 ? Math.floor(d) : 180;
  const refMs = row.last_reviewed_at
    ? new Date(row.last_reviewed_at).getTime()
    : new Date(row.published_at).getTime();
  if (Number.isNaN(refMs)) return false;
  const thresholdMs = intervalDays * 24 * 60 * 60 * 1000;
  return Date.now() - refMs >= thresholdMs;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer || bearer !== serviceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: rows, error: qErr } = await supabase
      .from('posts')
      .select('id, slug, title, published_at, last_reviewed_at, review_interval_days')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .limit(8000);

    if (qErr) {
      console.error('[flag-stale-posts] select:', qErr.message);
      return new Response(JSON.stringify({ error: qErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stale = (rows ?? []).filter(isStale);
    const staleIds = stale.map((r) => r.id);

    if (staleIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, flagged: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: uErr } = await supabase.from('posts').update({ needs_review: true }).in('id', staleIds);

    if (uErr) {
      console.error('[flag-stale-posts] update:', uErr.message);
      return new Response(JSON.stringify({ error: uErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const n = staleIds.length;
    const { error: nErr } = await supabase.from('admin_notifications').insert({
      type: 'content_review',
      title: `검토 필요 글 ${n}개`,
      body: `의료 정보 주기 검토 기준에 따라 published 글 ${n}건이 검토 필요로 표시되었습니다.`,
      resource_slug: null,
    });

    if (nErr) {
      console.error('[flag-stale-posts] admin_notifications:', nErr.message);
    }

    return new Response(JSON.stringify({ ok: true, flagged: n }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[flag-stale-posts]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
