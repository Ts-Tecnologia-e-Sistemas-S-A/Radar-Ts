import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Despesa, EventoTimeline, MunicipioCrm } from './types';

// Mock mínimo do Firestore em memória, só o suficiente pra exercitar a
// lógica de storage.ts (nomes de coleção, mapeamento de doc id, filtro por
// codigoIbge) sem depender de rede.
const bancos = new Map<string, Map<string, unknown>>();
let falharGravacao = false;

function validarFirestore(valor: unknown) {
  if (valor === undefined) throw new Error('Unsupported field value: undefined');
  if (valor !== null && typeof valor === 'object') Object.values(valor).forEach(validarFirestore);
}

function colecao(nome: string) {
  if (!bancos.has(nome)) bancos.set(nome, new Map());
  return bancos.get(nome)!;
}

mock.module('firebase/firestore', () => ({
  runTransaction: async (_db: unknown, callback: (t: any) => Promise<unknown>) => {
    const escritas: { ref: { __colecao: string; __id: string }; data: object }[] = [];
    const resultado = await callback({
      get: async (ref: { __colecao: string; __id: string }) => {
        const dado = colecao(ref.__colecao).get(ref.__id);
        return { exists: () => dado !== undefined, data: () => dado };
      },
      set: (ref: { __colecao: string; __id: string }, data: object) => { validarFirestore(data); escritas.push({ ref, data }); },
    });
    if (falharGravacao) throw new Error('permission-denied');
    for (const { ref, data } of escritas) colecao(ref.__colecao).set(ref.__id, structuredClone(data));
    return resultado;
  },
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
  setDoc: async (ref: { __colecao: string; __id: string }, data: Record<string, unknown>, options?: { mergeFields: string[] }) => {
    if (falharGravacao) throw new Error('permission-denied');
    validarFirestore(data);
    const anterior = options ? colecao(ref.__colecao).get(ref.__id) as object || {} : {};
    colecao(ref.__colecao).set(ref.__id, structuredClone({ ...anterior, ...data }));
  },
}));

mock.module('./lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'teste' } } }));

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
  getResultadosMunicipio,
  saveResultadosMunicipio,
  getRecomendacoesSemana,
  saveRecomendacoesSemana,
  getTarefas,
  saveTarefa,
  saveStandby,
  cancelarTarefaSeExistir,
  setStatusTarefa,
  migratePipelineB2G,
  importarHistorico,
} = await import('./storage');

describe('importação de histórico', () => {
  it('preserva a ficha atual e importa o texto integral uma única vez', async () => {
    const crm = makeMunicipio(2103000, { estagioFunil: 'juridico', contatos: [{ id: '1', nome: 'Contato atual', cargo: 'Gestor' }] });
    await saveMunicipioCrm(crm);
    const pacote = { versao: 1 as const, fonte: 'Fonte de teste', registros: [{ codigoIbge: 2103000, cidade: 'Caxias / MA', data: '', texto: 'Relato completo\nSegunda visita e contato.', visitaRegistrada: false }] };
    expect(await importarHistorico(pacote)).toEqual({ inseridos: 1, existentes: 0 });
    expect(await importarHistorico(pacote)).toEqual({ inseridos: 0, existentes: 1 });
    expect(await getMunicipioCrm(2103000)).toEqual({ ...crm, visitada: true });
    const eventos = await getEventos(2103000);
    expect(eventos).toHaveLength(1); expect(eventos[0].data).toBe(''); expect(eventos[0].resumo).toBe(pacote.registros[0].texto);
  });
  it('não grava nada quando a transação falha', async () => {
    falharGravacao = true;
    await expect(importarHistorico({ versao: 1, fonte: 'Teste', registros: [{ codigoIbge: 2103000, cidade: 'Caxias / MA', data: '', texto: 'Histórico', visitaRegistrada: false }] })).rejects.toThrow('permission-denied');
    expect(await getMunicipioCrm(2103000)).toBeNull(); expect(await getEventos()).toHaveLength(0);
  });
});

beforeEach(() => {
  bancos.clear();
  falharGravacao = false;
});

