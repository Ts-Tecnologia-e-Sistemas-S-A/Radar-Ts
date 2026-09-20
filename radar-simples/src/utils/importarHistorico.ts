import { dataValida } from './agenda';

export interface RegistroHistoricoImportacao {
  codigoIbge: number;
  cidade: string;
  data: string;
  texto: string;
  visitaRegistrada: boolean;
}
export interface PacoteHistorico { versao: 1; fonte: string; registros: RegistroHistoricoImportacao[] }

export function validarPacoteHistorico(texto: string): PacoteHistorico {
  if (texto.length > 500000) throw new Error('O arquivo excede o limite de 500 mil caracteres.');
  const pacote = JSON.parse(texto);
  if (pacote?.versao !== 1 || typeof pacote.fonte !== 'string' || !pacote.fonte.trim() || pacote.fonte.length > 200 || !Array.isArray(pacote.registros) || !pacote.registros.length || pacote.registros.length > 100) throw new Error('Arquivo de histórico inválido.');
  const registros = pacote.registros.map((r: RegistroHistoricoImportacao) => {
    if (!r || !Number.isInteger(r.codigoIbge) || r.codigoIbge < 1000000 || r.codigoIbge > 9999999 || typeof r.cidade !== 'string' || !r.cidade.trim() || r.cidade.length > 150 || typeof r.texto !== 'string' || !r.texto.trim() || r.texto.length > 60000 || typeof r.data !== 'string' || (r.data !== '' && !dataValida(r.data)) || typeof r.visitaRegistrada !== 'boolean') throw new Error('Há um registro com cidade, texto ou data inválida.');
    return { codigoIbge: r.codigoIbge, cidade: r.cidade.trim(), data: r.data, texto: r.texto, visitaRegistrada: r.visitaRegistrada };
  });
  return { versao: 1, fonte: pacote.fonte.trim(), registros };
}

export async function idHistoricoImportado(fonte: string, registro: RegistroHistoricoImportacao) {
  const chave = JSON.stringify([fonte, registro.codigoIbge, registro.data, registro.texto, registro.visitaRegistrada]);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chave));
  return `historico-${Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
