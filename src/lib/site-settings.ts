import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

type SiteSettingRow = {
  key: string;
  value_json: Record<string, any> | null;
};

export type PublicSiteSettings = {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage: string | null;
  featuredSlug: string | null;
  aboutIntro: string | null;
  socialLinks: Record<string, string>;
};

const fallbackSettings: PublicSiteSettings = {
  siteTitle: SITE_TITLE,
  siteDescription: SITE_DESCRIPTION,
  defaultOgImage: null,
  featuredSlug: null,
  aboutIntro: '에스리본 클리닉은 환자분들의 건강과 아름다움을 최우선으로 생각합니다.',
  socialLinks: {},
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return fallbackSettings;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=key,value_json&key=in.(site_meta,homepage,about_page,social_links)`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!response.ok) {
      return fallbackSettings;
    }

    const rows = (await response.json()) as SiteSettingRow[];
    const map = new Map(rows.map((row) => [row.key, row.value_json || {}]));
    const siteMeta = map.get('site_meta') || {};
    const homepage = map.get('homepage') || {};
    const aboutPage = map.get('about_page') || {};
    const socialLinks = map.get('social_links') || {};

    return {
      siteTitle: siteMeta.title || SITE_TITLE,
      siteDescription: siteMeta.description || SITE_DESCRIPTION,
      defaultOgImage: siteMeta.default_og_image || null,
      featuredSlug: homepage.featured_slug || null,
      aboutIntro: aboutPage.intro || fallbackSettings.aboutIntro,
      socialLinks,
    };
  } catch {
    return fallbackSettings;
  }
}
