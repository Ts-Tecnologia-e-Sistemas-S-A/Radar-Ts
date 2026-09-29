/** Município oficial (código/nome/UF vêm do IBGE — nunca editáveis). */
export interface MunicipioIbge {
  codigoIbge: number;
  nome: string;
  uf: string;
}

export type EstagioFunilB2G =
  | 'mapeamento'
  | 'rota'
  | 'visita'
  | 'qualificacao'
  | 'diagnostico'
  | 'proposta'
  | 'juridico'
  | 'homologacao'
  | 'contratado'
  | 'standby';

export const ESTAGIOS_FUNIL_B2G: { value: EstagioFunilB2G; label: string; prazoMedio: string }[] = [
  { value: 'mapeamento', label: 'Pesquisa / Mapa', prazoMedio: 'Análise preliminar' },
  { value: 'rota', label: 'Selecionada para Rota', prazoMedio: 'Próxima viagem' },
  { value: 'visita', label: 'Visita / Contato Realizado', prazoMedio: 'Contato de campo' },
  { value: 'qualificacao', label: 'Qualificação Técnica & PoC', prazoMedio: '~21 dias' },
  { value: 'diagnostico', label: 'Diagnóstico Técnico / PoC', prazoMedio: 'Validação da solução' },
  { value: 'proposta', label: 'Apresentação & Minuta Técnica', prazoMedio: '~18 dias' },
  { value: 'juridico', label: 'Trâmite Jurídico & Modalidade', prazoMedio: 'Fase crítica (Lei 14.133)' },
  { value: 'homologacao', label: 'Homologação & Assinatura', prazoMedio: 'Garantia de receita' },
  { value: 'contratado', label: 'Contratado / Ganho', prazoMedio: 'Implantação e pós-venda' },
  { value: 'standby', label: 'Em Espera / Nutrição', prazoMedio: 'Retorno programado' },
];

export type MotivoEspera =
  | 'loa_ppa'
  | 'troca_gestao'
  | 'fim_contrato'
  | 'prioridade_adiada'
  | 'sem_orcamento'
  | 'aguardando_licitacao'
  | 'decisao_politica'
  | 'contato_indisponivel'
  | 'outro';

export const MOTIVOS_ESPERA: { value: MotivoEspera; label: string }[] = [
  { value: 'loa_ppa', label: 'Aguardando LOA/PPA do próximo exercício' },
  { value: 'troca_gestao', label: 'Troca de gestão ou eleição' },
  { value: 'fim_contrato', label: 'Fim do contrato concorrente' },
  { value: 'prioridade_adiada', label: 'Prioridade pedagógica adiada' },
  { value: 'sem_orcamento', label: 'Sem orçamento disponível' },
  { value: 'aguardando_licitacao', label: 'Aguardando publicação ou licitação' },
  { value: 'decisao_politica', label: 'Aguardando decisão política' },
  { value: 'contato_indisponivel', label: 'Contato temporariamente indisponível' },
  { value: 'outro', label: 'Outro' },
];

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  telefone?: string;
  whatsapp?: string;
}

export type StatusSolucao = 'contato_inicial' | 'proposta_enviada' | 'em_negociacao' | 'contratado';

export const STATUS_SOLUCAO: { value: StatusSolucao; label: string }[] = [
  { value: 'contato_inicial', label: 'Contato Inicial' },
  { value: 'proposta_enviada', label: 'Proposta Enviada' },
  { value: 'em_negociacao', label: 'Em Negociação' },
  { value: 'contratado', label: 'Contratado' },
];

export interface SolucaoOfertada {
  id: string;
  nome: string;
  descricao: string;
  status: StatusSolucao;
}

/**
 * Dados preenchidos manualmente pelo vendedor (mais o que a IA sugere e ele
 * confirma) para um município. Nada aqui é fabricado sem confirmação humana.
 */
