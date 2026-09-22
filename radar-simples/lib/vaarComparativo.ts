import { normalizar, tabelaCsv } from './fontesOficiais.js';
import { compararEstado, numeroPublicado, ufDoCodigo } from './comparativoEstadual.js';

export function compararAprendizagemVaar(codigo: number, indicadores: string, habilitacao: string, exercicio: number, fonteUrl: string, consultadoEm: string) {
  if (!normalizar(indicadores).includes(`fundeb ${exercicio}`)) throw new Error('Indicadores VAAR de outro exercício; comparação bloqueada.');
  const uf = ufDoCodigo(codigo);
  const habilitados = tabelaCsv(habilitacao, ['Código IBGE', 'UF', 'Habilitados?', 'Beneficiário?', 'Evoluiu Indicador de Aprendizagem?']);
  const elegiveis = new Set<number>();
  const ids = new Set<string>();
  for (const r of habilitados.filter((r) => r.uf === uf && /^[1-9]\d{6}$/.test(r['codigo ibge']))) {
    if (ids.has(r['codigo ibge'])) throw new Error('Município duplicado na lista de habilitação.');
    ids.add(r['codigo ibge']);
    if (!['habilitado', 'nao habilitado'].includes(normalizar(r['habilitados?'])) ||
        !['beneficiario', 'nao beneficiario'].includes(normalizar(r['beneficiario?'])) ||
        !['sim', 'nao'].includes(normalizar(r['evoluiu indicador de aprendizagem?']))) throw new Error('Habilitação desconhecida; comparação bloqueada.');
    if (normalizar(r['habilitados?']) === 'habilitado' && normalizar(r['beneficiario?']) === 'beneficiario' && normalizar(r['evoluiu indicador de aprendizagem?']) === 'sim') elegiveis.add(Number(r['codigo ibge']));
  }
  const notas = tabelaCsv(indicadores, ['UF', 'Ente Federado', 'Código IBGE', 'Indicador Aprendizagem'])
    .filter((r) => r.uf === uf && /^[1-9]\d{6}$/.test(r['codigo ibge']))
    .map((r) => ({ codigoIbge: Number(r['codigo ibge']), municipio: r['ente federado'], uf: r.uf,
      nota: numeroPublicado(r['indicador aprendizagem']), participa: elegiveis.has(Number(r['codigo ibge'])) }));
  // Sem cobertura dos beneficiários não é possível afirmar quais têm as maiores notas.
  if ([...elegiveis].some((id) => !notas.some((n) => n.codigoIbge === id))) throw new Error('Indicadores incompletos para os beneficiários do estado.');
  return compararEstado(codigo, notas, {
    titulo: 'VAAR — aprendizagem', anoReferencia: exercicio,
    universo: 'Municípios beneficiários e elegíveis em aprendizagem no mesmo estado. Indicador VAAR; não é nota do IDEB.',
    fonte: { titulo: `FNDE — indicadores VAAR ${exercicio}`, url: fonteUrl }, consultadoEm, casasDecimais: 6,
  });
}
