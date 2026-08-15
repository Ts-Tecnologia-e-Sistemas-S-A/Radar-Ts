import { Municipality } from '../types';

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function phoneticNormalize(str: string): string {
  let norm = normalizeString(str);
  if (!norm) return '';
  return norm
    .replace(/\b(de|da|do|dos|das)\b/g, '')
    .replace(/z/g, 's')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/ch/g, 'x')
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/lh/g, 'l')
    .replace(/nh/g, 'n')
    .replace(/rr/g, 'r')
    .replace(/ss/g, 's')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  // Check substring containment
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return 0.82 + 0.18 * (minLen / maxLen);
  }

  // Phonetic match check
  const p1 = phoneticNormalize(str1);
  const p2 = phoneticNormalize(str2);
  if (p1 && p2 && p1 === p2) return 0.95;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const levSimilarity = 1 - distance / maxLen;

  const pDistance = levenshteinDistance(p1, p2);
  const pMaxLen = Math.max(p1.length, p2.length) || 1;
  const phonSimilarity = 1 - pDistance / pMaxLen;

  return Math.max(levSimilarity, phonSimilarity * 0.92);
}

export interface FuzzySearchResult<T> {
  item: T;
  score: number; // 0 to 1
  isExactOrClose: boolean;
}

/**
 * Intelligent Fuzzy Search across a list of municipalities.
 * Handles typos, Portuguese spelling differences, accents, and state matching.
 */
export function findBestMatchingMunicipality(
  query: string,
  stateUf: string | undefined,
  municipalities: Municipality[],
  minThreshold: number = 0.45
): FuzzySearchResult<Municipality> | null {
  if (!query || !query.trim() || municipalities.length === 0) return null;

  const cleanQuery = query.trim();
  const cleanState = stateUf ? stateUf.trim().toUpperCase() : '';

  let bestMatch: Municipality | null = null;
  let bestScore = -1;

  for (const muni of municipalities) {
    const nameSim = calculateStringSimilarity(cleanQuery, muni.name);

    // State bonus or penalty
    let stateMultiplier = 1.0;
    if (cleanState) {
      if (muni.state.toUpperCase() === cleanState) {
        stateMultiplier = 1.15;
      } else {
        stateMultiplier = 0.85;
      }
    }

    const finalScore = Math.min(1.0, nameSim * stateMultiplier);

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMatch = muni;
    }
  }

  if (bestMatch && bestScore >= minThreshold) {
    return {
      item: bestMatch,
      score: bestScore,
      isExactOrClose: bestScore >= 0.7
    };
  }

  return null;
}

/**
 * Searches and ranks municipalities for auto-complete dropdowns or search results.
 */
export function rankMunicipalitiesByQuery(
  query: string,
  stateUf: string | undefined,
  municipalities: Municipality[],
  maxResults: number = 5
): FuzzySearchResult<Municipality>[] {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const cleanState = stateUf ? stateUf.trim().toUpperCase() : '';

  const scoredList = municipalities.map(muni => {
    const nameSim = calculateStringSimilarity(cleanQuery, muni.name);
    let stateMultiplier = 1.0;
    if (cleanState) {
      if (muni.state.toUpperCase() === cleanState) {
        stateMultiplier = 1.15;
      } else {
        stateMultiplier = 0.85;
      }
    }
    const score = Math.min(1.0, nameSim * stateMultiplier);
    return {
      item: muni,
      score,
      isExactOrClose: score >= 0.7
    };
  });

  return scoredList
    .filter(res => res.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
