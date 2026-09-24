/**
 * Chamada ao endpoint único de IA de campo (/api/ia/processar). Se
 * GEMINI_API_KEY não estiver configurada no servidor, a chamada falha com
 * uma mensagem clara — nunca inventamos uma resposta no lugar.
 */
import { prepararTextoPlanilha, validarRelatorioPlanilha, type RelatorioPlanilha } from '../utils/relatorioPlanilha';
import { dataLocal, validarSugestaoTarefa, type SugestaoTarefa } from '../utils/agenda';

export async function sugerirTarefa(contexto: string): Promise<SugestaoTarefa> {
  return validarSugestaoTarefa(await chamarIA('sugerir_tarefa', { contexto, hoje: dataLocal() }));
}

async function chamarIA<T>(modo: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/ia/processar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modo, ...payload }),
  });
  let json;
  try { json = await response.json(); }
  catch {
    throw new Error(`O servidor não retornou uma resposta válida (status ${response.status}). Tente novamente com um trecho menor se os dados forem extensos.`);
  }
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || `Falha ao processar com IA (status ${response.status})`);
  }
  return json.dados as T;
}

export interface ContatoDetectado {
  nome: string | null;
  cargo: string | null;
  telefone: string | null;
}

export interface SinteseNota {
  combinado: string;
  proximoPasso: string;
  contatoDetectado: ContatoDetectado | null;
}

export async function analisarPlanilha(texto: string): Promise<RelatorioPlanilha> {
  return validarRelatorioPlanilha(await chamarIA('analisar_planilha', { texto: prepararTextoPlanilha(texto) }));
}

export interface TranscricaoReuniao extends SinteseNota {
  transcricao: string;
  analise: string;
  acoes: import('../types').AcaoReuniao[];
}

export function transcreverAudio(audioBase64: string, mimeType: string): Promise<TranscricaoReuniao> {
  return chamarIA<TranscricaoReuniao>('transcrever_audio', { audioBase64, mimeType });
}

export function transcreverAudioArquivo(arquivoUrl: string, mimeType: string, nome: string): Promise<TranscricaoReuniao> {
  return chamarIA<TranscricaoReuniao>('transcrever_audio_arquivo', { arquivoUrl, mimeType, nome });
}

export interface Briefing {
  diretriz: string;
}

export function gerarBriefing(contextoHistorico: string): Promise<Briefing> {
  return chamarIA<Briefing>('briefing', { contextoHistorico });
}

export interface RecomendacaoSemana {
  titulo: string;
  texto: string;
}

export interface RecomendacoesSemana {
  recomendacoes: RecomendacaoSemana[];
}

export function gerarRecomendacoesSemana(contextoSemana: string): Promise<RecomendacoesSemana> {
  return chamarIA<RecomendacoesSemana>('recomendacoes_semana', { contextoSemana });
}
