import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Despesa, EventoTimeline, MunicipioCrm } from './types';

// Mock mínimo do Firestore em memória, só o suficiente pra exercitar a
// lógica de storage.ts (nomes de coleção, mapeamento de doc id, filtro por
// codigoIbge) sem depender de rede.
const bancos = new Map<string, Map<string, unknown>>();

function colecao(nome: string) {
  if (!bancos.has(nome)) bancos.set(nome, new Map());
  return bancos.get(nome)!;
}

mock.module('firebase/firestore', () => ({
  collection: (_db: unknown, nome: string) => ({ __colecao: nome }),
  doc: (_db: unknown, nome: string, id: string) => ({ __colecao: nome, __id: id }),
  getDoc: async (ref: { __colecao: string; __id: string }) => {
    const dado = colecao(ref.__colecao).get(ref.__id);
    return { exists: () => dado !== undefined, data: () => dado };
  },
  getDocs: async (ref: { __colecao: string }) => {
    const docs = Array.from(colecao(ref.__colecao).values()).map((data) => ({ data: () => data }));
    return { docs, forEach: (fn: (d: { data: () => unknown }) => void) => docs.forEach(fn) };
  },
  setDoc: async (ref: { __colecao: string; __id: string }, data: unknown) => {
    colecao(ref.__colecao).set(ref.__id, data);
  },
}));

mock.module('./lib/firebase', () => ({ db: {} }));

const {
  getMunicipiosCrm,
  getMunicipioCrm,
  saveMunicipioCrm,
  getDespesas,
  addDespesa,
  getEventos,
  addEvento,
  getPontosRota,
  addPontoRota,
} = await import('./storage');

beforeEach(() => {
  bancos.clear();
});

function makeMunicipio(codigoIbge: number, overrides: Partial<MunicipioCrm> = {}): MunicipioCrm {
  return { codigoIbge, prioritario: false, contatos: [], solucoes: [], estagioFunil: 'mapeamento', ...overrides };
}

function makeDespesa(id: string, codigoIbge: number, overrides: Partial<Despesa> = {}): Despesa {
  return {
    id,
    codigoIbge,
    valor: 100,
    data: '2026-01-01',
    categoria: 'combustivel',
    descricao: 'teste',
    origemOcr: false,
    criadaEm: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeEvento(id: string, codigoIbge: number): EventoTimeline {
  return {
    id,
    codigoIbge,
    tipo: 'reuniao',
    data: '2026-01-01',
    resumo: 'teste',
    anexos: [],
    mandato: '2025–2028',
    mandatoAtivo: true,
  };
}

describe('getMunicipioCrm / saveMunicipioCrm', () => {
  it('retorna null para município ainda não salvo', async () => {
    expect(await getMunicipioCrm(1)).toBeNull();
  });

  it('salva e recupera pelo código IBGE', async () => {
    await saveMunicipioCrm(makeMunicipio(2211001, { prioritario: true }));
    const resultado = await getMunicipioCrm(2211001);
    expect(resultado).toEqual(makeMunicipio(2211001, { prioritario: true }));
  });
});

describe('getMunicipiosCrm', () => {
  it('retorna todos os municípios salvos, indexados por codigoIbge', async () => {
    await saveMunicipioCrm(makeMunicipio(1));
    await saveMunicipioCrm(makeMunicipio(2));
    const todos = await getMunicipiosCrm();
    expect(Object.keys(todos).sort()).toEqual(['1', '2']);
  });

  it('retorna objeto vazio quando nada foi salvo', async () => {
    expect(await getMunicipiosCrm()).toEqual({});
  });
});

describe('getDespesas / addDespesa', () => {
  it('registra e filtra despesas por município', async () => {
    await addDespesa(makeDespesa('d1', 10));
    await addDespesa(makeDespesa('d2', 20));
    expect(await getDespesas(10)).toEqual([makeDespesa('d1', 10)]);
    expect(await getDespesas()).toHaveLength(2);
  });
});

describe('getEventos / addEvento', () => {
  it('registra e filtra eventos por município', async () => {
    await addEvento(makeEvento('e1', 10));
    await addEvento(makeEvento('e2', 20));
    expect(await getEventos(10)).toEqual([makeEvento('e1', 10)]);
    expect(await getEventos()).toHaveLength(2);
  });
});

describe('getPontosRota / addPontoRota', () => {
  it('registra e lista pontos de localização', async () => {
    await addPontoRota({ id: 'p1', latitude: -5.09, longitude: -42.36, timestamp: '2026-01-01T08:00:00.000Z' });
    const pontos = await getPontosRota();
    expect(pontos).toEqual([{ id: 'p1', latitude: -5.09, longitude: -42.36, timestamp: '2026-01-01T08:00:00.000Z' }]);
  });
});
