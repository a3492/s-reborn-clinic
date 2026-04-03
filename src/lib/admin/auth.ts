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
