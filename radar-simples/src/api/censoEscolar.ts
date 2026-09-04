export interface DadosEscolares {
  ano: number;
  escolas: number;
  alunos: number;
}

/**
 * Busca a rede escolar municipal (nº de escolas + matrículas) no Censo
 * Escolar do INEP, via nosso proxy (lib/censoEscolarProxy.ts). Retorna
 * `null` quando não há dado publicado pra esse município (não é erro) —
 * se a chamada em si falhar, propaga o erro pra quem chamou decidir como
 * mostrar (nunca inventamos um número no lugar).
 */
export async function buscarDadosEscolares(codigoIbge: number): Promise<DadosEscolares | null> {
  const response = await fetch(`/api/censo-escolar?codigoIbge=${codigoIbge}`);
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || `Falha ao consultar o Censo Escolar (status ${response.status})`);
  }
  return json.dados;
}
