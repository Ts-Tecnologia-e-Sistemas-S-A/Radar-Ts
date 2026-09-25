import type { MunicipioCrm, MunicipioIbge } from '../types';

type MunicipioOrdenavel = {
  municipio: Pick<MunicipioIbge, 'codigoIbge' | 'nome' | 'uf'>;
  crm: Pick<MunicipioCrm, 'codigoIbge' | 'ultimaAtividadeEm'> | null | undefined;
};

function stableSerialize(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(stableSerialize).join(',')}]`;
  if (valor && typeof valor === 'object') {
    const entries = Object.entries(valor as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([chave, item]) => `${JSON.stringify(chave)}:${stableSerialize(item)}`).join(',')}}`;
  }
  return JSON.stringify(valor);
}

function atividadeValida(data?: string): string {
  return data && !Number.isNaN(Date.parse(data)) ? data : '';
}

export function municipioCrmMudouSemUltimaAtividade(anterior: MunicipioCrm | null | undefined, proximo: MunicipioCrm): boolean {
  if (!anterior) return true;
  const { ultimaAtividadeEm: _anteriorIgnorada, ...semAnterior } = anterior;
  const { ultimaAtividadeEm: _proximaIgnorada, ...semProximo } = proximo;
  return stableSerialize(semAnterior) !== stableSerialize(semProximo);
}

export function compareMunicipiosPorUltimaAtividade(a: MunicipioOrdenavel, b: MunicipioOrdenavel): number {
  const atividadeA = atividadeValida(a.crm?.ultimaAtividadeEm);
  const atividadeB = atividadeValida(b.crm?.ultimaAtividadeEm);
  if (atividadeA !== atividadeB) return atividadeB.localeCompare(atividadeA);
  return a.municipio.nome.localeCompare(b.municipio.nome, 'pt-BR')
    || a.municipio.uf.localeCompare(b.municipio.uf, 'pt-BR')
    || a.municipio.codigoIbge - b.municipio.codigoIbge;
}

export function ordenarMunicipiosPorUltimaAtividade<T extends MunicipioOrdenavel>(linhas: T[]): T[] {
  return [...linhas].sort(compareMunicipiosPorUltimaAtividade);
}
