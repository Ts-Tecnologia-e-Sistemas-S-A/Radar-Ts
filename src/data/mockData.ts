import { Municipality, TenderNotice, CommercialAlert, CompetitorItem, CRMInteraction } from '../types';
import { ALL_PIAUI_MARANHAO_MUNICIPALITIES } from './piauíMaranhaoData';
import { calculateCommercialScore } from '../utils/scoreCalculator';

const RAW_MUNICIPALITIES: Municipality[] = [
  ...ALL_PIAUI_MARANHAO_MUNICIPALITIES,
  {
    id: 'mun-sobral',
    name: 'Sobral',
    state: 'CE',
    region: 'Nordeste',
    population: 210000,
    status: 'cliente',
    funnelStage: 'implantacao',
    currentSystem: 'SICAP Educação Pro',
    currentContractValue: 4100000,
    contractDaysRemaining: 420,
    renewalProbability: 'Alta',
    tenderProbability: 10,
    estimatedNewContractValue: 4500000,
    probableModality: 'Inexigibilidade',
    ioScore: 0,
    ioFactors: {
      contractExpiringDays: 10,
      lowIdebScore: 10,
      techInvestmentHistory: 100,
      budgetAvailability: 90,
      managementChange: 20,
      federalFundsAvailable: 85,
      existingRelationship: 100,
    },
    educationalMetrics: {
      ideb: 8.8,
      idebTarget: 8.9,
      dropoutRate: 0.2,
      schoolsCount: 112,
      studentsCount: 34000,
      teachersCount: 1890,
      fundebBudget: 98000000,
      mainPains: [
        'Manter liderança nacional no IDEB com módulos preditivos de IA pedagógica'
      ]
    },
    keyContacts: [
      { name: 'Dra. Herbert Lima', role: 'Secretário de Educação', phone: '(88) 99701-2233', email: 'seduc@sobral.ce.gov.br' }
    ],
    buyingHistory: [
      { year: 2024, company: 'SICAP Soluções Educacionais', value: 4100000, objectStr: 'Plataforma Integrada de Inteligência Pedagógica e Gestão Escolar', modality: 'Inexigibilidade', addendumsCount: 0 }
    ],
    lastActivityDate: '2026-07-28',
    dealOwner: 'Rodrigo Alencar (Diretor de Clientes)',
    latitude: -3.6861,
    longitude: -40.3497,
    notes: 'Case de Sucesso SICAP! Referência nacional de alfabetização.'
  },
  {
    id: 'mun-juazeiro',
    name: 'Juazeiro do Norte',
    state: 'CE',
    region: 'Nordeste',
    population: 275000,
    status: 'oportunidade',
    funnelStage: 'projeto_apresentado',
    currentSystem: 'IPM Tecnologia',
    currentContractValue: 3400000,
    contractDaysRemaining: 85,
    renewalProbability: 'Média',
    tenderProbability: 79,
    estimatedNewContractValue: 3900000,
    probableModality: 'Pregão Eletrônico',
    ioScore: 84,
    ioFactors: {
      contractExpiringDays: 85,
      lowIdebScore: 78,
      techInvestmentHistory: 92,
      budgetAvailability: 88,
      managementChange: 85,
      federalFundsAvailable: 92,
      existingRelationship: 55,
    },
    educationalMetrics: {
      ideb: 4.8,
      idebTarget: 6.0,
      dropoutRate: 3.8,
      schoolsCount: 104,
      studentsCount: 38000,
      teachersCount: 1950,
      fundebBudget: 85000000,
      mainPains: [
        'Sistemas IPM focam mais em finanças do que em gestão pedagógica',
        'Secretário busca solução com inteligência artificial para previsão de retenção escolar'
      ]
    },
    keyContacts: [
      { name: 'Dr. Pergentino de Oliveira', role: 'Secretário de Educação', phone: '(88) 98877-4400', email: 'educacao@juazeiro.ce.gov.br' }
    ],
    buyingHistory: [
      { year: 2022, company: 'IPM Tecnologia', value: 3400000, objectStr: 'Atende sistemas de folha e educação', modality: 'Pregão', addendumsCount: 2 }
    ],
    lastActivityDate: '2026-07-29',
    dealOwner: 'Mariana Duarte (Regional CE/RN)',
    latitude: -7.2125,
    longitude: -39.3150,
    notes: 'Projeto do SICAP apresentado para o gabinete do prefeito e secretários.'
  },
  {
    id: 'mun-caruaru',
    name: 'Caruaru',
    state: 'PE',
    region: 'Nordeste',
    population: 378000,
    status: 'contrato_encerrado',
    funnelStage: 'prospectado',
    currentSystem: 'Contrato Encerrado / Legado',
    currentContractValue: 3800000,
    contractDaysRemaining: -12,
    renewalProbability: 'Baixa',
    tenderProbability: 95,
    estimatedNewContractValue: 4600000,
    probableModality: 'Pregão Eletrônico',
    ioScore: 89,
    ioFactors: {
      contractExpiringDays: 100,
      lowIdebScore: 85,
      techInvestmentHistory: 88,
      budgetAvailability: 92,
      managementChange: 90,
      federalFundsAvailable: 94,
      existingRelationship: 30,
    },
    educationalMetrics: {
      ideb: 4.5,
      idebTarget: 5.9,
      dropoutRate: 5.1,
      schoolsCount: 140,
      studentsCount: 46000,
      teachersCount: 2300,
      fundebBudget: 110000000,
      mainPains: [
        'Contrato anterior expirou e município está operando com planilha emergencial',
        'Tribunal de Contas notificou prefeitura para abertura imediata de certame'
      ]
    },
    keyContacts: [
      { name: 'Dra. Maria Aparecida Diniz', role: 'Secretária de Educação', phone: '(81) 99811-0022', email: 'sedu@caruaru.pe.gov.br' }
    ],
    buyingHistory: [
      { year: 2021, company: 'EducaNet PE', value: 3800000, objectStr: 'Gestão escolar descentralizada', modality: 'Pregão', addendumsCount: 5 }
    ],
    lastActivityDate: '2026-08-01',
    dealOwner: 'Felipe Siqueira (Regional PE/PB)',
    latitude: -8.2839,
    longitude: -35.9761,
    notes: 'ALERTA CRÍTICO: Contrato encerrado! Oportunidade prioritária de abordagem de emergência.'
  },
  {
    id: 'mun-montesclaros',
    name: 'Montes Claros',
    state: 'MG',
    region: 'Sudeste',
    population: 414000,
    status: 'oportunidade',
    funnelStage: 'piloto',
    currentSystem: 'Sigma Soft',
    currentContractValue: 4200000,
    contractDaysRemaining: 140,
    renewalProbability: 'Média',
    tenderProbability: 62,
    estimatedNewContractValue: 4900000,
    probableModality: 'Pregão Eletrônico',
    ioScore: 78,
    ioFactors: {
      contractExpiringDays: 60,
      lowIdebScore: 70,
      techInvestmentHistory: 95,
      budgetAvailability: 90,
      managementChange: 80,
      federalFundsAvailable: 88,
      existingRelationship: 80,
    },
    educationalMetrics: {
      ideb: 5.2,
      idebTarget: 6.2,
      dropoutRate: 3.1,
      schoolsCount: 130,
      studentsCount: 48000,
      teachersCount: 2400,
      fundebBudget: 125000000,
      mainPains: [
        'Necessidade de unificar 130 escolas na nuvem',
        'Piloto do SICAP rodando em 5 escolas municipais com aprovação de 98%'
      ]
    },
    keyContacts: [
      { name: 'Prof. Reinaldo Barbosa', role: 'Secretário de Educação', phone: '(38) 99922-3344', email: 'educacao@montesclaros.mg.gov.br' }
    ],
    buyingHistory: [
      { year: 2022, company: 'Sigma Soft', value: 4200000, objectStr: 'Licença de software escolar', modality: 'Pregão', addendumsCount: 2 }
    ],
    lastActivityDate: '2026-08-02',
    dealOwner: 'Lucas Bernardes (Regional MG/ES)',
    latitude: -16.7281,
    longitude: -43.8578,
    notes: 'Piloto concluído em 5 escolas com altíssimo engajamento dos professores.'
  }
];

