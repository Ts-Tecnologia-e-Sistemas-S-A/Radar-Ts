import { createHash } from 'node:crypto';
import { lerFonteOficial, linksHtml, normalizar } from './fontesOficiais.js';

export const PAGINA_CENSO = 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar';

/** Identifica também retificações do mesmo ano, sem baixar o ZIP de microdados. */
export async function consultarEdicaoCenso(ler = lerFonteOficial) {
  const links = linksHtml(await ler(PAGINA_CENSO), PAGINA_CENSO)
    .filter((l) => /microdados.*censo.*escolar/.test(normalizar(l.texto)) && /20\d{2}/.test(l.texto));
  const edicoes = links.map((l) => ({ ...l, ano: Number(l.texto.match(/20\d{2}/)![0]) }));
  const ano = Math.max(...edicoes.map((l) => l.ano));
  const atuais = edicoes.filter((l) => l.ano === ano);
  if (atuais.length !== 1) throw new Error('Não foi possível confirmar a edição atual do Censo no INEP.');
  const edicao = atuais[0];
  const url = new URL(edicao.url);
  if (url.protocol !== 'https:' || url.hostname !== 'download.inep.gov.br') throw new Error('Arquivo atual do INEP não reconhecido.');
  const resposta = await fetch(edicao.url, { method: 'HEAD', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
  const etag = resposta.headers.get('etag');
  const ultimaModificacao = resposta.headers.get('last-modified');
  if (!resposta.ok || !etag || !ultimaModificacao) throw new Error('Não foi possível confirmar a revisão do arquivo do INEP.');
  const revisao = createHash('sha256').update(JSON.stringify([edicao.url, edicao.texto, etag, ultimaModificacao])).digest('hex');
  return { ano, revisao, url: edicao.url };
}

export function validarEspelhoCenso(edicao: { ano: number; revisao: string }, revisaoEspelho: string | undefined) {
  if (revisaoEspelho !== edicao.revisao) {
    throw new Error(`Censo ${edicao.ano}: a revisão atual do INEP ainda não foi validada na base de consulta. Números anteriores estão bloqueados.`);
  }
}
