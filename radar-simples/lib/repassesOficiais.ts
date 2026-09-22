import { compararEstado, ufDoCodigo } from './comparativoEstadual.js';
import { normalizar, lerCsv } from './fontesOficiais.js';

const CATALOGO = 'https://www.tesourotransparente.gov.br/ckan/api/3/action/resource_show?id=18d5b0ae-8037-461e-8685-3f0d7752a287';
const nomeChave = (s: string) => normalizar(s).replace(/[^a-z0-9]/g, '');
type MunicipioOficial = { id: number; nome: string };

async function ler(url: string): Promise<string> {
  const u = new URL(url);
  if (u.protocol !== 'https:' || !['www.tesourotransparente.gov.br', 'servicodados.ibge.gov.br'].includes(u.hostname)) throw new Error('Fonte de repasses não autorizada.');
  const r = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(40000), headers: { 'Cache-Control': 'no-cache' } });
  if (!r.ok || !r.body) throw new Error('Fonte oficial dos repasses indisponível.');
  const partes: Uint8Array[] = [];
  let total = 0;
  const stream = r.body.getReader();
  while (true) {
    const p = await stream.read();
    if (p.done) break;
    total += p.value.length;
    if (total > 40_000_000) { await stream.cancel(); throw new Error('Arquivo de repasses excede o limite de leitura.'); }
    partes.push(p.value);
  }
  const bytes = Buffer.concat(partes);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}

export function apurarRepasses(codigo: number, csv: string, municipios: MunicipioOficial[], ano: number) {
  const uf = ufDoCodigo(codigo);
  const linhas = lerCsv(csv);
  const h = linhas[0]?.map(normalizar) || [];
  const colunas = ['cod_mun', 'municipio', 'uf', 'mes', String(ano)].map((c) => h.indexOf(c));
  if (colunas.some((i) => i < 0)) throw new Error(`O Tesouro ainda não disponibiliza o exercício ${ano} no formato esperado. Não será usado um ano anterior.`);
  const [cod, nome, estado, mes, valor] = colunas;
  const oficiais = new Map<string, MunicipioOficial>();
  for (const m of municipios) {
    if (ufDoCodigo(m.id) !== uf || oficiais.has(nomeChave(m.nome))) throw new Error('Identificação dos municípios ambígua na base do IBGE.');
    oficiais.set(nomeChave(m.nome), m);
  }
  const valores = new Map<number, { municipio: string; codigoIbge: number; uf: string; meses: Map<number, number> }>();
  let ultimoMes = 0;
  const identificadores = new Map<string, number>();
  for (const r of linhas.slice(1)) {
    if (r[estado] !== uf) continue;
    const m = oficiais.get(nomeChave(r[nome]));
    if (!m) throw new Error(`Não foi possível vincular ${r[nome]} ao código IBGE. Comparação pendente de conferência.`);
    const codigoSiafi = r[cod];
    const anterior = identificadores.get(codigoSiafi);
    if (anterior !== undefined && anterior !== m.id) throw new Error('Código municipal divergente na base de repasses.');
    identificadores.set(codigoSiafi, m.id);
    const numeroMes = Number(r[mes]);
    if (!Number.isInteger(numeroMes) || numeroMes < 1 || numeroMes > 12) throw new Error('Mês inválido na fonte oficial.');
    const v = r[valor]?.trim();
    if (!v || /^[-*]+$/.test(v)) continue;
    if (!/^-?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(v)) throw new Error('Valor não reconhecido na base do Tesouro.');
    const centavos = Math.round(Number(v.replace(/\./g, '').replace(',', '.')) * 100);
    if (!Number.isSafeInteger(centavos)) throw new Error('Valor fora do limite de apuração.');
    const acumulado = valores.get(m.id) || { municipio: m.nome, codigoIbge: m.id, uf, meses: new Map<number, number>() };
    if (acumulado.meses.has(numeroMes)) throw new Error('Mês duplicado na base de repasses.');
    acumulado.meses.set(numeroMes, centavos);
    valores.set(m.id, acumulado);
    ultimoMes = Math.max(ultimoMes, numeroMes);
  }
  if (!ultimoMes) throw new Error('Ainda não há valores recebidos publicados para este exercício e estado.');
  const notas = [...valores.values()].map((r) => {
    for (let m = 1; m <= ultimoMes; m++) if (!r.meses.has(m)) throw new Error('Períodos incompletos entre municípios. Ranking bloqueado para evitar comparação incorreta.');
    return { codigoIbge: r.codigoIbge, municipio: r.municipio, uf, nota: [...r.meses.values()].reduce((a, v) => a + v, 0) / 100, participa: true };
  });
  return { notas, ultimoMes };
}

export async function buscarRepassesRecebidos(codigo: number, leitor = ler, agora = new Date()) {
  const uf = ufDoCodigo(codigo);
  const ano = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(agora));
  const [catalogo, cidades] = await Promise.all([
    leitor(CATALOGO), leitor(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`),
  ]);
  const recurso = JSON.parse(catalogo);
  if (!recurso.success || !recurso.result?.last_modified || !recurso.result?.url) throw new Error('Atualização da fonte de repasses não confirmada.');
  const url = new URL(recurso.result.url);
  if (url.hostname !== 'www.tesourotransparente.gov.br' || !url.pathname.endsWith('/fundeb-por-municipio.csv')) throw new Error('Arquivo de repasses não reconhecido no catálogo oficial.');
  const { notas, ultimoMes } = apurarRepasses(codigo, await leitor(url.href), JSON.parse(cidades), ano);
  const mesAtual = Number(new Intl.DateTimeFormat('en', { month: 'numeric', timeZone: 'America/Sao_Paulo' }).format(agora));
  if (ultimoMes > mesAtual) throw new Error('A fonte contém períodos futuros. Repasses recebidos pendentes de conferência.');
  const atualizadoEm = /(?:Z|[+-]\d{2}:\d{2})$/.test(recurso.result.last_modified) ? recurso.result.last_modified : `${recurso.result.last_modified}Z`;
  if (!Number.isFinite(Date.parse(atualizadoEm)) || Date.parse(atualizadoEm) > agora.getTime()) throw new Error('Data de atualização oficial inválida.');
  return compararEstado(codigo, notas, {
    titulo: 'FUNDEB — maiores repasses recebidos', anoReferencia: ano,
    universo: 'Valores do Fundeb efetivamente distribuídos aos municípios, conforme a base do Tesouro Nacional. Acumulado no mesmo período para todas as cidades; a base não discrimina o VAAR.',
    periodo: `Janeiro a ${new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(ano, ultimoMes - 1, 1)))} de ${ano}`,
    atualizadoEm,
    fonte: { titulo: 'Tesouro Nacional — Fundeb por município', url: url.href },
    consultadoEm: agora.toISOString(), casasDecimais: 2, formato: 'moeda',
  });
}
