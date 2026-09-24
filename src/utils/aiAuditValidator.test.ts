import { describe, it, expect } from 'bun:test';
import { auditAIDataIntegrity } from './aiAuditValidator';

describe('auditAIDataIntegrity', () => {
  it('rejects missing or non-object raw data', () => {
    const result = auditAIDataIntegrity(null);
    expect(result.isValid).toBe(false);
    expect(result.dataVerificationStatus).toBe('REJEITADO (FALHA DE INTEGRIDADE)');
    expect(result.errors).toEqual(['Dados brutos inválidos ou ausentes.']);
    expect(result.sanitizedData).toBeNull();
  });

  it('collects structural errors without assigning unproven fallback sources', () => {
    const result = auditAIDataIntegrity({ population: 50000 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'Nome do município é obrigatório e precisa ser uma string válida.',
      'UF (Estado) deve ser uma sigla válida de 2 letras (ex: MA, PI).',
    ]);
    expect(result.sanitizedData).toBeNull();
    expect(result.verifiedSources).toEqual([]);
  });

  it('accepts minimal valid data without inventing sources or a commercial score', () => {
    const result = auditAIDataIntegrity({ name: 'Cidade Teste', state: 'MA', population: 80000 });
    expect(result.isValid).toBe(true);
    expect(result.dataVerificationStatus).toBe('PARCIALMENTE VERIFICADO');
    expect(result.errors).toEqual([]);
    expect(result.verifiedSources).toEqual([]);
    expect(result.sanitizedData).toMatchObject({
      id: 'mun-cidade-teste-ma',
      name: 'Cidade Teste',
      state: 'MA',
      population: 80000,
      ioScore: 0,
      currentContractValue: 0,
    });
    expect(result.sanitizedData?.keyContacts).toEqual([]);
    expect(result.sanitizedData?.lastActivityDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps only officially-recognized sources and warns about the rest', () => {
    const result = auditAIDataIntegrity({
      name: 'Cidade Teste',
      state: 'PI',
      population: 60000,
      verifiedSources: ['Portal da Transparência Municipal', 'Blog local de notícias'],
    });
    expect(result.verifiedSources).toEqual(['Portal da Transparência Municipal']);
    expect(result.warnings).toContain('Fonte não classificada como oficial: "Blog local de notícias".');
  });

  it('rejects a negative contract value as a hard error', () => {
    const result = auditAIDataIntegrity({
      name: 'Cidade X',
      state: 'CE',
      population: 40000,
      currentContractValue: -5000,
      ioScore: 250,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['Valor do contrato não pode ser negativo.']);
    expect(result.sanitizedData).toBeNull();
  });

  it('normalizes an out-of-range IO score to pending zero', () => {
    const result = auditAIDataIntegrity({ name: 'Cidade Y', state: 'BA', population: 30000, ioScore: 250 });
    expect(result.sanitizedData?.ioScore).toBe(0);
    expect(result.warnings).toContain('Score IO ausente ou inválido. Mantido como pendente (0).');
  });

  it('keeps only the newest reference year as current', () => {
    const result = auditAIDataIntegrity({
      name: 'Cidade Atualizada',
      state: 'MA',
      population: 50000,
      buyingHistory: [
        { year: 2024, company: 'Antiga', value: 1, objectStr: 'Sistema', modality: 'Pregão' },
        { year: 2025, company: 'Atual', value: 2, objectStr: 'Sistema', modality: 'Pregão' },
      ],
    });

    expect(result.sanitizedData?.buyingHistory.map((item) => item.year)).toEqual([2025]);
    expect(result.sanitizedData?.buyingHistoryArchive?.map((item) => item.year)).toEqual([2024]);
  });
});
