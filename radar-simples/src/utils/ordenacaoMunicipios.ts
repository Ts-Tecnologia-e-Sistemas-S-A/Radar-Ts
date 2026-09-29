import type { MunicipioCrm, MunicipioIbge } from '../types';

export interface LinhaMunicipio {
  municipio: MunicipioIbge;
  crm: MunicipioCrm;
}

type DataOrdenacao = { data: string; hora?: string };

export function compararMunicipios(
  a: LinhaMunicipio,
  b: LinhaMunicipio,
  ordenacao: string,
  visitasPorCodigo: Record<number, DataOrdenacao>,
): number {
  if (ordenacao !== 'nome') {
    const dataA = ordenacao === 'visita' ? visitasPorCodigo[a.municipio.codigoIbge] : a.crm.proximaAcao;
    const dataB = ordenacao === 'visita' ? visitasPorCodigo[b.municipio.codigoIbge] : b.crm.proximaAcao;
    const chave = (acao?: DataOrdenacao) => acao?.data ? `${acao.data} ${acao.hora || '23:59'}` : '9999-12-31 23:59';
    const diferenca = chave(dataA).localeCompare(chave(dataB));
    if (diferenca) return diferenca;
  }
  return a.municipio.nome.localeCompare(b.municipio.nome, 'pt-BR') || a.municipio.uf.localeCompare(b.municipio.uf);
}