// Dynamically compute exact official commercial scores
export const MOCK_MUNICIPALITIES: Municipality[] = RAW_MUNICIPALITIES.map((m) => {
  const scoreBreakdown = calculateCommercialScore(m);
  return {
    ...m,
    ioScore: scoreBreakdown.finalScore,
  };
});

export const MOCK_TENDERS: TenderNotice[] = [
  {
    id: 'ten-caruaru-03',
    municipalityId: 'mun-caruaru',
    municipalityName: 'Caruaru',
    state: 'PE',
    source: 'Compras.gov.br',
    noticeNumber: 'Pregão Eletrônico nº 044/2026-PMC',
    objectStr: 'Registro de Preços para eventual contratação de empresa fornecedora de software de inteligência analítica e gestão educacional para rede municipal de ensino de Caruaru - Pernambuco.',
    estimatedValue: 4600000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-07-28',
    openingDate: '2026-08-18',
    status: 'Aberto',
    link: 'https://www.gov.br/compras/pt-br',
    portalName: 'Compras.gov.br (Pernambuco)',
    category: 'Inteligência Educacional & IDEB'
  },
  {
    id: 'ten-petrolina-05',
    municipalityId: 'mun-petrolina',
    municipalityName: 'Petrolina',
    state: 'PE',
    source: 'PNCP',
    noticeNumber: 'Pregão Eletrônico nº 012/2026-SEDU',
    objectStr: 'Contratação de plataforma de diário de classe eletrônico com funcionamento offline e módulo do Educacenso para as 120 escolas municipais de Petrolina - Pernambuco.',
    estimatedValue: 3900000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-08-02',
    openingDate: '2026-08-19',
    status: 'Aberto',
    link: 'https://pncp.gov.br/app/editais?q=Petrolina',
    portalName: 'Portal Nacional de Contratações Públicas (PNCP)',
    category: 'Diário Eletrônico & Offline'
  },
  {
    id: 'ten-olinda-06',
    municipalityId: 'mun-olinda',
    municipalityName: 'Olinda',
    state: 'PE',
    source: 'Diário Oficial',
    noticeNumber: 'Pregão Eletrônico nº 028/2026-PMO',
    objectStr: 'Licenciamento de software para controle de frequência escolar, merenda e gestão pedagógica do Saeb/IDEB no município de Olinda - Pernambuco.',
    estimatedValue: 2450000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-08-03',
    openingDate: '2026-08-25',
    status: 'Aberto',
    link: 'https://www.olinda.pe.gov.br/licitacoes',
    portalName: 'Diário Oficial do Estado de Pernambuco (AMUPE)',
    category: 'Merenda & Almoxarifado Escolar'
  },
  {
    id: 'ten-timon-01',
    municipalityId: 'mun-timon',
    municipalityName: 'Timon',
    state: 'MA',
    source: 'PNCP',
    noticeNumber: 'Pregão Eletrônico nº 009/2026-SEMED',
    objectStr: 'Contratação de empresa especializada em prestação de serviços de tecnologia da informação para licenciamento de plataforma de gestão educacional integrada com diário eletrônico em Timon - Maranhão.',
    estimatedValue: 3200000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-08-01',
    openingDate: '2026-08-15',
    status: 'Aberto',
    link: 'https://pncp.gov.br/app/editais?q=Timon',
    portalName: 'Portal Nacional de Contratações Públicas (PNCP)',
    category: 'Plataforma Integrada de Gestão Escolar'
  },
  {
    id: 'ten-esperantina-02',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Esperantina',
    state: 'PI',
    source: 'Diário Oficial',
    noticeNumber: 'Pregão Eletrônico nº 014/2026',
    objectStr: 'Contratação de solução tecnológica para informatização das escolas municipais de Esperantina-PI, incluindo diário eletrônico offline e aplicativo de acompanhamento escolar.',
    estimatedValue: 1450000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-08-03',
    openingDate: '2026-08-22',
    status: 'Em Análise',
    link: 'http://www.diarioficialdosmunicipios.pi.gov.br',
    portalName: 'Diário Oficial dos Municípios do Piauí',
    category: 'Diário Eletrônico & Offline'
  },
  {
    id: 'ten-parnaiba-04',
    municipalityId: 'mun-parnaiba',
    municipalityName: 'Parnaíba',
    state: 'PI',
    source: 'Tribunal de Contas',
    noticeNumber: 'Pregão Eletrônico nº 002/2026',
    objectStr: 'Sistema de gestão educacional e conectividade escolar para a rede de Parnaíba - Piauí.',
    estimatedValue: 2500000,
    modality: 'Pregão Eletrônico',
    publicationDate: '2026-07-31',
    openingDate: '2026-08-28',
    status: 'Em Análise',
    link: 'https://www.tce.pi.gov.br/mural',
    portalName: 'Mural de Licitações TCE-PI',
    category: 'Conectividade & Infraestrutura Escolar'
  }
];

