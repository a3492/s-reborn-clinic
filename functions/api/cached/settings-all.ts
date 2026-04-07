import { withCache } from '../../lib/kv-cache';
import { supabaseServiceFetch } from '../../lib/supabase-service';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export const onRequestGet = async ({ env }: { env: Record<string, unknown> }) => {
  const url = env.SUPABASE_URL as string | undefined;
  const key = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !key) {
    return Response.json({ ok: false, error: 'Server misconfigured.' }, { status: 500, headers: cors });
  }

  try {
    const data = await withCache(
      env as { SITE_CACHE?: KVNamespace },
      'settings:all',
      600,
      async () => {
        const r = await supabaseServiceFetch(
          { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key },
          'site_settings?select=key,value_json&key=in.(site_meta,homepage,about_page,social_links)',
        );
        if (!r.ok) {
          const err = await r.text();
          throw new Error(err || `site_settings ${r.status}`);
        }
        return (await r.json()) as unknown;
      },
    );
    return Response.json({ ok: true, data }, { headers: cors });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ ok: false, error: msg }, { status: 502, headers: cors });
  }
};
