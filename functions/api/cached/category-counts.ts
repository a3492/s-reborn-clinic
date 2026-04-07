import { withCache } from '../../lib/kv-cache';
import { supabaseServiceFetch } from '../../lib/supabase-service';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const PAGE = 1000;
const MAX_PAGES = 50;

async function fetchAllPublishedCategories(svc: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) {
  const counts = new Map<string, number>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE;
    const r = await supabaseServiceFetch(
      svc,
      `posts?select=category&status=eq.published&offset=${from}&limit=${PAGE}`,
    );
    if (!r.ok) {
      const err = await r.text();
      throw new Error(err || `posts ${r.status}`);
    }
    const rows = (await r.json()) as { category?: string | null }[];
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const c = (row.category || 'uncategorized').trim() || 'uncategorized';
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    if (rows.length < PAGE) break;
  }
  return Object.fromEntries(counts);
}

export const onRequestGet = async ({ env }: { env: Record<string, unknown> }) => {
  const url = env.SUPABASE_URL as string | undefined;
  const key = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !key) {
    return Response.json({ ok: false, error: 'Server misconfigured.' }, { status: 500, headers: cors });
  }

  const svc = { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key };

  try {
    const data = await withCache(env as { SITE_CACHE?: KVNamespace }, 'category:counts', 1800, () =>
      fetchAllPublishedCategories(svc),
    );
    return Response.json({ ok: true, data }, { headers: cors });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ ok: false, error: msg }, { status: 502, headers: cors });
  }
};
