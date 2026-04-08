/**
 * Cloudflare Turnstile siteverify.
 * 시크릿이 없으면 true(검증 생략). 시크릿만 있고 토큰이 없으면 false.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> {
  const s = String(secret ?? '').trim();
  if (!s) return true;
  const t = String(token ?? '').trim();
  if (!t) return false;

  const params = new URLSearchParams();
  params.set('secret', s);
  params.set('response', t);
  if (ip) params.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return Boolean(data.success);
}
