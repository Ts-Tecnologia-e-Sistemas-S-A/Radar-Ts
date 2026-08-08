import React, { useState } from 'react';
import { Municipality } from '../types';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import { Calculator, Sparkles, Clock, ShieldAlert, CheckCircle2, ArrowRight, Filter, TrendingUp, HelpCircle } from 'lucide-react';

interface IOScoreCalculatorViewProps {
  municipalities: Municipality[];
  onSelectMunicipality: (m: Municipality) => void;
  selectedMunicipality?: Municipality | null;
}

export const IOScoreCalculatorView: React.FC<IOScoreCalculatorViewProps> = ({
  municipalities,
  onSelectMunicipality,
  selectedMunicipality,
}) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [daysOffset, setDaysOffset] = useState<number>(0);
  const [selectedMuniId, setSelectedMuniId] = useState<string>(
    selectedMunicipality?.id || municipalities[0]?.id || ''
  );

  React.useEffect(() => {
    if (selectedMunicipality) {
      setSelectedMuniId(selectedMunicipality.id);
    }
  }, [selectedMunicipality]);

  // Filter municipalities by selected state
  const filteredMunicipalities = municipalities.filter((m) => {
    if (selectedState === 'ALL') return true;
    return m.state === selectedState;
  });

  const selectedMuni = municipalities.find((m) => m.id === selectedMuniId) || municipalities[0];
  const currentScoreBreakdown = calculateCommercialScore(selectedMuni, daysOffset);

  // Count classifications across filtered dataset
  const classificationCounts = filteredMunicipalities.reduce(
    (acc, m) => {
      const breakdown = calculateCommercialScore(m, daysOffset);
      const score = breakdown.finalScore;
      if (score >= 95) acc.maximo++;
      else if (score >= 80) acc.muitoQuente++;
      else if (score >= 60) acc.quente++;
      else if (score >= 40) acc.monitorar++;
      else acc.naoVisitar++;
      return acc;
    },
    { maximo: 0, muitoQuente: 0, quente: 0, monitorar: 0, naoVisitar: 0 }
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Motor Oficial de Classificação Comercial CRM</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Matriz de Pontuação Comercial & Avaliação Temporal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Algoritmo oficial de pontuação baseado na situação contratual, porte, dores pedagógicas e histórico municipal em Piauí, Maranhão e região.
          </p>
        </div>

        {/* State Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedState('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedState === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos os Estados ({municipalities.length})
          </button>
          <button
            onClick={() => setSelectedState('PI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedState === 'PI'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Piauí (PI)
          </button>
          <button
            onClick={() => setSelectedState('MA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedState === 'MA'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Maranhão (MA)
          </button>
          <button
            onClick={() => setSelectedState('CE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedState === 'CE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ceará (CE)
          </button>
        </div>
      </div>

      {/* Dynamic Time Decay Auto-Update Slider */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 block">
                Simulador Temporal & Reavaliação Automática
              </span>
              <h3 className="text-base font-black text-white">
                "A avaliação não é estanque: com o passar do tempo o que é ruim hoje amanhã é ótimo"
              </h3>
            </div>
          </div>

          <div className="bg-indigo-900/60 border border-indigo-700/50 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-indigo-300 uppercase font-bold block">Avanço Simulado</span>
            <span className="text-lg font-black text-amber-300">
              +{daysOffset} dias ({Math.round(daysOffset / 30)} meses)
            </span>
          </div>
        </div>

        {/* Time Slider Controls */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="0"
            max="365"
            step="30"
            value={daysOffset}
            onChange={(e) => setDaysOffset(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
          <div className="flex justify-between text-[11px] font-bold text-slate-300">
            <button onClick={() => setDaysOffset(0)} className="hover:text-amber-300">Hoje (0 dias)</button>
            <button onClick={() => setDaysOffset(90)} className="hover:text-amber-300">+3 Meses (90d)</button>
            <button onClick={() => setDaysOffset(180)} className="hover:text-amber-300">+6 Meses (180d)</button>
            <button onClick={() => setDaysOffset(270)} className="hover:text-amber-300">+9 Meses (270d)</button>
            <button onClick={() => setDaysOffset(365)} className="hover:text-amber-300">+12 Meses (365d)</button>
          </div>
        </div>
      </div>

      {/* Official Score Rules Reference Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Regra de Cálculo Oficial do CRM</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Somar */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
            <span className="font-extrabold text-emerald-900 block uppercase text-[11px] border-b border-emerald-200/60 pb-1">
              ➕ Bonificações (+)
            </span>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 font-semibold text-emerald-800 text-[11px]">
              <li>• +40 Sem sistema</li>
              <li>• +35 Vence em ≤ 6 meses</li>
              <li>• +20 Vence em ≤ 12 meses</li>
              <li>• +30 &gt; 20.000 alunos</li>
              <li>• +20 &gt; 10.000 alunos</li>
              <li>• +10 &gt; 5.000 alunos</li>
              <li>• +20 Reclamações públicas</li>
              <li>• +10 Troca de secretário</li>
              <li>• +10 Rota PI/MA/CE</li>
            </ul>
          </div>

          {/* Descontar */}
          <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 space-y-1.5">
            <span className="font-extrabold text-red-900 block uppercase text-[11px] border-b border-red-200/60 pb-1">
              ➖ Penalizações (-)
            </span>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 font-semibold text-red-800 text-[11px]">
              <li>• -100 Cliente SICAP</li>
              <li>• -80 Em Produção</li>
              <li>• -70 Em Implantação</li>
              <li>• -60 Recém-assinado (&gt; 12 meses)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-purple-700 block">95 – 100</span>
          <span className="text-lg font-black text-purple-900 block">{classificationCounts.maximo}</span>
          <span className="text-[10px] font-bold text-purple-800">⭐ Prioridade Máxima</span>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">80 – 94</span>
          <span className="text-lg font-black text-emerald-900 block">{classificationCounts.muitoQuente}</span>
          <span className="text-[10px] font-bold text-emerald-800">🟢 Muito Quente</span>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">60 – 79</span>
          <span className="text-lg font-black text-amber-900 block">{classificationCounts.quente}</span>
          <span className="text-[10px] font-bold text-amber-800">🟡 Quente</span>
        </div>
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-orange-700 block">40 – 59</span>
          <span className="text-lg font-black text-orange-900 block">{classificationCounts.monitorar}</span>
          <span className="text-[10px] font-bold text-orange-800">🟠 Monitorar</span>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-red-700 block">0 – 39</span>
          <span className="text-lg font-black text-red-900 block">{classificationCounts.naoVisitar}</span>
          <span className="text-[10px] font-bold text-red-800">🔴 Não Visitar</span>
        </div>
      </div>

      {/* Main Grid: Detail Breakdown + Full Ranked List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Selected Municipality Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ANÁLISE DETALHADA</span>
              <select
                value={selectedMuni.id}
                onChange={(e) => setSelectedMuniId(e.target.value)}
                className="text-base font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 mt-1 focus:outline-none"
              >
                {filteredMunicipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Score Result Card */}
            <div className={`p-4 rounded-2xl border text-center ${currentScoreBreakdown.badgeColor} shadow-md`}>
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">PONTUAÇÃO DEDUZIDA</span>
              <span className="text-3xl font-black">{currentScoreBreakdown.finalScore} pts</span>
              <span className="text-xs font-black block mt-0.5">{currentScoreBreakdown.classification}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block">Dados Vigentes do Município:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Sistema: <strong className="text-slate-900">{selectedMuni.currentSystem}</strong></div>
                <div>Alunos na Rede: <strong className="text-slate-900">{selectedMuni.educationalMetrics?.studentsCount?.toLocaleString('pt-BR')}</strong></div>
                <div>Dias Vigentes Contrato: <strong className="text-slate-900">{currentScoreBreakdown.effectiveDaysRemaining} dias</strong></div>
                <div>Estágio: <strong className="text-slate-900 uppercase">{currentScoreBreakdown.projectedStage}</strong></div>
              </div>
            </div>

            {/* Additions List */}
            {currentScoreBreakdown.additionPoints.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-extrabold text-emerald-800 block text-xs uppercase">Pontos Somados (+):</span>
                {currentScoreBreakdown.additionPoints.map((pt, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg text-emerald-900 border border-emerald-100 font-medium">
                    <span>{pt.label}</span>
                    <span className="font-black text-emerald-700">+{pt.points}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Subtractions List */}
            {currentScoreBreakdown.subtractionPoints.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-extrabold text-red-800 block text-xs uppercase">Descontos Aplicados (-):</span>
                {currentScoreBreakdown.subtractionPoints.map((pt, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded-lg text-red-900 border border-red-100 font-medium">
                    <span>{pt.label}</span>
                    <span className="font-black text-red-700">{pt.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectMunicipality(selectedMuni)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow flex items-center justify-center gap-2"
          >
            <span>Abrir Ficha de Inteligência Comercial de {selectedMuni.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Full Ranked List */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Ranking de Municípios - Pontuação Comercial ({filteredMunicipalities.length})
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Ordenado por Score Decrescente
            </span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredMunicipalities
              .map((m) => {
                const breakdown = calculateCommercialScore(m, daysOffset);
                return { m, breakdown };
              })
              .sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore)
              .map(({ m, breakdown }, idx) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMuniId(m.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                    selectedMuni && selectedMuni.id === m.id
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-400 text-xs w-6 text-center">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm font-extrabold">{m.name}</strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 text-slate-800">
                          {m.state}
                        </span>
                        <span className="text-xs">{breakdown.stars}</span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {m.currentSystem} • {m.educationalMetrics?.studentsCount?.toLocaleString('pt-BR')} alunos • Venc: {breakdown.effectiveDaysRemaining}d
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${breakdown.badgeColor}`}>
                      {breakdown.finalScore} pts
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

    </div>
  );
};
