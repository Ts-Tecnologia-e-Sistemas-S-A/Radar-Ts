import React from 'react';
import { Municipality } from '../types';
import { ActiveTab } from './Sidebar';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import { 
  Building2, 
  Sparkles, 
  Compass, 
  FileText, 
  Kanban, 
  MessageSquare, 
  GraduationCap, 
  Calculator, 
  Swords, 
  Download, 
  Zap, 
  ChevronDown,
  Clock,
  Users,
  Award
} from 'lucide-react';

interface SelectedCityBarProps {
  municipalities: Municipality[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenExportModal: () => void;
  onOpenEnricherModal: () => void;
}

export const SelectedCityBar: React.FC<SelectedCityBarProps> = ({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  activeTab,
  onNavigateTab,
  onOpenExportModal,
  onOpenEnricherModal,
}) => {
  if (!selectedMunicipality || municipalities.length === 0) return null;

  const scoreData = calculateCommercialScore(selectedMunicipality);

  const actionButtons = [
    {
      id: 'field_visits' as ActiveTab,
      label: 'Roteiro & Campo',
      icon: Compass,
      color: 'bg-emerald-600 text-white hover:bg-emerald-500',
    },
    {
      id: 'intelligence' as ActiveTab,
      label: 'Dossiê Licitatório',
      icon: FileText,
      color: 'bg-blue-600 text-white hover:bg-blue-500',
    },
    {
      id: 'ai_agent' as ActiveTab,
      label: 'IA Agente & Pitch',
      icon: Sparkles,
      color: 'bg-purple-600 text-white hover:bg-purple-500',
    },
    {
      id: 'funnel' as ActiveTab,
      label: 'Funil CRM',
      icon: Kanban,
      color: 'bg-amber-600 text-white hover:bg-amber-500',
    },
    {
      id: 'crm' as ActiveTab,
      label: 'Reg. Interações',
      icon: MessageSquare,
      color: 'bg-teal-600 text-white hover:bg-teal-500',
    },
    {
      id: 'cockpit' as ActiveTab,
      label: 'Cockpit Educacional',
      icon: GraduationCap,
      color: 'bg-indigo-600 text-white hover:bg-indigo-500',
    },
    {
      id: 'io_score' as ActiveTab,
      label: 'Simular IO',
      icon: Calculator,
      color: 'bg-slate-700 text-white hover:bg-slate-600',
    },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3.5 mb-6 shadow-xl border border-slate-800 space-y-3">
      
      {/* Top Row: Active City Title & Selector + Key Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        
        {/* City Selector & Label */}
        <div className="flex items-center gap-3 min-w-[280px]">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-xl shadow-md font-black shrink-0">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                🏛️ CIDADE ATIVA NO RADAR COMERCIAL:
              </span>
              <span className={`text-[9px] px-2 py-0.2 rounded-full border ${scoreData.badgeColor}`}>
                {scoreData.classification}
              </span>
            </div>

            <div className="relative flex items-center mt-0.5">
              <select
                value={selectedMunicipality.id}
                onChange={(e) => {
                  const m = municipalities.find((item) => item.id === e.target.value);
                  if (m) onSelectMunicipality(m);
                }}
                className="bg-slate-800 text-white font-black text-sm sm:text-base border border-slate-700 rounded-lg px-2.5 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer w-full max-w-xs"
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    Prefeitura de {m.name} ({m.state}) — {m.currentSystem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Metrics Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Score IO:</span>
            <strong className="text-amber-400 font-black text-sm">{scoreData.finalScore}/100</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Concorrente:</span>
            <strong className="text-blue-200 font-extrabold">{selectedMunicipality.currentSystem}</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento:</span>
            <strong className="text-red-300 font-extrabold">{selectedMunicipality.contractDaysRemaining} dias</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Alunos:</span>
            <strong className="text-emerald-300 font-extrabold">
              {(selectedMunicipality.educationalMetrics?.studentsCount || Math.round(selectedMunicipality.population / 4)).toLocaleString('pt-BR')}
            </strong>
          </div>

        </div>

      </div>

      {/* Bottom Row: 360º Multi-Module Action Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
            Opções para {selectedMunicipality.name}:
          </span>

          {actionButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;

            return (
              <button
                key={btn.id}
                onClick={() => onNavigateTab(btn.id)}
                className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : `${btn.color} opacity-90 hover:opacity-100`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Special Modal Trigger Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-black px-3 py-1.5 rounded-xl transition-all active:scale-95"
            title="Exportar / Imprimir Dossiê Licitatório Completo"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar Dossiê</span>
          </button>

          <button
            onClick={onOpenEnricherModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
            title="Atualizar / Enriquecer Dados com IA"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Enriquecer CRM (IA)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
