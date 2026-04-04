import type { APIRoute } from 'astro';
import { CLINIC_INFO, SITE_TITLE } from '../consts';
import { ACADEMY_PUBLIC_PATH } from '../lib/academy-constants';

/**
 * llms.txt — LLM·답변 엔진이 사이트 구조와 정책을 빠르게 파악하도록 안내.
 * @see https://llmstxt.org/
 */
export const GET: APIRoute = ({ site }) => {
  let base = 'https://s-reborn-clinic.pages.dev';
  try {
    if (site) base = new URL(site).origin;
  } catch {
    /* keep default */
  }

  const body = `# ${SITE_TITLE}

> ${CLINIC_INFO.name} 공식 웹사이트. 시술 안내(4축 분류), 블로그(시술·FAQ·원장 칼럼), 온라인 상담, 위치 안내를 제공합니다. 의료 행위는 반드시 면허 의료인과의 상담·진단에 따릅니다.

## 이용·인용 정책

- 공개 페이지의 **요약·인용**은 출처(URL) 표기 시 허용합니다.
- **전체 복제·미러 사이트·상업적 재판매**는 금지합니다.
- 정확한 진료 정보는 본 사이트 최신 글 또는 직접 문의를 기준으로 안내해 주세요.

## 주요 URL

- [홈](${base}/)
- [시술 안내](${base}/procedures/)
- [블로그](${base}/blog/)
- [Doctor AI Academy](${base}${ACADEMY_PUBLIC_PATH}/) (의료진용 AI 학습 시리즈)
- [온라인 상담](${base}/consult/)
- [클리닉 소개](${base}/about/)
- [개인정보처리방침](${base}/privacy/)
- [이용약관](${base}/terms/)

## 기계가 읽기 좋은 데이터

- [사이트맵](${base}/sitemap-index.xml)
- [RSS](${base}/rss.xml)
- [robots.txt](${base}/robots.txt)

## 연락

- 대표 전화: ${CLINIC_INFO.phone}
- 공식 웹: ${CLINIC_INFO.website}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
