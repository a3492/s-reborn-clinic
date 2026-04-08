/** 블로그 본문에 glossary 용어 <abbr data-glossary> 삽입 — innerHTML 미사용 */

export type GlossaryRow = {
  id: string;
  term: string;
  definition: string;
  aliases?: unknown;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeAliasList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => String(x ?? '').trim()).filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

function uniqueForms(term: string, aliases: unknown): string[] {
  const forms = [String(term ?? '').trim(), ...normalizeAliasList(aliases)].filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of forms) {
    const k = f.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

/** title 속성용 — 줄바꿈 제거, HTML 사용 금지(plain text) */
export function plainDefinitionForTitle(def: string): string {
  return String(def ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 450);
}

/** 라틴·숫자 위주 짧은 토큰은 단어 경계로만 매칭(부분 일치 방지) */
function useWordBoundary(form: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9.+_-]*$/.test(form) && /[A-Za-z]/.test(form);
}

function findFirstMatch(
  text: string,
  form: string,
): { index: number; length: number } | null {
  if (!text || !form) return null;
  if (useWordBoundary(form)) {
    const re = new RegExp(`\\b${escapeRegExp(form)}\\b`, 'gi');
    const m = re.exec(text);
    if (!m) return null;
    return { index: m.index, length: m[0].length };
  }
  const idx = text.indexOf(form);
  if (idx < 0) return null;
  return { index: idx, length: form.length };
}

function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !root.contains(parent)) return NodeFilter.FILTER_REJECT;
      let el: Element | null = parent;
      while (el && el !== root) {
        const tag = el.tagName;
        if (
          tag === 'CODE' ||
          tag === 'PRE' ||
          tag === 'SCRIPT' ||
          tag === 'STYLE' ||
          tag === 'KBD' ||
          tag === 'SAMP' ||
          tag === 'TEXTAREA' ||
          tag === 'NOSCRIPT'
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (tag === 'ABBR' && (el as HTMLElement).hasAttribute('data-glossary')) {
          return NodeFilter.FILTER_REJECT;
        }
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    nodes.push(n as Text);
  }
  return nodes;
}

function replaceTextNodeMatch(
  node: Text,
  index: number,
  length: number,
  definition: string,
): void {
  const text = node.textContent ?? '';
  const before = text.slice(0, index);
  const match = text.slice(index, index + length);
  const after = text.slice(index + length);
  const parent = node.parentNode;
  if (!parent) return;
  const frag = document.createDocumentFragment();
  if (before) frag.appendChild(document.createTextNode(before));
  const abbr = document.createElement('abbr');
  abbr.textContent = match;
  abbr.title = plainDefinitionForTitle(definition);
  abbr.setAttribute('data-glossary', '');
  frag.appendChild(abbr);
  if (after) frag.appendChild(document.createTextNode(after));
  parent.replaceChild(frag, node);
}

type Entry = { id: string; definition: string; forms: string[] };

function buildEntries(rows: GlossaryRow[]): Entry[] {
  return rows
    .map((r) => ({
      id: r.id,
      definition: r.definition,
      forms: uniqueForms(r.term, r.aliases),
    }))
    .filter((e) => e.forms.length > 0);
}

/** 긴 형태 우선(다른 용어 부분 문자열 충돌 완화) */
function sortEntriesForPass(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const ma = a.forms.length ? Math.max(...a.forms.map((f) => f.length)) : 0;
    const mb = b.forms.length ? Math.max(...b.forms.map((f) => f.length)) : 0;
    return mb - ma;
  });
}

/**
 * 각 glossary 행당 본문 첫 등장 1회만 마킹. 처리 중 DOM이 바뀌므로 패스마다 텍스트 노드 재수집.
 */
export function applyGlossaryToRoot(root: HTMLElement, rows: GlossaryRow[]): void {
  if (!rows.length) return;
  const baseEntries = buildEntries(rows);
  const used = new Set<string>();
  const maxIterations = 400;
  for (let iter = 0; iter < maxIterations; iter++) {
    const pending = sortEntriesForPass(baseEntries.filter((e) => !used.has(e.id)));
    if (!pending.length) break;
    const textNodes = collectTextNodes(root);
    let replaced = false;
    outer: for (const entry of pending) {
      const forms = [...entry.forms].sort((a, b) => b.length - a.length);
      for (const form of forms) {
        for (const node of textNodes) {
          if (!node.parentNode) continue;
          const text = node.textContent ?? '';
          const hit = findFirstMatch(text, form);
          if (!hit) continue;
          replaceTextNodeMatch(node, hit.index, hit.length, entry.definition);
          used.add(entry.id);
          replaced = true;
          break outer;
        }
      }
    }
    if (!replaced) break;
  }
}
