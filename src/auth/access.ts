export const INITIAL_ADMIN_EMAIL = 'jbadotti@gmail.com';

export type AccessRole = 'admin' | 'usuario';

export interface AuthorizedUser {
  email: string;
  perfil: AccessRole;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  criadoPor?: string;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function isInitialAdmin(email: string | null | undefined): boolean {
  return normalizeEmail(email || '') === INITIAL_ADMIN_EMAIL;
}

export function hasVerifiedAccess(
  email: string | null | undefined,
  emailVerified: boolean,
  record?: Pick<AuthorizedUser, 'email' | 'ativo'> | null,
): boolean {
  if (!emailVerified || !email) return false;
  const normalized = normalizeEmail(email);
  return isInitialAdmin(normalized) || Boolean(record?.ativo && normalizeEmail(record.email) === normalized);
}
