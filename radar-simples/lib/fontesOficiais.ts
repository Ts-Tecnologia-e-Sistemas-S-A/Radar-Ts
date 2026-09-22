/** Sem cache nem fallback: cada consulta verifica novamente o portal oficial. */
export async function lerFonteOficial(url: string): Promise<string> {
  const endereco = new URL(url);
  if (endereco.protocol !== 'https:' || endereco.hostname !== 'www.gov.br' ||
      !/^\/(fnde|inep)\//.test(endereco.pathname)) throw new Error('Endereço fora das fontes oficiais permitidas.');
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch { throw new Error('Não foi possível consultar a fonte oficial agora. Avaliação pendente; dados anteriores não serão utilizados.'); }
  if (!resposta.ok) throw new Error(`Fonte oficial indisponível (HTTP ${resposta.status}). Tente novamente.`);
  const bytes = await resposta.arrayBuffer();
  if (bytes.byteLength > 12_000_000) throw new Error('Arquivo oficial excede o limite de leitura.');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}

export const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const textoHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export function linksHtml(html: string, base: string) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ url: new URL(m[1].replace(/&amp;/g, '&'), base).href, texto: textoHtml(m[2]) }));
}

/** CSV do FNDE usa ponto e vírgula, vírgula decimal e cabeçalhos multilinha. */
export function lerCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      if (aspas && texto[i + 1] === '"') { campo += '"'; i++; }
      else aspas = !aspas;
    } else if (c === ';' && !aspas) { linha.push(campo.trim()); campo = ''; }
    else if ((c === '\n' || c === '\r') && !aspas) {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo.trim()); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (aspas) throw new Error('CSV oficial incompleto.');
  if (campo || linha.length) { linha.push(campo.trim()); linhas.push(linha); }
  return linhas;
}

export function tabelaCsv(texto: string, colunas: string[]) {
  const linhas = lerCsv(texto);
  const indice = linhas.findIndex((linha) => colunas.every((c) => linha.some((v) => normalizar(v) === normalizar(c))));
  if (indice < 0) throw new Error('Formato da publicação oficial mudou; avaliação pendente de validação.');
  const cabecalho = linhas[indice].map(normalizar);
  return linhas.slice(indice + 1).map((linha) => Object.fromEntries(cabecalho.map((c, i) => [c, linha[i] ?? ''])));
}
