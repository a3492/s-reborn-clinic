import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const migrationDir = join(root, 'supabase', 'migrations');
const migrationFiles = readdirSync(migrationDir).filter((name) =>
  /^\d{14}_ir301_interaction_events\.sql$/.test(name),
);

assert.equal(migrationFiles.length, 1, 'expected exactly one CLI-generated IR-301 migration');

const sql = readFileSync(join(migrationDir, migrationFiles[0]), 'utf8').toLowerCase();
const smoke = readFileSync(
  join(root, 'supabase', 'tests', 'ir301_interaction_events_rls.sql'),
  'utf8',
).toLowerCase();

for (const required of [
  'create table public.interaction_events',
  'alter table public.interaction_events enable row level security',
  'create policy interaction_events_browser_insert',
  'for insert',
  'to anon, authenticated',
  "with check (source = 'web')",
  'revoke all on table public.interaction_events from public, anon, authenticated',
  'grant insert on table public.interaction_events to anon, authenticated',
  'security definer',
  "set search_path = ''",
  'revoke all on function private.canonicalize_interaction_event()',
]) {
  assert.ok(sql.includes(required), `IR-301 migration is missing: ${required}`);
}

for (const forbidden of [
  'grant select on table public.interaction_events to anon',
  'grant update on table public.interaction_events to anon',
  'grant delete on table public.interaction_events to anon',
  'grant select on table public.interaction_events to authenticated',
  'grant update on table public.interaction_events to authenticated',
  'grant delete on table public.interaction_events to authenticated',
]) {
  assert.ok(!sql.includes(forbidden), `IR-301 migration contains forbidden grant: ${forbidden}`);
}

for (const smokeAssertion of [
  "set local role anon",
  "set local role authenticated",
  "has_table_privilege('anon', 'public.interaction_events', 'insert')",
  'forged content_id was not canonicalized',
  "has_table_privilege('anon', 'public.interaction_events', 'select')",
  "has_table_privilege('anon', 'public.interaction_events', 'update')",
  "has_table_privilege('authenticated', 'public.interaction_events', 'delete')",
  'rollback;',
]) {
  assert.ok(smoke.includes(smokeAssertion), `IR-301 smoke is missing: ${smokeAssertion}`);
}

console.log(`IR-301 migration contract: OK (${migrationFiles[0]})`);