export const MOCK_ALERTS: CommercialAlert[] = [
  {
    id: 'alt-esperantina-01',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Prefeitura de Esperantina',
    state: 'PI',
    type: 'contrato_vencendo',
    severity: 'critico',
    daysLeft: 63,
    currentCompany: 'TechEduca Sistemas',
    value: 1240000,
    renewalChance: 'Baixa',
    tenderProb: 82,
    recommendation: 'Contrato atual com insatisfação no diário offline. Iniciar visitas e apresentação do Cockpit imediatamente.',
    createdAt: '2026-08-03T08:00:00Z',
    isRead: false,
    noticeNumber: 'PE 002/2026 - SEMEC Esperantina',
    objectStr: 'Contratação de Sistema Integrado de Gestão Escolar com Diário Eletrônico Offline e Plataforma de Monitoramento do Saeb/IDEB',
    items: [
      { itemNumber: 1, description: 'Licença de Uso de Software de Gestão Escolar Integrada (Módulo Secretaria e Censo Escolar)', quantity: 42, unit: 'Escola', estimatedValue: 380000, category: 'Gestão Escolar' },
      { itemNumber: 2, description: 'Aplicativo Diário de Classe Eletrônico e Módulo de Sincronização Offline para Professores', quantity: 850, unit: 'Professor', estimatedValue: 420000, category: 'Diário Offline' },
      { itemNumber: 3, description: 'Plataforma de Avaliações Diagnósticas e Indicadores de Aprendizagem (Preparatório Saeb/IDEB)', quantity: 12000, unit: 'Aluno', estimatedValue: 260000, category: 'Inteligência IDEB' },
      { itemNumber: 4, description: 'Serviços Técnicos de Migração de Dados Legados, Treinamento Presencial e Suporte Técnico Continuado', quantity: 1, unit: 'Lote Global', estimatedValue: 180000, category: 'Serviços / Implantação' }
    ]
  },
  {
    id: 'alt-caruaru-03',
    municipalityId: 'mun-caruaru',
    municipalityName: 'Prefeitura de Caruaru',
    state: 'PE',
    type: 'edital_publicado',
    severity: 'critico',
    daysLeft: 15,
    currentCompany: 'EducaNet PE (Encerrado)',
    value: 4600000,
    renewalChance: 'Baixa',
    tenderProb: 95,
    recommendation: 'Licitação aberta no Estado de Pernambuco (PE)! Pregão Eletrônico nº 044/2026 publicado no Compras.gov.br. Abertura em 15 dias.',
    createdAt: '2026-08-01T10:00:00Z',
    isRead: false,
    noticeNumber: 'PE 044/2026 - CPL Caruaru',
    objectStr: 'Aquisição de Solução Computacional em Nuvem para Gestão da Rede Municipal de Ensino de Caruaru',
    items: [
      { itemNumber: 1, description: 'Software de Gestão da Rede de Ensino (Matrícula On-line, Quadro de Horários, Frequência e Alocação)', quantity: 140, unit: 'Unid. Escolar', estimatedValue: 1800000, category: 'Gestão Integrada' },
      { itemNumber: 2, description: 'Módulo Diário de Classe Digital Web/Mobile com Acesso Offline para Zonas Rurais', quantity: 2400, unit: 'Docente', estimatedValue: 1500000, category: 'Diário Offline' },
      { itemNumber: 3, description: 'Módulo de Gestão de Merenda, Nutrição e Controle de Estoque/Almoxarifado Escolar', quantity: 1, unit: 'Lote', estimatedValue: 700000, category: 'Merenda & Estoque' },
      { itemNumber: 4, description: 'Portal do Aluno e Aplicativo de Comunicação Família-Escola com Notificação de Frequência', quantity: 48000, unit: 'Estudante', estimatedValue: 600000, category: 'Comunicação' }
    ]
  },
  {
    id: 'alt-petrolina-06',
    municipalityId: 'mun-petrolina',
    municipalityName: 'Prefeitura de Petrolina',
    state: 'PE',
    type: 'edital_publicado',
    severity: 'critico',
    daysLeft: 16,
    currentCompany: 'SystemSat',
    value: 3900000,
    renewalChance: 'Baixa',
    tenderProb: 92,
    recommendation: 'Licitação publicada em Pernambuco (PE)! Pregão Eletrônico nº 012/2026 no PNCP. R$ 3.9 Milhões para diário eletrônico.',
    createdAt: '2026-08-02T12:00:00Z',
    isRead: false,
    noticeNumber: 'PE 012/2026 - SEDUC Petrolina',
    objectStr: 'Contratação de Plataforma Tecnológica para Acompanhamento Pedagógico e Diário de Classe Digital',
    items: [
      { itemNumber: 1, description: 'Licença de Plataforma Educacional Integrada com Diário de Classe Offline em Tablets/Smartphones', quantity: 2100, unit: 'Professor', estimatedValue: 1800000, category: 'Diário Offline' },
      { itemNumber: 2, description: 'Módulo de Inteligência de Dados Educacionais para Prevenção do Evasão Escolar e Alerta do IDEB', quantity: 1, unit: 'Licença Global', estimatedValue: 1200000, category: 'Inteligência IDEB' },
      { itemNumber: 3, description: 'Capacitação Presencial EAD para Professores e Gestores de Unidades Escolares', quantity: 120, unit: 'Horas', estimatedValue: 900000, category: 'Treinamento' }
    ]
  },
  {
    id: 'alt-timon-02',
    municipalityId: 'mun-timon',
    municipalityName: 'Prefeitura de Timon',
    state: 'MA',
    type: 'edital_publicado',
    severity: 'critico',
    daysLeft: 14,
    currentCompany: 'Fiorilli Software',
    value: 2800000,
    renewalChance: 'Baixa',
    tenderProb: 98,
    recommendation: 'Edital de Pregão Eletrônico nº 009/2026 publicado no PNCP para Timon - Maranhão (MA)! Abertura em 14 dias.',
    createdAt: '2026-08-02T14:15:00Z',
    isRead: false,
    noticeNumber: 'PE 009/2026 - CPL Timon',
    objectStr: 'Contratação de Licença de Software SaaS para Gestão da Educação Infantil e Ensino Fundamental',
    items: [
      { itemNumber: 1, description: 'Sistema de Gestão Escolar (Módulo Acadêmico, Registro de Notas e Transferências Automatizadas)', quantity: 95, unit: 'Escola', estimatedValue: 1200000, category: 'Plataforma SaaS' },
      { itemNumber: 2, description: 'Diário de Classe Eletrônico com Tecnologia Multiplataforma Offline', quantity: 1300, unit: 'Licença', estimatedValue: 1000000, category: 'Diário Eletrônico' },
      { itemNumber: 3, description: 'Suporte Técnico Presencial e Central de Atendimento Dedicada', quantity: 12, unit: 'Mês', estimatedValue: 600000, category: 'Suporte Continuado' }
    ]
  },
  {
    id: 'alt-parnaiba-04',
    municipalityId: 'mun-parnaiba',
    municipalityName: 'Prefeitura de Parnaíba',
    state: 'PI',
    type: 'contrato_vencendo',
    severity: 'alto',
    daysLeft: 45,
    currentCompany: 'Betha Sistemas',
    value: 2100000,
    renewalChance: 'Baixa',
    tenderProb: 88,
    recommendation: 'Contrato vence em 45 dias. Secretária insatisfeita com diário offline da Betha. Agendar reunião presencial.',
    createdAt: '2026-08-02T11:20:00Z',
    isRead: false,
    noticeNumber: 'PE 018/2026 - Parnaíba',
    objectStr: 'Registro de Preços para Contratação de Solução de Software Educacional SaaS',
    items: [
      { itemNumber: 1, description: 'Módulo de Controle da Busca Ativa Escolar e Combate à Evasão Infantil', quantity: 1, unit: 'Lote', estimatedValue: 850000, category: 'Busca Ativa' },
      { itemNumber: 2, description: 'Licenciamento de Diário de Classe Offline com Validação Biométrica/QR Code', quantity: 1100, unit: 'Docente', estimatedValue: 950000, category: 'Diário Offline' },
      { itemNumber: 3, description: 'Treinamento e Suporte de Campo', quantity: 1, unit: 'Lote', estimatedValue: 300000, category: 'Suporte' }
    ]
  },
  {
    id: 'alt-juazeiro-05',
    municipalityId: 'mun-juazeiro',
    municipalityName: 'Prefeitura de Juazeiro do Norte',
    state: 'CE',
    type: 'novo_recurso_fundeb',
    severity: 'medio',
    daysLeft: 85,
    currentCompany: 'IPM Tecnologia',
    value: 3400000,
    renewalChance: 'Média',
    tenderProb: 79,
    recommendation: 'Recebeu suplementação do VAAT/Fundeb no valor de R$ 4.2M destinados à tecnologia escolar.',
    createdAt: '2026-07-30T16:00:00Z',
    isRead: true,
    noticeNumber: 'Proc. Origem VAAT 2026',
    objectStr: 'Iniciativa de Modernização Tecnológica e Infraestrutura da Rede de Ensino de Juazeiro do Norte',
    items: [
      { itemNumber: 1, description: 'Plataforma Educacional Integrada com Módulo de Avaliação Contínua e Simulados Saeb', quantity: 35000, unit: 'Estudante', estimatedValue: 1600000, category: 'Avaliação Saeb' },
      { itemNumber: 2, description: 'Ecossistema de Gestão Escolar SaaS em Nuvem', quantity: 105, unit: 'Escola', estimatedValue: 1200000, category: 'Gestão Escolar' },
      { itemNumber: 3, description: 'Cartões de Acesso do Aluno e Kit de Frequência Automatizada', quantity: 1, unit: 'Lote', estimatedValue: 600000, category: 'Hardware/Acesso' }
    ]
  }
];

