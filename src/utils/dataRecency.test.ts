import { describe, expect, it } from 'bun:test';
import { selectNewestBuyingHistory, selectNewestEducationalMetrics } from './dataRecency';

describe('selectNewestBuyingHistory', () => {
  const record = (year: number, company: string, publishedAt?: string) => ({
    year,
    company,
    value: year,
    objectStr: 'Sistema escolar',
    modality: 'Pregão Eletrônico',
    publishedAt,
  });

  it('presents 2025 as current and archives 2024 even when 2025 was published in 2026', () => {
    const result = selectNewestBuyingHistory([
      record(2024, 'Fornecedor antigo', '2025-01-10'),
      record(2025, 'Fornecedor atual', '2026-03-20'),
    ]);

    expect(result.current.map((item) => item.year)).toEqual([2025]);
    expect(result.archived.map((item) => item.year)).toEqual([2024]);
  });

  it('uses publication date only to order records from the same reference year', () => {
    const result = selectNewestBuyingHistory([
      record(2025, 'Primeiro', '2026-01-10'),
      record(2025, 'Revisado', '2026-04-15'),
    ]);

    expect(result.current.map((item) => item.company)).toEqual(['Revisado', 'Primeiro']);
    expect(result.archived).toEqual([]);
  });

  it('selects the newest INEP reference year and archives records without a proven year', () => {
    const metrics = (referenceYear?: number) => ({
      ideb: 0,
      idebTarget: 0,
      dropoutRate: 0,
      schoolsCount: referenceYear || 10,
      studentsCount: referenceYear || 100,
      teachersCount: 0,
      fundebBudget: 0,
      mainPains: [],
      referenceYear,
    });
    const result = selectNewestEducationalMetrics([metrics(2024), metrics(), metrics(2025)]);

    expect(result.current?.referenceYear).toBe(2025);
    expect(result.archived.map((item) => item.referenceYear)).toEqual([2024, undefined]);
  });

  it('does not archive empty pending placeholders on repeated normalization', () => {
    const result = selectNewestEducationalMetrics([
      {
        ideb: 0,
        idebTarget: 0,
        dropoutRate: 0,
        schoolsCount: 0,
        studentsCount: 0,
        teachersCount: 0,
        fundebBudget: 0,
        mainPains: [],
      },
    ]);

    expect(result.current).toBeNull();
    expect(result.archived).toEqual([]);
  });
});