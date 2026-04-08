/**
 * 동적 OG 이미지 (PNG). Satori + resvg-wasm.
 * 슬래시가 있는 slug는 encodeURIComponent 로 한 세그먼트에 넣습니다: /api/og/cat%2Fpost/
 */
/// <reference types="@cloudflare/workers-types" />

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const OG_W = 1200;
const OG_H = 630;
const CACHE = 'public, max-age=86400';

const CATEGORY_LABELS: Record<string, string> = {
  procedures: '시술·치료',
  'before-after': '전후 사례',
  'patient-story': '환자 이야기',
  'health-tips': '건강 정보',
  'clinic-news': '원장·클리닉 소식',
  faq: 'FAQ',
  myth: 'MYTH',
  'doctor-column': '원장 칼럼',
  'doctor-ai': 'Doctor AI Academy',
};

function supabaseHeaders(env: Record<string, string | undefined>) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

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

function categoryBadge(category: string | null): string {
  if (!category) return 'Blog';
  return CATEGORY_LABELS[category] ?? category;
}

function formatDateKo(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/** 2줄 말줄임 (대략적 글자 수) */
function clipTitle(title: string, maxChars = 72): string {
  const t = title.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (p: Promise<unknown>) => void;
}) => {
  const { env, params } = context;
  const raw = params.slug as string | undefined;
  if (!raw) {
    return new Response('Not found', { status: 404 });
  }

  let slug: string;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    slug = raw;
  }

  if (!slug || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Misconfigured', { status: 500 });
  }

  const postRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=title,category,published_at,status&limit=1`,
    { headers: supabaseHeaders(env) },
  );

  if (!postRes.ok) {
    return new Response('Upstream error', { status: 502 });
  }

  const rows = (await postRes.json()) as {
    title?: string;
    category?: string | null;
    published_at?: string | null;
    status?: string;
  }[];

  const post = Array.isArray(rows) ? rows[0] : null;
  if (!post || post.status !== 'published') {
    return new Response('Not found', { status: 404 });
  }

  const title = clipTitle(String(post.title ?? '제목 없음'));
  const badge = categoryBadge(post.category ?? null);
  const dateStr = formatDateKo(post.published_at ?? null);

  try {
    const [font, _] = await Promise.all([loadKoreanFont(), ensureResvgWasm()]);

    const element = {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #1a1a2e 0%, #2d2d4a 45%, #3d2a1f 100%)',
          padding: 56,
          justifyContent: 'space-between',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: 24 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(184, 149, 106, 0.25)',
                      color: '#e8d4b8',
                      fontSize: 22,
                      fontWeight: 700,
                      padding: '10px 20px',
                      borderRadius: 999,
                      border: '1px solid rgba(184, 149, 106, 0.5)',
                    },
                    children: badge,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#ffffff',
                      fontSize: 52,
                      fontWeight: 800,
                      lineHeight: 1.25,
                      letterSpacing: -0.5,
                      maxHeight: 140,
                      overflow: 'hidden',
                    },
                    children: title,
                  },
                },
              ],
            },
          },
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
                    style: { color: '#b8956a', fontSize: 26, fontWeight: 700 },
                    children: 'S-Reborn AI Blog',
                  },
                },
                dateStr
                  ? {
                      type: 'div',
                      props: {
                        style: { color: 'rgba(255,255,255,0.55)', fontSize: 22 },
                        children: dateStr,
                      },
                    }
                  : { type: 'div', props: { style: { width: 1, height: 1 } } },
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
        {
          name: 'Noto Sans KR',
          data: font,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Noto Sans KR',
          data: font,
          weight: 400,
          style: 'normal',
        },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: OG_W },
    });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE,
      },
    });
  } catch (e) {
    console.error('[og]', e);
    return new Response('Render error', { status: 500 });
  }
};