export const MOCK_COMPETITORS: CompetitorItem[] = [
  {
    id: 'comp-betha',
    name: 'Betha Sistemas',
    marketShare: 28.0,
    wonContractsCount: 180,
    avgPrice: 2900000,
    strengths: [
      'Grande porte nacional e ecossistema de sistemas públicos',
      'Bons recursos de gestão orçamentária e compras'
    ],
    weaknesses: [
      'Altíssimo custo de licenciamento e implantação',
      'Lentidão operacional na navegação do diário do professor',
      'Suporte impessoal estruturado por tickets distantes'
    ],
    vulnerabilitiesForSICAP: [
      'SICAP possui custo-benefício 30% mais vantajoso e atendimento regional humanizado',
      'SICAP entrega ferramentas pedagógicas exclusivas com IA que a Betha não possui'
    ],
    recentWins: [
      { municipality: 'Parnaíba', state: 'PI', value: 2100000, date: '2021-09-10', objectStr: 'Licenciamento Betha Educação', addendumsCount: 4, renewalsCount: 3 }
    ]
  },
  {
    id: 'comp-fiorilli',
    name: 'Fiorilli Software',
    marketShare: 22.5,
    wonContractsCount: 115,
    avgPrice: 2400000,
    strengths: [
      'Pacotes genéricos de contabilidade e RH público integrados',
      'Força de vendas consolidada no estado de SP e MA'
    ],
    weaknesses: [
      'Módulo educacional é secundário e tratado apenas como cadastro administrativo',
      'Interface ultrapassada sem recursos de inteligência pedagógica ou IDEB preditivo',
      'Sem aplicativo nativo e relatórios pedagógicos engessados'
    ],
    vulnerabilitiesForSICAP: [
      'Não oferece soluções pedagógicas para elevação do IDEB',
      'Falta de foco específico nas rotinas das escolas da rede municipal'
    ],
    recentWins: [
      { municipality: 'Timon', state: 'MA', value: 2800000, date: '2022-03-15', objectStr: 'Software público e escolar', addendumsCount: 3, renewalsCount: 2 }
    ]
  },
  {
    id: 'comp-ipm',
    name: 'IPM Tecnologia',
    marketShare: 18.8,
    wonContractsCount: 82,
    avgPrice: 3200000,
    strengths: [
      'Tecnologia em nuvem nativa Atende.net',
      'Forte presença nos estados do Sul e expansão no Nordeste'
    ],
    weaknesses: [
      'Sistema complexo com curva de aprendizado longa para professores de primeira infância',
      'Falta de soluções focadas em busca ativa escolar e merenda automatizada'
    ],
    vulnerabilitiesForSICAP: [
      'Professores reclamam da complexidade excessiva de menus',
      'SICAP é muito mais amigável e focado na rotina das escolas'
    ],
    recentWins: [
      { municipality: 'Juazeiro do Norte', state: 'CE', value: 3400000, date: '2022-01-20', objectStr: 'Atende.net Educação', addendumsCount: 2, renewalsCount: 1 }
    ]
  },
  {
    id: 'comp-techeduca',
    name: 'TechEduca Sistemas',
    marketShare: 14.2,
    wonContractsCount: 38,
    avgPrice: 1150000,
    strengths: [
      'Forte presença histórica no interior do Piauí e Maranhão',
      'Preços iniciais baixos em pregões eletrônicos'
    ],
    weaknesses: [
      'Sistema em arquitetura desktop antiga sem sincronização nuvem em tempo real',
      'Suporte técnico muito lento e frequente perda de dados do censo',
      'Falta de aplicativo para pais e alunos'
    ],
    vulnerabilitiesForSICAP: [
      'Incapacidade de enviar o Educacenso sem erros de validação',
      'Insatisfação expressa dos professores por falta de diário eletrônico offline',
      'Excesso de aditivos de preço após ganhar a licitação'
    ],
    recentWins: [
      { municipality: 'Esperantina', state: 'PI', value: 1240000, date: '2023-04-12', objectStr: 'Gestão escolar', addendumsCount: 2, renewalsCount: 1 },
      { municipality: 'Barras', state: 'PI', value: 980000, date: '2023-08-20', objectStr: 'Software educacional', addendumsCount: 1, renewalsCount: 0 }
    ]
  },
  {
    id: 'comp-sonner',
    name: 'Sonner Informática',
    marketShare: 9.5,
    wonContractsCount: 29,
    avgPrice: 1950000,
    strengths: [
      'Instalações tradicionais no Maranhão e Minas Gerais',
      'Relacionamento histórico com secretarias municipais'
    ],
    weaknesses: [
      'Ausência de recursos de IA e análise preditiva do IDEB',
      'Diário de classe engessado sem suporte a funcionamento offline para zonas rurais'
    ],
    vulnerabilitiesForSICAP: [
      'Dificuldades no monitoramento da frota de transporte escolar e merenda',
      'Incapacidade de atender às metas de governança pedagógica moderna'
    ],
    recentWins: [
      { municipality: 'Caxias', state: 'MA', value: 1950000, date: '2023-02-10', objectStr: 'Sistema de gestão escolar', addendumsCount: 1, renewalsCount: 1 }
    ]
  },
  {
    id: 'comp-sigmasoft',
    name: 'Sigma Soft',
    marketShare: 7.0,
    wonContractsCount: 21,
    avgPrice: 2100000,
    strengths: [
      'Presença no estado de Minas Gerais e Vale do Jequitinhonha',
      'Soluções modulares para pequenos e médios municípios'
    ],
    weaknesses: [
      'Falta de aplicativo nativo para acompanhamento dos pais',
      'Dificuldades na escala para redes de ensino com mais de 30 mil alunos'
    ],
    vulnerabilitiesForSICAP: [
      'Migração de dados lenta e trabalhosa',
      'SICAP substitui com ganho de velocidade e aplicativo mobile integrado'
    ],
    recentWins: [
      { municipality: 'Montes Claros', state: 'MG', value: 4200000, date: '2022-06-18', objectStr: 'Licença de software escolar', addendumsCount: 2, renewalsCount: 1 }
    ]
  },
  {
    id: 'comp-govbr',
    name: 'GovBR / Coplan Tecnologia',
    marketShare: 12.0,
    wonContractsCount: 64,
    avgPrice: 2600000,
    strengths: [
      'Forte carteira no Centro-Oeste e Sudeste',
      'Módulos fiscais e contábeis consolidados'
    ],
    weaknesses: [
      'Solução educacional genérica sem acompanhamento de fluência leitora',
      'Baixo nível de personalização pedagógica'
    ],
    vulnerabilitiesForSICAP: [
      'Insatisfação com o suporte pós-venda pedagógico',
      'SICAP possui equipe técnica de especialistas em Educação Pública'
    ],
    recentWins: [
      { municipality: 'Luziânia', state: 'GO', value: 2300000, date: '2023-11-05', objectStr: 'Sistema de gestão municipal', addendumsCount: 2, renewalsCount: 1 }
    ]
  },
  {
    id: 'comp-totvs',
    name: 'TOTVS Educacional',
    marketShare: 15.5,
    wonContractsCount: 45,
    avgPrice: 5800000,
    strengths: [
      'Marca corporativa consolidada no mercado',
      'Poderosa capacidade de integração de grandes volumes de dados'
    ],
    weaknesses: [
      'Valores de licença e consultoria proibitivos para municípios de pequeno/médio porte',
      'Lenta curva de implantação que pode levar mais de 12 meses'
    ],
    vulnerabilitiesForSICAP: [
      'Preço extremamente elevado comparado ao orçamento do FUNDEB local',
      'SICAP implanta em menos de 15 dias com custo 60% menor'
    ],
    recentWins: [
      { municipality: 'Niterói', state: 'RJ', value: 6200000, date: '2022-08-14', objectStr: 'ERP de Gestão Pública e Educacional', addendumsCount: 3, renewalsCount: 2 }
    ]
  }
];

