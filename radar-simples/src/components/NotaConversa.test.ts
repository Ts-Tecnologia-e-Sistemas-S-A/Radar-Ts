import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('NotaConversa', () => {
  it('remove a ação antiga de salvar e mantém a ação de sincronização', () => {
    const codigo = readFileSync(new URL('./NotaConversa.tsx', import.meta.url), 'utf8');
    expect(codigo.includes('Tentar salvar novamente')).toBe(false);
    expect(codigo.includes('Tentar sincronizar novamente')).toBe(true);
  });
});
