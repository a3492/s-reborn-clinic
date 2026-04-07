import { supabaseServiceFetch, type SupabaseServiceEnv } from '../lib/supabase-service';

function jsonResponse(body: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

const VITAL_NAMES = new Set(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);
const RATINGS = new Set(['good', 'needs-improvement', 'poor']);
const UA_BOT = /bot|crawler|spider/i;
function isValidPagePath(page: string): boolean {
	if (!page.startsWith('/') || page.length > 2048) return false;
	if (/[\r\n\0]/.test(page)) return false;
	return true;
}

function isBotRequest(request: Request): boolean {
	const ua = request.headers.get('user-agent') || '';
	return UA_BOT.test(ua);
}

type PagesPostContext = {
	request: Request;
	env: Record<string, string | undefined>;
	waitUntil?: (promise: Promise<unknown>) => void;
};

export const onRequestOptions = () =>
	new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});

export const onRequestPost = async (context: PagesPostContext) => {
	const { request, env, waitUntil } = context;

	if (isBotRequest(request)) {
		return jsonResponse({ ok: true });
	}

	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		return jsonResponse({ error: 'Server misconfigured.' }, 500);
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const name = String(body?.name ?? '').trim();
	const rating = String(body?.rating ?? '').trim();
	const page = String(body?.page ?? '').trim().slice(0, 2048);
	const valueRaw = body?.value;

	if (!VITAL_NAMES.has(name) || !RATINGS.has(rating) || !isValidPagePath(page)) {
		return jsonResponse({ error: 'Invalid payload.' }, 400);
	}

	const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
	if (!Number.isFinite(value) || value < 0 || value > 1e7) {
		return jsonResponse({ error: 'Invalid value.' }, 400);
	}

	const row = { name, value, rating, page };
	const svc = env as unknown as SupabaseServiceEnv;

	const insertPromise = supabaseServiceFetch(svc, 'web_vitals', {
		method: 'POST',
		headers: { Prefer: 'return=minimal' },
		body: JSON.stringify(row),
	}).then(async (res) => {
		if (!res.ok) {
			const t = await res.text().catch(() => '');
			console.error('[vitals] insert failed:', res.status, t.slice(0, 200));
		}
	});

	if (typeof waitUntil === 'function') {
		waitUntil(insertPromise);
		return jsonResponse({ ok: true });
	}

	await insertPromise;
	return jsonResponse({ ok: true });
};
