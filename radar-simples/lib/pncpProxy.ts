/**
 * Lógica compartilhada do proxy do PNCP — usada tanto pelo servidor Express
 * (dev local, server.ts) quanto pela função serverless do Vercel
 * (api/pncp/licitacoes.ts), pra não duplicar a chamada real à API.
 */
export interface ResultadoProxy {
  status: number;
  body: { data: unknown[] } | { erro: string };
}

export async function buscarLicitacoesPncp(
  uf: string | undefined,
  dataInicial: string | undefined,
  dataFinal: string | undefined
): Promise<ResultadoProxy> {
  if (!uf || !dataInicial || !dataFinal) {
    return { status: 400, body: { erro: 'Parâmetros uf, dataInicial e dataFinal são obrigatórios.' } };
  }

  const url =
    `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao` +
    `?dataInicial=${dataInicial}&dataFinal=${dataFinal}&uf=${uf.toUpperCase()}&pagina=1&tamanhoPagina=50`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { status: 502, body: { erro: `PNCP respondeu ${response.status}` } };
    }

    const dados = await response.json();
    return { status: 200, body: { data: Array.isArray(dados.data) ? dados.data : [] } };
  } catch (err: any) {
    return { status: 502, body: { erro: err.message || 'Falha ao consultar o PNCP' } };
  }
}
