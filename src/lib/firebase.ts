import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = configHasCustomDatabaseId(firebaseConfig)
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

function configHasCustomDatabaseId(cfg: Record<string, string>): boolean {
  return Boolean(cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)');
}

export { app };
