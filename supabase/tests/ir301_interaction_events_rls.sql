-- IR-301 transactional security smoke.
-- Run only after the migration has been applied to a disposable local or
-- preview database. The final rollback leaves no test rows behind.

begin;

do $$
declare
  enabled boolean;
begin
  select c.relrowsecurity
  into enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'interaction_events';

  if enabled is distinct from true then
    raise exception 'IR-301 smoke: RLS is not enabled';
  end if;

  if not has_table_privilege('anon', 'public.interaction_events', 'insert')
     or not has_table_privilege('authenticated', 'public.interaction_events', 'insert') then
    raise exception 'IR-301 smoke: browser INSERT grant is missing';
  end if;

  if has_table_privilege('anon', 'public.interaction_events', 'select')
     or has_table_privilege('anon', 'public.interaction_events', 'update')
     or has_table_privilege('anon', 'public.interaction_events', 'delete')
     or has_table_privilege('authenticated', 'public.interaction_events', 'select')
     or has_table_privilege('authenticated', 'public.interaction_events', 'update')
     or has_table_privilege('authenticated', 'public.interaction_events', 'delete') then
    raise exception 'IR-301 smoke: browser role has a forbidden table privilege';
  end if;
end;
$$;

insert into public.posts (id, title, slug)
values (
  '11111111-1111-4111-8111-111111111111',
  'IR-301 transactional smoke',
  'ir301-transactional-smoke'
);

set local role anon;

insert into public.interaction_events (
  event_id,
  event_name,
  event_version,
  occurred_at,
  received_at,
  content_id,
  slug,
  public_path,
  page_type,
  session_id,
  locale,
  source,
  metadata
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'article.viewed',
  1,
  now(),
  '2000-01-01 00:00:00+00',
  '22222222-2222-4222-8222-222222222222',
  'ir301-transactional-smoke',
  '/blog/ir301-transactional-smoke/',
  'article',
  '33333333-3333-4333-8333-333333333333',
  'ko',
  'web',
  '{"referrer_present": false}'::jsonb
);

reset role;

do $$
declare
  stored_content_id uuid;
  stored_received_at timestamptz;
begin
  select content_id, received_at
  into stored_content_id, stored_received_at
  from public.interaction_events
  where event_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if stored_content_id <> '11111111-1111-4111-8111-111111111111'::uuid then
    raise exception 'IR-301 smoke: forged content_id was not canonicalized';
  end if;

  if stored_received_at < now() - interval '1 minute' then
    raise exception 'IR-301 smoke: forged received_at was not replaced';
  end if;
end;
$$;

set local role authenticated;

insert into public.interaction_events (
  event_id, event_name, occurred_at, slug, page_type, session_id, source
) values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'article.engaged',
  now(),
  'ir301-transactional-smoke',
  'article',
  '44444444-4444-4444-8444-444444444444',
  'web'
);

reset role;

rollback;
