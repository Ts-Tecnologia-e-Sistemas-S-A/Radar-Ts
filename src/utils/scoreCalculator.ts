import { Municipality } from '../types';

export interface ScoreBreakdown {
  finalScore: number;
  classification: string;
  badgeColor: string;
  stars: string;
  additionPoints: { label: string; points: number }[];
  subtractionPoints: { label: string; points: number }[];
  effectiveDaysRemaining: number;
  projectedStage: string;
}

/**
 * Dynamic Commercial Score Calculator (SICAP RADAR Engine)
 * Automatically updates scores dynamically as time passes (simulated or real time decay).
 */
export function calculateCommercialScore(
  m: Municipality,
  daysOffset: number = 0
): ScoreBreakdown {
  let score = 0;
  const additionPoints: { label: string; points: number }[] = [];
  const subtractionPoints: { label: string; points: number }[] = [];

  // Effective days remaining in contract after time offset
  const baseDays = m.contractDaysRemaining ?? 365;
  const effectiveDaysRemaining = Math.max(0, baseDays - daysOffset);

  const currentSysLower = (m.currentSystem || '').toLowerCase();
  const isSicapClient = currentSysLower.includes('sicap') || m.status === 'cliente';
  const isNoSystem = currentSysLower.includes('sem sistema') || m.status === 'sem_sistema' as any;
  const students = m.educationalMetrics?.studentsCount || 0;
  const painsStr = (m.educationalMetrics?.mainPains || []).join(' ').toLowerCase();
  const hasPublicComplaints =
    painsStr.includes('reclama') ||
    painsStr.includes('lento') ||
    painsStr.includes('atraso') ||
    painsStr.includes('falha') ||
    painsStr.includes('perda') ||
    painsStr.includes('suporte');

  const recentSecChange =
    (m.ioFactors?.managementChange || 0) >= 70 ||
    (m.notes || '').toLowerCase().includes('troca') ||
    (m.notes || '').toLowerCase().includes('mudança');

  const isNearRoute = m.state === 'PI' || m.state === 'MA' || m.state === 'CE';

  // Determine projected stage as time advances
  let projectedStage = m.funnelStage || 'primeiro_contato';
  if (m.funnelStage === 'implantacao' && daysOffset >= 180) {
    projectedStage = 'producao' as any;
  }

  // --- SUBTRACTIONS ---
  if (isSicapClient) {
    subtractionPoints.push({ label: 'Cliente SICAP', points: -100 });
    score -= 100;
  } else {
    // 1. Produção / Implantação / Recém-assinado
    if (projectedStage === 'implantacao') {
      subtractionPoints.push({ label: 'Em Implantação (Contrato recente)', points: -70 });
      score -= 70;
    } else if (projectedStage === ('producao' as any) && effectiveDaysRemaining > 365) {
      subtractionPoints.push({ label: 'Em Produção (Contrato consolidado)', points: -80 });
      score -= 80;
    } else if (effectiveDaysRemaining > 365) {
      subtractionPoints.push({ label: 'Contrato Recém-assinado (> 12 meses vigência)', points: -60 });
      score -= 60;
    }

    // --- ADDITIONS ---
    if (isNoSystem) {
      additionPoints.push({ label: 'Sem sistema educacional contratado', points: +40 });
      score += 40;
    }

    // Expiring contract bonus
    if (effectiveDaysRemaining <= 180 && effectiveDaysRemaining >= 0 && !isNoSystem) {
      additionPoints.push({ label: `Contrato vence em até 6 meses (${effectiveDaysRemaining} dias restantes)`, points: +35 });
      score += 35;
    } else if (effectiveDaysRemaining > 180 && effectiveDaysRemaining <= 365 && !isNoSystem) {
      additionPoints.push({ label: `Contrato vence em até 12 meses (${effectiveDaysRemaining} dias restantes)`, points: +20 });
      score += 20;
    }

    // Student count scale
    if (students > 20000) {
      additionPoints.push({ label: 'Mais de 20.000 alunos na rede municipal', points: +30 });
      score += 30;
    } else if (students > 10000) {
      additionPoints.push({ label: 'Mais de 10.000 alunos na rede municipal', points: +20 });
      score += 20;
    } else if (students > 5000) {
      additionPoints.push({ label: 'Mais de 5.000 alunos na rede municipal', points: +10 });
      score += 10;
    }

    // Public complaints
    if (hasPublicComplaints) {
      additionPoints.push({ label: 'Reclamações ou dores públicas identificadas', points: +20 });
      score += 20;
    }

    // Secretary change
    if (recentSecChange) {
      additionPoints.push({ label: 'Mudança recente de secretário(a) de Educação', points: +10 });
      score += 10;
    }

    // Near active commercial route
    if (isNearRoute) {
      additionPoints.push({ label: 'Localizado na Rota Comercial Ativa (PI/MA/CE)', points: +10 });
      score += 10;
    }
  }

  // Clamp 0 to 100
  const finalScore = Math.max(0, Math.min(100, score));

  // Classification strictly as prompt specifies
  let classification = '🔴 Não Visitar';
  let badgeColor = 'bg-red-100 text-red-800 border-red-300';
  let stars = '⭐';

  if (finalScore >= 95) {
    classification = '⭐ Prioridade Máxima';
    badgeColor = 'bg-purple-100 text-purple-900 border-purple-300 font-black';
    stars = '⭐⭐⭐⭐⭐';
  } else if (finalScore >= 80) {
    classification = '🟢 Muito Quente';
    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
    stars = '⭐⭐⭐⭐';
  } else if (finalScore >= 60) {
    classification = '🟡 Quente';
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    stars = '⭐⭐⭐';
  } else if (finalScore >= 40) {
    classification = '🟠 Monitorar';
    badgeColor = 'bg-orange-100 text-orange-900 border-orange-300 font-semibold';
    stars = '⭐⭐';
  }

  return {
    finalScore,
    classification,
    badgeColor,
    stars,
    additionPoints,
    subtractionPoints,
    effectiveDaysRemaining,
    projectedStage,
  };
}
