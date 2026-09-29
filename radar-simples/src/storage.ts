import { collection, doc, getDoc, getDocs, runTransaction, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { Despesa, EventoTimeline, MunicipioCrm, municipioCrmVazio } from './types';
import { idHistoricoImportado, validarPacoteHistorico, type PacoteHistorico } from './utils/importarHistorico';
import type { Diagnostico } from './api/diagnostico';
import { dataLocal, validarSugestaoTarefa, type Tarefa } from './utils/agenda';
import { garantirDataInclusao, marcarComoVisitada } from './utils/pipeline';

const MUNICIPIOS_COLLECTION = 'radar_simples_municipios';
const DESPESAS_COLLECTION = 'radar_simples_despesas';
const EVENTOS_COLLECTION = 'radar_simples_eventos';
const ROTA_PONTOS_COLLECTION = 'radar_simples_rota_pontos';
const RESULTADOS_COLLECTION = 'radar_simples_resultados';
const TAREFAS_COLLECTION = 'radar_simples_tarefas';

/** Transações online, IDs estáveis e criação apenas: não substitui CRM ou histórico existente. */
export async function importarHistorico(pacote: PacoteHistorico) {
  if (!auth.currentUser) throw new Error('Entre com uma conta autorizada para importar o histórico.');
  const validado = validarPacoteHistorico(JSON.stringify(pacote));
  let inseridos = 0;
  let existentes = 0;
  for (const registro of validado.registros) {
    const id = await idHistoricoImportado(validado.fonte, registro);
    const criado = await runTransaction(db, async (transaction) => {
      const eventoRef = doc(db, EVENTOS_COLLECTION, id);
      const crmRef = doc(db, MUNICIPIOS_COLLECTION, String(registro.codigoIbge));
      const [evento, crm] = await Promise.all([transaction.get(eventoRef), transaction.get(crmRef)]);
      if (evento.exists()) return false;
      const crmAtual = crm.exists() ? crm.data() as MunicipioCrm : municipioCrmVazio(registro.codigoIbge);
      transaction.set(crmRef, semUndefined(marcarComoVisitada(crmAtual, registro.data)));
      transaction.set(eventoRef, {
        id, codigoIbge: registro.codigoIbge, tipo: 'documento', data: registro.data,
        resumo: registro.texto, criadaEm: new Date().toISOString(),
        anexos: [], mandato: 'Histórico anterior ao Radar', mandatoAtivo: true,
        historicoImportado: { fonte: validado.fonte, visitaRegistrada: registro.visitaRegistrada },
      } satisfies EventoTimeline);
      return true;
    });
    if (criado) inseridos++; else existentes++;
  }
  return { inseridos, existentes };
}

export async function getTarefas(): Promise<Tarefa[]> {
  const snapshot = await getDocs(collection(db, TAREFAS_COLLECTION));
  return snapshot.docs.map((d) => d.data() as Tarefa).sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
}

export async function saveTarefa(tarefa: Tarefa): Promise<void> {
  validarSugestaoTarefa({ ...tarefa, hora: tarefa.hora || null });
  if (!tarefa.data || !tarefa.id || !Number.isInteger(tarefa.codigoIbge) || tarefa.codigoIbge <= 0) throw new Error('Informe município, descrição e data da tarefa.');
  await setDoc(doc(db, TAREFAS_COLLECTION, tarefa.id), semUndefined(tarefa));
}

export async function saveStandby(municipio: MunicipioCrm, tarefa: Tarefa): Promise<void> {
  validarSugestaoTarefa({ ...tarefa, hora: tarefa.hora || null });
  if (municipio.estagioFunil !== 'standby' || !municipio.dataReativacao || !municipio.motivoEspera) {
    throw new Error('Data de reativação e motivo são obrigatórios para colocar a oportunidade em espera.');
  }
  const atualizado = municipio.contatos.length > 0 ? marcarComoVisitada(municipio) : municipio;
  await runTransaction(db, async (transaction) => {
    transaction.set(doc(db, MUNICIPIOS_COLLECTION, String(municipio.codigoIbge)), semUndefined(atualizado));
    transaction.set(doc(db, TAREFAS_COLLECTION, tarefa.id), semUndefined(tarefa));
  });
}

export async function setStatusTarefa(id: string, status: Tarefa['status']): Promise<void> {
  await setDoc(doc(db, TAREFAS_COLLECTION, id), { status }, { mergeFields: ['status'] });
}

export async function cancelarTarefaSeExistir(id: string): Promise<void> {
  const referencia = doc(db, TAREFAS_COLLECTION, id);
  const snapshot = await getDoc(referencia);
  if (snapshot.exists()) await setDoc(referencia, { status: 'cancelada' }, { mergeFields: ['status'] });
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
  const referencia = doc(db, MUNICIPIOS_COLLECTION, String(municipio.codigoIbge));
  const existente = await getDoc(referencia);
  const base = existente.exists() ? municipio : garantirDataInclusao(municipio);
  const atualizado = base.contatos.length > 0 ? marcarComoVisitada(base) : base;
  await setDoc(referencia, semUndefined(atualizado));
}

function dataBrasil(timestamp: string): string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((item) => item.type === tipo)?.value || '';
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}

