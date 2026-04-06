-- Published 글만 공개 읽기 (블로그 FTS·목록용 anon 접근)
drop policy if exists "posts_public_select_published" on public.posts;
create policy "posts_public_select_published"
on public.posts
for select
to anon, authenticated
using (status = 'published');

alter table public.posts
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '')
        || ' '
        || coalesce(description, '')
        || ' '
        || coalesce(body_markdown, '')
    )
  ) stored;

create index if not exists posts_search_idx on public.posts using gin (search_vector);
