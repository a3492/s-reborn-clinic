import { strToU8, zip } from 'fflate';
import { buildFrontmatter, buildTargetPath } from '../../lib/post-format';

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

async function authorizeExportOwner(request: Request, env: Record<string, string | undefined>) {
  const token =
    request.headers.get('X-Auth-Token')?.trim() ||
    request.headers.get('x-auth-token')?.trim() ||
    request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ||
    '';
  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: 'X-Auth-Token 헤더에 Supabase 세션 access_token을 넣어 주세요.',
    };
  }

  const base = String(env.SUPABASE_URL ?? '').replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !serviceKey) {
    return { ok: false as const, status: 500, error: '서버 설정 오류입니다.' };
  }

  const userRes = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceKey,
    },
  });

  if (!userRes.ok) {
    return { ok: false as const, status: 401, error: '유효하지 않은 세션입니다.' };
  }

  const userJson = (await safeJson(userRes)) as Record<string, unknown> | null;
  const userId = typeof userJson?.id === 'string' ? userJson.id : null;
  if (!userId) {
    return { ok: false as const, status: 401, error: '유효하지 않은 세션입니다.' };
  }

  const profRes = await fetch(
    `${base}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  if (!profRes.ok) {
    return { ok: false as const, status: 403, error: '관리자 프로필을 확인할 수 없습니다.' };
  }

  const profs = (await safeJson(profRes)) as unknown;
  const prof = Array.isArray(profs) ? (profs[0] as Record<string, unknown> | undefined) : null;
  if (prof?.role !== 'owner') {
    return { ok: false as const, status: 403, error: '콘텐츠 백업은 owner만 다운로드할 수 있습니다.' };
  }

  return { ok: true as const };
}

function allocateZipPath(files: Record<string, Uint8Array>, post: Record<string, unknown>): string {
  const base = buildTargetPath(post);
  if (!files[base]) return base;
  const id = typeof post.id === 'string' ? post.id.slice(0, 8) : 'dup';
  const stem = base.replace(/\.md$/i, '');
  let i = 2;
  let candidate = `${stem}__${id}.md`;
  while (files[candidate]) {
    candidate = `${stem}__${id}_${i}.md`;
    i += 1;
  }
  return candidate;
}

export const onRequestGet = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  const missingEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !String(env[k] ?? '').trim());
  if (missingEnv.length) {
    return jsonResponse({ error: '환경변수 누락: ' + missingEnv.join(', ') }, 500);
  }

  const authz = await authorizeExportOwner(request, env);
  if (!authz.ok) {
    return jsonResponse({ error: authz.error }, authz.status);
  }

  const base = String(env.SUPABASE_URL).replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY!;

  const allPosts: Record<string, unknown>[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const url = `${base}/rest/v1/posts?status=eq.published&select=*&order=slug.asc&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) {
      const err = await safeJson(res);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : res.statusText;
      return jsonResponse({ error: `posts 조회 실패: ${msg}` }, 502);
    }

    const batch = (await safeJson(res)) as unknown;
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const row of batch) {
      if (row && typeof row === 'object') allPosts.push(row as Record<string, unknown>);
    }

    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  const files: Record<string, Uint8Array> = {};
  for (const post of allPosts) {
    const path = allocateZipPath(files, post);
    const md = buildFrontmatter(post) + String(post.body_markdown ?? '');
    files[path] = strToU8(md, false);
  }

  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(zipped, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="s-reborn-blog-${date}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
};
