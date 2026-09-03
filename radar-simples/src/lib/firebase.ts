import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Mesmo projeto Firebase já usado pelo app principal (radar-ts) — só que com
 * coleções próprias (radar_simples_*, ver storage.ts) para não misturar dados
 * com o app anterior.
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * autoDetectLongPolling: em redes com proxy/firewall restritivo (comum em
 * rede corporativa), a conexão em streaming (WebChannel) do Firestore pode
 * falhar; essa opção detecta isso e cai para long-polling automaticamente.
 * O try/catch cobre o hot-reload do Vite, que pode reexecutar este módulo
 * sem recriar `app` — e initializeFirestore só pode rodar uma vez por app.
 */
export const db = (() => {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return getFirestore(app);
  }
})();
