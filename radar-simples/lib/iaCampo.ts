import { GoogleGenAI } from '@google/genai';

/**
 * Integração real com Gemini pra IA de campo: sintetizar notas, transcrever
 * áudio de reunião, extrair dados de cupom fiscal (OCR), gerar briefing e
 * recomendações. Exige GEMINI_API_KEY configurada (mesma variável que o app
 * principal usa) — sem a chave, cada função abaixo lança um erro explícito
 * em vez de inventar uma resposta.
 */

let cliente: GoogleGenAI | null = null;

function getCliente(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada — recursos de IA de campo estão desligados.');
  }
  if (!cliente) {
    cliente = new GoogleGenAI({ apiKey });
  }
  return cliente;
}

async function gerarJson<T>(parts: unknown[], instrucao: string): Promise<T> {
  const ai = getCliente();
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [{ role: 'user', parts: [{ text: instrucao }, ...parts] as any }],
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  });
  const texto = response.text;
  if (!texto) throw new Error('Gemini não retornou conteúdo.');
  return JSON.parse(texto) as T;
}

export interface SinteseNota {
  combinado: string;
  proximoPasso: string;
}

const INSTRUCAO_SINTESE = `Você é o assistente de campo de um vendedor B2G (vendas para prefeituras) no Brasil.
Recebe uma anotação rápida de reunião (texto ditado ou digitado em campo) e devolve APENAS um JSON válido:
{"combinado": "frase objetiva do que ficou combinado/decidido", "proximoPasso": "próxima ação concreta sugerida, com prazo se possível"}
Não invente nomes, valores ou fatos que não estejam no texto — se faltar informação, deixe genérico em vez de inventar.`;

export async function sintetizarNota(texto: string): Promise<SinteseNota> {
  return gerarJson<SinteseNota>([{ text: `Anotação: ${texto}` }], INSTRUCAO_SINTESE);
}

export interface TranscricaoReuniao extends SinteseNota {
  transcricao: string;
}

const INSTRUCAO_AUDIO = `Você é o assistente de campo de um vendedor B2G (vendas para prefeituras) no Brasil.
Recebe um áudio de uma reunião ou ditado rápido pós-reunião. Devolva APENAS um JSON válido:
{"transcricao": "transcrição literal do áudio", "combinado": "síntese objetiva do que ficou combinado", "proximoPasso": "próxima ação concreta sugerida"}
Transcreva fielmente o que foi dito — não invente conteúdo que não está no áudio.`;

export async function transcreverAudio(audioBase64: string, mimeType: string): Promise<TranscricaoReuniao> {
  return gerarJson<TranscricaoReuniao>([{ inlineData: { mimeType, data: audioBase64 } }], INSTRUCAO_AUDIO);
}

export interface DespesaExtraida {
  valor: number | null;
  data: string | null;
  categoria: 'combustivel' | 'hospedagem' | 'alimentacao' | 'pedagio' | 'outros' | null;
  estabelecimento: string | null;
  descricaoSugerida: string;
}

const INSTRUCAO_OCR = `Você é um leitor de cupom fiscal / nota fiscal brasileira (NFC-e, SAT, cupom comum).
Analise a imagem e devolva APENAS um JSON válido:
{"valor": <número em reais, ou null se ilegível>, "data": "<AAAA-MM-DD ou null>", "categoria": "<combustivel|hospedagem|alimentacao|pedagio|outros ou null>", "estabelecimento": "<nome do estabelecimento ou null>", "descricaoSugerida": "<descrição curta>"}
Se algum campo não estiver legível na imagem, use null para ele — NUNCA invente um valor plausível no lugar.`;

export async function extrairDespesa(imagemBase64: string, mimeType: string): Promise<DespesaExtraida> {
  return gerarJson<DespesaExtraida>([{ inlineData: { mimeType, data: imagemBase64 } }], INSTRUCAO_OCR);
}

export interface Briefing {
  diretriz: string;
}

const INSTRUCAO_BRIEFING = `Você é o assistente de campo de um vendedor B2G brasileiro prestes a entrar numa reunião.
Recebe um resumo do histórico recente do município (contatos, últimos eventos registrados). Devolva APENAS um JSON válido:
{"diretriz": "1-2 frases objetivas do que o vendedor precisa lembrar antes de entrar na reunião, baseado só no histórico fornecido"}
Use só o que está no histórico — não invente fatos novos.`;

export async function gerarBriefing(contextoHistorico: string): Promise<Briefing> {
  return gerarJson<Briefing>([{ text: `Histórico: ${contextoHistorico}` }], INSTRUCAO_BRIEFING);
}

export interface RecomendacaoSemana {
  titulo: string;
  texto: string;
}

export interface RecomendacoesSemana {
  recomendacoes: RecomendacaoSemana[];
}

const INSTRUCAO_RECOMENDACOES = `Você é o assistente estratégico de um vendedor B2G brasileiro revisando a semana.
Recebe um resumo agregado da rota da semana (municípios visitados, estágios do funil, pendências). Devolva APENAS um JSON válido:
{"recomendacoes": [{"titulo": "título curto", "texto": "recomendação objetiva de 1-2 frases"}]}
No máximo 3 recomendações. Baseie-se só nos dados fornecidos — não invente municípios ou fatos que não estejam no resumo.`;

export async function gerarRecomendacoesSemana(contextoSemana: string): Promise<RecomendacoesSemana> {
  return gerarJson<RecomendacoesSemana>([{ text: `Resumo da semana: ${contextoSemana}` }], INSTRUCAO_RECOMENDACOES);
}
