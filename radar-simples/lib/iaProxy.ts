import {
  analisarPlanilha,
  sugerirTarefa,
  extrairDespesa,
  gerarBriefing,
  gerarRecomendacoesSemana,
  sintetizarNota,
  transcreverAudio,
} from './iaCampo.js';
import { prepararTextoPlanilha } from '../src/utils/relatorioPlanilha.js';
import { dataValida } from '../src/utils/agenda.js';

export interface ResultadoIA {
  status: number;
  body: { sucesso: true; dados: unknown } | { sucesso: false; erro: string };
}

/**
 * Dispatcher único da IA de campo — usado tanto pelo servidor Express (dev
 * local) quanto pela função serverless do Vercel, igual ao padrão do
 * pncpProxy.ts. Um endpoint só, ramificado por `modo`.
 */
export async function processarRequisicaoIA(modo: string, payload: any): Promise<ResultadoIA> {
  try {
    switch (modo) {
      case 'sugerir_tarefa': {
        if (typeof payload?.contexto !== 'string' || !payload.contexto.trim() || payload.contexto.length > 60000 ||
            typeof payload.hoje !== 'string' || !dataValida(payload.hoje)) return erro400('Informe contexto de até 60.000 caracteres e a data de hoje.');
        return ok(await sugerirTarefa(payload.contexto, payload.hoje));
      }
      case 'analisar_planilha': {
        let texto: string;
        try { texto = prepararTextoPlanilha(payload?.texto); }
        catch (e: any) { return erro400(e.message); }
        return ok(await analisarPlanilha(texto));
      }
      case 'sintetizar_nota': {
        if (!payload?.texto) return erro400('Campo "texto" é obrigatório.');
        return ok(await sintetizarNota(payload.texto));
      }
      case 'transcrever_audio': {
        if (!payload?.audioBase64 || !payload?.mimeType) return erro400('Campos "audioBase64" e "mimeType" são obrigatórios.');
        return ok(await transcreverAudio(payload.audioBase64, payload.mimeType));
      }
      case 'ocr_despesa': {
        if (!payload?.imagemBase64 || !payload?.mimeType) return erro400('Campos "imagemBase64" e "mimeType" são obrigatórios.');
        return ok(await extrairDespesa(payload.imagemBase64, payload.mimeType));
      }
      case 'briefing': {
        if (!payload?.contextoHistorico) return erro400('Campo "contextoHistorico" é obrigatório.');
        return ok(await gerarBriefing(payload.contextoHistorico));
      }
      case 'recomendacoes_semana': {
        if (!payload?.contextoSemana) return erro400('Campo "contextoSemana" é obrigatório.');
        return ok(await gerarRecomendacoesSemana(payload.contextoSemana));
      }
      default:
        return erro400(`Modo desconhecido: "${modo}".`);
    }
  } catch (err: any) {
    return { status: 502, body: { sucesso: false, erro: err.message || 'Falha ao processar com IA' } };
  }
}

function ok(dados: unknown): ResultadoIA {
  return { status: 200, body: { sucesso: true, dados } };
}

function erro400(erro: string): ResultadoIA {
  return { status: 400, body: { sucesso: false, erro } };
}
