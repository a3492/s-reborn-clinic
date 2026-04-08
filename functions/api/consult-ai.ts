function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const { request, env } = context;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: '요청 본문이 필요합니다.' }, 400);
  }

  const concerns = (Array.isArray(body.concerns) ? body.concerns : []) as string[];
  const answers = (typeof body.answers === 'object' && body.answers !== null ? body.answers : {}) as Record<string, string[]>;
  const language = String(body.language ?? 'ko');
  const isKo = language !== 'en';

  // ── OpenAI 분석 (OPENAI_API_KEY 있을 때) ──────────────────────
  if (env.OPENAI_API_KEY) {
    try {
      const answerSummary = Object.entries(answers)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n');

      const systemPrompt = isKo
        ? `당신은 미용 피부과 클리닉(에스리본 클리닉)의 친절한 상담 어시스턴트입니다.
고객의 피부 고민과 문진 응답을 바탕으로 간결하고 전문적인 사전 분석을 한국어로 제공합니다.
반드시 JSON 형식으로만 응답하세요: { "summary": string, "recommendations": [{ "title": string, "description": string, "reasoning": string }], "cautions": string[] }
추천은 2~3개, 주의사항은 1~2개로 제한하고, 과도한 의학적 확신을 피하며 내원 상담을 유도하세요.`
        : `You are a friendly assistant at S-Reborn Clinic, a cosmetic dermatology clinic.
Provide a concise, professional pre-consultation analysis in English based on the patient's skin concerns and questionnaire responses.
Reply in JSON only: { "summary": string, "recommendations": [{ "title": string, "description": string, "reasoning": string }], "cautions": string[] }
Limit to 2-3 recommendations and 1-2 cautions. Avoid overconfident medical claims and encourage an in-person consultation.`;

      const userPrompt = isKo
        ? `고객 고민: ${concerns.join(', ')}\n문진 응답:\n${answerSummary}`
        : `Patient concerns: ${concerns.join(', ')}\nQuestionnaire responses:\n${answerSummary}`;

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 800,
          temperature: 0.6,
        }),
      });

      if (aiRes.ok) {
        const aiData = (await aiRes.json()) as { choices?: { message?: { content?: string } }[] };
        const content = aiData.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(content) as {
          summary?: string;
          recommendations?: unknown[];
          cautions?: unknown[];
        };
        return jsonResponse({
          summary: parsed.summary ?? '',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
        });
      }
    } catch (e) {
      console.error('[consult-ai] OpenAI error:', e);
    }
  }

  // ── 폴백: 규칙 기반 응답 ────────────────────────────────────────
  const concernText = concerns.length > 0 ? concerns.join(', ') : (isKo ? '피부 고민' : 'skin concerns');

  const summary = isKo
    ? `고객님의 주요 고민(${concernText})을 확인했습니다. 정확한 피부 상태 평가와 맞춤 시술 안내는 내원 상담을 통해 가능합니다. 상담 신청서를 제출하시면 1~2 영업일 이내에 연락드리겠습니다.`
    : `We've reviewed your concerns (${concernText}). An accurate skin assessment and personalized treatment plan will be provided during your in-person consultation. Submit a consultation request and we'll get back to you within 1-2 business days.`;

  const recommendations = isKo
    ? [
        {
          title: '내원 상담 권장',
          description: '피부 상태를 직접 확인한 후 가장 적합한 시술을 안내해 드립니다.',
          reasoning: '사진이나 텍스트만으로는 개인별 피부 상태를 정확히 파악하기 어렵습니다.',
        },
        {
          title: '상담 전 생활습관 메모',
          description: '현재 사용 중인 스킨케어 제품, 복용 중인 약물, 알레르기 이력을 메모해 오시면 더욱 정밀한 상담이 가능합니다.',
          reasoning: '진료 시 참고 정보가 많을수록 최적의 치료 계획을 세울 수 있습니다.',
        },
      ]
    : [
        {
          title: 'In-Person Consultation Recommended',
          description: "We'll assess your skin directly and recommend the most suitable treatments.",
          reasoning: 'A personalized evaluation requires direct examination.',
        },
        {
          title: 'Prepare for Your Visit',
          description: 'Please note your current skincare routine, medications, and any allergy history for a more thorough consultation.',
          reasoning: 'More information leads to a better treatment plan.',
        },
      ];

  const cautions = isKo
    ? ['모든 시술은 개인 피부 상태와 건강 상황에 따라 적합성이 다를 수 있습니다. 반드시 전문의 진료 후 결정해 주세요.']
    : ['Treatment suitability varies by individual skin condition and health. Always consult a specialist before proceeding.'];

  return jsonResponse({ summary, recommendations, cautions });
};
