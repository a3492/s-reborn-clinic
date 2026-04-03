import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

/**
 * notify-consult — Supabase Edge Function
 *
 * consult_requests 테이블에 INSERT가 발생하면 Supabase Database Webhook으로 호출됩니다.
 * 환경 변수 NOTIFY_EMAIL_TO 가 설정되어 있으면 관리자에게 이메일 알림을 보냅니다.
 * (실제 이메일 전송은 SMTP 또는 Resend 등 별도 연동 필요)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const record = body?.record;

    if (!record) {
      return new Response(JSON.stringify({ error: 'No record in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, phone, email, interest, concern, preferred_time, created_at } = record;

    console.log('[notify-consult] New consult request received:', {
      name,
      phone,
      email,
      interest,
      created_at,
    });

    // 이메일 알림 전송 (NOTIFY_EMAIL_TO 환경 변수 필요)
    const notifyTo = Deno.env.get('NOTIFY_EMAIL_TO');
    if (notifyTo) {
      const subject = `[에스리본 클리닉] 새 상담 신청 — ${name} 님`;
      const text = [
        `새로운 온라인 상담 신청이 접수되었습니다.`,
        ``,
        `이름: ${name}`,
        `연락처: ${phone}`,
        email ? `이메일: ${email}` : '',
        interest ? `관심 시술: ${interest}` : '',
        `고민 사항: ${concern}`,
        preferred_time ? `희망 상담 시간: ${preferred_time}` : '',
        ``,
        `접수일: ${created_at}`,
        ``,
        `관리자 패널에서 확인하세요: https://s-reborn-clinic.pages.dev/admin/consults`,
      ].filter(line => line !== undefined).join('\n');

      // TODO: 실제 이메일 전송 연동 (Resend, SendGrid 등)
      console.log('[notify-consult] Would send email to:', notifyTo);
      console.log('[notify-consult] Subject:', subject);
      console.log('[notify-consult] Body:\n', text);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[notify-consult] Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
