import { configurarCertificadosSistema } from './tlsOficial.js';
import { unzipSync } from 'fflate';
import { readSheet } from 'read-excel-file/node';
import { lerFonteOficial, linksHtml, normalizar } from './fontesOficiais.js';
import { compararEstado, numeroPublicado, ufDoCodigo, type NotaDaFonte } from './comparativoEstadual.js';
import type { ComparativoEstadual } from '../src/types/diagnostico.js';

export const PAGINA_IDEB = 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados';
const LIMITE_ZIP = 40_000_000;

/** Apenas download.inep.gov.br; validação TLS permanece obrigatória, incluindo CAs do SO. */
export async function baixarPlanilhaInep(url: string): Promise<Uint8Array> {
  const endereco = new URL(url);
  if (endereco.protocol !== 'https:' || endereco.hostname !== 'download.inep.gov.br' || !endereco.pathname.startsWith('/ideb/')) throw new Error('Arquivo fora da fonte oficial do IDEB.');
  // Usa também a confiança do sistema operacional, sem relaxar a verificação TLS.
  configurarCertificadosSistema();
  const iniciar = async () => {
    const resposta = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(45000), headers: { 'Cache-Control': 'no-cache' } });
    if (!resposta.ok || !resposta.body || Number(resposta.headers.get('content-length') || 0) > LIMITE_ZIP) throw new Error('Download inválido.');
    const leitor = resposta.body.getReader();
    const partes: Uint8Array[] = [];
    let tamanho = 0;
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > LIMITE_ZIP) { await leitor.cancel(); throw new Error('Arquivo excede o limite.'); }
      partes.push(value);
    }
    return Buffer.concat(partes);
  };
  const inicio = Date.now();
  try { return await iniciar(); }
  catch {
    // Uma reconexão à mesma edição para falhas rápidas de transporte; nunca usa arquivo anterior.
    if (Date.now() - inicio < 10000) {
      try { return await iniciar(); } catch { /* Exibe a pendência abaixo. */ }
    }
    throw new Error('Não foi possível baixar a edição atual do IDEB no INEP. Não serão usados resultados anteriores.');
  }
}

export function descobrirEdicaoIdeb(html: string) {
  // O portal usa abas carregadas por data-url, além de links HTML comuns.
  const abas = [...html.matchAll(/data-url=["']([^"']+)["']/g)].map((m) => ({ url: new URL(m[1], PAGINA_IDEB).href }));
  const links = [...linksHtml(html, PAGINA_IDEB), ...abas].filter((l) => new RegExp(`^${PAGINA_IDEB}/2005-20\\d{2}/?$`).test(l.url));
  const edicoes = [...new Map(links.map((l) => [l.url, { url: l.url, ano: Number(l.url.match(/(20\d{2})\/?$/)![1]) }])).values()];
  if (!edicoes.length) throw new Error('Não foi possível confirmar a edição mais recente do IDEB.');
  return edicoes.sort((a, b) => b.ano - a.ano)[0];
}

export function extrairNotasIdeb(linhas: unknown[][], ano: number, codigo: number): NotaDaFonte[] {
  const uf = ufDoCodigo(codigo);
  const colunas = ['SG_UF', 'CO_MUNICIPIO', 'NO_MUNICIPIO', 'REDE', `VL_OBSERVADO_${ano}`];
  const cabecalho = linhas.findIndex((r) => colunas.every((c) => r.includes(c)));
  if (cabecalho < 0) throw new Error(`A planilha não confirma as notas do IDEB ${ano}. Não será usada a coluna de anos anteriores.`);
  const indices = colunas.map((c) => linhas[cabecalho].indexOf(c));
  return linhas.slice(cabecalho + 1)
    .filter((r) => r[indices[0]] === uf && normalizar(String(r[indices[3]] ?? '')) === 'municipal')
    .map((r) => ({ uf, codigoIbge: Number(r[indices[1]]), municipio: String(r[indices[2]]), nota: numeroPublicado(r[indices[4]], 10), participa: true }));
}

export async function lerNotasIdeb(zip: Uint8Array, ano: number, codigo: number): Promise<NotaDaFonte[]> {
  // O ZIP inclui ODS e XLSX. Só descompacta o XLSX, sem escrever arquivos em disco.
  const arquivos = unzipSync(zip, { filter: (f) => {
    if (!/\.xlsx$/i.test(f.name)) return false;
    if (f.originalSize > 30_000_000) throw new Error('Planilha oficial excede o limite de leitura.');
    return true;
  } });
  const planilhas = Object.values(arquivos);
  if (planilhas.length !== 1) throw new Error('Arquivo IDEB sem uma planilha única reconhecida.');
  let tamanhoInterno = 0;
  unzipSync(planilhas[0], { filter: (f) => {
    tamanhoInterno += f.originalSize;
    if (tamanhoInterno > 250_000_000) throw new Error('Conteúdo da planilha excede o limite de leitura.');
    return false;
  } });
  const linhas = await readSheet(Buffer.from(planilhas[0]));
  return extrairNotasIdeb(linhas, ano, codigo);
}

export async function buscarComparativosIdeb(codigo: number, dependencias = { ler: lerFonteOficial, baixar: baixarPlanilhaInep, notas: lerNotasIdeb }): Promise<{ comparativos: ComparativoEstadual[]; aviso: string | null }> {
  ufDoCodigo(codigo);
  const edicao = descobrirEdicaoIdeb(await dependencias.ler(PAGINA_IDEB));
  const links = linksHtml(await dependencias.ler(edicao.url), edicao.url);
  const comparativos: ComparativoEstadual[] = [];
  const avisos: string[] = [];
  // Sequencial para limitar o uso de memória ao ler as planilhas nacionais.
  for (const [etapa, titulo] of [['iniciais', 'Anos iniciais'], ['finais', 'Anos finais']]) {
    try {
      const arquivos = links.filter((l) => new RegExp(`/divulgacao_anos_${etapa}_municipios_${edicao.ano}\\.zip$`, 'i').test(l.url));
      if (arquivos.length !== 1) throw new Error('Planilha atual desta etapa não identificada com segurança.');
      const notas = await dependencias.notas(await dependencias.baixar(arquivos[0].url), edicao.ano, codigo);
      if (!notas.length) throw new Error('Nenhum resultado municipal encontrado para o estado.');
      comparativos.push(compararEstado(codigo, notas, {
        titulo: `IDEB — ${titulo}`, anoReferencia: edicao.ano, universo: 'Rede municipal, ensino fundamental regular, mesma etapa e mesma edição.',
        fonte: { titulo: `INEP — IDEB ${edicao.ano}, ${titulo.toLowerCase()}`, url: arquivos[0].url },
        consultadoEm: new Date().toISOString(), casasDecimais: 1,
      }));
    } catch (erro) { avisos.push(`${titulo}: ${erro instanceof Error ? erro.message : 'Consulta indisponível.'}`); }
  }
  return { comparativos, aviso: avisos.length ? avisos.join(' ') : null };
}
