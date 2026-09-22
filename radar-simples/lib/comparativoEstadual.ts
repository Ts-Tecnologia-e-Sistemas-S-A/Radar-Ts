import type { ComparativoEstadual } from '../src/types/diagnostico.js';

export interface NotaDaFonte {
  codigoIbge: number;
  municipio: string;
  uf: string;
  nota: number | null;
  participa: boolean;
}
const UFS: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};
export function ufDoCodigo(codigo: number): string {
  const uf = UFS[String(codigo).slice(0, 2)];
  if (!/^[1-9]\d{6}$/.test(String(codigo)) || !uf) throw new Error('Código IBGE inválido para a comparação estadual.');
  return uf;
}

/** Retorna somente a cidade solicitada e os cinco primeiros, preservando todos os empates. */
export function compararEstado(codigo: number, notas: NotaDaFonte[], metadados: Omit<ComparativoEstadual, 'uf' | 'cidade' | 'destaques' | 'totalComNota'>): ComparativoEstadual {
  const uf = ufDoCodigo(codigo);
  const estaduais = notas.filter((n) => n.uf === uf);
  const ids = new Set<number>();
  for (const n of estaduais) {
    if (ids.has(n.codigoIbge) || ufDoCodigo(n.codigoIbge) !== uf) throw new Error('Município duplicado ou UF divergente na fonte oficial.');
    if (n.nota !== null && (!Number.isFinite(n.nota) || n.nota < 0)) throw new Error('Nota inválida na fonte oficial.');
    ids.add(n.codigoIbge);
  }
  const classificados = estaduais.filter((n) => n.participa && n.nota !== null)
    .sort((a, b) => b.nota! - a.nota! || a.municipio.localeCompare(b.municipio, 'pt-BR') || a.codigoIbge - b.codigoIbge);
  let posicao = 0;
  const ranking = classificados.map((n, i) => {
    if (i === 0 || n.nota !== classificados[i - 1].nota) posicao = i + 1;
    return { codigoIbge: n.codigoIbge, municipio: n.municipio, nota: n.nota, posicao };
  });
  const selecionada = estaduais.find((n) => n.codigoIbge === codigo);
  const cidade = selecionada ? {
    codigoIbge: codigo, municipio: selecionada.municipio, nota: selecionada.nota,
    posicao: ranking.find((n) => n.codigoIbge === codigo)?.posicao ?? null,
  } : null;
  return {
    ...metadados, uf, cidade, totalComNota: ranking.length,
    destaques: ranking.filter((n) => n.posicao <= 5 && n.codigoIbge !== codigo),
  };
}

export function numeroPublicado(valor: unknown, maximo?: number): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === '' || /^[-*]+$/.test(String(valor).trim())) return null;
  const texto = String(valor).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(texto)) throw new Error('Formato de nota desconhecido na fonte oficial.');
  const numero = Number(texto);
  if (!Number.isFinite(numero) || (maximo !== undefined && numero > maximo)) throw new Error('Nota fora da escala oficial.');
  return numero;
}
