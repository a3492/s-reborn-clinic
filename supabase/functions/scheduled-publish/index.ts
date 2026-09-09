import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
    const publishSecret = (Deno.env.get('PUBLISH_SECRET') ?? '').trim();

    if (!supabaseUrl || !serviceKey) {
      console.error('[scheduled-publish] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!siteUrl) {
      console.error('[scheduled-publish] SITE_URL is not set');
      return new Response(JSON.stringify({ error: 'SITE_URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!publishSecret) {
      console.warn('[scheduled-publish] PUBLISH_SECRET is empty; Cloudflare publish may return 401 if PUBLISH_SECRET is set there');
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const nowIso = new Date().toISOString();

    const { data: rows, error: qErr } = await supabase
      .from('posts')
      .select('id, slug, scheduled_at, content_version, deploy_status')
      .eq('status', 'draft')
      .in('deploy_status', ['idle', 'failed', 'rolled_back'])
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true });

    if (qErr) {
      console.error('[scheduled-publish] posts query failed:', qErr.message);
      return new Response(JSON.stringify({ error: qErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const list = rows ?? [];
    console.log(`[scheduled-publish] eligible candidates at ${nowIso}: ${list.length}`);

    const results: Array<{
      slug: string;
      contentVersion: number;
      ok: boolean;
      status?: number;
      detail?: string;
    }> = [];

    const publishUrl = `${siteUrl}/api/admin/publish`;

    for (const row of list) {
      const slug = row.slug as string;
      const contentVersion = Number(row.content_version ?? 1);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (publishSecret) {
        headers['X-Publish-Secret'] = publishSecret;
      }

      try {
        const res = await fetch(publishUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slug,
            contentVersion,
            dryRun: false,
            requestedBy: null,
          }),
        });

        const text = await res.text();
        let detail = text.slice(0, 800);
        try {
          const j = JSON.parse(text);
          detail = j.error ? String(j.error) : res.ok ? 'ok' : text.slice(0, 800);
        } catch {
          /* plain text */
        }

        results.push({ slug, contentVersion, ok: res.ok, status: res.status, detail });
        console.log(
          `[scheduled-publish] ${slug}@v${contentVersion} → HTTP ${res.status}`,
          detail.slice(0, 160),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[scheduled-publish] ${slug}@v${contentVersion} fetch error:`, msg);
        results.push({ slug, contentVersion, ok: false, detail: msg });
      }
    }

    const summary = {
      ok: true,
      checkedAt: nowIso,
      count: list.length,
      results,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scheduled-publish] fatal:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
