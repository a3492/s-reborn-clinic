/** 아카이브 HTML을 iframe srcdoc에 넣기 전 2차 방어(본문은 자체 생성이나 방어적 처리) */
export function sanitizeNewsletterForSrcdoc(html: string): string {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}