async function getDatasCriacaoFirestore(): Promise<Map<number, string>> {
  const datas = new Map<number, string>();
  if (!auth.currentUser?.getIdToken) return datas;
  try {
    const token = await auth.currentUser.getIdToken();
    let pageToken = '';
    do {
      const url = new URL(
        `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${MUNICIPIOS_COLLECTION}`
      );
      url.searchParams.set('pageSize', '300');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Firestore REST respondeu ${response.status}`);
      const pagina = await response.json() as { documents?: { name: string; createTime?: string }[]; nextPageToken?: string };
      for (const documento of pagina.documents || []) {
        const codigoIbge = Number(documento.name.split('/').at(-1));
        if (Number.isInteger(codigoIbge) && documento.createTime) datas.set(codigoIbge, dataBrasil(documento.createTime));
      }
      pageToken = pagina.nextPageToken || '';
    } while (pageToken);
  } catch (error) {
    console.warn('Não foi possível consultar a data oficial de inclusão no Firestore.', error);
  }
  return datas;
}

export async function migratePipelineB2G(): Promise<number> {
  const [municipios, eventos, datasCriacao] = await Promise.all([
    getDocs(collection(db, MUNICIPIOS_COLLECTION)),
    getDocs(collection(db, EVENTOS_COLLECTION)),
    getDatasCriacaoFirestore(),
  ]);
  const datasPorMunicipio = new Map<number, string[]>();
  eventos.docs.forEach((snapshot) => {
    const evento = snapshot.data() as EventoTimeline;
    if (evento.data) datasPorMunicipio.set(evento.codigoIbge, [...(datasPorMunicipio.get(evento.codigoIbge) || []), evento.data]);
  });
  let atualizados = 0;
  await Promise.all(municipios.docs.map(async (snapshot) => {
    const crm = snapshot.data() as MunicipioCrm;
    const datas = (datasPorMunicipio.get(crm.codigoIbge) || []).sort();
    const dataCriacao = datasCriacao.get(crm.codigoIbge);
    const dataInclusao = dataCriacao || crm.dataInclusao || crm.dataPrimeiraVisita || datas[0] || dataLocal();
    const corrigirPelaCriacao = Boolean(dataCriacao && crm.dataInclusao !== dataCriacao);
    const update = semUndefined(corrigirPelaCriacao
      ? {
          visitada: true,
          dataInclusao,
          dataPrimeiraVisita: dataInclusao,
          ...(!crm.dataUltimaVisita ? { dataUltimaVisita: dataInclusao } : {}),
        }
      : {
          ...(!crm.dataInclusao ? { dataInclusao } : {}),
          ...(!crm.dataPrimeiraVisita ? { dataPrimeiraVisita: dataInclusao } : {}),
          ...(!crm.dataUltimaVisita ? { dataUltimaVisita: datas.at(-1) || crm.dataPrimeiraVisita || dataInclusao } : {}),
          ...(typeof crm.visitada !== 'boolean' || !crm.dataInclusao ? { visitada: true } : {}),
        });
    if (!Object.keys(update).length) return;
    await setDoc(doc(db, MUNICIPIOS_COLLECTION, String(crm.codigoIbge)), update, { mergeFields: Object.keys(update) });
    atualizados++;
  }));
  return atualizados;
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
  const crm = await getMunicipioCrm(evento.codigoIbge);
  if (crm) await saveMunicipioCrm(marcarComoVisitada(crm, evento.data));
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
