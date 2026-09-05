import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Mesmo projeto Firebase já usado pelo app principal (radar-ts) — só que com
 * coleções próprias (radar_simples_*, ver storage.ts) para não misturar dados
 * com o app anterior. Mesmo padrão de inicialização do app principal
 * (src/lib/firebase.ts): getFirestore(app) puro, sem detecção experimental
 * de transporte — essa detecção chegou a travar em silêncio (sem erro) em
 * rede móvel real.
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const cfg = firebaseConfig as Record<string, string>;

/**
 * O projeto sicap-radar não tem banco "(default)" — os dados vivem num banco
 * Firestore nomeado (criado pelo Google AI Studio). Sem passar esse ID, toda
 * leitura/escrita falha com "Database '(default)' not found" (silencioso:
 * a promise nem resolve nem rejeita, então parece só travado).
 */
export const db =
  cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, cfg.firestoreDatabaseId)
    : getFirestore(app);
