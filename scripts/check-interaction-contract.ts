import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  INTERACTION_EVENT_NAMES,
  getOrCreateReaderSessionId,
  recordInteractionEvent,
} from '../src/lib/interaction-events';
import {
  readReaderSessionId,
  recordServerInteractionEvent,
} from '../functions/lib/interaction-events';

const expected = [
  'article.viewed',
  'article.engaged',
  'article.completed',
  'article.reacted',
  'article.bookmarked',
  'search.executed',
  'search.no_result',
  'search.result_clicked',
  'related.clicked',
  'primary_next.clicked',
  'question.submitted',
  'comment.submitted',
  'error.reported',
];
assert.deepEqual([...INTERACTION_EVENT_NAMES], expected, 'v1 interaction event allow-list changed unexpectedly');

const storage = new Map<string, string>();
const cookieWrites: string[] = [];
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
});
const documentMock = { documentElement: { lang: 'ko' } } as { documentElement: { lang: string }; cookie?: string };
Object.defineProperty(documentMock, 'cookie', {
  configurable: true,
  get: () => cookieWrites.join('; '),
  set: (value: string) => cookieWrites.push(value),
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: documentMock,
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { pathname: '/blog/doctor-column/contract-test/' } },
});

const session1 = getOrCreateReaderSessionId();
const session2 = getOrCreateReaderSessionId();
assert.equal(session1, session2, 'reader session ID must be stable within local storage');
assert.match(session1, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.ok(
  cookieWrites.some((value) => value.includes(`sreborn_reader_session_id=${session1}`) && value.includes('Path=/api/comments')),
  'reader session must be scoped to the comments API',
);
assert.ok(
  cookieWrites.some((value) => value.includes(`sreborn_reader_session_id=${session1}`) && value.includes('Path=/api/report')),
  'reader session must be scoped to the report API',
);
assert.ok(cookieWrites.every((value) => value.includes('SameSite=Lax')), 'reader session API cookies must be SameSite=Lax');
assert.ok(cookieWrites.every((value) => !value.includes('Path=/;')), 'reader session cookie must not be site-wide');

const cookieRequest = new Request('https://example.test/api/comments', {
  headers: { Cookie: `other=1; sreborn_reader_session_id=${session1}; theme=dark` },
});
assert.equal(readReaderSessionId(cookieRequest), session1);
const badCookieRequest = new Request('https://example.test/api/comments', {
  headers: { Cookie: 'sreborn_reader_session_id=not-a-uuid' },
});
assert.equal(readReaderSessionId(badCookieRequest), null, 'malformed session cookies must be rejected');

let captured: Record<string, unknown> | null = null;
const successClient = {
  from(table: string) {
    assert.equal(table, 'interaction_events');
    return {
      async insert(row: Record<string, unknown>) {
        captured = row;
        return { error: null };
      },
    };
  },
};

const ok = await recordInteractionEvent(successClient as never, {
  eventName: 'article.viewed',
  context: {
    contentId: '11111111-1111-4111-8111-111111111111',
    slug: 'doctor-column/contract-test',
    pageType: 'article',
    locale: 'ko',
  },
  metadata: { sample: true },
});
assert.equal(ok, true);
assert.ok(captured);
assert.equal(captured.event_name, 'article.viewed');
assert.equal(captured.event_version, 1);
assert.equal(captured.session_id, session1);
assert.equal(captured.content_id, '11111111-1111-4111-8111-111111111111');
assert.equal(captured.public_path, '/blog/doctor-column/contract-test/');
assert.deepEqual(captured.metadata, { sample: true });

const oversized = await recordInteractionEvent(successClient as never, {
  eventName: 'article.engaged',
  context: { slug: 'contract-test', pageType: 'article' },
  metadata: { payload: 'x'.repeat(9 * 1024) },
});
assert.equal(oversized, true);
assert.deepEqual(captured?.metadata, { truncated: true }, 'oversized metadata must be reduced client-side');

const failingClient = {
  from() {
    return {
      async insert() {
        return { error: { message: 'interaction_events unavailable during rollout' } };
      },
    };
  },
};

const failed = await recordInteractionEvent(failingClient as never, {
  eventName: 'article.bookmarked',
  context: { slug: 'contract-test', pageType: 'article' },
});
assert.equal(failed, false, 'event pipeline failure must be isolated from the primary action');

const realFetch = globalThis.fetch;
let serverPayload: Record<string, unknown> | null = null;
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: async (_input: string | URL | Request, init?: RequestInit) => {
    serverPayload = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    return new Response(null, { status: 201 });
  },
});

