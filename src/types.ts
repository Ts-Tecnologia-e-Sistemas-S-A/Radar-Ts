export type MunicipalityStatus = 
  | 'cliente'             // 🟢 Cliente
  | 'oportunidade'        // 🟡 Oportunidade
  | 'licitacao_proxima'   // 🟠 Licitação próxima
  | 'edital_publicado'    // 🔴 Edital publicado
  | 'contrato_encerrado';  // ⚫ Contrato encerrado

export type FunnelStage = 
  | 'prospectado'
  | 'primeiro_contato'
  | 'reuniao'
  | 'demonstracao'
  | 'piloto'
  | 'projeto_apresentado'
  | 'processo_licitatorio'
  | 'homologacao'
  | 'implantacao';

export type ProcurementModality = 
  | 'Pregão Eletrônico' 
  | 'Concorrência Pública' 
  | 'Inexigibilidade' 
  | 'Adesão à Ata (ARP)' 
  | 'Dispensa de Licitação';

export interface KeyContact {
  name: string;
  role: string; // e.g. 'Secretário de Educação', 'Pregoeiro', 'Diretor de TI'
  phone?: string;
  email?: string;
  notes?: string;
}

export interface BuyingHistoryItem {
  year: number;
  company: string;
  value: number;
  objectStr: string;
  modality: string;
  addendumsCount?: number;
}

export interface IOFactorWeights {
  contractExpiringDays: number; // 0-100 score contribution
  lowIdebScore: number;
  techInvestmentHistory: number;
  budgetAvailability: number;
  managementChange: number;
  federalFundsAvailable: number;
  existingRelationship: number;
}

export interface EducationalMetrics {
  ideb: number; // e.g. 3.8
  idebTarget: number; // e.g. 5.2
  dropoutRate: number; // e.g. 8.4%
  schoolsCount: number;
  studentsCount: number;
  teachersCount: number;
  fundebBudget: number; // R$
  mainPains: string[];
}

export interface Municipality {
  id: string;
  name: string;
  state: string; // "PI", "MA", "CE", "BA", "PE", "SP", "MG", etc.
  region: 'Nordeste' | 'Norte' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  population: number;
  status: MunicipalityStatus;
  funnelStage: FunnelStage;
  currentSystem: string; // Competitor or legacy
  currentContractValue: number;
  contractDaysRemaining: number;
  renewalProbability: 'Alta' | 'Média' | 'Baixa';
  tenderProbability: number; // 0-100%
  estimatedNewContractValue: number;
  probableModality: ProcurementModality;
  ioScore: number; // 0 - 100
  ioFactors: IOFactorWeights;
  educationalMetrics: EducationalMetrics;
  keyContacts: KeyContact[];
  buyingHistory: BuyingHistoryItem[];
  lastActivityDate: string;
  dealOwner?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  dataVerificationStatus?: string;
  verifiedSources?: string[];
  auditNotes?: string;
}

export interface TenderItem {
  itemNumber: number;
  description: string;
  quantity?: number;
  unit?: string;
  estimatedValue?: number;
  category?: string;
}

export interface TenderNotice {
  id: string;
  municipalityId: string;
  municipalityName: string;
  state: string;
  source: 'PNCP' | 'Diário Oficial' | 'Tribunal de Contas' | 'Compras.gov.br' | 'Portal Transparência' | 'Consórcio Público';
  noticeNumber: string; // e.g., "PE 014/2026"
  objectStr: string;
  estimatedValue: number;
  modality: ProcurementModality;
  publicationDate: string;
  openingDate: string;
  status: 'Aberto' | 'Em Análise' | 'Homologado' | 'Suspenso' | 'Revogado';
  link: string;
  portalName: string;
  category?: string;
  items?: TenderItem[];
}

export interface CommercialAlert {
  id: string;
  municipalityId: string;
  municipalityName: string;
  state: string;
  type: 'contrato_vencendo' | 'edital_publicado' | 'mudanca_gestao' | 'novo_recurso_fundeb' | 'risco_concorrente';
  severity: 'critico' | 'alto' | 'medio' | 'info';
  daysLeft?: number;
  currentCompany: string;
  value: number;
  renewalChance: 'Alta' | 'Média' | 'Baixa';
  tenderProb: number;
  recommendation: string;
  createdAt: string;
  isRead?: boolean;
  noticeNumber?: string;
  objectStr?: string;
  items?: TenderItem[];
}

export interface CompetitorItem {
  id: string;
  name: string;
  marketShare: number; // percentage
  wonContractsCount: number;
  avgPrice: number;
  strengths: string[];
  weaknesses: string[];
  vulnerabilitiesForSICAP: string[];
  recentWins: {
    municipality: string;
    state: string;
    value: number;
    date: string;
    objectStr: string;
    addendumsCount: number;
    renewalsCount: number;
  }[];
}

export interface AICommercialStrategy {
  approachStrategy: string;
  counterArguments: string[];
  inexeligibilityDocument: string;
  commercialTimeline: { phase: string; duration: string; action: string }[];
  decisionMakers: { role: string; strategy: string }[];
  risksAndMitigation: { risk: string; mitigation: string }[];
}

export interface CRMInteraction {
  id: string;
  municipalityId: string;
  municipalityName: string;
  state: string;
  date: string; // YYYY-MM-DD THH:mm or YYYY-MM-DD
  type: 'ligacao' | 'visita' | 'email' | 'reuniao_virtual' | 'impugnacao' | 'esclarecimento' | 'proposta' | 'adesao_ata' | 'analise_estrategica_ia' | 'chat_assistente_ia' | 'outros';
  contactName: string;
  contactRole?: string;
  summary: string;
  description: string;
  outcome: 'positivo' | 'neutro' | 'critico' | 'aguardando_retorno' | 'deferido' | 'indeferido';
  nextStep?: string;
  nextStepDueDate?: string;
  dealOwner?: string;
  attachments?: string[];
}

export interface FilterOptions {
  searchQuery: string;
  state: string;
  region: string;
  status: string;
  funnelStage: string;
  minValue: number;
  maxValue: number;
  minIoScore: number;
  competitor: string;
}
