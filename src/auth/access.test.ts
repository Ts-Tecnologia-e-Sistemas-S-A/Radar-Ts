import { describe, expect, test } from 'bun:test';
import { hasVerifiedAccess, isInitialAdmin, normalizeEmail } from './access';

describe('controle de acesso', () => {
  test('normaliza e reconhece o administrador inicial', () => {
    expect(normalizeEmail(' JBAdotti@Gmail.com ')).toBe('jbadotti@gmail.com');
    expect(isInitialAdmin('JBADOTTI@gmail.com')).toBe(true);
  });
  test('nega e-mail não verificado, ausente ou inativo', () => {
    expect(hasVerifiedAccess('jbadotti@gmail.com', false)).toBe(false);
    expect(hasVerifiedAccess(null, true)).toBe(false);
    expect(hasVerifiedAccess('pessoa@empresa.com', true, { email: 'pessoa@empresa.com', ativo: false })).toBe(false);
  });
  test('aceita administrador inicial ou cadastro ativo correspondente', () => {
    expect(hasVerifiedAccess('jbadotti@gmail.com', true)).toBe(true);
    expect(hasVerifiedAccess('Pessoa@Empresa.com', true, { email: 'pessoa@empresa.com', ativo: true })).toBe(true);
  });
  test('não aceita cadastro de outro endereço', () => {
    expect(hasVerifiedAccess('intruso@empresa.com', true, { email: 'pessoa@empresa.com', ativo: true })).toBe(false);
  });
});
