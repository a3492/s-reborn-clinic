interface CheckResult {
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function result(key: string, label: string, status: 'ok' | 'warn' | 'error', detail: string): CheckResult {
  return { key, label, status, detail };
}

function requiredEnv(env: Record<string, unknown>) {
  return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GITHUB_TOKEN', 'GITHUB_REPO'].filter((key) => !env[key]);
}

async function supabaseFetch(env: any, path: string, init?: RequestInit) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

export const onRequestGet = async ({ env }: any) => {
  const checks: CheckResult[] = [];
  const missing = requiredEnv(env);

  if (missing.length > 0) {
    checks.push(result('env', 'Required Env', 'error', `누락된 환경 변수: ${missing.join(', ')}`));
    return Response.json({ ok: false, checks }, { status: 500 });
  }

  checks.push(result('env', 'Required Env', 'ok', '필수 Cloudflare Pages 환경 변수가 모두 설정되어 있습니다.'));

  try {
    const postsRes = await supabaseFetch(env, 'posts?select=id&limit=1');
    if (!postsRes.ok) {
      const error = await safeJson(postsRes);
      checks.push(result('supabase', 'Supabase Service Role', 'error', error?.message || 'posts 조회 실패'));
    } else {
      checks.push(result('supabase', 'Supabase Service Role', 'ok', 'Service role로 posts 조회가 가능합니다.'));
    }
  } catch (error: any) {
    checks.push(result('supabase', 'Supabase Service Role', 'error', error?.message || 'Supabase 연결 실패'));
  }

  const repo = String(env.GITHUB_REPO || '');
  const branch = String(env.GITHUB_BRANCH || 'main');
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 's-reborn-clinic-admin-health',
  };

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    const repoJson = await safeJson(repoRes);
    if (!repoRes.ok) {
      checks.push(result('github_repo', 'GitHub Repo Access', 'error', repoJson?.message || 'repo 조회 실패'));
    } else {
      checks.push(result('github_repo', 'GitHub Repo Access', 'ok', `${repo} 저장소 접근이 가능합니다.`));
    }
  } catch (error: any) {
    checks.push(result('github_repo', 'GitHub Repo Access', 'error', error?.message || 'GitHub repo 연결 실패'));
  }

  try {
    const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${encodeURIComponent(branch)}`, { headers });
    const branchJson = await safeJson(branchRes);
    if (!branchRes.ok) {
      checks.push(result('github_branch', 'GitHub Branch Access', 'error', branchJson?.message || 'branch 조회 실패'));
    } else {
      checks.push(result('github_branch', 'GitHub Branch Access', 'ok', `${branch} 브랜치를 찾았습니다.`));
    }
  } catch (error: any) {
    checks.push(result('github_branch', 'GitHub Branch Access', 'error', error?.message || 'GitHub branch 연결 실패'));
  }

  const kv = env.SITE_CACHE as KVNamespace | undefined;
  if (!kv) {
    checks.push(
      result(
        'site_cache_kv',
        'SITE_CACHE KV',
        'warn',
        'SITE_CACHE 바인딩이 없습니다. /api/cached/* 는 Supabase 직조회로 동작합니다.',
      ),
    );
  } else {
    const probeKey = `__health_kv_${Date.now()}`;
    try {
      await kv.put(probeKey, JSON.stringify({ ping: true }), { expirationTtl: 120 });
      const got = await kv.get(probeKey, { type: 'json' });
      await kv.delete(probeKey);
      if (got && typeof got === 'object' && (got as { ping?: boolean }).ping === true) {
        checks.push(result('site_cache_kv', 'SITE_CACHE KV', 'ok', 'put/get/delete 프로브 성공'));
      } else {
        checks.push(result('site_cache_kv', 'SITE_CACHE KV', 'warn', 'KV 응답 형식이 예상과 다릅니다.'));
      }
    } catch (error: any) {
      checks.push(
        result('site_cache_kv', 'SITE_CACHE KV', 'warn', error?.message || 'KV put/get 테스트 실패'),
      );
    }
  }

  const ok = checks.every((check) => check.status !== 'error');
  return Response.json({ ok, checks, repo, branch });
};
