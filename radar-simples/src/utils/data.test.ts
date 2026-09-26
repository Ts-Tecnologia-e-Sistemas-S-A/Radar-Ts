import { describe, expect, it } from 'bun:test';
import { dataBr } from './data';

describe('dataBr', () => {
  it('formata datas persistidas como DD/MM/AA', () => {
    expect(dataBr('2026-09-26')).toBe('26/09/26');
  });

  it('trata datas ausentes e preserva valores inesperados', () => {
    expect(dataBr(undefined)).toBe('Data não informada');
    expect(dataBr('26/09/26')).toBe('26/09/26');
  });
});
