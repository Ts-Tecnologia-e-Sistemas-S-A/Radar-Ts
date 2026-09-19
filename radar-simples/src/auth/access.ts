export const INITIAL_ADMIN_EMAIL = 'jbadotti@gmail.com';
export type AccessRole = 'admin' | 'usuario';
export interface AuthorizedUser { email: string; perfil: AccessRole; ativo: boolean; criadoEm?: string; atualizadoEm?: string; criadoPor?: string }
export const normalizeEmail = (value: string) => value.trim().toLocaleLowerCase('en-US');
export const isInitialAdmin = (email?: string | null) => normalizeEmail(email || '') === INITIAL_ADMIN_EMAIL;
export function hasVerifiedAccess(email: string | null | undefined, verified: boolean, record?: Pick<AuthorizedUser, 'email' | 'ativo'> | null) {
  if (!verified || !email) return false;
  const normalized = normalizeEmail(email);
  return isInitialAdmin(normalized) || Boolean(record?.ativo && normalizeEmail(record.email) === normalized);
}
