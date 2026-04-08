import { invalidatePublishRelatedCaches } from '../../lib/kv-cache';
import { buildFrontmatter, buildTargetPath, isoNow } from '../../lib/post-format';

const encoder = new TextEncoder();

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

/** 발행된 마크다운 경로 → 공개 사이트 글 URL (트레일링 슬래시) */
function absolutePostUrl(siteBase: string, targetPath: string) {
  const base = siteBase.replace(/\/$/, '');
  const m = targetPath.match(/^src\/content\/blog\/(.+)\.md$/i);
  if (!m) return `${base}/blog/`;
  const rel = m[1];
  const enc = (s: string) => s.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  if (rel.startsWith('doctor-ai-academy/')) {
    const rest = rel.slice('doctor-ai-academy/'.length);
    return `${base}/doctor-ai-academy/${enc(rest)}/`;
  }
  if (rel.startsWith('doctor-ai/')) {
    const rest = rel.slice('doctor-ai/'.length);
    return `${base}/doctor-ai-academy/${enc(rest)}/`;
  }
  return `${base}/blog/${enc(rel)}/`;
}

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function countTitleSpecialChars(title: string): number {
  let n = 0;
  for (const ch of title.trim()) {
    if (/[\p{L}\p{N}]/u.test(ch)) continue;
    if (/\s/u.test(ch)) continue;
    n += 1;
  }
  return n;
}

function validatePublishablePost(post: any): ValidationResult {
  const errors: string[] = [];
  if (!post?.title?.trim()) errors.push('title');
  if (!post?.description?.trim()) errors.push('description');
  if (!post?.slug?.trim()) errors.push('slug');
  if (!post?.category?.trim()) errors.push('category');
  if (!post?.body_markdown?.trim()) errors.push('body_markdown');
  if (post?.status === 'archived') errors.push('archived_status');

  const warnings: string[] = [];
  const body = String(post?.body_markdown ?? '').trim();
  if (body.length < 500) {
    warnings.push('본문이 너무 짧습니다 (500자 미만)');
  }
  if (!post?.thumbnail_url?.trim()) {
    warnings.push('썸네일 이미지가 없습니다');
  }
  const tags = post?.tags;
  if (!Array.isArray(tags) || tags.length === 0) {
    warnings.push('태그가 없습니다');
  }
  if (!post?.seo_description?.trim()) {
    warnings.push('SEO 설명이 없습니다');
  }
  if (countTitleSpecialChars(String(post?.title ?? '')) > 2) {
    warnings.push('제목에 특수문자가 많습니다');
  }
  if (
    /작성\s*중/.test(body) ||
    /\bTODO\b/i.test(body) ||
    /\bTBD\b/i.test(body)
  ) {
    warnings.push('미완성 표시가 남아 있습니다');
  }

  return { errors, warnings };
}

