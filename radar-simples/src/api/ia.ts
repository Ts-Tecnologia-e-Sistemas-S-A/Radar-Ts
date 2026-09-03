/**
 * Chamada ao endpoint único de IA de campo (/api/ia/processar). Se
 * GEMINI_API_KEY não estiver configurada no servidor, a chamada falha com
 * uma mensagem clara — nunca inventamos uma resposta no lugar.
 */
async function chamarIA<T>(modo: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/ia/processar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modo, ...payload }),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || `Falha ao processar com IA (status ${response.status})`);
  }
  return json.dados as T;
}

export interface SinteseNota {
  combinado: string;
  proximoPasso: string;
}

export function sintetizarNota(texto: string): Promise<SinteseNota> {
  return chamarIA<SinteseNota>('sintetizar_nota', { texto });
}

export interface TranscricaoReuniao extends SinteseNota {
  transcricao: string;
}

export function transcreverAudio(audioBase64: string, mimeType: string): Promise<TranscricaoReuniao> {
  return chamarIA<TranscricaoReuniao>('transcrever_audio', { audioBase64, mimeType });
}

export interface DespesaExtraida {
  valor: number | null;
  data: string | null;
  categoria: 'combustivel' | 'hospedagem' | 'alimentacao' | 'pedagio' | 'outros' | null;
  estabelecimento: string | null;
  descricaoSugerida: string;
}

export function extrairDespesa(imagemBase64: string, mimeType: string): Promise<DespesaExtraida> {
  return chamarIA<DespesaExtraida>('ocr_despesa', { imagemBase64, mimeType });
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
