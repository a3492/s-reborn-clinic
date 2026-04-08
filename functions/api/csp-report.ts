/** CSP violation reports (report-uri) — 본문은 로그만, 저장하지 않음 */

export const onRequestPost = async (context: { request: Request }) => {
  const ct = context.request.headers.get('content-type') || '';
  let body: unknown = null;
  try {
    if (ct.includes('application/csp-report') || ct.includes('application/json')) {
      body = await context.request.json();
    }
  } catch {
    body = null;
  }
  if (!body) {
    return new Response(null, { status: 204 });
  }
  console.error('CSP violation:', JSON.stringify(body));
  return new Response(null, { status: 204 });
};
