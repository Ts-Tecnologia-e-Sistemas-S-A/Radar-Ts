/** Município oficial (código/nome/UF vêm do IBGE — nunca editáveis). */
export interface MunicipioIbge {
  codigoIbge: number;
  nome: string;
  uf: string;
}

export type EstagioFunilB2G =
  | 'mapeamento'
  | 'qualificacao'
  | 'proposta'
  | 'juridico'
  | 'homologacao';

export const ESTAGIOS_FUNIL_B2G: { value: EstagioFunilB2G; label: string; prazoMedio: string }[] = [
  { value: 'mapeamento', label: 'Mapeamento & Contato Político', prazoMedio: '~14 dias' },
  { value: 'qualificacao', label: 'Qualificação Técnica & PoC', prazoMedio: '~21 dias' },
  { value: 'proposta', label: 'Apresentação & Minuta Técnica', prazoMedio: '~18 dias' },
  { value: 'juridico', label: 'Trâmite Jurídico & Modalidade', prazoMedio: 'Fase crítica (Lei 14.133)' },
  { value: 'homologacao', label: 'Homologação & Assinatura', prazoMedio: 'Garantia de receita' },
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
  macrorregiao?: string;
  escolasCount?: number;
  alunosCount?: number;
  /** Ano do Censo Escolar (INEP) de onde escolasCount/alunosCount vieram —
   *  ausente quando os números foram digitados manualmente pelo vendedor
   *  ou ainda não preenchidos. */
  censoEscolarAno?: number;
  contatos: Contato[];
  solucoes: SolucaoOfertada[];
  estagioFunil: EstagioFunilB2G;
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
}

export type TipoEventoTimeline = 'reuniao' | 'documento' | 'deslocamento';

export interface AnexoEvento {
  tipo: 'pdf' | 'audio';
  nome: string;
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
  sinteseIA?: string;
  proximoPassoIA?: string;
  desfecho?: string;
  anexos: AnexoEvento[];
  /** Rótulo livre pra agrupar por mandato/gestão na timeline (ex: "2025–2028"). */
  mandato: string;
  mandatoAtivo: boolean;
}
