import { s3PathStylePathname, sha256HexOfBuffer, signR2S3PutHeaders } from '../../lib/aws-sign';

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

/** publish.ts 와 동일 — Bearer JWT + admin_profiles.role */
async function authorizeUploadRequest(request: Request, env: Record<string, unknown>) {
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

function requiredR2Env(env: Record<string, unknown>) {
  return ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'].filter(
    (k) => !String(env[k] ?? '').trim(),
  );
}

function amzDateNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function safeSegment(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildObjectKey(suggested: string | null, fileName: string): string {
  const now = new Date();
  const y = String(now.getUTCFullYear());
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
  const baseName = safeSegment(fileName) || 'upload';
  const raw = suggested?.trim();
  if (raw && !raw.startsWith('/') && !raw.includes('..')) {
    const parts = raw.split('/').map(safeSegment).filter(Boolean);
    if (parts.length) return parts.join('/');
  }
  return `${y}/${mo}/${Date.now()}-${baseName}`;
}

function publicUrlForKey(publicBase: string, objectKey: string): string {
  const b = publicBase.replace(/\/$/, '');
  const path = objectKey
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${b}/${path}`;
}

const MAX_BYTES = 15 * 1024 * 1024;

export const onRequestPost = async (context: { request: Request; env: Record<string, unknown> }) => {
  const { request, env } = context;

  const missing = requiredR2Env(env);
  if (missing.length > 0) {
    return jsonResponse({ error: `R2 환경 변수 누락: ${missing.join(', ')}` }, 500);
  }

  const authz = await authorizeUploadRequest(request, env);
  if (!authz.ok) {
    return jsonResponse({ error: authz.error }, authz.status);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: 'multipart/form-data 파싱에 실패했습니다.' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return jsonResponse({ error: 'file 필드(비어 있지 않은 파일)가 필요합니다.' }, 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: `파일이 너무 큽니다. 최대 ${MAX_BYTES / (1024 * 1024)}MB.` }, 400);
  }

  const mime = String(file.type || '').trim() || 'application/octet-stream';
  if (!mime.startsWith('image/')) {
    return jsonResponse({ error: '이미지 파일만 업로드할 수 있습니다.' }, 400);
  }

  const pathHint = String(form.get('file_path') || '').trim() || null;
  const objectKey = buildObjectKey(pathHint, file.name);

  const accountId = String(env.R2_ACCOUNT_ID).trim();
  const bucket = String(env.R2_BUCKET_NAME).trim();
  const accessKeyId = String(env.R2_ACCESS_KEY_ID).trim();
  const secretAccessKey = String(env.R2_SECRET_ACCESS_KEY).trim();
  const publicBase = String(env.R2_PUBLIC_URL).trim();

  const endpoint = new URL(`https://${accountId}.r2.cloudflarestorage.com`);
  endpoint.pathname = s3PathStylePathname(bucket, objectKey);

  const bodyBuf = await file.arrayBuffer();
  const payloadHashHex = await sha256HexOfBuffer(bodyBuf);
  const amzDate = amzDateNow();

  const signHeaders = await signR2S3PutHeaders({
    endpointUrl: endpoint,
    bucket,
    objectKey,
    method: 'PUT',
    accessKeyId,
    secretAccessKey,
    region: String(env.R2_REGION || 'auto').trim() || 'auto',
    contentType: mime,
    payloadHashHex,
    amzDate,
  });

  const putRes = await fetch(endpoint.toString(), {
    method: 'PUT',
    headers: signHeaders,
    body: bodyBuf,
  });

  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => '');
    return jsonResponse(
      {
        error: 'R2 업로드 실패',
        status: putRes.status,
        detail: errText.slice(0, 500),
      },
      502,
    );
  }

  const publicUrl = publicUrlForKey(publicBase, objectKey);

  return jsonResponse({
    ok: true,
    publicUrl,
    objectKey,
    bucket,
    contentType: mime,
    size: bodyBuf.byteLength,
  });
};