export interface MunicipioCrm {
  codigoIbge: number;
  prioritario: boolean;
  visitada: boolean;
  dataInclusao?: string;
  dataPrimeiraVisita?: string;
  dataUltimaVisita?: string;
  macrorregiao?: string;
  portePopulacional?: 'pequeno' | 'medio' | 'grande';
  escolasCount?: number;
  alunosCount?: number;
  /** Ano do Censo Escolar (INEP) de onde escolasCount/alunosCount vieram —
   *  ausente quando os números foram digitados manualmente pelo vendedor
   *  ou ainda não preenchidos. */
  censoEscolarAno?: number;
  contatos: Contato[];
  solucoes: SolucaoOfertada[];
  estagioFunil: EstagioFunilB2G;
  dataReativacao?: string;
  motivoEspera?: MotivoEspera;
  detalhesEspera?: string;
  estagioAntesStandby?: Exclude<EstagioFunilB2G, 'standby'>;
  valorAnual?: number;
  proximaAcao?: {
    data: string; // YYYY-MM-DD
    hora?: string;
    descricao: string;
    presencial: boolean;
  };
  observacoes?: string;
}

export function municipioCrmVazio(codigoIbge: number): MunicipioCrm {
  return {
    codigoIbge,
    prioritario: false,
    visitada: false,
    contatos: [],
    solucoes: [],
    estagioFunil: 'mapeamento',
  };
}

/** Uma licitação real vinda do PNCP. */
export interface Oportunidade {
  id: string;
  municipioNome: string;
  uf: string;
  numeroContratacao: string;
  objeto: string;
  valorEstimado?: number;
  dataPublicacao: string;
  modalidade: string;
  linkPncp: string;
}

export type CategoriaDespesa = 'combustivel' | 'hospedagem' | 'alimentacao' | 'pedagio' | 'outros';

export const CATEGORIAS_DESPESA: { value: CategoriaDespesa; label: string; icone: string }[] = [
  { value: 'combustivel', label: 'Combustível', icone: 'local_gas_station' },
  { value: 'hospedagem', label: 'Hospedagem', icone: 'hotel' },
  { value: 'alimentacao', label: 'Alimentação', icone: 'restaurant' },
  { value: 'pedagio', label: 'Pedágio', icone: 'toll' },
  { value: 'outros', label: 'Outros', icone: 'more_horiz' },
];

/** Uma despesa de campo, com ou sem origem em OCR de cupom. */
export interface Despesa {
  id: string;
  codigoIbge?: number;
  valor: number;
  data: string; // YYYY-MM-DD
  categoria: CategoriaDespesa;
  descricao: string;
  origemOcr: boolean;
  latitude?: number;
  longitude?: number;
  criadaEm: string; // ISO datetime
  comprovante?: {
    mimeType: 'image/jpeg';
    base64: string;
  };
}

export type TipoEventoTimeline = 'reuniao' | 'documento' | 'deslocamento';

export interface AnexoEvento {
  tipo: 'pdf' | 'audio';
  nome: string;
  /** Referência privada do arquivo no Firebase Storage. */
  caminho?: string;
  /** URL de leitura gerada para o usuário autenticado. */
  url?: string;
  mimeType?: string;
  tamanho?: number;
}

export interface AcaoReuniao {
  acao: string;
  responsavel: string | null;
  prazo: string | null;
  origem: 'combinada' | 'sugerida';
}

/** Um evento na Memória da Conta de um município. */
export interface EventoTimeline {
  id: string;
  codigoIbge: number;
  tipo: TipoEventoTimeline;
  data: string; // YYYY-MM-DD
  local?: string;
  participantes?: string;
  resumo: string;
  /** Relato digitado preservado antes de qualquer síntese da IA. */
  textoOriginal?: string;
  registroRapido?: { autorId: string; atualizadoEm: string; encerrado: boolean };
  sinteseIA?: string;
  transcricao?: string;
  textoPlanilha?: string;
  relatorioPlanilha?: import('./utils/relatorioPlanilha').RelatorioPlanilha;
  criadaEm?: string;
  proximoPassoIA?: string;
  desfecho?: string;
  anexos: AnexoEvento[];
  /** Rótulo livre pra agrupar por mandato/gestão na timeline (ex: "2025–2028"). */
  mandato: string;
  mandatoAtivo: boolean;
  /** Na importação, data vazia significa que a fonte não informou a data. */
  historicoImportado?: { fonte: string; visitaRegistrada: boolean };
  /** Situação do processamento do áudio; o original continua salvo se a IA falhar. */
  processamentoAudio?: 'pendente' | 'concluido' | 'erro';
  erroProcessamentoAudio?: string;
  analiseReuniao?: string;
  acoesReuniao?: AcaoReuniao[];
}
