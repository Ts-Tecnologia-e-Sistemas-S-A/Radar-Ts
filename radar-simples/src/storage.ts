import { Interacao, MunicipioCrm } from './types';

const MUNICIPIOS_KEY = 'radar_municipios_crm_v1';
const INTERACOES_KEY = 'radar_interacoes_v1';

export function getMunicipiosCrm(): Record<number, MunicipioCrm> {
  try {
    const raw = localStorage.getItem(MUNICIPIOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMunicipioCrm(municipio: MunicipioCrm): void {
  const all = getMunicipiosCrm();
  all[municipio.codigoIbge] = municipio;
  localStorage.setItem(MUNICIPIOS_KEY, JSON.stringify(all));
}

export function getInteracoes(codigoIbge?: number): Interacao[] {
  try {
    const raw = localStorage.getItem(INTERACOES_KEY);
    const all: Interacao[] = raw ? JSON.parse(raw) : [];
    return codigoIbge === undefined ? all : all.filter((i) => i.codigoIbge === codigoIbge);
  } catch {
    return [];
  }
}

export function addInteracao(interacao: Interacao): void {
  const all = getInteracoes();
  all.push(interacao);
  localStorage.setItem(INTERACOES_KEY, JSON.stringify(all));
}
