import { invalidatePublishRelatedCaches } from '../../lib/kv-cache';
import { isoNow } from '../../lib/post-format';

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

async function patchJob(env: any, id: string, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, `publish_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await safeJson(res))?.message || 'publish_jobs update failed');
}

async function patchPost(env: any, id: string, payload: Record<string, unknown>) {
  const res = await supabaseFetch(env, `posts?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await safeJson(res))?.message || 'posts update failed');
}

async function insertAuditLog(env: any, payload: Record<string, unknown>) {
  await supabaseFetch(env, 'audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
}

async function insertAdminNotification(env: any, payload: Record<string, unknown>) {
  try {
    await supabaseFetch(env, 'admin_notifications', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Notification failure must never undo a verified deployment.
  }
}

function publicUrlFromTarget(origin: string, targetPath: string) {
  const m = targetPath.match(/^src\/content\/blog\/(.+)\.md$/i);
  if (!m) return `${origin.replace(/\/$/, '')}/blog/`;
  const rel = m[1];
  const enc = (s: string) => s.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  if (rel.startsWith('doctor-ai-academy/')) {
    return `${origin.replace(/\/$/, '')}/doctor-ai-academy/${enc(rel.slice('doctor-ai-academy/'.length))}/`;
  }
  if (rel.startsWith('doctor-ai/')) {
    return `${origin.replace(/\/$/, '')}/doctor-ai-academy/${enc(rel.slice('doctor-ai/'.length))}/`;
  }
  return `${origin.replace(/\/$/, '')}/blog/${enc(rel)}/`;
}

async function verifyGitHubDeployRun(token: string, repo: string, runId: number, commitSha: string, branch: string) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 's-reborn-publish-finalizer',
    },
  });
  const data = await safeJson(res);
  if (!res.ok) return { ok: false, reason: data?.message || `GitHub run lookup HTTP ${res.status}` };

  const ok =
    data?.name === 'Deploy to Cloudflare Pages' &&
    data?.event === 'push' &&
    data?.head_branch === branch &&
    data?.head_sha === commitSha &&
    data?.conclusion === 'success';

  return {
    ok,
    reason: ok ? null : 'workflow_run does not prove a successful production deploy for this commit',
  };
}

