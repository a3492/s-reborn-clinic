import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const { concerns = [], answers = {}, language = 'ko' } = body as {
    concerns: string[];
    answers: Record<string, string[]>;
    language: string;
  };

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[consult-ai] ANTHROPIC_API_KEY 미설정 — 개발 모드 응답 반환');
    return new Response(
      JSON.stringify({
        summary:
          '선택하신 고민들을 확인했습니다. 에스리본 클리닉에서는 개인별 피부 상태와 체질을 고려한 맞춤 시술을 제공합니다. 정확한 진단을 위해 내원 상담을 권장드립니다. (개발 모드 — API 키 미설정)',
        recommendations: [
          {
            title: '초기 상담 및 피부 분석',
            description: '전문 의료진이 직접 피부 상태를 분석하고, 최적의 시술 방향을 제안해 드립니다.',
            reasoning: '정확한 진단 없이는 최적의 치료 계획을 세우기 어렵습니다.',
          },
          {
            title: '비수술적 개선 옵션 검토',
            description: '레이저, RF, 보툴리눔 등 다양한 비수술 옵션 중 고민에 맞는 방법을 검토합니다.',
            reasoning: '먼저 비수술적 방법으로 개선 가능성을 확인하는 것이 중요합니다.',
          },
        ],
        cautions: [
          '시술 전 정확한 진단이 필요합니다. 반드시 전문 의료진과 직접 상담하세요.',
          '시술 후 관리 방법도 중요합니다. 내원 시 자세히 안내받으세요.',
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // 고민 목록 한국어 문자열로 변환
  const concernsText = concerns.length > 0 ? concerns.join(', ') : '없음';

  // 답변 요약
  const answersText = Object.entries(answers)
    .filter(([, v]) => v && v.length > 0)
    .map(([k, v]) => `- ${k}: ${v.join(', ')}`)
    .join('\n');

  const prompt = `당신은 에스리본 클리닉의 친절하고 전문적인 AI 상담 어시스턴트입니다.

환자가 온라인 상담 마법사를 통해 다음과 같은 고민과 정보를 입력했습니다.

## 선택한 고민 (경로 형식)
${concernsText}

## 세부 답변
${answersText || '(답변 없음)'}

위 정보를 바탕으로 다음 형식의 JSON을 반환해 주세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "summary": "2~3문장 한국어 고민 요약. 따뜻하고 공감하는 어조로 작성. 정확한 진단을 내리지 말 것.",
  "recommendations": [
    {
      "title": "추천 방향 제목 (짧게, 예: '색소 레이저 치료 검토')",
      "description": "1~2문장 설명. 구체적이되 확정적 진단은 피할 것.",
      "reasoning": "이 방향을 추천하는 간략한 이유"
    }
  ],
  "cautions": [
    "주의사항 1",
    "주의사항 2"
  ]
}

중요 지침:
- recommendations는 2~3개
- cautions는 2~4개
- 모든 텍스트는 한국어
- 확정적 진단이나 처방은 절대 하지 말 것
- 항상 내원 상담을 권장하는 내용 포함
- 따뜻하고 전문적인 어조 유지
- JSON만 반환, 다른 마크다운이나 코드블록 없음`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[consult-ai] Anthropic API 오류:', res.status, errText);
      throw new Error(`Anthropic API error: ${res.status}`);
    }

    const data = await res.json();
    const content = data?.content?.[0]?.text || '';

    // JSON 파싱 시도
    let parsed: { summary: string; recommendations: unknown[]; cautions: string[] };
    try {
      // 코드블록 제거 후 파싱
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[consult-ai] JSON 파싱 실패, raw 응답:', content);
      parsed = {
        summary: content.slice(0, 500) || '분석 결과를 가져오는 중 오류가 발생했습니다.',
        recommendations: [],
        cautions: ['정확한 상담을 위해 직접 내원해 주세요.'],
      };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[consult-ai] 오류:', err);
    return new Response(
      JSON.stringify({
        summary: 'AI 분석 중 일시적 오류가 발생했습니다. 상담 신청서를 제출하시면 의료진이 직접 검토해 드립니다.',
        recommendations: [],
        cautions: ['정확한 진단과 치료를 위해 반드시 전문 의료진과 직접 상담하세요.'],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
