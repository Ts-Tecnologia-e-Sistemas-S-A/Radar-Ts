import type { MunicipioIbge } from '../types';

const DIACRITICOS_REGEX = /[\u0300-\u036f]/g;
const SEPARADORES_REGEX = /[^a-z0-9]+/g;
const ESPACOS_REGEX = /\s+/g;

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS_REGEX, '')
    .replace(SEPARADORES_REGEX, ' ')
    .trim()
    .replace(ESPACOS_REGEX, ' ');
}

function compactarTexto(texto: string): string {
  return texto.replace(ESPACOS_REGEX, '');
}

function distanciaMaxima(tamanho: number): number {
  if (tamanho <= 4) return 1;
  if (tamanho <= 8) return 2;
  return 3;
}

function damerauLevenshteinAte(a: string, b: string, maximo: number): number | null {
  const tamanhoA = a.length;
  const tamanhoB = b.length;
  if (Math.abs(tamanhoA - tamanhoB) > maximo) return null;

  let linhaAnteriorAnterior = new Array<number>(tamanhoB + 1).fill(0);
  let linhaAnterior = new Array<number>(tamanhoB + 1);
  let linhaAtual = new Array<number>(tamanhoB + 1);

  for (let j = 0; j <= tamanhoB; j += 1) linhaAnterior[j] = j;

  for (let i = 1; i <= tamanhoA; i += 1) {
    linhaAtual[0] = i;
    let menorLinha = linhaAtual[0];
    for (let j = 1; j <= tamanhoB; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      let valor = Math.min(
        linhaAnterior[j] + 1,
        linhaAtual[j - 1] + 1,
        linhaAnterior[j - 1] + custo
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, linhaAnteriorAnterior[j - 2] + 1);
      }
      linhaAtual[j] = valor;
      if (valor < menorLinha) menorLinha = valor;
    }
    if (menorLinha > maximo) return null;
    [linhaAnteriorAnterior, linhaAnterior, linhaAtual] = [linhaAnterior, linhaAtual, linhaAnteriorAnterior];
  }

  const distancia = linhaAnterior[tamanhoB];
  return distancia <= maximo ? distancia : null;
}

function pontuacaoAproximada(consulta: string, alvo: string, base: number): number | null {
  if (consulta.length < 3 || alvo.length < 3) return null;
  const maior = Math.max(consulta.length, alvo.length);
  const menor = Math.min(consulta.length, alvo.length);
  if (menor / maior < 0.65) return null;
  const limite = distanciaMaxima(maior);
  const distancia = damerauLevenshteinAte(consulta, alvo, limite);
  if (distancia === null) return null;
  return base + distancia * 10 + (maior - menor);
}

export function pontuarBuscaMunicipio(consultaBruta: string, municipio: MunicipioIbge): number | null {
  const consulta = normalizarTexto(consultaBruta);
  if (!consulta) return 0;

  const nome = normalizarTexto(municipio.nome);
  const uf = normalizarTexto(municipio.uf);
  const nomeCompacto = compactarTexto(nome);
  const consultaCompacta = compactarTexto(consulta);
  const tokensNome = nome.split(' ').filter(Boolean);

  if (consulta === nome || consultaCompacta === nomeCompacto) return 0;
  if (consulta === uf) return 5;
  if (nome.startsWith(consulta) || nomeCompacto.startsWith(consultaCompacta)) return 10;
  if (tokensNome.some((token) => token === consulta)) return 20;
  if (uf.startsWith(consulta)) return 25;
  if (tokensNome.some((token) => token.startsWith(consulta))) return 30;
  if (nome.includes(consulta) || nomeCompacto.includes(consultaCompacta)) return 40;

  const aproximacoes: number[] = [];
  const nomeAproximado = pontuacaoAproximada(consultaCompacta, nomeCompacto, 100);
  if (nomeAproximado !== null) aproximacoes.push(nomeAproximado);
  for (const token of tokensNome) {
    const tokenAproximado = pontuacaoAproximada(consulta, token, 110);
    if (tokenAproximado !== null) aproximacoes.push(tokenAproximado);
  }

  if (aproximacoes.length === 0) return null;
  return Math.min(...aproximacoes);
}

export function correspondeBuscaMunicipio(consultaBruta: string, municipio: MunicipioIbge): boolean {
  return pontuarBuscaMunicipio(consultaBruta, municipio) !== null;
}

export function ordenarMunicipiosPorBusca(consultaBruta: string, municipios: MunicipioIbge[]): MunicipioIbge[] {
  return municipios
    .map((municipio) => ({ municipio, pontuacao: pontuarBuscaMunicipio(consultaBruta, municipio) }))
    .filter((item): item is { municipio: MunicipioIbge; pontuacao: number } => item.pontuacao !== null)
    .sort((a, b) =>
      a.pontuacao - b.pontuacao
      || a.municipio.nome.localeCompare(b.municipio.nome, 'pt-BR')
      || a.municipio.uf.localeCompare(b.municipio.uf)
    )
    .map((item) => item.municipio);
}
