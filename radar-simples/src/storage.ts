import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Despesa, EventoTimeline, MunicipioCrm } from './types';

const MUNICIPIOS_COLLECTION = 'radar_simples_municipios';
const DESPESAS_COLLECTION = 'radar_simples_despesas';
const EVENTOS_COLLECTION = 'radar_simples_eventos';
const ROTA_PONTOS_COLLECTION = 'radar_simples_rota_pontos';

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

export async function getDespesas(codigoIbge?: number): Promise<Despesa[]> {
  const snapshot = await getDocs(collection(db, DESPESAS_COLLECTION));
  const all = snapshot.docs.map((docSnap) => docSnap.data() as Despesa);
  return codigoIbge === undefined ? all : all.filter((d) => d.codigoIbge === codigoIbge);
}

export async function addDespesa(despesa: Despesa): Promise<void> {
  await setDoc(doc(db, DESPESAS_COLLECTION, despesa.id), despesa);
}

export async function getEventos(codigoIbge?: number): Promise<EventoTimeline[]> {
  const snapshot = await getDocs(collection(db, EVENTOS_COLLECTION));
  const all = snapshot.docs.map((docSnap) => docSnap.data() as EventoTimeline);
  return codigoIbge === undefined ? all : all.filter((e) => e.codigoIbge === codigoIbge);
}

export async function addEvento(evento: EventoTimeline): Promise<void> {
  await setDoc(doc(db, EVENTOS_COLLECTION, evento.id), evento);
}

export interface PontoRota {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO datetime
}

export async function getPontosRota(): Promise<PontoRota[]> {
  const snapshot = await getDocs(collection(db, ROTA_PONTOS_COLLECTION));
  return snapshot.docs.map((docSnap) => docSnap.data() as PontoRota);
}

export async function addPontoRota(ponto: PontoRota): Promise<void> {
  await setDoc(doc(db, ROTA_PONTOS_COLLECTION, ponto.id), ponto);
}
