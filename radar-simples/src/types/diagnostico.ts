export type TipoAchado = 'escola_sem_matricula' | 'escola_duplicada' | 'variacao_matricula_atipica';
export interface AchadoDiagnostico { tipo: TipoAchado; ano: number; detalhe: string }
export interface FonteDiagnostico { titulo: string; url: string }
export interface NotaMunicipal {
  codigoIbge: number;
  municipio: string;
  nota: number | null;
  posicao: number | null;
}
export interface ComparativoEstadual {
  titulo: string;
  uf: string;
  anoReferencia: number;
  universo: string;
  cidade: NotaMunicipal | null;
  destaques: NotaMunicipal[];
  totalComNota: number;
  consultadoEm: string;
  fonte: FonteDiagnostico;
  casasDecimais: number;
  formato?: 'numero' | 'moeda';
  periodo?: string;
  atualizadoEm?: string;
}
export interface AvaliacaoVaar {
  codigoIbge: number;
  municipio: string;
  uf: string;
  exercicio: number;
  publicacao: string;
  consultadoEm: string;
  condicoes: boolean[];
  habilitado: boolean;
  beneficiario: boolean;
  evoluiuAtendimento: boolean;
  evoluiuAprendizagem: boolean;
  repasseTotalPrevisto: number | null;
  pendencia: string | null;
  avisos: string[];
  fontes: FonteDiagnostico[];
  comparativoAprendizagem?: ComparativoEstadual | null;
  avisoComparativo?: string | null;
}
export const CONDICOES_VAAR = [
  'I — Provimento do cargo de gestor escolar',
  'II — Participação dos estudantes no Saeb',
  'III — Redução das desigualdades educacionais',
  'IV — ICMS Educacional',
  'V — Currículo alinhado à BNCC',
];
export interface Diagnostico {
  resumo: { ano: number; escolas: number; alunos: number } | null;
  achados: AchadoDiagnostico[];
  vaar?: AvaliacaoVaar | null;
  codigoIbge?: number;
  consultadoEm?: string;
  avisoCenso?: string | null;
  avisoVaar?: string | null;
  comparativosIdeb?: ComparativoEstadual[];
  avisoIdeb?: string | null;
  comparativoRepasses?: ComparativoEstadual | null;
  avisoRepasses?: string | null;
}
