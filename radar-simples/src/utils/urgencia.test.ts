import { describe, it, expect } from 'bun:test';
import { isUrgente } from './urgencia';
import { municipioCrmVazio } from '../types';

const HOJE = new Date('2026-08-17T12:00:00');

describe('isUrgente', () => {
  it('false quando não há próxima ação registrada', () => {
    expect(isUrgente(municipioCrmVazio(1), HOJE)).toBe(false);
  });

  it('true quando a próxima ação já passou da data', () => {
    const municipio = {
      ...municipioCrmVazio(1),
      proximaAcao: { data: '2026-08-15', descricao: 'Cobrar parecer', presencial: false },
    };
    expect(isUrgente(municipio, HOJE)).toBe(true);
  });

  it('false quando a próxima ação é hoje ou no futuro', () => {
    const hoje = {
      ...municipioCrmVazio(1),
      proximaAcao: { data: '2026-08-17', descricao: 'Reunião', presencial: true },
    };
    const futuro = {
      ...municipioCrmVazio(1),
      proximaAcao: { data: '2026-08-20', descricao: 'Reunião', presencial: true },
    };
    expect(isUrgente(hoje, HOJE)).toBe(false);
    expect(isUrgente(futuro, HOJE)).toBe(false);
  });
});
