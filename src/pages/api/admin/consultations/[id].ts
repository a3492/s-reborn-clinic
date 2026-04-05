import type { APIRoute } from 'astro';

export const prerender = false;

// GET 단건 조회
export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Supabase 환경변수 미설정' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/consultations?id=eq.${id}&select=*`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ ok: false, error: err }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await res.json();
  if (!rows.length) {
    return new Response(JSON.stringify({ ok: false, error: '찾을 수 없음' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, data: rows[0] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH 상태/메모 수정
export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params;
  const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Supabase 환경변수 미설정' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: '잘못된 요청' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 허용 필드만 추출
  const allowed = ['status', 'admin_note', 'assigned_to'];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (!Object.keys(patch).length) {
    return new Response(JSON.stringify({ ok: false, error: '변경할 항목 없음' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/consultations?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ ok: false, error: err }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = await res.json();
  return new Response(JSON.stringify({ ok: true, data: updated[0] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
