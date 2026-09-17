import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Despesa, EventoTimeline, MunicipioCrm } from './types';
import type { Diagnostico } from './api/diagnostico';
import { validarSugestaoTarefa, type Tarefa } from './utils/agenda';

const MUNICIPIOS_COLLECTION = 'radar_simples_municipios';
const DESPESAS_COLLECTION = 'radar_simples_despesas';
const EVENTOS_COLLECTION = 'radar_simples_eventos';
const ROTA_PONTOS_COLLECTION = 'radar_simples_rota_pontos';
const RESULTADOS_COLLECTION = 'radar_simples_resultados';
const TAREFAS_COLLECTION = 'radar_simples_tarefas';

export async function getTarefas(): Promise<Tarefa[]> {
  const snapshot = await getDocs(collection(db, TAREFAS_COLLECTION));
  return snapshot.docs.map((d) => d.data() as Tarefa).sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
}

export async function saveTarefa(tarefa: Tarefa): Promise<void> {
  validarSugestaoTarefa({ ...tarefa, hora: tarefa.hora || null });
  if (!tarefa.data || !tarefa.id || !Number.isInteger(tarefa.codigoIbge) || tarefa.codigoIbge <= 0) throw new Error('Informe município, descrição e data da tarefa.');
  await setDoc(doc(db, TAREFAS_COLLECTION, tarefa.id), semUndefined(tarefa));
}

export async function setStatusTarefa(id: string, status: Tarefa['status']): Promise<void> {
  await setDoc(doc(db, TAREFAS_COLLECTION, id), { status }, { mergeFields: ['status'] });
}

// Os modelos usam campos opcionais. Firestore rejeita undefined, inclusive
// dentro dos contatos em arrays. Omitir esses campos mantém a substituição
// completa dos documentos e permite limpar valores opcionais já salvos.
function semUndefined(valor: unknown): any {
  if (Array.isArray(valor)) return valor.map(semUndefined);
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, semUndefined(v)]));
  }
  return valor;
}

export interface ResultadosMunicipio {
  briefing?: string;
  diagnostico?: Diagnostico;
}

export async function getResultadosMunicipio(codigoIbge: number): Promise<ResultadosMunicipio> {
  const snapshot = await getDoc(doc(db, RESULTADOS_COLLECTION, String(codigoIbge)));
  return snapshot.exists() ? snapshot.data() as ResultadosMunicipio : {};
}

export async function saveResultadosMunicipio(codigoIbge: number, resultado: ResultadosMunicipio): Promise<void> {
  const dados = semUndefined(resultado);
  // Substitui só os resultados fornecidos, sem sobrescrever outro resultado
  // gerado em paralelo nem os dados editáveis do CRM.
  await setDoc(doc(db, RESULTADOS_COLLECTION, String(codigoIbge)), dados, { mergeFields: Object.keys(dados) });
}

export type Recomendacao = { titulo: string; texto: string };

export async function getRecomendacoesSemana(inicio: string, fim: string): Promise<Recomendacao[]> {
  const snapshot = await getDoc(doc(db, RESULTADOS_COLLECTION, `semana-${inicio}-${fim}`));
  return snapshot.exists() ? snapshot.data().recomendacoes : [];
}

export async function saveRecomendacoesSemana(inicio: string, fim: string, recomendacoes: Recomendacao[]): Promise<void> {
  await setDoc(doc(db, RESULTADOS_COLLECTION, `semana-${inicio}-${fim}`), { inicio, fim, recomendacoes });
}

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
  await setDoc(doc(db, MUNICIPIOS_COLLECTION, String(municipio.codigoIbge)), semUndefined(municipio));
}

export async function getDespesas(codigoIbge?: number): Promise<Despesa[]> {
  const snapshot = await getDocs(collection(db, DESPESAS_COLLECTION));
  const all = snapshot.docs.map((docSnap) => docSnap.data() as Despesa);
  return codigoIbge === undefined ? all : all.filter((d) => d.codigoIbge === codigoIbge);
}

export async function addDespesa(despesa: Despesa): Promise<void> {
  await setDoc(doc(db, DESPESAS_COLLECTION, despesa.id), semUndefined(despesa));
}

export async function getEventos(codigoIbge?: number): Promise<EventoTimeline[]> {
  const snapshot = await getDocs(collection(db, EVENTOS_COLLECTION));
  const all = snapshot.docs.map((docSnap) => docSnap.data() as EventoTimeline);
  return codigoIbge === undefined ? all : all.filter((e) => e.codigoIbge === codigoIbge);
}

export async function addEvento(evento: EventoTimeline): Promise<void> {
  await setDoc(doc(db, EVENTOS_COLLECTION, evento.id), semUndefined(evento));
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
