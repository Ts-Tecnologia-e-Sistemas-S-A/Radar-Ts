import { saveInteractionToFirebase, saveMunicipalityToFirebase } from './firebaseService';
import { CRMInteraction, Municipality } from '../types';

export interface PendingSyncItem {
  id: string;
  type: 'interaction' | 'municipality';
  data: CRMInteraction | Municipality;
  createdAt: string;
  attempts: number;
  lastAttemptError?: string;
}

const PENDING_QUEUE_KEY = 'sicap_pending_sync_queue_v1';
const SYNCED_IDS_KEY = 'sicap_synced_ids_v1';

/**
 * Get all items pending sync in local storage
 */
export function getPendingQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading pending sync queue:', err);
    return [];
  }
}

/**
 * Save pending queue to local storage
 */
function savePendingQueue(queue: PendingSyncItem[]): void {
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving pending sync queue:', err);
  }
}

/**
 * Enqueue an item for auto-save sync
 */
export function enqueuePendingSync(type: 'interaction' | 'municipality', data: CRMInteraction | Municipality): void {
  const queue = getPendingQueue();
  const existingIndex = queue.findIndex((item) => item.id === data.id);

  const newItem: PendingSyncItem = {
    id: data.id,
    type,
    data,
    createdAt: new Date().toISOString(),
    attempts: 0
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = newItem;
  } else {
    queue.push(newItem);
  }

  savePendingQueue(queue);
}

/**
 * Remove an item from the pending queue after successful sync
 */
export function dequeuePendingSync(id: string): void {
  const queue = getPendingQueue();
  const filtered = queue.filter((item) => item.id !== id);
  savePendingQueue(filtered);
  
  // Track as synced ID
  try {
    const syncedRaw = localStorage.getItem(SYNCED_IDS_KEY);
    const syncedSet = new Set<string>(syncedRaw ? JSON.parse(syncedRaw) : []);
    syncedSet.add(id);
    localStorage.setItem(SYNCED_IDS_KEY, JSON.stringify(Array.from(syncedSet)));
  } catch (e) {
    // Ignore
  }
}

/**
 * Check if an item ID is already confirmed synced
 */
export function isItemSynced(id: string): boolean {
  try {
    const syncedRaw = localStorage.getItem(SYNCED_IDS_KEY);
    if (!syncedRaw) return false;
    const syncedSet = new Set<string>(JSON.parse(syncedRaw));
    return syncedSet.has(id);
  } catch (e) {
    return false;
  }
}

/**
 * Scan all local state items and ensure any unsynced items are queued for auto-save
 */
export function auditAndEnqueueUnsyncedItems(
  municipalities: Municipality[],
  crmInteractions: CRMInteraction[]
): number {
  const queue = getPendingQueue();
  const queueIds = new Set(queue.map((q) => q.id));
  let newAdded = 0;

  // Audit interactions
  crmInteractions.forEach((item) => {
    if (!queueIds.has(item.id) && !isItemSynced(item.id)) {
      enqueuePendingSync('interaction', item);
      newAdded++;
    }
  });

  // Audit municipalities
  municipalities.forEach((m) => {
    if (!queueIds.has(m.id) && !isItemSynced(m.id)) {
      enqueuePendingSync('municipality', m);
      newAdded++;
    }
  });

  return newAdded;
}

/**
 * Process pending queue auto-save to Cloud Firestore
 */
export async function processAutoSaveQueue(): Promise<{
  syncedCount: number;
  remainingCount: number;
  errors: string[];
}> {
  if (!navigator.onLine) {
    const currentQueue = getPendingQueue();
    return {
      syncedCount: 0,
      remainingCount: currentQueue.length,
      errors: ['Dispositivo desconectado da internet (Modo Offline activo)']
    };
  }

  const queue = getPendingQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      let success = false;
      if (item.type === 'interaction') {
        success = await saveInteractionToFirebase(item.data as CRMInteraction);
      } else if (item.type === 'municipality') {
        success = await saveMunicipalityToFirebase(item.data as Municipality);
      }

      if (success) {
        dequeuePendingSync(item.id);
        syncedCount++;
      } else {
        // Increment attempt
        item.attempts += 1;
        errors.push(`Falha ao sincronizar ${item.type} (${item.id})`);
      }
    } catch (err: any) {
      errors.push(err.message || 'Erro desconhecido de conexao');
    }
  }

  const remainingQueue = getPendingQueue();
  return {
    syncedCount,
    remainingCount: remainingQueue.length,
    errors
  };
}
