/**
 * auto-translate Edge Function
 *
 * 어드민에서 새 포스트를 Supabase DB에 저장할 때 자동으로 영문 번역을 생성합니다.
 *
 * 호출 방식:
 *   POST /functions/v1/auto-translate
 *   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *   Content-Type: application/json
 *
 * Body (Supabase Webhook 또는 직접 호출):
 *   { "title": "...", "description": "...", "slug": "...", "id": "..." }
 *
 * 응답:
 *   { "title_en": "...", "description_en": "..." }
 *
 * Supabase Dashboard 환경변수 (Edge Function Secrets):
 *   ANTHROPIC_API_KEY
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-6';

const SYSTEM_PROMPT = `You are a professional medical translator specializing in aesthetic dermatology and cosmetic procedures in Korea.
Translate Korean content to natural, professional English suitable for an international medical clinic website.

Guidelines:
- Use standard English medical/dermatology terminology
- Maintain the original tone (informative and reassuring, not overly clinical)
- Keep titles concise and compelling
- Do NOT translate: brand names (에스리본, Botox, Juvederm), medical acronyms (HIFU, RF, IPL), URLs

Consistent glossary:
시술 → procedure/treatment  |  보톡스 → Botox  |  필러 → filler
리프팅 → lifting  |  고주파 → RF (radiofrequency)  |  실 리프팅 → thread lifting
스킨부스터 → skin booster  |  레이저 토닝 → laser toning  |  원장 → chief physician
수액 → IV drip  |  탈모 → hair loss  |  여드름 → acne  |  비만 → weight management`;

interface TranslationResult {
  title_en: string;
  description_en: string;
}

async function callClaudeApi(
  apiKey: string,
  title: string,
  description: string,
): Promise<TranslationResult> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Translate these two fields from Korean to English. Return ONLY valid JSON, no extra text.

Input:
{
  "title": ${JSON.stringify(title)},
  "description": ${JSON.stringify(description)}
}

Output format:
{
  "title_en": "...",
  "description_en": "..."
}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${err}`);
  }

  const data = await resp.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find((c) => c.type === 'text')?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Non-JSON response from Claude: ${text}`);

  const parsed = JSON.parse(jsonMatch[0]) as TranslationResult;
  if (!parsed.title_en || !parsed.description_en) {
    throw new Error(`Incomplete translation: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  let body: { title?: string; description?: string; slug?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const { title, description } = body;

  if (!title || !description) {
    return new Response(
      JSON.stringify({ error: 'title and description are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const result = await callClaudeApi(anthropicKey, title, description);
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Translation failed:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
