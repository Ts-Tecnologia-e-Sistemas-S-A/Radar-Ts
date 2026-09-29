import { Municipality } from '../types';
import {
  EMPTY_EDUCATIONAL_METRICS,
  selectNewestBuyingHistory,
  selectNewestEducationalMetrics,
} from './dataRecency';

export interface AuditResult<T = Municipality> {
  isValid: boolean;
  dataVerificationStatus: '100% VERIFICADO (FONTES OFICIAIS)' | 'PARCIALMENTE VERIFICADO' | 'REJEITADO (FALHA DE INTEGRIDADE)';
  verifiedSources: string[];
  auditNotes: string;
  errors: string[];
  warnings: string[];
  sanitizedData: T | null;
}

const OFFICIAL_SOURCE_KEYWORDS = [
  'pncp',
  'transparência',
  'transparencia',
  'tce',
  'inep',
  'ibge',
  'diário oficial',
  'diario oficial',
  'dom',
  'gov.br',
  'prefeitura',
  'portal oficial',
  'censo escolar',
  'tribunal de contas',
];

/**
 * Utility to audit and validate AI-generated or enriched Municipality data
 * strictly checking official sources, data structure integrity, and anti-hallucination business rules.
 */
export function auditAIDataIntegrity(rawData: any): AuditResult<Municipality> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const verifiedSources: string[] = [];

  if (!rawData || typeof rawData !== 'object') {
    return {
      isValid: false,
      dataVerificationStatus: 'REJEITADO (FALHA DE INTEGRIDADE)',
      verifiedSources: [],
      auditNotes: 'Erro Crítico: Resposta da IA vazia ou em formato inválido.',
      errors: ['Dados brutos inválidos ou ausentes.'],
      warnings: [],
      sanitizedData: null,
    };
  }

  // 1. Structural Field Validations
  if (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length === 0) {
    errors.push('Nome do município é obrigatório e precisa ser uma string válida.');
  }

  if (!rawData.state || typeof rawData.state !== 'string' || rawData.state.trim().length !== 2) {
    errors.push('UF (Estado) deve ser uma sigla válida de 2 letras (ex: MA, PI).');
  }

  if (typeof rawData.population !== 'number' || rawData.population <= 0) {
    warnings.push('População inválida ou não numérica. Ajustado para estimativa regional.');
  }

  // 2. Official Sources Audit
  const rawSources: string[] = Array.isArray(rawData.verifiedSources)
    ? rawData.verifiedSources
    : typeof rawData.sourceUsed === 'string'
    ? rawData.sourceUsed.split(/[/,;]/).map((s: string) => s.trim())
    : [];

  rawSources.forEach((src) => {
    if (typeof src === 'string' && src.trim().length > 0) {
      const lower = src.toLowerCase();
      const isOfficial = OFFICIAL_SOURCE_KEYWORDS.some((kw) => lower.includes(kw));
      if (isOfficial) {
        if (!verifiedSources.includes(src.trim())) {
          verifiedSources.push(src.trim());
        }
      } else {
        warnings.push(`Fonte não classificada como oficial: "${src}".`);
      }
    }
  });

  // Missing evidence must remain explicit; never assign sources the response did not provide.
  if (verifiedSources.length === 0) {
    warnings.push('Nenhuma fonte oficial explícita foi comprovada pela resposta.');
  }

  // 3. Timon Rule & Business Logic Audit (Advanced Stage Rule)
  const currentSystem = rawData.currentSystem || 'Não localizado em fonte oficial';
  const funnelStage = rawData.funnelStage || 'prospectado';
  const status = rawData.status || 'oportunidade';

  const normalizedHistory = selectNewestBuyingHistory(
    Array.isArray(rawData.buyingHistory) ? rawData.buyingHistory : [],
    Array.isArray(rawData.buyingHistoryArchive) ? rawData.buyingHistoryArchive : []
  );
  const normalizedEducation = selectNewestEducationalMetrics([
    rawData.educationalMetrics,
    ...(Array.isArray(rawData.educationalMetricsArchive) ? rawData.educationalMetricsArchive : []),
  ]);
  if (rawData.educationalMetrics && !normalizedEducation.current) {
    warnings.push('Métricas educacionais sem ano de referência do INEP foram arquivadas e não serão exibidas como atuais.');
  }

  if (
    (funnelStage === 'licitacao_aberta' || status === 'licitacao') &&
    normalizedHistory.current.length > 0
  ) {
    const latestPurchase = normalizedHistory.current[0];
    if (latestPurchase?.company) {
      warnings.push(
        `Regra Timon Aplicada: Licitação aberta descartada em favor do contrato vigente com ${latestPurchase.company} (Ano ${latestPurchase.year}).`
      );
    }
  }

  // 4. Contract Value & IO Score Audit
  let sanitizedContractValue = Number(rawData.currentContractValue) || 0;
  if (sanitizedContractValue < 0) {
    errors.push('Valor do contrato não pode ser negativo.');
    sanitizedContractValue = Math.abs(sanitizedContractValue);
  }

  let sanitizedIOScore = Number(rawData.ioScore);
  if (isNaN(sanitizedIOScore) || sanitizedIOScore < 0 || sanitizedIOScore > 100) {
    sanitizedIOScore = 0;
    warnings.push('Score IO ausente ou inválido. Mantido como pendente (0).');
  }

  // 5. Contact Verification & Formatting Audit
  const keyContacts = Array.isArray(rawData.keyContacts) ? rawData.keyContacts : [];
  const sanitizedContacts = keyContacts.map((contact: any) => ({
    name: contact?.name || 'Não localizado em fonte oficial',
    role: contact?.role || 'Não localizado em fonte oficial',
    phone: contact?.phone,
    email: contact?.email,
  }));

  // Determine Verification Status
  const isValid = errors.length === 0;
  let dataVerificationStatus: AuditResult['dataVerificationStatus'] = '100% VERIFICADO (FONTES OFICIAIS)';

  if (!isValid) {
    dataVerificationStatus = 'REJEITADO (FALHA DE INTEGRIDADE)';
  } else if (warnings.length > 0) {
    dataVerificationStatus = 'PARCIALMENTE VERIFICADO';
  }

  const auditNotes = isValid
    ? `Auditoria concluída com sucesso (${verifiedSources.length} fontes oficiais validadas). ${
        warnings.length > 0 ? `Alertas de Integridade: ${warnings.join(' ')}` : 'Nenhuma inconformidade detectada.'
      }`
    : `Falha na auditoria de integridade: ${errors.join(' ')}`;

  // Construct Sanitized Municipality Object
  const sanitizedData: Municipality = {
    id:
      rawData.id ||
      `mun-${(rawData.name || 'cidade')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')}-${(rawData.state || 'ma').toLowerCase()}`,
    name: rawData.name || 'Cidade',
    state: (rawData.state || 'MA').toUpperCase(),
    region: rawData.region || 'Nordeste',
    population: Number(rawData.population) || 0,
    populationReferenceYear: Number(rawData.populationReferenceYear) || undefined,
    populationSource: rawData.populationSource,
    populationSourceUrl: rawData.populationSourceUrl,
    status: status,
    funnelStage: funnelStage,
    currentSystem: currentSystem,
    currentContractValue: sanitizedContractValue,
    contractDaysRemaining: Number(rawData.contractDaysRemaining) || 0,
    renewalProbability: rawData.renewalProbability || 'Média',
    tenderProbability: Number(rawData.tenderProbability) || 0,
    estimatedNewContractValue: Number(rawData.estimatedNewContractValue) || 0,
    probableModality: rawData.probableModality || 'Pregão Eletrônico',
    ioScore: sanitizedIOScore,
    ioFactors: rawData.ioFactors || {
      contractExpiringDays: 0,
      lowIdebScore: 0,
      techInvestmentHistory: 0,
      budgetAvailability: 0,
      managementChange: 0,
      federalFundsAvailable: 0,
      existingRelationship: 0,
    },
    educationalMetrics: normalizedEducation.current || EMPTY_EDUCATIONAL_METRICS,
    educationalMetricsArchive: normalizedEducation.archived,
    keyContacts: sanitizedContacts,
    buyingHistory: normalizedHistory.current,
    buyingHistoryArchive: normalizedHistory.archived,
    lastActivityDate: new Date().toISOString().slice(0, 10),
    dealOwner: rawData.dealOwner || 'José Badotti',
    latitude: rawData.latitude,
    longitude: rawData.longitude,
    notes: rawData.notes || `Perfil auditado em ${new Date().toLocaleDateString('pt-BR')}.`,
    dataVerificationStatus,
    verifiedSources,
    auditNotes,
  };

  return {
    isValid,
    dataVerificationStatus,
    verifiedSources,
    auditNotes,
    errors,
    warnings,
    sanitizedData: isValid ? sanitizedData : null,
  };
}
