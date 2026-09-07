import assert from 'node:assert/strict';
import {
  INTERACTION_EVENT_NAMES,
  getOrCreateReaderSessionId,
  recordInteractionEvent,
} from '../src/lib/interaction-events';

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
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: { documentElement: { lang: 'ko' } },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { pathname: '/blog/doctor-column/contract-test/' } },
});

const session1 = getOrCreateReaderSessionId();
const session2 = getOrCreateReaderSessionId();
assert.equal(session1, session2, 'reader session ID must be stable within local storage');
assert.match(session1, /^[0-9a-f-]{36}$/i);

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

console.log('Interaction event client contract: OK');
