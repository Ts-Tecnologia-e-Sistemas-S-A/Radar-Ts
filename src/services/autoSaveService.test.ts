import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { CRMInteraction, Municipality } from '../types';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const saveInteractionToFirebase = mock(async (_i: CRMInteraction) => true);
const saveMunicipalityToFirebase = mock(async (_m: Municipality) => true);

mock.module('./firebaseService', () => ({
  saveInteractionToFirebase,
  saveMunicipalityToFirebase,
}));

const {
  getPendingQueue,
  enqueuePendingSync,
  dequeuePendingSync,
  isItemSynced,
  auditAndEnqueueUnsyncedItems,
  processAutoSaveQueue,
} = await import('./autoSaveService');

function makeInteraction(id: string): CRMInteraction {
  return {
    id,
    municipalityId: 'mun-1',
    municipalityName: 'Cidade Teste',
    state: 'PI',
    date: '2026-01-01',
    type: 'visita',
    contactName: 'Fulano de Tal',
    summary: 'Visita inicial',
    description: 'Descrição da visita',
    outcome: 'positivo',
  };
}

function makeMunicipality(id: string): Municipality {
  return {
    id,
    name: 'Cidade Teste',
    state: 'PI',
    region: 'Nordeste',
    population: 50000,
    status: 'oportunidade',
    funnelStage: 'prospectado',
    currentSystem: 'Sistema Concorrente',
    currentContractValue: 0,
    contractDaysRemaining: 0,
    renewalProbability: 'Média',
    tenderProbability: 0,
    estimatedNewContractValue: 0,
    probableModality: 'Pregão Eletrônico',
    ioScore: 0,
    ioFactors: {
      contractExpiringDays: 0,
      lowIdebScore: 0,
      techInvestmentHistory: 0,
      budgetAvailability: 0,
      managementChange: 0,
      federalFundsAvailable: 0,
      existingRelationship: 0,
    },
    educationalMetrics: {
      ideb: 0,
      idebTarget: 0,
      dropoutRate: 0,
      schoolsCount: 0,
      studentsCount: 0,
      teachersCount: 0,
      fundebBudget: 0,
      mainPains: [],
    },
    keyContacts: [],
    buyingHistory: [],
    lastActivityDate: '2026-01-01',
  };
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemoryStorage();
  (navigator as any).onLine = true;
  saveInteractionToFirebase.mockClear();
  saveMunicipalityToFirebase.mockClear();
  saveInteractionToFirebase.mockImplementation(async () => true);
  saveMunicipalityToFirebase.mockImplementation(async () => true);
});

describe('fila de sincronização (enqueue/dequeue/synced)', () => {
  it('começa vazia', () => {
    expect(getPendingQueue()).toEqual([]);
  });

  it('enfileira um item novo', () => {
    enqueuePendingSync('interaction', makeInteraction('int-1'));
    const queue = getPendingQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ id: 'int-1', type: 'interaction', attempts: 0 });
  });

  it('substitui o item existente em vez de duplicar', () => {
    enqueuePendingSync('interaction', makeInteraction('int-1'));
    enqueuePendingSync('interaction', { ...makeInteraction('int-1'), summary: 'Atualizado' });
    const queue = getPendingQueue();
    expect(queue).toHaveLength(1);
    expect((queue[0].data as CRMInteraction).summary).toBe('Atualizado');
  });

  it('remove da fila e marca como sincronizado ao dar dequeue', () => {
    enqueuePendingSync('municipality', makeMunicipality('mun-1'));
    dequeuePendingSync('mun-1');
    expect(getPendingQueue()).toEqual([]);
    expect(isItemSynced('mun-1')).toBe(true);
  });

  it('isItemSynced retorna false para item nunca sincronizado', () => {
    expect(isItemSynced('nunca-existiu')).toBe(false);
  });
});

describe('auditAndEnqueueUnsyncedItems', () => {
  it('enfileira todos os itens ainda não sincronizados', () => {
    const added = auditAndEnqueueUnsyncedItems([makeMunicipality('mun-1')], [makeInteraction('int-1')]);
    expect(added).toBe(2);
    expect(getPendingQueue()).toHaveLength(2);
  });

  it('não duplica itens que já estão na fila', () => {
    auditAndEnqueueUnsyncedItems([makeMunicipality('mun-1')], [makeInteraction('int-1')]);
    const addedAgain = auditAndEnqueueUnsyncedItems([makeMunicipality('mun-1')], [makeInteraction('int-1')]);
    expect(addedAgain).toBe(0);
    expect(getPendingQueue()).toHaveLength(2);
  });

  it('não reenfileira itens já confirmados como sincronizados', () => {
    enqueuePendingSync('municipality', makeMunicipality('mun-1'));
    dequeuePendingSync('mun-1');
    const added = auditAndEnqueueUnsyncedItems([makeMunicipality('mun-1')], []);
    expect(added).toBe(0);
    expect(getPendingQueue()).toEqual([]);
  });
});

describe('processAutoSaveQueue', () => {
  it('não tenta sincronizar quando o dispositivo está offline', async () => {
    (navigator as any).onLine = false;
    enqueuePendingSync('interaction', makeInteraction('int-1'));

    const result = await processAutoSaveQueue();

    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(1);
    expect(result.errors).toEqual(['Dispositivo desconectado da internet (Modo Offline activo)']);
    expect(saveInteractionToFirebase).not.toHaveBeenCalled();
  });

  it('não faz nada quando a fila está vazia', async () => {
    const result = await processAutoSaveQueue();
    expect(result).toEqual({ syncedCount: 0, remainingCount: 0, errors: [] });
  });

  it('sincroniza e remove da fila os itens salvos com sucesso', async () => {
    enqueuePendingSync('interaction', makeInteraction('int-1'));
    enqueuePendingSync('municipality', makeMunicipality('mun-1'));

    const result = await processAutoSaveQueue();

    expect(result).toEqual({ syncedCount: 2, remainingCount: 0, errors: [] });
    expect(getPendingQueue()).toEqual([]);
    expect(isItemSynced('int-1')).toBe(true);
    expect(isItemSynced('mun-1')).toBe(true);
    expect(saveInteractionToFirebase).toHaveBeenCalledTimes(1);
    expect(saveMunicipalityToFirebase).toHaveBeenCalledTimes(1);
  });

  it('mantém o item na fila e registra erro quando o Firebase recusa o salvamento', async () => {
    saveInteractionToFirebase.mockImplementation(async () => false);
    enqueuePendingSync('interaction', makeInteraction('int-1'));

    const result = await processAutoSaveQueue();

    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(1);
    expect(result.errors).toEqual(['Falha ao sincronizar interaction (int-1)']);
    expect(getPendingQueue()).toHaveLength(1);
  });

  it('mantém o item na fila e registra o erro quando o Firebase lança uma exceção', async () => {
    saveMunicipalityToFirebase.mockImplementation(async () => {
      throw new Error('Firestore indisponível');
    });
    enqueuePendingSync('municipality', makeMunicipality('mun-1'));

    const result = await processAutoSaveQueue();

    expect(result.syncedCount).toBe(0);
    expect(result.errors).toEqual(['Firestore indisponível']);
    expect(getPendingQueue()).toHaveLength(1);
  });
});