/** PUBLISH_SECRET 이 있으면: X-Publish-Secret 일치(크론·Edge) 또는 관리자 세션 JWT */
async function authorizePublishRequest(request: Request, env: any) {
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
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
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

async function createPublishJob(env: any, payload: any) {
  const res = await supabaseFetch(env, 'publish_jobs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(`publish_jobs insert failed: ${error?.message || JSON.stringify(error)}`);
  }

  const data = await safeJson(res);
  return Array.isArray(data) ? data[0] : data;
}

async function patchPublishJob(env: any, id: string, payload: any) {
  const res = await supabaseFetch(env, `publish_jobs?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(`publish_jobs patch failed: ${error?.message || JSON.stringify(error)}`);
  }
}

async function patchPost(env: any, id: string, payload: any) {
  const res = await supabaseFetch(env, `posts?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(`posts patch failed: ${error?.message || JSON.stringify(error)}`);
  }
}

async function insertAuditLog(env: any, payload: any) {
  const res = await supabaseFetch(env, 'audit_logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await safeJson(res);
    throw new Error(`audit_logs insert failed: ${error?.message || JSON.stringify(error)}`);
  }
}

/** 알림 센터용 — 실패해도 발행 흐름에 영향 없음 */
async function insertAdminNotification(env: any, row: Record<string, unknown>) {
  try {
    const res = await supabaseFetch(env, 'admin_notifications', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const err = await safeJson(res);
      console.error('[publish] admin_notifications insert failed:', err?.message || res.status);
    }
  } catch (e) {
    console.error('[publish] admin_notifications insert failed:', e);
  }
}

/** 발행 직후 임베딩 갱신 — 비동기, 실패 무시 (발행 지연 방지) */
function triggerEmbedPost(env: any, slug: string) {
  const base = String(env.SUPABASE_URL ?? '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !slug) return;
  void fetch(`${base}/functions/v1/embed-post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({ slug }),
  }).catch(() => {});
}

/** 발행·저장 추적용 — 실패해도 발행 성공과 분리 (경고만) */
async function insertPostVersionSnapshot(env: any, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, 'post_versions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await safeJson(res);
    console.warn('[publish] post_versions insert failed:', error?.message || res.status);
  }
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  const missingEnv = requiredEnv(env);

  if (missingEnv.length > 0) {
    return jsonResponse({ error: `Missing required env bindings: ${missingEnv.join(', ')}` }, 500);
  }

  const authz = await authorizePublishRequest(request, env);
  if (!authz.ok) {
    return jsonResponse({ error: authz.error }, authz.status);
  }

  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? '').trim();
  const dryRun = Boolean(body?.dryRun);
  const requestedBy = body?.requestedBy ?? null;

  if (!slug) {
    return jsonResponse({ error: 'slug is required.' }, 400);
  }

  const postRes = await supabaseFetch(env, `posts?slug=eq.${encodeURIComponent(slug)}&select=*`);
  if (!postRes.ok) {
    const error = await safeJson(postRes);
    return jsonResponse({ error: error?.message || 'Failed to fetch post from Supabase.' }, 502);
  }

  const posts = await safeJson(postRes);
  const post = Array.isArray(posts) ? posts[0] : null;

  if (!post) {
    return jsonResponse({ error: 'Post not found.' }, 404);
  }

  const frontmatter = buildFrontmatter(post);
  const markdown = `${frontmatter}${post.body_markdown ?? ''}`;
  const targetPath = buildTargetPath(post);
  const branch = env.GITHUB_BRANCH || 'main';
  const commitMessage = `publish: ${post.slug}`;
  const { errors: validationErrors, warnings } = validatePublishablePost(post);

  if (validationErrors.length > 0) {
    return jsonResponse({
      error: `Post is not publishable: ${validationErrors.join(', ')}`,
      validationIssues: validationErrors,
      warnings,
      targetPath,
      branch,
    }, 400);
  }

  if (dryRun) {
    return jsonResponse({
      dryRun: true,
      targetPath,
      branch,
      commitMessage,
      postStatus: post.status,
      validationIssues: validationErrors,
      warnings,
      markdownPreview: markdown.slice(0, 1200),
    });
  }

  const job = await createPublishJob(env, {
    post_id: post.id,
    job_type: 'publish',
    status: 'pending',
    target_repo: env.GITHUB_REPO,
    target_branch: branch,
    target_path: targetPath,
    requested_by: requestedBy,
  });

  try {
    await patchPublishJob(env, job.id, {
      status: 'processing',
      target_repo: env.GITHUB_REPO,
      target_branch: branch,
      target_path: targetPath,
    });

    const headers = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 's-reborn-clinic-admin',
    };

    const contentUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${targetPath}`;
    let sha: string | undefined;

    const existing = await fetch(`${contentUrl}?ref=${encodeURIComponent(branch)}`, { headers });
    if (existing.ok) {
      const existingJson = await safeJson(existing);
      sha = existingJson.sha;
    } else if (existing.status !== 404) {
      const existingError = await safeJson(existing);
      throw new Error(existingError?.message || `GitHub lookup failed with status ${existing.status}.`);
    }

    const githubRes = await fetch(contentUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: toBase64(markdown),
        branch,
        sha,
      }),
    });

    const githubJson = await safeJson(githubRes);
    if (!githubRes.ok) {
      throw new Error(githubJson?.message || `GitHub publish failed with status ${githubRes.status}.`);
    }

    const publishedAt = post.published_at ?? isoNow();
    await patchPost(env, post.id, {
      status: 'published',
      published_at: publishedAt,
    });

    await patchPublishJob(env, job.id, {
      status: 'success',
      commit_sha: githubJson?.commit?.sha ?? null,
      completed_at: isoNow(),
    });

    await insertAuditLog(env, {
      actor_id: requestedBy,
      action: 'post_published',
      resource_type: 'post',
      resource_id: post.id,
      after_json: {
        slug: post.slug,
        target_path: targetPath,
        target_repo: env.GITHUB_REPO,
        target_branch: branch,
        commit_sha: githubJson?.commit?.sha ?? null,
      },
    });

    await insertPostVersionSnapshot(env, {
      post_id: post.id,
      slug: post.slug,
      title: post.title ?? null,
      body_markdown: post.body_markdown ?? '',
      changed_by: requestedBy != null ? String(requestedBy) : '',
      change_summary: 'published',
    });

    await invalidatePublishRelatedCaches(env);

    triggerEmbedPost(env, post.slug);

    const notifySecret = env.NOTIFY_SUBSCRIBERS_SECRET?.trim();
    const resendKey = env.RESEND_API_KEY?.trim();
    const fromEmail = env.FROM_EMAIL?.trim();
    if (notifySecret && resendKey && fromEmail) {
      try {
        const origin = new URL(request.url).origin;
        const siteBase = String(env.PUBLIC_SITE_URL || origin).replace(/\/$/, '');
        const postUrl = absolutePostUrl(siteBase, targetPath);
        await fetch(`${origin}/api/notify-subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-notify-secret': notifySecret,
          },
          body: JSON.stringify({
            slug: post.slug,
            title: post.title,
            description: post.description ?? '',
            postUrl,
          }),
        });
      } catch {
        // 구독자 알림 실패는 발행 성공과 분리
      }
    }

    await insertAdminNotification(env, {
      type: 'publish_success',
      title: `발행 완료: ${post.slug}`,
      body: null,
      resource_slug: post.slug,
    });

    return jsonResponse({
      ok: true,
      warnings,
      jobId: job.id,
      targetPath,
      targetRepo: env.GITHUB_REPO,
      branch,
      commitSha: githubJson?.commit?.sha ?? null,
      publishedAt,
    });
  } catch (error: any) {
    try {
      await patchPublishJob(env, job.id, {
        status: 'failed',
        error_message: error?.message || 'Unknown publish error',
        completed_at: isoNow(),
      });
    } catch {}

    try {
      await insertAuditLog(env, {
        actor_id: requestedBy,
        action: 'post_publish_failed',
        resource_type: 'post',
        resource_id: post.id,
        after_json: {
          slug: post.slug,
          target_path: targetPath,
          error_message: error?.message || 'Unknown publish error',
        },
      });
    } catch {}

    await insertAdminNotification(env, {
      type: 'publish_failed',
      title: `발행 실패: ${post.slug}`,
      body: String(error?.message || 'Unknown publish error').slice(0, 2000),
      resource_slug: post.slug,
    });

    return jsonResponse({
      error: error?.message || 'Unknown publish error',
      jobId: job.id,
      targetPath,
      branch,
    }, 500);
  }
};
