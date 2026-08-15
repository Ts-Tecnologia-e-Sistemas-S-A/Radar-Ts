// Busca inteligente de cidades: ignora acentuação e tolera pequenos erros de digitação.

export function normalizeForSearch(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const currRow = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1, // inserção
        prevRow[j] + 1, // remoção
        prevRow[j - 1] + cost // substituição
      );
    }
    prevRow = currRow;
  }
  return prevRow[n];
}

/**
 * Score de proximidade entre um termo digitado e o nome de uma cidade.
 * Quanto menor, mais próximo (0 = igual). Retorna null quando não há
 * proximidade suficiente para considerar um resultado.
 */
export function citySearchScore(term: string, cityName: string): number | null {
  const normTerm = normalizeForSearch(term);
  const normName = normalizeForSearch(cityName);

  if (!normTerm) return 0;
  if (normName === normTerm) return 0;
  if (normName.startsWith(normTerm)) return 1;
  if (normName.includes(normTerm)) return 2;

  // Compara também contra cada palavra do nome (cidades com nomes compostos, ex: "São Luís")
  const words = normName.split(/\s+/).filter(Boolean);
  let bestDistance = levenshteinDistance(normTerm, normName);
  for (const word of words) {
    bestDistance = Math.min(bestDistance, levenshteinDistance(normTerm, word));
  }

  const tolerance = Math.max(1, Math.floor(normTerm.length * 0.4));
  return bestDistance <= tolerance ? 3 + bestDistance : null;
}

export function matchesCitySearch(term: string, cityName: string): boolean {
  return citySearchScore(term, cityName) !== null;
}
