import { BuyingHistoryItem, EducationalMetrics, Municipality } from '../types';

export interface CurrentAndArchivedHistory {
  current: BuyingHistoryItem[];
  archived: BuyingHistoryItem[];
}

function newestFirst(a: BuyingHistoryItem, b: BuyingHistoryItem): number {
  if (a.year !== b.year) return b.year - a.year;
  return (b.publishedAt || b.contractDate || '').localeCompare(a.publishedAt || a.contractDate || '');
}

export function selectNewestBuyingHistory(
  records: BuyingHistoryItem[] = [],
  existingArchive: BuyingHistoryItem[] = []
): CurrentAndArchivedHistory {
  const unique = new Map<string, BuyingHistoryItem>();

  [...records, ...existingArchive].forEach((record) => {
    if (!record || !Number.isInteger(record.year) || record.year <= 0) return;
    const key = [record.year, record.company, record.contractDate, record.value].join('|').toLowerCase();
    unique.set(key, record);
  });

  const sorted = Array.from(unique.values()).sort(newestFirst);
  const newestYear = sorted[0]?.year;

  return {
    current: newestYear ? sorted.filter((record) => record.year === newestYear) : [],
    archived: newestYear ? sorted.filter((record) => record.year < newestYear) : [],
  };
}

export interface CurrentAndArchivedEducation {
  current: EducationalMetrics | null;
  archived: EducationalMetrics[];
}

export const EMPTY_EDUCATIONAL_METRICS: EducationalMetrics = {
  ideb: 0,
  idebTarget: 0,
  dropoutRate: 0,
  schoolsCount: 0,
  studentsCount: 0,
  teachersCount: 0,
  fundebBudget: 0,
  mainPains: [],
};

export function selectNewestEducationalMetrics(
  records: Array<EducationalMetrics | null | undefined>
): CurrentAndArchivedEducation {
  const unique = new Map<string, EducationalMetrics>();
  records
    .filter((record): record is EducationalMetrics => Boolean(record))
    .filter((record) => Boolean(
      record.referenceYear ||
      record.ideb ||
      record.schoolsCount ||
      record.studentsCount ||
      record.teachersCount ||
      record.fundebBudget ||
      record.mainPains?.length ||
      record.source ||
      record.sourceUrl
    ))
    .forEach((record) => {
      const key = [
        record.referenceYear,
        record.publishedAt,
        record.schoolsCount,
        record.studentsCount,
        record.sourceUrl,
      ].join('|');
      unique.set(key, record);
    });
  const available = Array.from(unique.values());
  const verified = available
    .filter((record) => Number.isInteger(record.referenceYear) && Number(record.referenceYear) > 0)
    .sort((a, b) => {
      if (a.referenceYear !== b.referenceYear) return Number(b.referenceYear) - Number(a.referenceYear);
      return (b.publishedAt || '').localeCompare(a.publishedAt || '');
    });

  const current = verified[0] || null;
  return {
    current,
    archived: available.filter((record) => record !== current),
  };
}

export function normalizeMunicipalityRecency(municipality: Municipality): Municipality {
  const history = selectNewestBuyingHistory(
    municipality.buyingHistory,
    municipality.buyingHistoryArchive
  );
  const education = selectNewestEducationalMetrics([
    municipality.educationalMetrics,
    ...(municipality.educationalMetricsArchive || []),
  ]);

  return {
    ...municipality,
    buyingHistory: history.current,
    buyingHistoryArchive: history.archived,
    educationalMetrics: education.current || EMPTY_EDUCATIONAL_METRICS,
    educationalMetricsArchive: education.archived,
    dataVerificationStatus: education.current
      ? municipality.dataVerificationStatus
      : 'PENDENTE_REVALIDACAO_INEP',
  };
}