export const MOCK_CRM_INTERACTIONS: CRMInteraction[] = [
  {
    id: 'crm-esperantina-03',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Esperantina',
    state: 'PI',
    date: '2026-08-03T18:20:00',
    type: 'analise_estrategica_ia',
    contactName: 'IA Comercial (Playbook Automático)',
    contactRole: 'Gerador de Inteligência de Mercado',
    summary: 'Plano Estratégico de Abordagem IA — Esperantina (PI)',
    description: '🎯 ESTRATÉGIA DE ABORDAGEM:\nFocar na insatisfação com o Diário Eletrônico Offline do concorrente TechEduca. Apresentar que o SICAP possui notória especialização em escolas rurais do Piauí.\n\n⚔️ ARGUMENTOS CONTRA CONCORRENTE:\n1. TechEduca apresenta falhas de sincronização sem internet 4G.\n2. Incompatibilidade com relatórios do Educacenso (MEC).\n\n🗓️ CRONOGRAMA: 6 semanas com minutas de adesão e pregão presencial/eletrônico.',
    outcome: 'positivo',
    nextStep: 'Apresentar minuta jurídica para Secretária de Educação Profa. Maria das Graças',
    nextStepDueDate: '2026-08-08',
    dealOwner: 'José Badotti'
  },
  {
    id: 'crm-esperantina-04',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Esperantina',
    state: 'PI',
    date: '2026-08-03T18:25:00',
    type: 'chat_assistente_ia',
    contactName: 'Consultoria de Campo IA',
    contactRole: 'Assistente Estratégico de Pitch',
    summary: 'Consulta IA: "Como rebater o custo de migração com o Prefeito?"',
    description: '💬 PERGUNTA DO VENDEDOR:\n"Como rebater o receio do Prefeito de que a migração de sistema vai paralisar a rede escolar no meio do semestre?"\n\n🤖 ORIENTAÇÃO DA IA COMERCIAL:\nDemonstrar o plano de migração automatizada de dados em 15 dias sem paralisação, utilizando o importador direto do Educacenso e treinamento presencial de suporte de campo.',
    outcome: 'positivo',
    nextStep: 'Utilizar argumento durante a reunião com a equipe técnica da prefeitura',
    dealOwner: 'José Badotti'
  },
  {
    id: 'crm-timon-01',
    municipalityId: 'mun-timon',
    municipalityName: 'Timon',
    state: 'MA',
    date: '2026-08-03T10:15:00',
    type: 'impugnacao',
    contactName: 'Ana Paula Costa',
    contactRole: 'Pregoeira da CPL',
    summary: 'Protocolo de Impugnação ao Pregão Eletrônico nº 009/2026',
    description: 'Apresentamos impugnação formal contra o Item 4.2 do Edital PE 009/2026, que exigia atestado de capacidade técnica restrito a software instalado em servidor físico local. Solicitada retificação para admitir plataformas Cloud/SaaS modernas, garantindo ampla competitividade.',
    outcome: 'aguardando_retorno',
    nextStep: 'Acompanhar decisão da CPL de Timon sobre a impugnação em até 3 dias úteis.',
    nextStepDueDate: '2026-08-06',
    dealOwner: 'José Badotti',
    attachments: ['Impugnacao_Edital_PE009_2026_Timon.pdf']
  },
  {
    id: 'crm-esperantina-01',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Esperantina',
    state: 'PI',
    date: '2026-08-02T14:30:00',
    type: 'visita',
    contactName: 'Profa. Maria das Graças Silva',
    contactRole: 'Secretária de Educação',
    summary: 'Reunião Presencial na SEMEC e Demonstração do Diário Offline',
    description: 'Visita técnica presencial na sede da Secretaria de Educação. Demonstração prática da sincronização do Diário Eletrônico em tablets rurais sem conectividade 4G. A Secretária demonstrou grande entusiasmo pelo módulo de monitoramento do IDEB e indicou desejo de trocar de fornecedor antes do vencimento do contrato atual.',
    outcome: 'positivo',
    nextStep: 'Enviar minuta de Termo de Referência ajustada ao perfil das 42 escolas rurais.',
    nextStepDueDate: '2026-08-05',
    dealOwner: 'Carlos Mendes'
  },
  {
    id: 'crm-esperantina-02',
    municipalityId: 'mun-esperantina',
    municipalityName: 'Esperantina',
    state: 'PI',
    date: '2026-07-28T09:00:00',
    type: 'ligacao',
    contactName: 'Eng. Carlos Eduardo Viana',
    contactRole: 'Coordenador de TI Municipal',
    summary: 'Chamada Alinhamento Técnico de Infraestrutura Escolar',
    description: 'Discussão sobre a capacidade de migração do banco de dados legado da TechEduca. Confirmada compatibilidade com as tabelas do Educacenso (MEC).',
    outcome: 'positivo',
    nextStep: 'Agendar visita presencial com a Secretária de Educação.',
    nextStepDueDate: '2026-08-02',
    dealOwner: 'Carlos Mendes'
  },
  {
    id: 'crm-caruaru-01',
    municipalityId: 'mun-caruaru',
    municipalityName: 'Caruaru',
    state: 'PE',
    date: '2026-08-01T16:00:00',
    type: 'esclarecimento',
    contactName: 'José Siqueira da Silva Júnior',
    contactRole: 'Pregoeiro Oficial',
    summary: 'Pedido de Esclarecimento - Pregão nº 044/2026 (Caruaru)',
    description: 'Enviada solicitação de esclarecimento no Compras.gov.br referente à exigência do módulo de apuração de notas do Saeb/IDEB e integração com aplicativo dos pais.',
    outcome: 'deferido',
    nextStep: 'Revisar planilha orçamentária e proposta comercial em conformidade com a resposta do Pregoeiro.',
    nextStepDueDate: '2026-08-10',
    dealOwner: 'Fernanda Lima'
  },
  {
    id: 'crm-petrolina-01',
    municipalityId: 'mun-petrolina',
    municipalityName: 'Petrolina',
    state: 'PE',
    date: '2026-07-30T11:20:00',
    type: 'reuniao_virtual',
    contactName: 'Dr. Marcos Aurélio',
    contactRole: 'Diretor de Tecnologia e Inovação',
    summary: 'Webconferência de Apresentação da Plataforma SICAP',
    description: 'Reunião via Google Meet com a equipe de TI da Secretaria de Educação de Petrolina. Apresentados os dashboards de gestão do Fundeb e diário de classe offline.',
    outcome: 'positivo',
    nextStep: 'Acompanhar publicação oficial do edital PE 012/2026 no PNCP.',
    nextStepDueDate: '2026-08-04',
    dealOwner: 'Fernanda Lima'
  },
  {
    id: 'crm-sobral-01',
    municipalityId: 'mun-sobral',
    municipalityName: 'Sobral',
    state: 'CE',
    date: '2026-07-25T15:00:00',
    type: 'proposta',
    contactName: 'Profa. Luciana Alencar',
    contactRole: 'Secretária Executiva de Educação',
    summary: 'Envio de Proposta Comercial e Orçamento de Referência',
    description: 'Envio formal por e-mail da proposta para implantação da plataforma SICAP com foco no fortalecimento das metas de aprendizagem e alfabetização na idade certa.',
    outcome: 'aguardando_retorno',
    nextStep: 'Fazer ligação de follow-up para agendar reunião presencial em Sobral.',
    nextStepDueDate: '2026-08-08',
    dealOwner: 'José Badotti'
  }
];

