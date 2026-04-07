export type SupabaseServiceEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

export async function supabaseServiceFetch(
  env: SupabaseServiceEnv,
  pathWithQuery: string,
  init?: RequestInit,
): Promise<Response> {
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  return fetch(`${base}/rest/v1/${pathWithQuery}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}