function makeMunicipio(codigoIbge: number, overrides: Partial<MunicipioCrm> = {}): MunicipioCrm {
  return { codigoIbge, prioritario: false, visitada: false, contatos: [], solucoes: [], estagioFunil: 'mapeamento', ...overrides };
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
  it('persiste contato sugerido sem telefone e permite limpar campo opcional', async () => {
    await saveMunicipioCrm(makeMunicipio(1, { alunosCount: 20 }));
    const contato = { id: 'ia', nome: 'Maria', cargo: 'Secretária', telefone: undefined };
    await saveMunicipioCrm(makeMunicipio(1, { contatos: [contato], alunosCount: undefined }));
    const salvo = await getMunicipioCrm(1);
    expect(salvo?.contatos).toEqual([{ id: 'ia', nome: 'Maria', cargo: 'Secretária' }]);
    expect(salvo?.visitada).toBeTrue();
    expect(salvo).not.toHaveProperty('alunosCount');
    expect(contato).toHaveProperty('telefone');
  });
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
  it('migra fichas antigas como cidades visitadas sem sobrescrever o funil', async () => {
    const legado = { codigoIbge: 1, prioritario: false, contatos: [], solucoes: [], estagioFunil: 'juridico' } as unknown as MunicipioCrm;
    await saveMunicipioCrm(legado);
    expect(await migratePipelineB2G()).toBe(1);
    expect(await getMunicipioCrm(1)).toMatchObject({ visitada: true, estagioFunil: 'juridico' });
    expect(await migratePipelineB2G()).toBe(0);
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
  it('marca a cidade como visitada ao salvar uma nota', async () => {
    await saveMunicipioCrm(makeMunicipio(10));
    await addEvento(makeEvento('nota', 10));
    expect((await getMunicipioCrm(10))?.visitada).toBeTrue();
    expect((await getMunicipioCrm(10))?.dataPrimeiraVisita).toBe('2026-01-01');
  });
  it('salva relatório e tabela original como documento e recupera por município', async () => {
    const evento: EventoTimeline = {
      ...makeEvento('planilha', 10), tipo: 'documento', textoPlanilha: 'Escola\tAlunos\nA\t120',
      relatorioPlanilha: { titulo: 'Relatório', resumo: 'Uma escola.', achados: ['120 alunos.'], limitacoes: [], proximosPassos: ['Conferir o ano.'] },
    };
    await addEvento(evento);
    expect(await getEventos(10)).toEqual([evento]);
    expect(await getEventos(20)).toEqual([]);
  });
  it('recupera síntese, próximo passo e transcrição completa', async () => {
    const evento = { ...makeEvento('ia', 10), sinteseIA: 'Demonstração combinada', proximoPassoIA: 'Agendar', transcricao: 'Texto completo. '.repeat(100), local: undefined };
    await addEvento(evento);
    const [salvo] = await getEventos(10);
    expect(salvo.transcricao).toBe(evento.transcricao);
    expect(salvo.sinteseIA).toBe(evento.sinteseIA);
    expect(salvo.proximoPassoIA).toBe(evento.proximoPassoIA);
    expect(salvo).not.toHaveProperty('local');
  });
  it('registra e filtra eventos por município', async () => {
    await addEvento(makeEvento('e1', 10));
    await addEvento(makeEvento('e2', 20));
    expect(await getEventos(10)).toEqual([makeEvento('e1', 10)]);
    expect(await getEventos()).toHaveLength(2);
  });
});

describe('tarefas da agenda', () => {
  it('salva standby e lembrete juntos', async () => {
    const crm = makeMunicipio(10, { estagioFunil: 'standby', estagioAntesStandby: 'qualificacao', dataReativacao: '2027-01-10', motivoEspera: 'loa_ppa' });
    const tarefa = { id: 'reativacao-standby-10', codigoIbge: 10, tipo: 'ligar' as const, descricao: 'Reativar contato', data: '2027-01-10', hora: '', status: 'pendente' as const, origem: 'manual' as const, criadaEm: '2026-09-25T12:00:00Z' };
    await saveStandby(crm, tarefa);
    expect((await getMunicipioCrm(10))?.estagioFunil).toBe('standby');
    expect(await getTarefas()).toContainEqual(tarefa);
    await cancelarTarefaSeExistir(tarefa.id);
    expect((await getTarefas())[0].status).toBe('cancelada');
    await cancelarTarefaSeExistir('inexistente');
  });
  const tarefa = { id: 't1', codigoIbge: 10, tipo: 'ligar' as const, descricao: 'Confirmar visita', data: '2026-09-18', hora: '10:00', status: 'pendente' as const, origem: 'ia' as const, criadaEm: '2026-09-17T12:00:00Z' };
  it('recupera tarefa, permite reagendar e concluir sem perder descrição', async () => {
    await saveTarefa(tarefa);
    expect(await getTarefas()).toEqual([tarefa]);
    await saveTarefa({ ...tarefa, data: '2026-09-19' });
    await setStatusTarefa(tarefa.id, 'concluida');
    expect(await getTarefas()).toEqual([{ ...tarefa, data: '2026-09-19', status: 'concluida' }]);
    await setStatusTarefa(tarefa.id, 'pendente');
    expect((await getTarefas())[0].status).toBe('pendente');
  });
  it('não salva tarefa sem data ou município e propaga erro do banco', async () => {
    await expect(saveTarefa({ ...tarefa, data: '' })).rejects.toThrow();
    await expect(saveTarefa({ ...tarefa, codigoIbge: 0 })).rejects.toThrow();
    expect(await getTarefas()).toEqual([]);
    falharGravacao = true;
    await expect(saveTarefa(tarefa)).rejects.toThrow('permission-denied');
  });
});

describe('resultados persistidos', () => {
  it('retorna vazio para município e período sem resultados', async () => {
    expect(await getResultadosMunicipio(10)).toEqual({});
    expect(await getRecomendacoesSemana('2026-09-01', '2026-09-07')).toEqual([]);
  });

  it('mantém briefing e diagnóstico após editar CRM e isola municípios', async () => {
    await saveMunicipioCrm(makeMunicipio(10));
    await saveResultadosMunicipio(10, { briefing: 'Agendar demonstração' });
    const diagnostico = { resumo: { ano: 2025, escolas: 4, alunos: 120 }, achados: [] };
    await saveResultadosMunicipio(10, { diagnostico });
    await saveMunicipioCrm(makeMunicipio(10, { prioritario: true }));
    expect(await getResultadosMunicipio(10)).toEqual({ briefing: 'Agendar demonstração', diagnostico });
    expect(await getResultadosMunicipio(20)).toEqual({});
    await saveResultadosMunicipio(10, { diagnostico: { resumo: null, achados: [] } });
    expect((await getResultadosMunicipio(10)).diagnostico?.resumo).toBeNull();
    expect((await getResultadosMunicipio(10)).briefing).toBe('Agendar demonstração');
  });

  it('recupera recomendações apenas para o período correspondente', async () => {
    const recomendacoes = [{ titulo: 'Retorno', texto: 'Agendar reunião' }];
    await saveRecomendacoesSemana('2026-09-01', '2026-09-07', recomendacoes);
    expect(await getRecomendacoesSemana('2026-09-01', '2026-09-07')).toEqual(recomendacoes);
    expect(await getRecomendacoesSemana('2026-09-02', '2026-09-08')).toEqual([]);
  });

  it('propaga falha de gravação sem substituir o resultado anterior', async () => {
    await saveResultadosMunicipio(10, { briefing: 'Salvo anteriormente' });
    falharGravacao = true;
    await expect(saveResultadosMunicipio(10, { briefing: 'Novo' })).rejects.toThrow('permission-denied');
    await expect(saveMunicipioCrm(makeMunicipio(10))).rejects.toThrow('permission-denied');
    await expect(addEvento(makeEvento('ia', 10))).rejects.toThrow('permission-denied');
    expect((await getResultadosMunicipio(10)).briefing).toBe('Salvo anteriormente');
  });
});

describe('getPontosRota / addPontoRota', () => {
  it('registra e lista pontos de localização', async () => {
    await addPontoRota({ id: 'p1', latitude: -5.09, longitude: -42.36, timestamp: '2026-01-01T08:00:00.000Z' });
    const pontos = await getPontosRota();
    expect(pontos).toEqual([{ id: 'p1', latitude: -5.09, longitude: -42.36, timestamp: '2026-01-01T08:00:00.000Z' }]);
  });
});
