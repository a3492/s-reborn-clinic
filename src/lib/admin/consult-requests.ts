import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export interface ConsultRequest {
  id: string;
  name: string;
  phone: string | null;
  concern: string;
  procedure: string | null;
  status: 'pending' | 'reviewing' | 'done' | 'rejected';
  referrer: string | null;
  note: string | null;
  created_at: string;
}

export async function getConsultRequests(limit = 50): Promise<ConsultRequest[]> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data, error } = await sb
    .from('consult_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPendingConsultCount(): Promise<number> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { count, error } = await sb
    .from('consult_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) return 0;
  return count ?? 0;
}
