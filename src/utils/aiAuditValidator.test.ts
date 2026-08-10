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

  it('collects structural errors for missing name and state, and still assigns fallback sources', () => {
    const result = auditAIDataIntegrity({ population: 50000 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'Nome do município é obrigatório e precisa ser uma string válida.',
      'UF (Estado) deve ser uma sigla válida de 2 letras (ex: MA, PI).',
    ]);
    expect(result.sanitizedData).toBeNull();
    expect(result.verifiedSources).toEqual([
      'PNCP (Portal Nacional de Contratações Públicas)',
      'Portal da Transparência de Município',
      'INEP / Censo Escolar',
    ]);
  });

  it('accepts minimal valid data, defaulting to official sources and a safe IO score', () => {
    const result = auditAIDataIntegrity({ name: 'Cidade Teste', state: 'MA', population: 80000 });
    expect(result.isValid).toBe(true);
    expect(result.dataVerificationStatus).toBe('PARCIALMENTE VERIFICADO');
    expect(result.errors).toEqual([]);
    expect(result.verifiedSources).toEqual([
      'PNCP (Portal Nacional de Contratações Públicas)',
      'Portal da Transparência de Cidade Teste',
      'INEP / Censo Escolar',
    ]);
    expect(result.sanitizedData).toMatchObject({
      id: 'mun-cidade-teste-ma',
      name: 'Cidade Teste',
      state: 'MA',
      population: 80000,
      ioScore: 75,
      currentContractValue: 0,
    });
    expect(result.sanitizedData?.keyContacts[0]).toMatchObject({
      email: 'semec@cidadeteste.ma.gov.br',
    });
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

  it('normalizes an out-of-range IO score to the safe default of 75', () => {
    const result = auditAIDataIntegrity({ name: 'Cidade Y', state: 'BA', population: 30000, ioScore: 250 });
    expect(result.sanitizedData?.ioScore).toBe(75);
    expect(result.warnings).toContain('Score IO fora do intervalo [0-100]. Normalizado para 75.');
  });
});
