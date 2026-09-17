export type TipoAchado = 'escola_sem_matricula' | 'escola_duplicada' | 'variacao_matricula_atipica';

export interface AchadoDiagnostico {
  tipo: TipoAchado;
  ano: number;
  detalhe: string;
}

export interface Diagnostico {
  resumo: { ano: number; escolas: number; alunos: number } | null;
  achados: AchadoDiagnostico[];
}

/**
 * Busca o diagnóstico gratuito da rede municipal (resumo do Censo Escolar +
 * pontos de atenção de cadastro) via nosso proxy (lib/diagnosticoProxy.ts).
 * Se a chamada falhar, propaga o erro pra quem chamou decidir como mostrar
 * — nunca inventamos um achado no lugar.
 */
export async function buscarDiagnostico(codigoIbge: number): Promise<Diagnostico> {
  const response = await fetch(`/api/diagnostico?codigoIbge=${codigoIbge}`);
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || `Falha ao gerar diagnóstico (status ${response.status})`);
  }
  return json.dados;
}
