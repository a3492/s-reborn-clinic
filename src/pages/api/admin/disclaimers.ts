import type { APIRoute } from 'astro';

export const prerender = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function verifyOwner(
	request: Request,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
	const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
	const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !serviceKey) {
		return { ok: false, status: 500, error: 'Supabase 서버 환경변수가 없습니다.' };
	}

	const auth = request.headers.get('Authorization') ?? '';
	const m = auth.match(/^Bearer\s+(.+)$/i);
	if (!m?.[1]) {
		return { ok: false, status: 401, error: '로그인이 필요합니다.' };
	}

	const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
		headers: {
			Authorization: `Bearer ${m[1]}`,
			apikey: anonKey || serviceKey,
		},
	});

	if (!userRes.ok) {
		return { ok: false, status: 401, error: '유효하지 않은 세션입니다.' };
	}

	const userJson = (await userRes.json()) as { id?: string };
	const userId = userJson?.id;
	if (!userId) {
		return { ok: false, status: 401, error: '유효하지 않은 세션입니다.' };
	}

	const profRes = await fetch(
		`${supabaseUrl}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
		{
			headers: {
				apikey: serviceKey,
				Authorization: `Bearer ${serviceKey}`,
			},
		},
	);

	if (!profRes.ok) {
		return { ok: false, status: 403, error: '관리자 프로필을 확인할 수 없습니다.' };
	}

	const profs = (await profRes.json()) as { role?: string }[];
	const role = profs[0]?.role;
	if (role !== 'owner') {
		return { ok: false, status: 403, error: '면책 고지 편집은 owner만 가능합니다.' };
	}

	return { ok: true, userId };
}

export const GET: APIRoute = async ({ request }) => {
	const v = await verifyOwner(request);
	if (!v.ok) {
		return new Response(JSON.stringify({ ok: false, error: v.error }), {
			status: v.status,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
	const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY!;

	const res = await fetch(
		`${supabaseUrl}/rest/v1/disclaimers?select=id,category,body,is_active,updated_at&order=category.asc`,
		{
			headers: {
				apikey: serviceKey,
				Authorization: `Bearer ${serviceKey}`,
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

	const data = await res.json();
	return new Response(JSON.stringify({ ok: true, data }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const PATCH: APIRoute = async ({ request }) => {
	const v = await verifyOwner(request);
	if (!v.ok) {
		return new Response(JSON.stringify({ ok: false, error: v.error }), {
			status: v.status,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: '잘못된 JSON입니다.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const id = String(body.id ?? '').trim();
	if (!UUID_RE.test(id)) {
		return new Response(JSON.stringify({ ok: false, error: '유효한 id가 필요합니다.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if ('body' in body && typeof body.body === 'string') {
		patch.body = body.body;
	}
	if ('is_active' in body && typeof body.is_active === 'boolean') {
		patch.is_active = body.is_active;
	}

	if (Object.keys(patch).length <= 1) {
		return new Response(JSON.stringify({ ok: false, error: 'body 또는 is_active 중 하나 이상 필요합니다.' }), {
			status: 422,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
	const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY!;

	const res = await fetch(`${supabaseUrl}/rest/v1/disclaimers?id=eq.${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: {
			apikey: serviceKey,
			Authorization: `Bearer ${serviceKey}`,
			'Content-Type': 'application/json',
			Prefer: 'return=representation',
		},
		body: JSON.stringify(patch),
	});

	if (!res.ok) {
		const err = await res.text();
		return new Response(JSON.stringify({ ok: false, error: err }), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const rows = await res.json();
	return new Response(JSON.stringify({ ok: true, data: Array.isArray(rows) ? rows[0] : rows }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
