import type { APIRoute } from 'astro';

export const prerender = false;

interface ConsultPayload {
  name: string;
  phone: string;
  ageRange?: string;
  gender?: string;
  language?: string;
  concerns?: { id: string; label: string }[];
  answers?: Record<string, string[]>;
  aiSummary?: string;
  aiRecommendations?: unknown[];
  preferredContact?: string;
}

// ── Supabase 저장 ────────────────────────────────────────────────
async function saveToSupabase(payload: ConsultPayload): Promise<void> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('[consult-submit] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 미설정 — Supabase 저장 건너뜀');
    return;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/consultations`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      age_range: payload.ageRange || null,
      gender: payload.gender || null,
      language: payload.language || 'ko',
      preferred_contact: payload.preferredContact || null,
      concerns: payload.concerns ?? [],
      answers: payload.answers ?? {},
      ai_summary: payload.aiSummary || null,
      ai_recommendations: payload.aiRecommendations ?? [],
      status: 'new',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase 저장 실패: ${res.status} ${errText}`);
  }
}

// ── Slack 알림 ────────────────────────────────────────────────────
async function sendSlackNotification(payload: ConsultPayload): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[consult-submit] SLACK_WEBHOOK_URL 미설정 — Slack 알림 건너뜀');
    return;
  }

  const concernsText =
    payload.concerns && payload.concerns.length > 0
      ? payload.concerns.map((c) => `• ${c.label}`).join('\n')
      : '없음';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🩺 새 상담 신청이 접수되었습니다',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*이름*\n${payload.name}` },
        { type: 'mrkdwn', text: `*연락처*\n${payload.phone}` },
        {
          type: 'mrkdwn',
          text: `*연령대*\n${payload.ageRange || '-'}`,
        },
        {
          type: 'mrkdwn',
          text: `*성별*\n${payload.gender || '-'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*선택 고민*\n${concernsText}`,
      },
    },
    ...(payload.aiSummary
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*AI 요약*\n${payload.aiSummary}`,
            },
          },
        ]
      : []),
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*선호 상담 방식*\n${payload.preferredContact || '-'}`,
        },
        {
          type: 'mrkdwn',
          text: `*언어*\n${payload.language || 'ko'}`,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `접수 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} | 에스리본 클리닉 관리자 패널에서 확인하세요`,
        },
      ],
    },
  ];

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    throw new Error(`Slack 알림 실패: ${res.status}`);
  }
}

// ── 이메일 알림 (Resend) ──────────────────────────────────────────
async function sendEmailNotification(payload: ConsultPayload): Promise<void> {
  const resendKey = import.meta.env.RESEND_API_KEY;
  const adminEmail = import.meta.env.ADMIN_EMAIL;

  if (!resendKey || !adminEmail) {
    console.warn('[consult-submit] RESEND_API_KEY 또는 ADMIN_EMAIL 미설정 — 이메일 알림 건너뜀');
    return;
  }

  const recipients = adminEmail
    .split(',')
    .map((e: string) => e.trim())
    .filter(Boolean);

  const concernsHtml =
    payload.concerns && payload.concerns.length > 0
      ? `<ul>${payload.concerns.map((c) => `<li>${c.label}</li>`).join('')}</ul>`
      : '<p>없음</p>';

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /><title>새 상담 신청</title></head>
<body style="font-family: sans-serif; color: #2A2420; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #F9F5F0; padding: 20px 24px; border-radius: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 4px; font-size: 1.2rem; color: #A07840;">🩺 에스리본 클리닉</h1>
    <h2 style="margin: 0; font-size: 1.5rem;">새 상담 신청이 접수되었습니다</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 8px 12px; background: #F0E4CA; font-weight: 700; border-radius: 6px 0 0 6px; width: 100px;">이름</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E8E0D8;">${payload.name}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #F0E4CA; font-weight: 700;">연락처</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E8E0D8;">${payload.phone}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #F0E4CA; font-weight: 700;">연령대</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E8E0D8;">${payload.ageRange || '-'}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #F0E4CA; font-weight: 700;">성별</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E8E0D8;">${payload.gender || '-'}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #F0E4CA; font-weight: 700;">선호 상담</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E8E0D8;">${payload.preferredContact || '-'}</td>
    </tr>
  </table>

  <h3 style="margin: 0 0 8px; font-size: 1rem; color: #A07840;">선택 고민</h3>
  ${concernsHtml}

  ${
    payload.aiSummary
      ? `
  <h3 style="margin: 16px 0 8px; font-size: 1rem; color: #A07840;">AI 분석 요약</h3>
  <p style="background: #FDFBF8; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #C9A96E; margin: 0;">${payload.aiSummary}</p>
  `
      : ''
  }

  <p style="margin-top: 24px; font-size: 0.85rem; color: #9A9090;">
    이 메일은 에스리본 클리닉 온라인 상담 마법사를 통해 자동 발송되었습니다.<br/>
    접수 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
  </p>
</body>
</html>`;

  for (const to of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@s-reborn.com',
        to,
        subject: `[에스리본] 새 상담 신청 — ${payload.name} 님`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend 이메일 실패 (${to}): ${res.status} ${err}`);
    }
  }
}

// ── Telegram 알림 ─────────────────────────────────────────────────
async function sendTelegramNotification(payload: ConsultPayload): Promise<void> {
  const botToken = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[consult-submit] TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 미설정 — Telegram 알림 건너뜀');
    return;
  }

  const concernsText =
    payload.concerns && payload.concerns.length > 0
      ? payload.concerns.map((c) => `  • ${c.label}`).join('\n')
      : '  없음';

  const message = [
    '🩺 <b>에스리본 클리닉 — 새 상담 신청</b>',
    '',
    `👤 <b>이름:</b> ${payload.name}`,
    `📞 <b>연락처:</b> ${payload.phone}`,
    `🎂 <b>연령대:</b> ${payload.ageRange || '-'}`,
    `⚧ <b>성별:</b> ${payload.gender || '-'}`,
    `💬 <b>선호 상담:</b> ${payload.preferredContact || '-'}`,
    '',
    `📋 <b>선택 고민:</b>`,
    concernsText,
    ...(payload.aiSummary
      ? ['', `🤖 <b>AI 요약:</b>`, payload.aiSummary]
      : []),
    '',
    `⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
  ].join('\n');

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram 알림 실패: ${res.status} ${err}`);
  }
}

// ── 메인 핸들러 ────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  let body: ConsultPayload;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: '잘못된 요청 형식' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.name || !body.phone) {
    return new Response(
      JSON.stringify({ ok: false, error: '이름과 연락처는 필수입니다.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const results = await Promise.allSettled([
    saveToSupabase(body),
    sendSlackNotification(body),
    sendEmailNotification(body),
    sendTelegramNotification(body),
  ]);

  // 로그 (실패한 항목)
  const labels = ['Supabase', 'Slack', 'Email', 'Telegram'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[consult-submit] ${labels[i]} 실패:`, r.reason);
    }
  });

  // Supabase 저장 성공 여부 확인
  if (results[0].status === 'rejected') {
    return new Response(
      JSON.stringify({
        ok: false,
        error: '상담 신청 저장 중 오류가 발생했습니다. 다시 시도하거나 전화로 문의해 주세요.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
