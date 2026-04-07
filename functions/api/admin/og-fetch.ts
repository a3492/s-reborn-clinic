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
  return Response.json(body, { status });
}

async function supabaseFetch(env: Record<string, unknown>, path: string, init?: RequestInit) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: String(env.SUPABASE_SERVICE_ROLE_KEY),
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

/** upload.ts 와 동일 — 관리자만 HTML fetch */
async function authorizeAdminFetch(request: Request, env: Record<string, unknown>) {
  const expectedSecret = String(env.PUBLISH_SECRET ?? '').trim();
  if (!expectedSecret) {
    return { ok: true as const };
  }

  const headerSecret =
    request.headers.get('X-Publish-Secret') ?? request.headers.get('x-publish-secret') ?? '';
  if (headerSecret === expectedSecret) {
    return { ok: true as const };
  }

  const auth = request.headers.get('Authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) {
    return {
      ok: false as const,
      status: 401,
      error: 'PUBLISH_SECRET이 설정된 경우 X-Publish-Secret 또는 관리자 Authorization(Bearer)이 필요합니다.',
    };
  }

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${m[1]}`,
      apikey: String(env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });

  if (!userRes.ok) {
    return { ok: false as const, status: 401, error: '유효하지 않은 인증입니다.' };
  }

  const userJson = await safeJson(userRes);
  const userId = userJson?.id;
  if (!userId) {
    return { ok: false as const, status: 401, error: '유효하지 않은 인증입니다.' };
  }

  const profRes = await supabaseFetch(env, `admin_profiles?id=eq.${encodeURIComponent(userId)}&select=role`);
  if (!profRes.ok) {
    return { ok: false as const, status: 403, error: '관리자 프로필을 확인할 수 없습니다.' };
  }

  const profs = await safeJson(profRes);
  const prof = Array.isArray(profs) ? profs[0] : null;
  if (!prof?.role) {
    return { ok: false as const, status: 403, error: '관리자 권한이 없습니다.' };
  }

  return { ok: true as const };
}

function decodeBasicEntities(s: string) {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeBasicEntities(m[1].trim());
  }
  return null;
}

function extractOgFromHtml(html: string) {
  return {
    ogTitle: pickMeta(html, [
      /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i,
    ]),
    ogDescription: pickMeta(html, [
      /<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i,
    ]),
    ogImage: pickMeta(html, [
      /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["'][^>]*>/i,
    ]),
    twitterCard: pickMeta(html, [
      /<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:card["'][^>]*>/i,
      /<meta\s+[^>]*property=["']twitter:card["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    ]),
    twitterTitle: pickMeta(html, [
      /<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:title["'][^>]*>/i,
    ]),
  };
}

function pickCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  if (m?.[1]) return decodeBasicEntities(m[1].trim());
  const m2 = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return m2?.[1] ? decodeBasicEntities(m2[1].trim()) : null;
}

function allowedHostnameSet(env: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    try {
      out.add(new URL(t.startsWith('http') ? t : `https://${t}`).hostname);
    } catch {
      /* skip */
    }
  };
  add(String(env.PUBLIC_SITE_URL ?? ''));
  add(String(env.SITE_URL ?? ''));
  /** 로컬 미리보기 */
  out.add('localhost');
  out.add('127.0.0.1');
  return out;
}

export const onRequestPost = async (context: { request: Request; env: Record<string, unknown> }) => {
  const { request, env } = context;

  if (!String(env.SUPABASE_URL ?? '').trim() || !String(env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()) {
    return jsonResponse({ error: 'Supabase 환경 변수가 없습니다.' }, 500);
  }

  const authz = await authorizeAdminFetch(request, env);
  if (!authz.ok) {
    return jsonResponse({ error: authz.error }, authz.status);
  }

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return jsonResponse({ error: 'JSON 본문이 필요합니다.' }, 400);
  }

  const urlStr = String(body?.url ?? '').trim();
  if (!urlStr) {
    return jsonResponse({ error: 'url 필드가 필요합니다.' }, 400);
  }

  let target: URL;
  try {
    target = new URL(urlStr);
  } catch {
    return jsonResponse({ error: '유효한 URL이 아닙니다.' }, 400);
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return jsonResponse({ error: 'http(s) URL만 허용됩니다.' }, 400);
  }

  const allowed = allowedHostnameSet(env);
  if (!allowed.has(target.hostname)) {
    return jsonResponse({ error: '허용되지 않은 호스트입니다. PUBLIC_SITE_URL과 일치하는 사이트만 조회할 수 있습니다.' }, 403);
  }

  const res = await fetch(target.toString(), {
    redirect: 'follow',
    headers: {
      'User-Agent': 'S-Reborn-Admin-OG-Fetch/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html = await res.text();
  const slice = html.length > 1_500_000 ? html.slice(0, 1_500_000) : html;
  const meta = extractOgFromHtml(slice);
  const canonical = pickCanonical(slice);

  return jsonResponse({
    ok: true,
    status: res.status,
    finalUrl: res.url,
    meta,
    canonical,
  });
};
