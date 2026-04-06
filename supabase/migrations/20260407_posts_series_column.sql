-- 블로그 시리즈명 (Content `series` frontmatter ↔ admin posts 동기화용, 선택)
alter table public.posts
  add column if not exists series text;

create index if not exists idx_posts_series
  on public.posts (series)
  where series is not null;
