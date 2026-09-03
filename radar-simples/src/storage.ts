import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Interacao, MunicipioCrm } from './types';

// Coleções próprias deste app, separadas das usadas pelo radar-ts (main app)
// no mesmo projeto Firebase.
const MUNICIPIOS_COLLECTION = 'radar_simples_municipios';
const INTERACOES_COLLECTION = 'radar_simples_interacoes';

export async function getMunicipiosCrm(): Promise<Record<number, MunicipioCrm>> {
  const snapshot = await getDocs(collection(db, MUNICIPIOS_COLLECTION));
  const result: Record<number, MunicipioCrm> = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as MunicipioCrm;
    result[data.codigoIbge] = data;
  });
  return result;
}

export async function getMunicipioCrm(codigoIbge: number): Promise<MunicipioCrm | null> {
  const docSnap = await getDoc(doc(db, MUNICIPIOS_COLLECTION, String(codigoIbge)));
  return docSnap.exists() ? (docSnap.data() as MunicipioCrm) : null;
}

export async function saveMunicipioCrm(municipio: MunicipioCrm): Promise<void> {
  await setDoc(doc(db, MUNICIPIOS_COLLECTION, String(municipio.codigoIbge)), municipio);
}

export async function getInteracoes(codigoIbge?: number): Promise<Interacao[]> {
  const snapshot = await getDocs(collection(db, INTERACOES_COLLECTION));
  const all = snapshot.docs.map((docSnap) => docSnap.data() as Interacao);
  return codigoIbge === undefined ? all : all.filter((i) => i.codigoIbge === codigoIbge);
}

export async function addInteracao(interacao: Interacao): Promise<void> {
  await setDoc(doc(db, INTERACOES_COLLECTION, interacao.id), interacao);
}
