/**
 * translate-posts.ts
 *
 * 블로그 마크다운 파일의 title_en / description_en 필드를 Claude API로 자동 번역합니다.
 *
 * 사용법:
 *   npx tsx scripts/translate-posts.ts           # 미번역 파일만 처리
 *   npx tsx scripts/translate-posts.ts --force   # 이미 번역된 파일도 재번역
 *   npx tsx scripts/translate-posts.ts --file src/content/blog/doctor-column/aging-priorities.md
 *
 * 환경변수: ANTHROPIC_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';

// ─── 설정 ────────────────────────────────────────────────────────────────────

const CONTENT_DIR = path.resolve('src/content/blog');
const DELAY_MS = 800; // API 요청 간격 (rate limit 방지)
const MODEL = 'claude-opus-4-6';

const SYSTEM_PROMPT = `You are a professional medical translator specializing in aesthetic dermatology and cosmetic procedures in Korea.
Translate Korean content to natural, professional English suitable for an international medical clinic website.

Guidelines:
- Use standard English medical/dermatology terminology
- Maintain the original tone (informative and reassuring, not overly clinical)
- Keep titles concise and compelling — do NOT just transliterate
- Do NOT translate: brand names (에스리본, Botox, Juvederm), medical acronyms already in English (HIFU, RF, IPL), URLs

Consistent glossary:
시술 → procedure / treatment (context-dependent)
보톡스 → Botox
필러 → filler / dermal filler
리프팅 → lifting
고주파 → RF (radiofrequency)
초음파 리프팅 / HIFU → HIFU (High-Intensity Focused Ultrasound)
실 리프팅 → thread lifting
스킨부스터 → skin booster
레이저 토닝 → laser toning
원장 → chief physician / doctor
의원 → clinic
수액 → IV drip
부스터 → booster shot
탈모 → hair loss
여드름 → acne
비만 → obesity / weight management
재생 → regeneration / rejuvenation (context)
피부과 → dermatology / skin clinic`;

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface TranslationResult {
  title_en: string;
  description_en: string;
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** frontmatter 블록에서 특정 키 값을 파싱 */
function parseFrontmatterField(content: string, key: string): string | undefined {
  const re = new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm');
  const m = content.match(re);
  return m ? m[1].trim() : undefined;
}

/** frontmatter에 title_en / description_en 키가 이미 있는지 확인 */
function hasEnglishFields(content: string): boolean {
  return /^title_en:/m.test(content);
}

/**
 * frontmatter 블록 안에 title_en / description_en 을 주입(또는 교체)합니다.
 * title: 줄 바로 다음에 삽입합니다.
 */
function injectTranslation(fileContent: string, translation: TranslationResult): string {
  const fmMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    throw new Error('No frontmatter found');
  }

  let fm = fmMatch[1];

  // 기존 title_en / description_en 제거
  fm = fm.replace(/^title_en:.*\n?/m, '');
  fm = fm.replace(/^description_en:.*\n?/m, '');

  // title 줄 바로 다음에 title_en 삽입
  const titleLine = fm.match(/^(title:.*)$/m)?.[1] ?? '';
  if (titleLine) {
    fm = fm.replace(
      titleLine,
      `${titleLine}\ntitle_en: "${translation.title_en.replace(/"/g, '\\"')}"\ndescription_en: "${translation.description_en.replace(/"/g, '\\"')}"`,
    );
  }

  return fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${fm}\n---`);
}

// ─── 번역 ─────────────────────────────────────────────────────────────────────

async function translateFields(
  client: Anthropic,
  title: string,
  description: string,
): Promise<TranslationResult> {
  const prompt = `Translate these two fields from Korean to English. Return ONLY valid JSON, no extra text.

Input:
{
  "title": ${JSON.stringify(title)},
  "description": ${JSON.stringify(description)}
}

Output format:
{
  "title_en": "...",
  "description_en": "..."
}`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude returned non-JSON: ${text}`);

  const parsed = JSON.parse(jsonMatch[0]) as TranslationResult;
  if (!parsed.title_en || !parsed.description_en) {
    throw new Error(`Incomplete translation: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const fileArg = args.find((a) => !a.startsWith('--'));

  const client = new Anthropic({ apiKey });

  // 대상 파일 수집
  let files: string[];
  if (fileArg) {
    files = [path.resolve(fileArg)];
  } else {
    const iter = glob(`${CONTENT_DIR}/**/*.md`);
    files = [];
    for await (const f of iter) files.push(f);
    files.sort();
  }

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\n🌐 S-Reborn Clinic — Post Translation Script`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Files: ${files.length} total | force=${force}\n`);

  for (const filePath of files) {
    const rel = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!force && hasEnglishFields(content)) {
      skipped++;
      continue;
    }

    const title = parseFrontmatterField(content, 'title');
    const description = parseFrontmatterField(content, 'description');

    if (!title || !description) {
      console.warn(`  ⚠  Skipping (no title/description): ${rel}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ↻  ${rel} … `);

    try {
      const result = await translateFields(client, title, description);
      const updated = injectTranslation(content, result);
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`✓`);
      console.log(`       title_en:       ${result.title_en}`);
      console.log(`       description_en: ${result.description_en}\n`);
      translated++;
    } catch (err) {
      console.log(`✗`);
      console.error(`       Error: ${err instanceof Error ? err.message : String(err)}\n`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log('─'.repeat(60));
  console.log(`✅ Translated: ${translated}`);
  console.log(`⏭  Skipped:   ${skipped}`);
  if (failed > 0) console.log(`❌ Failed:    ${failed}`);
  console.log('');

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
