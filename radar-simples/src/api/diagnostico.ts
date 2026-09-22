import type { Diagnostico } from '../types/diagnostico';
export type { Diagnostico, AvaliacaoVaar, TipoAchado, AchadoDiagnostico } from '../types/diagnostico';

export async function buscarDiagnostico(codigoIbge: number): Promise<Diagnostico> {
  const response = await fetch(`/api/diagnostico?codigoIbge=${codigoIbge}`, { cache: 'no-store' });
  const json = await response.json();
  if (!response.ok || !json.sucesso) throw new Error(json.erro || `Falha ao gerar diagnóstico (status ${response.status})`);
  if (json.dados?.codigoIbge !== codigoIbge || !json.dados?.consultadoEm) throw new Error('Diagnóstico sem confirmação da cidade ou da consulta atual.');
  return json.dados;
}
