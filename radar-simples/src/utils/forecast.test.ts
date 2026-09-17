import { describe, it, expect } from 'bun:test';
import { forecastPonderado } from './forecast';

describe('forecastPonderado', () => {
  it('aplica o peso da etapa sobre o valor anual', () => {
    expect(forecastPonderado(100000, 'mapeamento')).toBe(10000);
    expect(forecastPonderado(100000, 'homologacao')).toBe(90000);
  });

  it('trata valor indefinido como zero', () => {
    expect(forecastPonderado(undefined, 'proposta')).toBe(0);
  });
});
