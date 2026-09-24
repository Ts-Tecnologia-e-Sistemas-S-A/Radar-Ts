import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { Municipality } from '../src/types';
import { normalizeMunicipalityRecency } from '../src/utils/dataRecency';

const applyChanges = process.argv.includes('--apply');
const debugChanges = process.argv.includes('--debug');
const BATCH_LIMIT = 400;

function canonicalJson(value: unknown): string {
  const sortKeys = (item: any): any => {
    if (Array.isArray(item)) return item.map(sortKeys);
    if (!item || typeof item !== 'object') return item;
    return Object.keys(item)
      .sort()
      .reduce((sorted, key) => {
        if (item[key] !== undefined) sorted[key] = sortKeys(item[key]);
        return sorted;
      }, {} as Record<string, unknown>);
  };
  return JSON.stringify(sortKeys(value));
}

async function migrateDataRecency(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'municipalities'));
  let changed = 0;
  let committed = 0;
  let batch = writeBatch(db);
  let batchSize = 0;

  for (const document of snapshot.docs) {
    const original = document.data() as Municipality;
    const normalized = normalizeMunicipalityRecency(original);
    const update = JSON.parse(JSON.stringify({
      buyingHistory: normalized.buyingHistory,
      buyingHistoryArchive: normalized.buyingHistoryArchive,
      educationalMetrics: normalized.educationalMetrics,
      educationalMetricsArchive: normalized.educationalMetricsArchive,
      dataVerificationStatus: normalized.dataVerificationStatus,
    }));
    const originalRelevant = {
      buyingHistory: original.buyingHistory || [],
      buyingHistoryArchive: original.buyingHistoryArchive || [],
      educationalMetrics: original.educationalMetrics,
      educationalMetricsArchive: original.educationalMetricsArchive || [],
      dataVerificationStatus: original.dataVerificationStatus,
    };

    if (canonicalJson(originalRelevant) === canonicalJson(update)) continue;

    changed += 1;
    if (debugChanges && changed === 1) {
      console.dir({ original: originalRelevant, normalized: update }, { depth: null });
    }
    console.log(
      `[${applyChanges ? 'APLICAR' : 'SIMULAR'}] ${original.name}-${original.state}: ` +
      `${normalized.educationalMetrics.referenceYear || 'Censo pendente'}, ` +
      `${normalized.buyingHistory[0]?.year || 'contrato pendente'}`
    );

    if (!applyChanges) continue;

    batch.set(document.ref, update, { merge: true });
    batchSize += 1;
    if (batchSize >= BATCH_LIMIT) {
      await batch.commit();
      committed += batchSize;
      batch = writeBatch(db);
      batchSize = 0;
    }
  }

  if (applyChanges && batchSize > 0) {
    await batch.commit();
    committed += batchSize;
  }

  console.log(
    applyChanges
      ? `Migração concluída: ${committed} município(s) atualizado(s).`
      : `Simulação concluída: ${changed} município(s) precisam de atualização. Execute com --apply para gravar.`
  );
}

migrateDataRecency().catch((error) => {
  console.error('Falha na migração de recência:', error);
  process.exitCode = 1;
});