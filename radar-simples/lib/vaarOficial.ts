import { lerFonteOficial, linksHtml, normalizar, tabelaCsv, textoHtml } from './fontesOficiais.js';
import type { AvaliacaoVaar } from '../src/types/diagnostico.js';
import { compararAprendizagemVaar } from './vaarComparativo.js';

const BASE = 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb';
type Leitor = (url: string) => Promise<string>;

export function descobrirPublicacao(html: string, pagina: string) {
  const secoes = [...html.matchAll(/<(?:p|h[2-4])\b[^>]*>([\s\S]*?)<\/(?:p|h[2-4])>/gi)]
    .map((m) => ({ inicio: m.index!, fim: m.index! + m[0].length, titulo: textoHtml(m[1]) }))
    .map((s) => ({ ...s, numero: Number(normalizar(s.titulo).match(/^(\d+)\s*[ªaºo]?\s*publicacao/)?.[1]) }))
    .filter((s) => s.numero > 0);
  if (!secoes.length) throw new Error('Não foi possível identificar a última publicação do FNDE.');
  const ultima = secoes.reduce((a, b) => a.numero > b.numero ? a : b);
  const fim = secoes.find((s) => s.inicio > ultima.inicio)?.inicio ?? html.length;
  const candidatos = linksHtml(html.slice(ultima.fim, fim), pagina)
    .filter((l) => /\.csv$/i.test(l.url) && /redes-beneficiadas/.test(l.url) && /vaar/.test(l.url));
  if (candidatos.length !== 1) throw new Error('A última publicação não tem uma tabela VAAR inequívoca; valores anteriores não serão utilizados.');
  const listas = linksHtml(html, pagina).filter((l) => /\.csv$/i.test(l.url) && /lista.*entes.*beneficiarios.*nao.*beneficiarios.*vaar/i.test(normalizar(decodeURI(l.url))));
  if (listas.length !== 1) throw new Error('Lista oficial de habilitação VAAR não identificada com segurança.');
  return { publicacao: ultima.titulo, valoresUrl: candidatos[0].url, habilitacaoUrl: listas[0].url };
}

function simNao(valor: string): boolean {
  if (normalizar(valor) === 'sim') return true;
  if (normalizar(valor) === 'nao') return false;
  throw new Error('Condição não informada no arquivo oficial; avaliação indisponível.');
}
function status(valor: string, positivo: string, negativo: string) {
  if (normalizar(valor) === positivo) return true;
  if (normalizar(valor) === negativo) return false;
  throw new Error('Situação não reconhecida na publicação oficial.');
}
export function moedaOficial(valor: string): number {
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(valor.trim())) throw new Error('Valor ausente ou inválido na publicação oficial.');
  const numero = Number(valor.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numero)) throw new Error('Valor inválido na publicação oficial.');
  return numero;
}

