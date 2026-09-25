import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('NotaConversa', () => {
  it('não exibe ação de "Salvar" para notas rápidas da reunião', () => {
    const codigo = readFileSync(new URL('./NotaConversa.tsx', import.meta.url), 'utf8');
    expect(codigo.includes('Tentar salvar novamente')).toBe(false);
  });
});