const serverOk = await recordServerInteractionEvent(
  { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-for-test' },
  {
    eventName: 'comment.submitted',
    slug: 'doctor-column/contract-test',
    sessionId: session1,
    metadata: { is_reply: false },
  },
);
assert.equal(serverOk, true);
assert.ok(serverPayload);
assert.equal(serverPayload.event_name, 'comment.submitted');
assert.equal(serverPayload.session_id, session1);
assert.equal(serverPayload.slug, 'doctor-column/contract-test');
assert.deepEqual(serverPayload.metadata, { is_reply: false });
assert.equal(serverPayload.content_id, null, 'DB trigger should resolve canonical content_id from slug');

Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: async () => new Response('no table during rollout', { status: 404 }),
});
const serverFailed = await recordServerInteractionEvent(
  { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-for-test' },
  {
    eventName: 'error.reported',
    slug: 'contract-test',
    sessionId: session1,
    metadata: { report_type: 'typo' },
  },
);
assert.equal(serverFailed, false, 'server event pipeline failure must not throw into the primary API');
Object.defineProperty(globalThis, 'fetch', { configurable: true, value: realFetch });

const commentsSource = await readFile(new URL('../functions/api/comments.ts', import.meta.url), 'utf8');
const reportSource = await readFile(new URL('../functions/api/report.ts', import.meta.url), 'utf8');
const commentInsertIndex = commentsSource.indexOf('/rest/v1/comments?select=id');
const commentEventIndex = commentsSource.indexOf("eventName: 'comment.submitted'");
assert.ok(commentInsertIndex >= 0 && commentEventIndex > commentInsertIndex, 'comment event must occur after durable comment insert');
const contactInsertIndex = commentsSource.indexOf('/rest/v1/comment_contacts');
assert.ok(contactInsertIndex >= 0 && commentEventIndex > contactInsertIndex, 'comment event must occur after optional private contact handling');
assert.ok(!commentsSource.slice(commentEventIndex, commentEventIndex + 260).includes('bodyText'), 'comment event metadata must exclude raw body');
assert.ok(!commentsSource.slice(commentEventIndex, commentEventIndex + 260).includes('author_email'), 'comment event metadata must exclude email');

const reportInsertIndex = reportSource.indexOf('/rest/v1/post_reports');
const reportEventIndex = reportSource.indexOf("eventName: 'error.reported'");
assert.ok(reportInsertIndex >= 0 && reportEventIndex > reportInsertIndex, 'report event must occur after durable report insert');
const reportEventCall = reportSource.match(
  /recordServerInteractionEvent\(env,\s*\{\s*eventName: 'error\.reported',\s*slug,\s*sessionId: readerSessionId,\s*metadata: \{ report_type: reportType \},\s*\}\s*\);/s,
);
assert.ok(reportEventCall, 'report event must contain only bounded report_type metadata');

const searchSource = await readFile(new URL('../src/pages/search.astro', import.meta.url), 'utf8');
assert.ok(searchSource.includes("eventName: 'search.executed'"), 'search success must append search.executed');
assert.ok(searchSource.includes("eventName: 'search.no_result'"), 'zero-result search must append search.no_result');
assert.ok(searchSource.includes("eventName: 'search.result_clicked'"), 'result navigation must append search.result_clicked');
assert.ok(
  searchSource.includes("const selectCols = 'id, slug, title, description, category, tags, published_at, thumbnail_url'"),
  'search results must carry canonical post id for result-click identity',
);
const searchMetadataBlock = searchSource.match(/const searchMetadata = \{([\s\S]*?)\n\t\t\};/)?.[1] ?? '';
assert.ok(searchMetadataBlock.includes('...shape'), 'search metadata must use derived query shape');
assert.ok(searchMetadataBlock.includes('result_count: rows.length'), 'search metadata must include result count');
assert.ok(searchMetadataBlock.includes('strategy'), 'search metadata must include fulltext/fallback strategy');
assert.ok(searchMetadataBlock.includes('duration_ms'), 'search metadata must include bounded execution duration');
assert.ok(!/\bquery\s*:/.test(searchMetadataBlock), 'search metadata must never store the raw query');
assert.ok(!/\bq\s*[,}]/.test(searchMetadataBlock), 'search metadata must never store the raw q value');
const queryShapeBlock = searchSource.match(/function queryShape\(query: string\) \{([\s\S]*?)\n\t\}/)?.[1] ?? '';
assert.ok(queryShapeBlock.includes('query_length'), 'search metadata must expose query length only as a derived metric');
assert.ok(queryShapeBlock.includes('query_token_count'), 'search metadata must expose query token count only as a derived metric');
assert.ok(!queryShapeBlock.includes('return { query'), 'queryShape must not return the raw search query');

console.log('Interaction event client/server contract: OK');
