import type { MunicipioCrm, MunicipioIbge } from '../types';

export interface LinhaMunicipio {
  municipio: MunicipioIbge;
  crm: MunicipioCrm;
}

export type OrdenacaoMunicipios = 'nome' | 'visita' | 'tarefa';

const SEM_DATA = '9999-12-31 23:59';

function chaveData(data?: string, hora?: string): string {
  return data ? `${data} ${hora || '23:59'}` : SEM_DATA;
}

function chaveMunicipio(crm: MunicipioCrm, ordenacao: Exclude<OrdenacaoMunicipios, 'nome'>): string {
  return ordenacao === 'visita'
    ? chaveData(crm.dataUltimaVisita)
    : chaveData(crm.proximaAcao?.data, crm.proximaAcao?.hora);
}

export function compararMunicipios(
  a: LinhaMunicipio,
  b: LinhaMunicipio,
  ordenacao: OrdenacaoMunicipios,
): number {
  if (ordenacao !== 'nome') {
    const diferenca = chaveMunicipio(a.crm, ordenacao).localeCompare(chaveMunicipio(b.crm, ordenacao));
    if (diferenca) return diferenca;
  }
  return a.municipio.nome.localeCompare(b.municipio.nome, 'pt-BR') || a.municipio.uf.localeCompare(b.municipio.uf);
}
