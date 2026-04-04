import type { APIRoute } from 'astro';

/** 검색·답변 엔진(공식 크롤러)은 허용, 관리자 경로는 차단. 무단 스크래핑은 법적·플랫폼 정책으로 다룸. */
export const GET: APIRoute = ({ site }) => {
  let base = 'https://s-reborn-clinic.pages.dev';
  try {
    if (site) base = new URL(site).origin;
  } catch {
    /* keep default */
  }

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    '',
    '# 공식 크롤러(robots 준수 시) — 인용·요약·검색 노출(GEO/AEO) 허용',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Claude-SearchBot',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: CCBot',
    'Allow: /',
    '',
    'User-agent: Amazonbot',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
