import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Interacao, MunicipioCrm } from './types';

// Mock mínimo do Firestore em memória, só o suficiente pra exercitar a lógica
// de storage.ts (nomes de coleção, mapeamento de doc id, filtro por
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

const { getMunicipiosCrm, getMunicipioCrm, saveMunicipioCrm, getInteracoes, addInteracao } = await import(
  './storage'
);

beforeEach(() => {
  bancos.clear();
});

function makeMunicipio(codigoIbge: number, overrides: Partial<MunicipioCrm> = {}): MunicipioCrm {
  return { codigoIbge, sistemaAtual: 'nenhum', estagioFunil: 'prospeccao', ...overrides };
}

function makeInteracao(id: string, codigoIbge: number): Interacao {
  return { id, codigoIbge, data: '2026-01-01', tipo: 'ligacao', resumo: 'teste' };
}

describe('getMunicipioCrm / saveMunicipioCrm', () => {
  it('retorna null para município ainda não salvo', async () => {
    expect(await getMunicipioCrm(1)).toBeNull();
  });

  it('salva e recupera pelo código IBGE', async () => {
    await saveMunicipioCrm(makeMunicipio(2211001, { alunosRede: 25000 }));
    const resultado = await getMunicipioCrm(2211001);
    expect(resultado).toEqual(makeMunicipio(2211001, { alunosRede: 25000 }));
  });

  it('sobrescreve ao salvar de novo o mesmo código', async () => {
    await saveMunicipioCrm(makeMunicipio(1, { sistemaAtual: 'nenhum' }));
    await saveMunicipioCrm(makeMunicipio(1, { sistemaAtual: 'concorrente' }));
    expect((await getMunicipioCrm(1))?.sistemaAtual).toBe('concorrente');
  });
});

describe('getMunicipiosCrm', () => {
  it('retorna todos os municípios salvos, indexados por codigoIbge', async () => {
    await saveMunicipioCrm(makeMunicipio(1));
    await saveMunicipioCrm(makeMunicipio(2));
    const todos = await getMunicipiosCrm();
    expect(Object.keys(todos).sort()).toEqual(['1', '2']);
    expect(todos[1].codigoIbge).toBe(1);
    expect(todos[2].codigoIbge).toBe(2);
  });

  it('retorna objeto vazio quando nada foi salvo', async () => {
    expect(await getMunicipiosCrm()).toEqual({});
  });
});

describe('getInteracoes / addInteracao', () => {
  it('registra e lista interações de um município', async () => {
    await addInteracao(makeInteracao('int-1', 10));
    const lista = await getInteracoes(10);
    expect(lista).toEqual([makeInteracao('int-1', 10)]);
  });

  it('filtra só as interações do município pedido', async () => {
    await addInteracao(makeInteracao('int-1', 10));
    await addInteracao(makeInteracao('int-2', 20));
    expect(await getInteracoes(10)).toEqual([makeInteracao('int-1', 10)]);
    expect(await getInteracoes(20)).toEqual([makeInteracao('int-2', 20)]);
  });

  it('sem código, retorna interações de todos os municípios', async () => {
    await addInteracao(makeInteracao('int-1', 10));
    await addInteracao(makeInteracao('int-2', 20));
    const todas = await getInteracoes();
    expect(todas).toHaveLength(2);
  });
});
