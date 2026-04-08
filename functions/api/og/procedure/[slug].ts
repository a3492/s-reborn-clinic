/**
 * 시술 페이지 동적 OG 이미지 (PNG).
 * URL: /api/og/procedure/[slug]?title=...&category=...&pillar=ebd|injection|oral|topical
 * Satori + resvg-wasm 사용.
 */
/// <reference types="@cloudflare/workers-types" />

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const OG_W = 1200;
const OG_H = 630;
const CACHE = 'public, max-age=86400';

const PILLAR_LABELS: Record<string, string> = {
  ebd: 'EBD · 에너지 기기',
  injection: '주사 · 액상 시술',
  oral: '경구 약물',
  topical: '외용제',
};

// 필라별 테마 색상
const PILLAR_COLORS: Record<string, { bg: string; accent: string }> = {
  ebd:       { bg: 'linear-gradient(145deg, #1a2335 0%, #2a3a55 45%, #1f2d40 100%)', accent: '#7eb8d4' },
  injection: { bg: 'linear-gradient(145deg, #1a2e20 0%, #2a4535 45%, #1f3028 100%)', accent: '#7ed48a' },
  oral:      { bg: 'linear-gradient(145deg, #2e1a2a 0%, #452a40 45%, #301f35 100%)', accent: '#d47eb8' },
  topical:   { bg: 'linear-gradient(145deg, #2e2a1a 0%, #453e2a 45%, #35301f 100%)', accent: '#d4c47e' },
};

let wasmReady: Promise<void> | null = null;
function ensureResvgWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const url = 'https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`resvg wasm fetch failed: ${res.status}`);
      await initWasm(await res.arrayBuffer());
    })();
  }
  return wasmReady;
}

let fontData: ArrayBuffer | null = null;
async function loadKoreanFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const url =
    'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5CgmG0X7twrxu-Q.ttf';
  const res = await fetch(url);
  if (!res.ok) {
    const fallback = await fetch(
      'https://unpkg.com/@fontsource/noto-sans-kr@5.0.18/files/noto-sans-kr-korean-400-normal.woff',
    );
    if (!fallback.ok) throw new Error('font fetch failed');
    fontData = await fallback.arrayBuffer();
    return fontData;
  }
  fontData = await res.arrayBuffer();
  return fontData;
}

function clipTitle(title: string, maxChars = 68): string {
  const t = title.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}

export const onRequestGet = async (context: {
  request: Request;
  params: Record<string, string>;
}) => {
  const { request, params } = context;
  const url = new URL(request.url);

  const rawTitle = url.searchParams.get('title') || params.slug || '시술 안내';
  const category = url.searchParams.get('category') || '';
  const pillar = (url.searchParams.get('pillar') || 'ebd') as string;

  const title = clipTitle(decodeURIComponent(rawTitle));
  const badgeLabel = PILLAR_LABELS[pillar] ?? '시술 안내';
  const theme = PILLAR_COLORS[pillar] ?? PILLAR_COLORS.ebd;

  try {
    const [font] = await Promise.all([loadKoreanFont(), ensureResvgWasm()]);

    const element = {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: theme.bg,
          padding: 56,
          justifyContent: 'space-between',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: 20 },
              children: [
                // 필라 배지
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            alignSelf: 'flex-start',
                            backgroundColor: `rgba(255,255,255,0.12)`,
                            color: theme.accent,
                            fontSize: 20,
                            fontWeight: 700,
                            padding: '8px 18px',
                            borderRadius: 999,
                            border: `1px solid rgba(255,255,255,0.2)`,
                          },
                          children: badgeLabel,
                        },
                      },
                      category
                        ? {
                            type: 'div',
                            props: {
                              style: {
                                alignSelf: 'flex-start',
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: 18,
                                fontWeight: 600,
                                padding: '8px 16px',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,0.1)',
                              },
                              children: category,
                            },
                          }
                        : { type: 'div', props: { style: { width: 1, height: 1 } } },
                    ],
                  },
                },
                // 제목
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#ffffff',
                      fontSize: 54,
                      fontWeight: 800,
                      lineHeight: 1.25,
                      letterSpacing: -0.5,
                      marginTop: 8,
                    },
                    children: title,
                  },
                },
              ],
            },
          },
          // 하단 바
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: 28,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { color: theme.accent, fontSize: 24, fontWeight: 700 },
                    children: 'S-Reborn Clinic · 시술 안내',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { color: 'rgba(255,255,255,0.4)', fontSize: 19 },
                    children: 's-reborn-clinic.pages.dev',
                  },
                },
              ],
            },
          },
        ],
      },
    };

    const svg = await satori(element as any, {
      width: OG_W,
      height: OG_H,
      fonts: [
        { name: 'Noto Sans KR', data: font, weight: 800, style: 'normal' },
        { name: 'Noto Sans KR', data: font, weight: 400, style: 'normal' },
      ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: OG_W } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE,
      },
    });
  } catch (e) {
    console.error('[og/procedure]', e);
    return new Response('Render error', { status: 500 });
  }
};
