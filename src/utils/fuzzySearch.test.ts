import { describe, it, expect } from 'bun:test';
import { normalizeForSearch, levenshteinDistance, citySearchScore, matchesCitySearch } from './fuzzySearch';

describe('normalizeForSearch', () => {
  it('remove acentuação e caixa alta', () => {
    expect(normalizeForSearch('São Luís')).toBe('sao luis');
    expect(normalizeForSearch('Imperatriz')).toBe('imperatriz');
    expect(normalizeForSearch('Codó')).toBe('codo');
    expect(normalizeForSearch('Paraná')).toBe('parana');
  });

  it('lida com string vazia ou undefined', () => {
    expect(normalizeForSearch('')).toBe('');
    expect(normalizeForSearch(undefined as unknown as string)).toBe('');
  });
});

describe('levenshteinDistance', () => {
  it('retorna 0 para strings iguais', () => {
    expect(levenshteinDistance('codo', 'codo')).toBe(0);
  });

  it('calcula a distância de edição corretamente', () => {
    expect(levenshteinDistance('codo', 'coddo')).toBe(1);
    expect(levenshteinDistance('teresina', 'teresna')).toBe(1);
    expect(levenshteinDistance('gato', 'cachorro')).toBeGreaterThan(3);
  });
});

describe('citySearchScore / matchesCitySearch', () => {
  it('encontra por nome exato, prefixo e substring, ignorando acento', () => {
    expect(citySearchScore('codo', 'Codó')).toBe(0);
    expect(citySearchScore('sao luis', 'São Luís')).toBe(0);
    expect(citySearchScore('impe', 'Imperatriz')).toBe(1);
    expect(citySearchScore('atriz', 'Imperatriz')).toBe(2);
  });

  it('tolera pequenos erros de digitação (busca com a escrita mais próxima)', () => {
    expect(matchesCitySearch('coddo', 'Codó')).toBe(true);
    expect(matchesCitySearch('teresna', 'Teresina')).toBe(true);
    expect(matchesCitySearch('inperatriz', 'Imperatriz')).toBe(true);
  });

  it('não retorna match para termos sem relação nenhuma', () => {
    expect(matchesCitySearch('xyz123', 'Codó')).toBe(false);
    expect(matchesCitySearch('teresina', 'Codó')).toBe(false);
  });

  it('termo vazio sempre casa (sem filtro ativo)', () => {
    expect(citySearchScore('', 'Codó')).toBe(0);
  });
});
