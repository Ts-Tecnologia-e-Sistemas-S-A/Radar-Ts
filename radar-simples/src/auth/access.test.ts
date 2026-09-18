import { describe, expect, test } from 'bun:test';
import { hasVerifiedAccess, isInitialAdmin, normalizeEmail } from './access';

describe('autorização do GovTrack', () => {
  test('administrador inicial exige e-mail confirmado', () => {
    expect(isInitialAdmin(' JBadotti@Gmail.com ')).toBe(true);
    expect(hasVerifiedAccess('jbadotti@gmail.com', false)).toBe(false);
    expect(hasVerifiedAccess('jbadotti@gmail.com', true)).toBe(true);
  });

  test('usuário precisa de cadastro ativo com o mesmo e-mail', () => {
    expect(normalizeEmail(' Pessoa@Empresa.com ')).toBe('pessoa@empresa.com');
    expect(hasVerifiedAccess('pessoa@empresa.com', true, { email: 'pessoa@empresa.com', ativo: true })).toBe(true);
    expect(hasVerifiedAccess('pessoa@empresa.com', true, { email: 'pessoa@empresa.com', ativo: false })).toBe(false);
    expect(hasVerifiedAccess('outra@empresa.com', true, { email: 'pessoa@empresa.com', ativo: true })).toBe(false);
  });
});
