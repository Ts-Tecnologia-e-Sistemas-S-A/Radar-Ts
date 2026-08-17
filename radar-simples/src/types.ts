export type SistemaAtual = 'nenhum' | 'concorrente' | 'nosso_sistema';

export type EstagioFunil =
  | 'prospeccao'
  | 'contato'
  | 'proposta'
  | 'negociacao'
  | 'fechado_ganho'
  | 'fechado_perdido';

export const ESTAGIOS_FUNIL: { value: EstagioFunil; label: string }[] = [
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'contato', label: 'Contato Feito' },
  { value: 'proposta', label: 'Proposta Enviada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechado_ganho', label: 'Fechado — Ganho' },
  { value: 'fechado_perdido', label: 'Fechado — Perdido' },
];

/** Município oficial (código/nome/UF vêm do IBGE — nunca editáveis). */
export interface MunicipioIbge {
  codigoIbge: number;
  nome: string;
  uf: string;
}

/**
 * Dados preenchidos manualmente pelo vendedor para um município.
 * Nada aqui vem de API ou de IA — é exatamente o que o CRM existe para registrar.
 */
export interface MunicipioCrm {
  codigoIbge: number;
  sistemaAtual: SistemaAtual;
  nomeSistemaAtual?: string;
  contratoVencimento?: string; // YYYY-MM-DD
  alunosRede?: number;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  observacoes?: string;
  estagioFunil: EstagioFunil;
}

export function municipioCrmVazio(codigoIbge: number): MunicipioCrm {
  return {
    codigoIbge,
    sistemaAtual: 'nenhum',
    estagioFunil: 'prospeccao',
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

export type TipoInteracao = 'ligacao' | 'visita' | 'email' | 'reuniao';

export const TIPOS_INTERACAO: { value: TipoInteracao; label: string }[] = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'visita', label: 'Visita' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
];

export interface Interacao {
  id: string;
  codigoIbge: number;
  data: string; // YYYY-MM-DD
  tipo: TipoInteracao;
  resumo: string;
  proximoPasso?: string;
}
