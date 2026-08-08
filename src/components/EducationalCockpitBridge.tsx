import React, { useState } from 'react';
import { Municipality } from '../types';
import { GraduationCap, ArrowRight, ShieldCheck, Sparkles, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

interface EducationalCockpitBridgeProps {
  municipalities: Municipality[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  onGenerateAIStrategy: (m: Municipality) => void;
}

export const EducationalCockpitBridge: React.FC<EducationalCockpitBridgeProps> = ({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  onGenerateAIStrategy,
}) => {
  const activeMuni = selectedMunicipality || municipalities[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span>Sinergia Estratégica SICAP: Cockpit Educacional + Radar Comercial</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Cockpit Educacional Hub de Vendas
          </h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            O <strong>Cockpit Educacional</strong> revela as vulnerabilidades pedagógicas do município (IDEB, evasão, Fundeb), enquanto o <strong>Radar de Licitações</strong> indica o timing exato para a venda.
          </p>
        </div>

        {/* Municipality Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-300" />
          <select
            value={activeMuni?.id}
            onChange={(e) => {
              const m = municipalities.find((item) => item.id === e.target.value);
              if (m) onSelectMunicipality(m);
            }}
            className="bg-slate-800 text-white font-bold text-xs border border-indigo-500/40 rounded-xl px-3 py-2 focus:outline-none"
          >
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.state}) - IDEB: {m.educationalMetrics?.ideb || 0}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual Column Synergy Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Cockpit Diagnóstico Educacional */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  1. Diagnóstico do Cockpit Educacional
                </h3>
                <span className="text-[11px] text-slate-500">Problemas e dores da Secretaria de Educação</span>
              </div>
            </div>
            <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
              IDEB: {activeMuni?.educationalMetrics?.ideb || 0} / Meta {activeMuni?.educationalMetrics?.idebTarget || 0}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">Gargalos Pedagógicos Identificados:</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                {(activeMuni?.educationalMetrics?.mainPains || []).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-700 font-bold block text-[10px] uppercase">Taxa de Evasão</span>
                <span className="text-lg font-black text-red-900">{activeMuni?.educationalMetrics?.dropoutRate || 0}%</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 font-bold block text-[10px] uppercase">Orçamento Fundeb</span>
                <span className="text-lg font-black text-emerald-900">
                  R$ {(((activeMuni?.educationalMetrics?.fundebBudget || 0)) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Radar Comercial Match */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  2. Oportunidade do Radar Comercial
                </h3>
                <span className="text-[11px] text-slate-500">Quando e onde vender o SICAP</span>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
              IO SICAP: {activeMuni?.ioScore || 0}/100
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 block text-[11px]">Timing da Abordagem Licitatória:</span>
              <p className="text-amber-800 leading-relaxed">
                Contrato atual da <strong>{activeMuni?.currentSystem || 'Empresa Concorrente'}</strong> expira em{' '}
                <strong>{activeMuni?.contractDaysRemaining ?? 0} dias</strong>. Probabilidade de nova licitação é de{' '}
                <strong>{activeMuni?.tenderProbability || 0}%</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-blue-900 font-bold block">Valor do Pitch Comercial</span>
                <span className="text-xs text-blue-700">Estimativa R$ {(activeMuni?.estimatedNewContractValue || 0).toLocaleString('pt-BR')}</span>
              </div>
              <button
                onClick={() => onGenerateAIStrategy(activeMuni)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Pitch IA</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
