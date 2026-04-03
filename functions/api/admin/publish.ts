const encoder = new TextEncoder();

function toBase64(input: string) {
  const bytes = encoder.encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isoNow() {
  return new Date().toISOString();
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

function escapeYamlString(value: unknown) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function buildFrontmatter(post: any) {
  const tags = Array.isArray(post.tags) ? `[${post.tags.map((tag: string) => `"${tag}"`).join(', ')}]` : '[]';
  const parts = [
    '---',
    `title: "${escapeYamlString(post.title)}"`,
    `description: "${escapeYamlString(post.description)}"`,
    `date: ${post.published_at ?? isoNow()}`,
    `category: "${escapeYamlString(post.category)}"`,
    post.subcategory ? `subcategory: "${escapeYamlString(post.subcategory)}"` : '',
    `tags: ${tags}`,
    `draft: ${post.status !== 'published'}`,
    post.thumbnail_url ? `thumbnail: "${escapeYamlString(post.thumbnail_url)}"` : '',
    post.seo_title ? `seoTitle: "${escapeYamlString(post.seo_title)}"` : '',
    post.seo_description ? `seoDescription: "${escapeYamlString(post.seo_description)}"` : '',
    post.canonical_url ? `canonicalURL: "${escapeYamlString(post.canonical_url)}"` : '',
    '---',
    '',
  ].filter(Boolean);
  return parts.join('\n');
}

function buildTargetPath(post: any) {
  const segments = ['src', 'content', 'blog'];
  segments.push(post.category || 'uncategorized');
  if (post.subcategory) segments.push(post.subcategory);
  segments.push(`${post.slug}.md`);
  return segments.join('/');
}

function validatePublishablePost(post: any) {
  const issues: string[] = [];
  if (!post?.title?.trim()) issues.push('title');
  if (!post?.description?.trim()) issues.push('description');
  if (!post?.slug?.trim()) issues.push('slug');
  if (!post?.category?.trim()) issues.push('category');
  if (!post?.body_markdown?.trim()) issues.push('body_markdown');
  if (post?.status === 'archived') issues.push('archived_status');
  return issues;
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

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  const missingEnv = requiredEnv(env);

  if (missingEnv.length > 0) {
    return jsonResponse({ error: `Missing required env bindings: ${missingEnv.join(', ')}` }, 500);
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
  const validationIssues = validatePublishablePost(post);

  if (validationIssues.length > 0) {
    return jsonResponse({
      error: `Post is not publishable: ${validationIssues.join(', ')}`,
      validationIssues,
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
      validationIssues,
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

    return jsonResponse({
      ok: true,
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

    return jsonResponse({
      error: error?.message || 'Unknown publish error',
      jobId: job.id,
      targetPath,
      branch,
    }, 500);
  }
};
