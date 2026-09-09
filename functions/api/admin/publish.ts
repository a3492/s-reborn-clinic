import { buildFrontmatter, buildTargetPath, isoNow } from '../../lib/post-format';

const encoder = new TextEncoder();
const ACTIVE_JOB_STATUSES = ['pending', 'validating', 'build_pending', 'deploying'];

function toBase64(input: string) {
  const bytes = encoder.encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function requiredEnv(env: Record<string, unknown>) {
  return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GITHUB_TOKEN', 'GITHUB_REPO'].filter((key) => !env[key]);
}

function absolutePostUrl(siteBase: string, targetPath: string) {
  const base = siteBase.replace(/\/$/, '');
  const m = targetPath.match(/^src\/content\/blog\/(.+)\.md$/i);
  if (!m) return `${base}/blog/`;
  const rel = m[1];
  const enc = (s: string) => s.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  if (rel.startsWith('doctor-ai-academy/')) {
    return `${base}/doctor-ai-academy/${enc(rel.slice('doctor-ai-academy/'.length))}/`;
  }
  if (rel.startsWith('doctor-ai/')) {
    return `${base}/doctor-ai-academy/${enc(rel.slice('doctor-ai/'.length))}/`;
  }
  return `${base}/blog/${enc(rel)}/`;
}

function countTitleSpecialChars(title: string) {
  let n = 0;
  for (const ch of title.trim()) {
    if (/[\p{L}\p{N}]/u.test(ch) || /\s/u.test(ch)) continue;
    n += 1;
  }
  return n;
}

function validatePublishablePost(post: any) {
  const errors: string[] = [];
  if (!post?.title?.trim()) errors.push('title');
  if (!post?.description?.trim()) errors.push('description');
  if (!post?.slug?.trim()) errors.push('slug');
  if (!post?.category?.trim()) errors.push('category');
  if (!post?.body_markdown?.trim()) errors.push('body_markdown');
  if (post?.status === 'archived') errors.push('archived_status');

  const warnings: string[] = [];
  const body = String(post?.body_markdown ?? '').trim();
  if (body.length < 500) warnings.push('본문이 너무 짧습니다 (500자 미만)');
  if (!post?.thumbnail_url?.trim()) warnings.push('썸네일 이미지가 없습니다');
  if (!Array.isArray(post?.tags) || post.tags.length === 0) warnings.push('태그가 없습니다');
  if (!post?.seo_description?.trim()) warnings.push('SEO 설명이 없습니다');
  if (countTitleSpecialChars(String(post?.title ?? '')) > 2) warnings.push('제목에 특수문자가 많습니다');
  if (/작성\s*중/.test(body) || /\bTODO\b/i.test(body) || /\bTBD\b/i.test(body)) {
    warnings.push('미완성 표시가 남아 있습니다');
  }
  return { errors, warnings };
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

async function authorizePublishRequest(request: Request, env: any) {
  const expectedSecret = String(env.PUBLISH_SECRET ?? '').trim();
  if (!expectedSecret) return { ok: true as const };

  const headerSecret = request.headers.get('X-Publish-Secret') ?? request.headers.get('x-publish-secret') ?? '';
  if (headerSecret === expectedSecret) return { ok: true as const };

  const auth = request.headers.get('Authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) return { ok: false as const, status: 401, error: '관리자 인증이 필요합니다.' };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${m[1]}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return { ok: false as const, status: 401, error: '유효하지 않은 인증입니다.' };
  const user = await safeJson(userRes);
  if (!user?.id) return { ok: false as const, status: 401, error: '유효하지 않은 인증입니다.' };

  const profRes = await supabaseFetch(env, `admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=role`);
  const profs = profRes.ok ? await safeJson(profRes) : [];
  if (!Array.isArray(profs) || !profs[0]?.role) {
    return { ok: false as const, status: 403, error: '관리자 권한이 없습니다.' };
  }
  return { ok: true as const };
}

async function patchPost(env: any, id: string, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, `posts?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await safeJson(res))?.message || 'posts patch failed');
}

async function patchJob(env: any, id: string, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, `publish_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await safeJson(res))?.message || 'publish_jobs patch failed');
}

async function getActiveJob(env: any, postId: string, contentVersion: number) {
  const statusList = ACTIVE_JOB_STATUSES.join(',');
  const res = await supabaseFetch(
    env,
    `publish_jobs?post_id=eq.${encodeURIComponent(postId)}&content_version=eq.${contentVersion}&status=in.(${statusList})&select=*&order=created_at.desc&limit=1`,
  );
  if (!res.ok) throw new Error((await safeJson(res))?.message || 'active publish job lookup failed');
  const rows = await safeJson(res);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function reservePublishJob(env: any, payload: Record<string, unknown>) {
  const existing = await getActiveJob(env, String(payload.post_id), Number(payload.content_version));
  if (existing) return { job: existing, reused: true };

  const res = await supabaseFetch(env, 'publish_jobs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const rows = await safeJson(res);
    return { job: Array.isArray(rows) ? rows[0] : rows, reused: false };
  }

  const error = await safeJson(res);
  if (res.status === 409 || error?.code === '23505') {
    const raced = await getActiveJob(env, String(payload.post_id), Number(payload.content_version));
    if (raced) return { job: raced, reused: true };
  }
  throw new Error(error?.message || 'publish_jobs insert failed');
}

async function insertAuditLog(env: any, payload: Record<string, unknown>) {
  await supabaseFetch(env, 'audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
}

async function insertPostVersionSnapshot(env: any, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, 'post_versions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.warn('[publish] post_versions snapshot failed:', res.status);
}

export const onRequestPost = async ({ request, env }: any) => {
  const missing = requiredEnv(env);
  if (missing.length) return jsonResponse({ error: `Missing required env bindings: ${missing.join(', ')}` }, 500);

  const authz = await authorizePublishRequest(request, env);
  if (!authz.ok) return jsonResponse({ error: authz.error }, authz.status);

  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? '').trim();
  const dryRun = Boolean(body?.dryRun);
  const requestedBy = body?.requestedBy ?? null;
  const requestedVersion = body?.contentVersion == null ? null : Number(body.contentVersion);
  if (!slug) return jsonResponse({ error: 'slug is required.' }, 400);

  const postRes = await supabaseFetch(env, `posts?slug=eq.${encodeURIComponent(slug)}&select=*`);
  if (!postRes.ok) return jsonResponse({ error: (await safeJson(postRes))?.message || 'Failed to fetch post.' }, 502);
  const rows = await safeJson(postRes);
  const post = Array.isArray(rows) ? rows[0] : null;
  if (!post) return jsonResponse({ error: 'Post not found.' }, 404);

  const contentVersion = Number(post.content_version ?? 1);
  if (requestedVersion != null && (!Number.isInteger(requestedVersion) || requestedVersion !== contentVersion)) {
    return jsonResponse({
      error: 'Requested content version is stale.',
      requestedContentVersion: requestedVersion,
      currentContentVersion: contentVersion,
    }, 409);
  }

  const targetPath = buildTargetPath(post);
  const branch = String(env.GITHUB_BRANCH || 'main');
  const commitMessage = `publish: ${post.slug} (v${contentVersion})`;
  const { errors, warnings } = validatePublishablePost(post);
  if (errors.length) {
    return jsonResponse({ error: `Post is not publishable: ${errors.join(', ')}`, validationIssues: errors, warnings, targetPath, branch }, 400);
  }

  // Artifact inclusion is independent from DB editorial/deploy status.
  const markdown = `${buildFrontmatter(post, { draft: false })}${post.body_markdown ?? ''}`;
  if (dryRun) {
    return jsonResponse({
      dryRun: true,
      targetPath,
      branch,
      commitMessage,
      postStatus: post.status,
      deployStatus: post.deploy_status ?? 'idle',
      contentVersion,
      validationIssues: errors,
      warnings,
      markdownPreview: markdown.slice(0, 1200),
    });
  }

  const publicUrl = absolutePostUrl(String(env.PUBLIC_SITE_URL || new URL(request.url).origin), targetPath);
  const requestKey = `${post.id}:${contentVersion}`;
  const { job, reused } = await reservePublishJob(env, {
    post_id: post.id,
    job_type: post.status === 'published' ? 'republish' : 'publish',
    status: 'pending',
    content_version: contentVersion,
    request_key: requestKey,
    target_repo: env.GITHUB_REPO,
    target_branch: branch,
    target_path: targetPath,
    public_url: publicUrl,
    requested_by: requestedBy,
  });

  if (reused) {
    return jsonResponse({
      ok: true,
      reused: true,
      state: job.status,
      jobId: job.id,
      contentVersion,
      commitSha: job.commit_sha ?? null,
      targetPath: job.target_path ?? targetPath,
      publicUrl: job.public_url ?? publicUrl,
      warnings,
    }, 202);
  }

  try {
    const requestedAt = isoNow();
    await patchPost(env, post.id, {
      deploy_status: 'validating',
      publish_requested_at: requestedAt,
      last_publish_result: { stage: 'validating', jobId: job.id, contentVersion },
    });
    await patchJob(env, job.id, { status: 'validating' });

    const headers = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 's-reborn-clinic-admin',
    };
    const contentUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${targetPath}`;
    let sha: string | undefined;
    const existing = await fetch(`${contentUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (existing.ok) sha = (await safeJson(existing))?.sha;
    else if (existing.status !== 404) throw new Error((await safeJson(existing))?.message || `GitHub lookup HTTP ${existing.status}`);

    const githubRes = await fetch(contentUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commitMessage, content: toBase64(markdown), branch, sha }),
    });
    const githubJson = await safeJson(githubRes);
    if (!githubRes.ok) throw new Error(githubJson?.message || `GitHub publish HTTP ${githubRes.status}`);

    const commitSha = String(githubJson?.commit?.sha ?? '');
    if (!/^[0-9a-f]{40}$/i.test(commitSha)) throw new Error('GitHub commit SHA missing from publish response.');

    await patchJob(env, job.id, {
      status: 'build_pending',
      commit_sha: commitSha,
      public_url: publicUrl,
      error_message: null,
    });
    await patchPost(env, post.id, {
      deploy_status: 'build_pending',
      public_url: publicUrl,
      last_publish_result: { stage: 'build_pending', jobId: job.id, contentVersion, commitSha, publicUrl },
    });

    await insertAuditLog(env, {
      actor_id: requestedBy,
      action: 'post_publish_committed',
      resource_type: 'post',
      resource_id: post.id,
      after_json: { slug: post.slug, content_version: contentVersion, commit_sha: commitSha, target_path: targetPath, public_url: publicUrl },
    });
    await insertPostVersionSnapshot(env, {
      post_id: post.id,
      slug: post.slug,
      title: post.title ?? null,
      body_markdown: post.body_markdown ?? '',
      changed_by: requestedBy != null ? String(requestedBy) : '',
      change_summary: 'publish committed; awaiting live verification',
    });

    return jsonResponse({
      ok: true,
      state: 'build_pending',
      warnings,
      jobId: job.id,
      contentVersion,
      targetPath,
      targetRepo: env.GITHUB_REPO,
      branch,
      commitSha,
      publicUrl,
      message: 'Git commit completed. Public live state will be finalized only after successful deploy and artifact verification.',
    }, 202);
  } catch (error: any) {
    const message = String(error?.message || 'Unknown publish error');
    try {
      await patchJob(env, job.id, { status: 'failed', error_message: message, completed_at: isoNow() });
    } catch {}
    try {
      await patchPost(env, post.id, { deploy_status: 'failed', last_publish_result: { stage: 'commit', jobId: job.id, contentVersion, error: message } });
    } catch {}
    try {
      await insertAuditLog(env, {
        actor_id: requestedBy,
        action: 'post_publish_failed',
        resource_type: 'post',
        resource_id: post.id,
        after_json: { slug: post.slug, content_version: contentVersion, target_path: targetPath, error_message: message },
      });
    } catch {}
    return jsonResponse({ error: message, jobId: job.id, targetPath, branch, contentVersion }, 500);
  }
};
