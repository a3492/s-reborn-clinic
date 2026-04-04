import { CLINIC_INFO, SITE_DESCRIPTION, SITE_TITLE } from '../consts';

function originOnly(site: string | URL | undefined, fallback: string): string {
  if (!site) return fallback.replace(/\/$/, '');
  try {
    return new URL(typeof site === 'string' ? site : site.href).origin;
  } catch {
    return fallback.replace(/\/$/, '');
  }
}

export function buildOrganizationAndWebSiteJsonLd(site: string | URL | undefined) {
  const origin = originOnly(site, 'https://s-reborn-clinic.pages.dev');
  const sameAs = [CLINIC_INFO.website, CLINIC_INFO.kakaoChannel].filter(Boolean);

  const organization = {
    '@type': 'MedicalClinic',
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
      addressCountry: 'KR',
    },
    ...(sameAs.length ? { sameAs } : {}),
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
      target: [`${origin}/`, `${origin}/procedures`, `${origin}/blog`, `${origin}/consult`],
    },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  };
}

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
    author: { '@id': `${origin}/#organization` },
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
