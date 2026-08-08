import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const cfg = firebaseConfig as Record<string, any>;

export const db = configHasCustomDatabaseId(cfg)
  ? getFirestore(app, cfg.firestoreDatabaseId)
  : getFirestore(app);

function configHasCustomDatabaseId(cfg: Record<string, string>): boolean {
  return Boolean(cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)');
}

export { app };
