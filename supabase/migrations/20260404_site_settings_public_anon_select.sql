-- 공개 페이지(getPublicSiteSettings)가 anon 키로 일부 설정을 읽을 수 있도록 허용
-- (기존 policy는 authenticated 관리자만 all — anon은 행이 보이지 않아 항상 fallback만 사용됨)

drop policy if exists "site_settings_public_anon_select" on public.site_settings;
create policy "site_settings_public_anon_select"
on public.site_settings
for select
to anon
using (key in ('site_meta', 'homepage', 'about_page', 'social_links'));