export async function buscarVaarOficial(codigoIbge: number, ler: Leitor = lerFonteOficial, agora = new Date()): Promise<AvaliacaoVaar> {
  if (!/^[1-9]\d{6}$/.test(String(codigoIbge))) throw new Error('Código IBGE inválido.');
  const exercicio = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(agora));
  const pagina = `${BASE}/${exercicio}`;
  const html = await ler(pagina);
  const fontes = descobrirPublicacao(html, pagina);
  const [habilitacao, valores] = await Promise.all([ler(fontes.habilitacaoUrl), ler(fontes.valoresUrl)]);
  const portaria = (texto: string) => normalizar(texto).match(/portaria[^;\n]*?n[ºo°.]*\s*(\d+)/)?.[1];
  if (!portaria(fontes.publicacao) || portaria(fontes.publicacao) !== portaria(valores.slice(0, 1500))) {
    throw new Error('O arquivo de repasses não corresponde à portaria mais recente. Valores bloqueados.');
  }
  // Confere o exercício dentro do arquivo, não apenas no nome do link.
  if (!normalizar(habilitacao).includes(`vaar ${exercicio}`) ||
      !new RegExp(`ano\\s+de\\s+${exercicio}`).test(normalizar(valores))) {
    throw new Error('Os arquivos oficiais não confirmam o exercício atual.');
  }
  const candidatos = tabelaCsv(habilitacao, ['UF', 'Código IBGE', 'Entidade', 'Cond. I', 'Cond. II', 'Cond. III', 'Cond. IV', 'Cond. V', 'Habilitados?', 'Beneficiário?', 'Evoluiu Indicador de Atendimento?', 'Evoluiu Indicador de Aprendizagem?', 'Pendência Identificada'])
    .filter((r) => r['codigo ibge'] === String(codigoIbge));
  if (candidatos.length !== 1) throw new Error('Município ausente ou duplicado na lista oficial de habilitação.');
  const r = candidatos[0];
  const condicoes = ['i', 'ii', 'iii', 'iv', 'v'].map((c) => simNao(r[`cond. ${c}`]));
  const habilitado = status(r['habilitados?'], 'habilitado', 'nao habilitado');
  const beneficiario = status(r['beneficiario?'], 'beneficiario', 'nao beneficiario');
  const evoluiuAtendimento = simNao(r['evoluiu indicador de atendimento?']);
  const evoluiuAprendizagem = simNao(r['evoluiu indicador de aprendizagem?']);
  if (habilitado !== condicoes.every(Boolean) || beneficiario !== (habilitado && (evoluiuAtendimento || evoluiuAprendizagem))) {
    throw new Error('Condições e situação oficial divergentes; necessária conferência no FNDE.');
  }
  const repasses = tabelaCsv(valores, ['Código IBGE', 'Complementação da União-VAAR (R$)'])
    .filter((v) => v['codigo ibge'] === String(codigoIbge));
  if (repasses.length > 1) throw new Error('Município duplicado na tabela de repasses do FNDE.');
  const avisos = ['O total é a previsão publicada pelo FNDE, não um pagamento realizado. A divisão por indicador e a taxa percentual do Saeb não são informadas nesta publicação.'];
  let repasseTotalPrevisto: number | null = null;
  if (beneficiario && repasses.length === 1) repasseTotalPrevisto = moedaOficial(repasses[0]['complementacao da uniao-vaar (r$)']);
  else if (!beneficiario && repasses.length === 0) repasseTotalPrevisto = 0;
  else avisos.push('A lista de habilitação e a última tabela de repasses divergem. Valor bloqueado até conferência oficial.');
  let comparativoAprendizagem = null;
  let avisoComparativo = null;
  try {
    const indicadores = linksHtml(html, pagina).filter((l) => /indicadores.*atendimento.*aprendizagem.*vaar.*\.csv$/i.test(l.url));
    if (indicadores.length !== 1) throw new Error('Arquivo atual dos indicadores VAAR não identificado com segurança.');
    comparativoAprendizagem = compararAprendizagemVaar(codigoIbge, await ler(indicadores[0].url), habilitacao, exercicio, indicadores[0].url, agora.toISOString());
  } catch (erro) { avisoComparativo = erro instanceof Error ? erro.message : 'Comparação estadual do VAAR indisponível.'; }
  return {
    codigoIbge, municipio: r.entidade, uf: r.uf, exercicio, publicacao: fontes.publicacao,
    consultadoEm: agora.toISOString(), condicoes, habilitado, beneficiario,
    evoluiuAtendimento, evoluiuAprendizagem, repasseTotalPrevisto,
    comparativoAprendizagem, avisoComparativo,
    pendencia: r['pendencia identificada'] && r['pendencia identificada'] !== '-' ? r['pendencia identificada'] : null,
    avisos,
    fontes: [
      { titulo: 'Publicações do FNDE — exercício e última revisão', url: pagina },
      { titulo: 'FNDE — condições, evolução e habilitação', url: fontes.habilitacaoUrl },
      { titulo: 'FNDE — última previsão de repasse VAAR', url: fontes.valoresUrl },
    ],
  };
}
