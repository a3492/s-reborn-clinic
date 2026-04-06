/**
 * 어드민 전용 세션 타입·역할 검사.
 * 로그인 UI·Supabase 플로우는 `src/pages/admin/login.astro` (이메일/비밀번호 + Magic Link).
 * 독자 소셜 로그인은 `/login` 및 `src/lib/reader-auth.ts` — 이 모듈과 분리됩니다.
 */
export type AdminRole = 'owner' | 'editor';

export interface AdminSessionUser {
  id: string;
  email: string;
  role: AdminRole;
  displayName?: string;
}

export function isAdminRole(role: string): role is AdminRole {
  return role === 'owner' || role === 'editor';
}

export function assertAdminUser(user: AdminSessionUser | null): asserts user is AdminSessionUser {
  if (!user) {
    throw new Error('Admin authentication is not connected yet.');
  }
}
