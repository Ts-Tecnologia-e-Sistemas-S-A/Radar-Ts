export const LIMITE_TEXTO_PLANILHA = 60000;

export interface RelatorioPlanilha {
  titulo: string;
  resumo: string;
  achados: string[];
  limitacoes: string[];
  proximosPassos: string[];
}

export function prepararTextoPlanilha(texto: unknown): string {
  if (typeof texto !== 'string' || !texto.trim()) throw new Error('Cole os cabeçalhos e os dados da planilha.');
  if (texto.length > LIMITE_TEXTO_PLANILHA) throw new Error('O trecho excede 60.000 caracteres. Divida a planilha em partes menores.');
  // Preserva células vazias e tabulações, incluindo as das bordas da tabela.
  return texto.replace(/\r\n?/g, '\n');
}

export function validarRelatorioPlanilha(valor: unknown): RelatorioPlanilha {
  const r = valor as Partial<RelatorioPlanilha> | null;
  if (!r || typeof r.titulo !== 'string' || !r.titulo.trim() ||
    typeof r.resumo !== 'string' || !r.resumo.trim() ||
    ![r.achados, r.limitacoes, r.proximosPassos].every((lista) =>
      Array.isArray(lista) && lista.every((item) => typeof item === 'string'))) {
    throw new Error('A IA retornou um relatório incompleto. Tente gerar novamente.');
  }
  return { titulo: r.titulo, resumo: r.resumo, achados: r.achados!, limitacoes: r.limitacoes!, proximosPassos: r.proximosPassos! };
}
