import { CLINIC_INFO, SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { ACADEMY_PUBLIC_PATH } from './academy-constants';

function originOnly(site: string | URL | undefined, fallback: string): string {
  if (!site) return fallback.replace(/\/$/, '');
  try {
    return new URL(typeof site === 'string' ? site : site.href).origin;
  } catch {
    return fallback.replace(/\/$/, '');
  }
}

// ─── 1. Organization + WebSite (모든 페이지 기본) ───────────────────────────

export function buildOrganizationAndWebSiteJsonLd(site: string | URL | undefined) {
  const origin = originOnly(site, 'https://s-reborn-clinic.pages.dev');
  const sameAs = [CLINIC_INFO.website, CLINIC_INFO.kakaoChannel].filter(Boolean);

  const organization = {
    '@type': ['MedicalClinic', 'LocalBusiness'],
    '@id': `${origin}/#organization`,
    name: CLINIC_INFO.name,
    alternateName: SITE_TITLE,
    url: origin,
    description: SITE_DESCRIPTION,
    telephone: CLINIC_INFO.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${CLINIC_INFO.address} ${CLINIC_INFO.addressDetail}`.trim(),
      addressLocality: '서울특별시',
      addressRegion: '마포구',
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.5563,
      longitude: 126.9238,
    },
    medicalSpecialty: ['가정의학과', '피부과', '미용성형'],
    employee: { '@id': `${origin}/#director` },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const director = {
    '@type': 'Physician',
    '@id': `${origin}/#director`,
    name: '김도위',
    jobTitle: '대표원장',
    honorificPrefix: '원장',
    worksFor: { '@id': `${origin}/#organization` },
    url: `${origin}/about/`,
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        name: '텐써마(Thermage) 키닥터',
        credentialCategory: 'certificate',
        recognizedBy: { '@type': 'Organization', name: 'Tentech' },
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: '써펙트(Sylfirm) 키닥터',
        credentialCategory: 'certificate',
      },
    ],
    knowsAbout: [
      '고주파 리프팅', '텐써마', '써펙트', '울쎄라', '보톡스', '필러',
      '피부 노화 관리', '에너지 기반 시술',
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: origin,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    inLanguage: 'ko-KR',
    publisher: { '@id': `${origin}/#organization` },
    potentialAction: {
      '@type': 'ReadAction',
      target: [
        `${origin}/`,
        `${origin}/procedures/`,
        `${origin}/blog/`,
        `${origin}${ACADEMY_PUBLIC_PATH}/`,
        `${origin}/consult/`,
      ],
    },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, director, website],
  };
}

// ─── 2. BlogPosting (블로그 글 페이지) ─────────────────────────────────────

export function buildArticlePageGraph(
  site: string | URL | undefined,
  opts: {
    title: string;
    description: string;
    url: string;
    datePublished: Date;
    dateModified?: Date;
    image?: string;
    category?: string;
  }
) {
  const origin = originOnly(site, 'https://s-reborn-clinic.pages.dev');
  const img =
    opts.image &&
    (opts.image.startsWith('http') ? opts.image : new URL(opts.image, origin).href);

  const org = {
    '@type': 'MedicalClinic',
    '@id': `${origin}/#organization`,
    name: CLINIC_INFO.name,
    url: origin,
    telephone: CLINIC_INFO.phone,
  };

  const article = {
    '@type': 'BlogPosting',
    '@id': `${opts.url}#article`,
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    inLanguage: 'ko-KR',
    author: { '@id': `${origin}/#director` },
    publisher: { '@id': `${origin}/#organization` },
    copyrightHolder: { '@id': `${origin}/#organization` },
    ...(img ? { image: [img] } : {}),
    ...(opts.category ? { articleSection: opts.category } : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [org, article],
  };
}

// ─── 3. FAQPage (FAQ 섹션이 있는 페이지) ────────────────────────────────────

export function buildFaqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ─── 4. BreadcrumbList (페이지 경로 표시) ───────────────────────────────────

export function buildBreadcrumbJsonLd(
  site: string | URL | undefined,
  crumbs: { name: string; path: string }[]
) {
  const origin = originOnly(site, 'https://s-reborn-clinic.pages.dev');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: `${origin}${crumb.path}`,
    })),
  };
}

// ─── 5. 여러 Schema 합치기 헬퍼 ─────────────────────────────────────────────

export function mergeJsonLd(...schemas: Record<string, unknown>[]) {
  if (schemas.length === 1) return schemas[0];
  return schemas;
}
