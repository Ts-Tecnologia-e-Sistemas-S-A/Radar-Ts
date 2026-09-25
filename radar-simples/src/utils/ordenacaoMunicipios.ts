import type { EventoTimeline, MunicipioCrm, MunicipioIbge } from '../types';

type LinhaMunicipio<TMunicipio extends MunicipioIbge = MunicipioIbge> = {
  municipio: TMunicipio;
  crm: MunicipioCrm;
};

function serializarEstavel(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(serializarEstavel).join(',')}]`;
  if (valor && typeof valor === 'object') {
    return `{${Object.entries(valor as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chave, conteudo]) => `${JSON.stringify(chave)}:${serializarEstavel(conteudo)}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor);
}

function atividadeComoNumero(ultimaAtividadeEm?: string): number | null {
  if (!ultimaAtividadeEm) return null;
  const timestamp = Date.parse(ultimaAtividadeEm);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compararPorFallback(a: MunicipioIbge, b: MunicipioIbge): number {
  return a.uf.localeCompare(b.uf, 'pt-BR')
    || a.nome.localeCompare(b.nome, 'pt-BR')
    || a.codigoIbge - b.codigoIbge;
}

export function compararMunicipiosPorUltimaAtividade<TMunicipio extends MunicipioIbge>(
  a: LinhaMunicipio<TMunicipio>,
  b: LinhaMunicipio<TMunicipio>,
): number {
  const atividadeA = atividadeComoNumero(a.crm.ultimaAtividadeEm);
  const atividadeB = atividadeComoNumero(b.crm.ultimaAtividadeEm);
  if (atividadeA !== atividadeB) {
    if (atividadeA === null) return 1;
    if (atividadeB === null) return -1;
    return atividadeB - atividadeA;
  }
  return compararPorFallback(a.municipio, b.municipio);
}

export function ordenarMunicipiosPorUltimaAtividade<TMunicipio extends MunicipioIbge>(
  linhas: LinhaMunicipio<TMunicipio>[],
): LinhaMunicipio<TMunicipio>[] {
  return [...linhas].sort(compararMunicipiosPorUltimaAtividade);
}

export function atualizarUltimaAtividadeMunicipio(
  anterior: MunicipioCrm,
  proximo: MunicipioCrm,
  ultimaAtividadeEm = new Date().toISOString(),
): MunicipioCrm {
  const { ultimaAtividadeEm: _anterior, ...restanteAnterior } = anterior;
  const { ultimaAtividadeEm: _proximo, ...restanteProximo } = proximo;
  if (serializarEstavel(restanteAnterior) === serializarEstavel(restanteProximo)) return proximo;
  return { ...proximo, ultimaAtividadeEm };
}

export function ultimaAtividadeDoEvento(evento: EventoTimeline, fallback = new Date().toISOString()): string {
  return evento.registroRapido?.atualizadoEm || evento.criadaEm || fallback;
}
