const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function supabaseHeaders(env: Record<string, string | undefined>) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function successHtml() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>구독 취소</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f5f5f7; color: #1a1a2e; }
    .card { background: #fff; padding: 2rem 2.25rem; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.08); max-width: 420px; text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
    p { margin: 0; color: #555; line-height: 1.55; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>구독이 취소되었습니다</h1>
    <p>더 이상 뉴스레터·알림 메일을 보내지 않습니다. 이용해 주셔서 감사합니다.</p>
  </div>
</body>
</html>`;
}

function errorHtml(message: string) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>오류</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f5f5f7; color: #1a1a2e; }
    .card { background: #fff; padding: 2rem 2.25rem; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.08); max-width: 420px; text-align: center; }
    h1 { font-size: 1.15rem; margin: 0 0 0.75rem; color: #b42318; }
    p { margin: 0; color: #555; line-height: 1.55; font-size: 0.92rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>처리할 수 없습니다</h1>
    <p>${message.replace(/</g, '&lt;').replace(/&/g, '&amp;')}</p>
  </div>
</body>
</html>`;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Record<string, string | undefined> }) => {
  const url = new URL(request.url);
  const rawEmail = url.searchParams.get('email')?.trim() ?? '';
  const email = rawEmail.toLowerCase();

  if (!email) {
    return new Response(errorHtml('이메일 주소가 필요합니다. 메일에 있는 구독 취소 링크를 사용해 주세요.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!EMAIL_RE.test(email)) {
    return new Response(errorHtml('이메일 형식이 올바르지 않습니다.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(errorHtml('서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const delRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/lab_waitlist?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'DELETE',
      headers: {
        ...supabaseHeaders(env),
        Prefer: 'return=minimal',
      },
    },
  );

  if (!delRes.ok) {
    return new Response(errorHtml('구독 목록을 갱신하지 못했습니다. 잠시 후 다시 시도해 주세요.'), {
      status: 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(successHtml(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