async function verifyPublicArtifact(url: string, contentId: string, contentVersion: number) {
  const markerId = `data-s-reborn-content-id=\"${contentId}\"`;
  const markerVersion = `data-s-reborn-content-version=\"${contentVersion}\"`;
  let lastStatus = 0;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const verifyUrl = new URL(url);
    verifyUrl.searchParams.set('__publish_verify', `${Date.now()}-${attempt}`);
    try {
      const res = await fetch(verifyUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      lastStatus = res.status;
      const html = await res.text();
      if (res.ok && html.includes(markerId) && html.includes(markerVersion)) {
        return { ok: true, httpStatus: res.status, attempt };
      }
    } catch {
      lastStatus = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return { ok: false, httpStatus: lastStatus, attempt: 5 };
}

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

export const onRequestPost = async ({ request, env }: any) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase runtime bindings.' }, 500);
  }

  const auth = request.headers.get('Authorization') ?? '';
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch?.[1]) {
    return jsonResponse({ error: 'GitHub Actions bearer token is required.' }, 401);
  }

  const body = await request.json().catch(() => null);
  const commitSha = String(body?.commitSha ?? '').trim();
  const runId = Number(body?.runId ?? 0);
  if (!/^[0-9a-f]{40}$/i.test(commitSha) || !Number.isInteger(runId) || runId <= 0) {
    return jsonResponse({ error: 'Valid commitSha and runId are required.' }, 400);
  }

  const repo = String(env.GITHUB_REPO || 'a3492/s-reborn-clinic');
  const branch = String(env.GITHUB_BRANCH || 'main');
  const deployProof = await verifyGitHubDeployRun(tokenMatch[1], repo, runId, commitSha, branch);
  if (!deployProof.ok) {
    return jsonResponse({ error: deployProof.reason }, 403);
  }

  const jobsRes = await supabaseFetch(
    env,
    `publish_jobs?commit_sha=eq.${encodeURIComponent(commitSha)}&status=in.(build_pending,deploying)&select=*`,
  );
  if (!jobsRes.ok) {
    return jsonResponse({ error: (await safeJson(jobsRes))?.message || 'Failed to load publish jobs.' }, 502);
  }

  const jobs = (await safeJson(jobsRes)) ?? [];
  if (!Array.isArray(jobs) || jobs.length === 0) {
    const liveRes = await supabaseFetch(
      env,
      `publish_jobs?commit_sha=eq.${encodeURIComponent(commitSha)}&status=eq.live&select=id`,
    );
    const liveJobs = liveRes.ok ? await safeJson(liveRes) : [];
    return jsonResponse({ ok: true, finalized: 0, alreadyLive: Array.isArray(liveJobs) && liveJobs.length > 0 });
  }

  const origin = String(env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const results: Array<Record<string, unknown>> = [];

  for (const job of jobs) {
    const now = isoNow();
    await patchJob(env, job.id, {
      status: 'deploying',
      deploy_started_at: job.deploy_started_at ?? now,
    });

    const postRes = await supabaseFetch(
      env,
      `posts?id=eq.${encodeURIComponent(job.post_id)}&select=id,slug,title,description,status,published_at,content_version,public_path,public_url`,
    );
    const posts = postRes.ok ? await safeJson(postRes) : [];
    const post = Array.isArray(posts) ? posts[0] : null;

    if (!post) {
      await patchJob(env, job.id, {
        status: 'failed',
        error_message: 'Post not found during live finalization.',
        completed_at: now,
      });
      results.push({ jobId: job.id, ok: false, reason: 'post_not_found' });
      continue;
    }

    const jobVersion = Number(job.content_version ?? 1);
    if (Number(post.content_version ?? 1) !== jobVersion) {
      await patchJob(env, job.id, {
        status: 'rolled_back',
        error_message: 'Content version advanced before this deployment was finalized.',
        completed_at: now,
        live_check: { reason: 'superseded_content_version', currentVersion: post.content_version },
      });
      results.push({ jobId: job.id, ok: false, reason: 'superseded_content_version' });
      continue;
    }

    const publicUrl =
      String(job.public_url || post.public_url || '').trim() || publicUrlFromTarget(origin, String(job.target_path || ''));
    const artifact = await verifyPublicArtifact(publicUrl, String(post.id), jobVersion);

    if (!artifact.ok) {
      await patchJob(env, job.id, {
        status: 'failed',
        error_message: 'Public artifact marker verification failed after successful deploy workflow.',
        completed_at: isoNow(),
        public_url: publicUrl,
        live_check: artifact,
      });
      await patchPost(env, post.id, {
        deploy_status: 'failed',
        last_publish_result: {
          stage: 'public_verify',
          commitSha,
          publicUrl,
          ...artifact,
        },
      });
      results.push({ jobId: job.id, ok: false, reason: 'public_marker_mismatch', publicUrl });
      continue;
    }

    const verifiedAt = isoNow();
    await patchPost(env, post.id, {
      status: 'published',
      deploy_status: 'live',
      published_at: post.published_at ?? verifiedAt,
      public_verified_at: verifiedAt,
      public_url: publicUrl,
      last_publish_result: {
        stage: 'live',
        commitSha,
        workflowRunId: runId,
        publicUrl,
        ...artifact,
      },
    });

    await patchJob(env, job.id, {
      status: 'live',
      public_verified_at: verifiedAt,
      public_url: publicUrl,
      completed_at: verifiedAt,
      error_message: null,
      live_check: {
        workflowRunId: runId,
        commitSha,
        ...artifact,
      },
    });

    await insertAuditLog(env, {
      actor_id: job.requested_by ?? null,
      action: 'post_live_verified',
      resource_type: 'post',
      resource_id: post.id,
      after_json: {
        slug: post.slug,
        content_version: jobVersion,
        commit_sha: commitSha,
        workflow_run_id: runId,
        public_url: publicUrl,
        verified_at: verifiedAt,
      },
    });

    await invalidatePublishRelatedCaches(env);
    triggerEmbedPost(env, post.slug);

    const notifySecret = String(env.NOTIFY_SUBSCRIBERS_SECRET || '').trim();
    if (notifySecret && env.RESEND_API_KEY && env.FROM_EMAIL) {
      try {
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
            postUrl: publicUrl,
          }),
        });
      } catch {
        // Notification is a post-live side effect and does not change live truth.
      }
    }

    await insertAdminNotification(env, {
      type: 'publish_success',
      title: `발행 검증 완료: ${post.slug}`,
      body: null,
      resource_slug: post.slug,
    });

    results.push({ jobId: job.id, ok: true, publicUrl, verifiedAt });
  }

  return jsonResponse({
    ok: results.every((item) => item.ok === true),
    finalized: results.filter((item) => item.ok === true).length,
    results,
  });
};
