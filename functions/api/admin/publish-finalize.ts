import { invalidatePublishRelatedCaches } from '../../lib/kv-cache';
import { isoNow } from '../../lib/post-format';

const OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const OIDC_JWKS_URL = 'https://token.actions.githubusercontent.com/.well-known/jwks';
const OIDC_AUDIENCE = 's-reborn-publish-finalizer';
const EXPECTED_REPOSITORY_ID = '1200829432';
const EXPECTED_FINALIZER_WORKFLOW = 'Finalize Published Content';
const EXPECTED_FINALIZER_WORKFLOW_PATH = '.github/workflows/publish-live-finalize.yml';
const EXPECTED_DEPLOY_WORKFLOW = 'Deploy to Cloudflare Pages';
const EXPECTED_DEPLOY_WORKFLOW_PATH = '.github/workflows/deploy.yml';
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_AGE_SECONDS = 10 * 60;

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

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtJson(value: string) {
  const text = new TextDecoder().decode(base64UrlToBytes(value));
  return JSON.parse(text);
}

function audienceMatches(aud: unknown, expected: string) {
  if (aud === expected) return true;
  return Array.isArray(aud) && aud.some((item) => item === expected);
}

async function verifyGitHubOidcToken(
  token: string,
  repo: string,
  branch: string,
  callerRunId: number,
) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false, reason: 'malformed_jwt' };

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = decodeJwtJson(encodedHeader);
    const payload = decodeJwtJson(encodedPayload);

    if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid) {
      return { ok: false, reason: 'unsupported_jwt_header' };
    }

    const jwksRes = await fetch(OIDC_JWKS_URL, {
      headers: { Accept: 'application/json' },
    });
    if (!jwksRes.ok) return { ok: false, reason: `jwks_http_${jwksRes.status}` };
    const jwks = await safeJson(jwksRes);
    const jwk = Array.isArray(jwks?.keys)
      ? jwks.keys.find((candidate: any) => candidate?.kid === header.kid && candidate?.kty === 'RSA')
      : null;
    if (!jwk) return { ok: false, reason: 'signing_key_not_found' };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signatureOk = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
    if (!signatureOk) return { ok: false, reason: 'invalid_signature' };

    const now = Math.floor(Date.now() / 1000);
    const exp = Number(payload?.exp ?? 0);
    const nbf = Number(payload?.nbf ?? 0);
    const iat = Number(payload?.iat ?? 0);
    if (!Number.isFinite(exp) || exp <= now - CLOCK_SKEW_SECONDS) {
      return { ok: false, reason: 'expired_token' };
    }
    if (nbf && nbf > now + CLOCK_SKEW_SECONDS) {
      return { ok: false, reason: 'token_not_yet_valid' };
    }
    if (!Number.isFinite(iat) || iat <= 0 || iat > now + CLOCK_SKEW_SECONDS || iat < now - MAX_TOKEN_AGE_SECONDS) {
      return { ok: false, reason: 'invalid_token_age' };
    }

    const expectedRef = `refs/heads/${branch}`;
    const expectedWorkflowRef = `${repo}/${EXPECTED_FINALIZER_WORKFLOW_PATH}@${expectedRef}`;
    const subject = String(payload?.sub ?? '');
    const claimsOk =
      payload?.iss === OIDC_ISSUER &&
      audienceMatches(payload?.aud, OIDC_AUDIENCE) &&
      payload?.repository === repo &&
      String(payload?.repository_id ?? '') === EXPECTED_REPOSITORY_ID &&
      payload?.ref === expectedRef &&
      payload?.ref_type === 'branch' &&
      payload?.event_name === 'workflow_run' &&
      payload?.workflow === EXPECTED_FINALIZER_WORKFLOW &&
      payload?.workflow_ref === expectedWorkflowRef &&
      String(payload?.run_id ?? '') === String(callerRunId) &&
      subject.startsWith(`repo:${repo}:`);

    if (!claimsOk) return { ok: false, reason: 'oidc_claim_mismatch' };

    return {
      ok: true,
      proof: {
        repositoryId: String(payload.repository_id),
        workflowRef: String(payload.workflow_ref),
        callerRunId: String(payload.run_id),
        jti: typeof payload?.jti === 'string' ? payload.jti : null,
      },
    };
  } catch {
    return { ok: false, reason: 'oidc_verification_error' };
  }
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
    data?.name === EXPECTED_DEPLOY_WORKFLOW &&
    data?.path === EXPECTED_DEPLOY_WORKFLOW_PATH &&
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
  const body = await request.json().catch(() => null);
  const commitSha = String(body?.commitSha ?? '').trim();
  const deployRunId = Number(body?.deployRunId ?? 0);
  const callerRunId = Number(body?.callerRunId ?? 0);
  if (
    !/^[0-9a-f]{40}$/i.test(commitSha) ||
    !Number.isInteger(deployRunId) || deployRunId <= 0 ||
    !Number.isInteger(callerRunId) || callerRunId <= 0
  ) {
    return jsonResponse({ error: 'Valid commitSha, deployRunId and callerRunId are required.' }, 400);
  }

  const oidcAuth = request.headers.get('Authorization') ?? '';
  const oidcMatch = oidcAuth.match(/^Bearer\s+(.+)$/i);
  const githubApiToken = String(request.headers.get('X-GitHub-Token') ?? '').trim();
  if (!oidcMatch?.[1] || !githubApiToken) {
    return jsonResponse({ error: 'GitHub Actions OIDC token and GitHub API token are required.' }, 401);
  }

  const repo = String(env.GITHUB_REPO || 'a3492/s-reborn-clinic');
  const branch = String(env.GITHUB_BRANCH || 'main');
  const oidcProof = await verifyGitHubOidcToken(oidcMatch[1], repo, branch, callerRunId);
  if (!oidcProof.ok) {
    return jsonResponse({ error: 'GitHub Actions OIDC verification failed.', reason: oidcProof.reason }, 403);
  }

  const deployProof = await verifyGitHubDeployRun(githubApiToken, repo, deployRunId, commitSha, branch);
  if (!deployProof.ok) {
    return jsonResponse({ error: deployProof.reason }, 403);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Missing Supabase runtime bindings.' }, 500);
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
          deployRunId,
          callerRunId,
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
        workflowRunId: deployRunId,
        finalizerRunId: callerRunId,
        oidcRepositoryId: oidcProof.proof?.repositoryId ?? EXPECTED_REPOSITORY_ID,
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
        workflowRunId: deployRunId,
        finalizerRunId: callerRunId,
        commitSha,
        oidcRepositoryId: oidcProof.proof?.repositoryId ?? EXPECTED_REPOSITORY_ID,
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
        workflow_run_id: deployRunId,
        finalizer_run_id: callerRunId,
        oidc_repository_id: oidcProof.proof?.repositoryId ?? EXPECTED_REPOSITORY_ID,
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
