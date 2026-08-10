import { describe, it, expect } from 'bun:test';
import { calculateCommercialScore } from './scoreCalculator';
import type { Municipality } from '../types';

const baseMunicipality: Municipality = {
  id: 'mun-test',
  name: 'Test City',
  state: 'SP',
  region: 'Sudeste',
  population: 100000,
  status: 'oportunidade',
  funnelStage: 'prospectado',
  currentSystem: 'Sistema Concorrente ABC',
  currentContractValue: 100000,
  contractDaysRemaining: 400,
  renewalProbability: 'Média',
  tenderProbability: 50,
  estimatedNewContractValue: 120000,
  probableModality: 'Pregão Eletrônico',
  ioScore: 50,
  ioFactors: {
    contractExpiringDays: 0,
    lowIdebScore: 0,
    techInvestmentHistory: 0,
    budgetAvailability: 0,
    managementChange: 0,
    federalFundsAvailable: 0,
    existingRelationship: 0,
  },
  educationalMetrics: {
    ideb: 4,
    idebTarget: 5,
    dropoutRate: 5,
    schoolsCount: 10,
    studentsCount: 1000,
    teachersCount: 100,
    fundebBudget: 1000000,
    mainPains: [],
  },
  keyContacts: [],
  buyingHistory: [],
  lastActivityDate: '2026-01-01',
};

describe('calculateCommercialScore', () => {
  it('returns the safe "não visitar" defaults for a missing municipality', () => {
    const result = calculateCommercialScore(null as unknown as Municipality);
    expect(result).toEqual({
      finalScore: 0,
      classification: '🔴 Não Visitar',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
      stars: '⭐',
      additionPoints: [],
      subtractionPoints: [],
      effectiveDaysRemaining: 0,
      projectedStage: 'primeiro_contato',
    });
  });

  it('scores an existing SICAP client at 0, regardless of other factors', () => {
    const result = calculateCommercialScore({
      ...baseMunicipality,
      currentSystem: 'SICAP Educação Municipal',
    });
    expect(result.finalScore).toBe(0);
    expect(result.classification).toBe('🔴 Não Visitar');
    expect(result.subtractionPoints).toEqual([{ label: 'Cliente SICAP', points: -100 }]);
    expect(result.additionPoints).toEqual([]);
  });

  it('stacks every addition bonus and clamps the total at 100', () => {
    const municipality: Municipality = {
      ...baseMunicipality,
      currentSystem: 'Sem Sistema Educacional',
      contractDaysRemaining: 90,
      state: 'PI',
      educationalMetrics: {
        ...baseMunicipality.educationalMetrics,
        studentsCount: 25000,
        mainPains: ['Muitas reclamações de lentidão do sistema'],
      },
      ioFactors: { ...baseMunicipality.ioFactors, managementChange: 80 },
    };
    const result = calculateCommercialScore(municipality);
    expect(result.finalScore).toBe(100);
    expect(result.classification).toBe('⭐ Prioridade Máxima');
    expect(result.stars).toBe('⭐⭐⭐⭐⭐');
    expect(result.subtractionPoints).toEqual([]);
    expect(result.additionPoints).toEqual([
      { label: 'Sem sistema educacional contratado', points: 40 },
      { label: 'Mais de 20.000 alunos na rede municipal', points: 30 },
      { label: 'Reclamações ou dores públicas identificadas', points: 20 },
      { label: 'Mudança recente de secretário(a) de Educação', points: 10 },
      { label: 'Localizado na Rota Comercial Ativa (PI/MA/CE)', points: 10 },
    ]);
  });

  it('flags a contract expiring within 6 months when a system is already in place', () => {
    const result = calculateCommercialScore({ ...baseMunicipality, contractDaysRemaining: 150 });
    expect(result.effectiveDaysRemaining).toBe(150);
    expect(result.finalScore).toBe(35);
    expect(result.additionPoints).toEqual([
      { label: 'Contrato vence em até 6 meses (150 dias restantes)', points: 35 },
    ]);
  });

  it('subtracts points while a contract is in implantação, and projects to produção after 180 days', () => {
    const municipality: Municipality = { ...baseMunicipality, funnelStage: 'implantacao', contractDaysRemaining: 400 };

    const atStart = calculateCommercialScore(municipality, 0);
    expect(atStart.projectedStage).toBe('implantacao');
    expect(atStart.subtractionPoints).toEqual([{ label: 'Em Implantação (Contrato recente)', points: -70 }]);
    expect(atStart.finalScore).toBe(0);

    const after200Days = calculateCommercialScore(municipality, 200);
    expect(after200Days.projectedStage).toBe('producao');
    expect(after200Days.effectiveDaysRemaining).toBe(200);
    expect(after200Days.subtractionPoints).toEqual([]);
    expect(after200Days.additionPoints).toEqual([
      { label: 'Contrato vence em até 12 meses (200 dias restantes)', points: 20 },
    ]);
  });

  it('subtracts points for a consolidated production contract with long remaining term', () => {
    const result = calculateCommercialScore({
      ...baseMunicipality,
      funnelStage: 'producao' as Municipality['funnelStage'],
      contractDaysRemaining: 500,
    });
    expect(result.subtractionPoints).toEqual([{ label: 'Em Produção (Contrato consolidado)', points: -80 }]);
    expect(result.finalScore).toBe(0);
  });

  it('subtracts points for a recently signed contract with more than 12 months remaining', () => {
    const result = calculateCommercialScore({ ...baseMunicipality, contractDaysRemaining: 500 });
    expect(result.subtractionPoints).toEqual([
      { label: 'Contrato Recém-assinado (> 12 meses vigência)', points: -60 },
    ]);
    expect(result.finalScore).toBe(0);
  });
});
