import { describe, expect, it } from 'bun:test';
import { dataBr, dataHoraBr } from './data';

describe('dataBr', () => {
  it('formata datas persistidas como DD/MM/AA', () => {
    expect(dataBr('2026-09-26')).toBe('26/09/26');
  });

  it('trata datas ausentes e preserva valores inesperados', () => {
    expect(dataBr(undefined)).toBe('Data não informada');
    expect(dataBr('26/09/26')).toBe('26/09/26');
  });

  it('formata data e hora com ano de dois dígitos', () => {
    expect(dataHoraBr(new Date(2026, 8, 26, 9, 5))).toBe('26/09/26 09:05');
  });
});
