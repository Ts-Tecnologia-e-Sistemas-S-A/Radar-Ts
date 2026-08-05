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
    <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 mb-4 sm:mb-6 shadow-xl border border-slate-800 space-y-3">
      
      {/* Top Row: Active City Title & Selector + Key Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        
        {/* City Selector & Label */}
        <div className="flex items-center gap-2.5 w-full md:w-auto min-w-0">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-xl shadow-md font-black shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400">
                🏛️ CIDADE ATIVA NO RADAR:
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${scoreData.badgeColor}`}>
                {scoreData.classification}
              </span>
            </div>

            <div className="relative flex items-center mt-0.5 w-full">
              <select
                value={selectedMunicipality.id}
                onChange={(e) => {
                  const m = municipalities.find((item) => item.id === e.target.value);
                  if (m) onSelectMunicipality(m);
                }}
                className="bg-slate-800 text-white font-black text-xs sm:text-sm border border-slate-700 rounded-lg px-2 py-1 pr-7 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer w-full max-w-full sm:max-w-xs truncate"
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

        {/* Live Metrics Chips (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar w-full md:w-auto py-0.5">
          
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[10px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>🔥 Firebase Cloud</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">IO:</span>
            <strong className="text-amber-400 font-black text-xs sm:text-sm">{scoreData.finalScore}/100</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Swords className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sistema:</span>
            <strong className="text-blue-200 font-extrabold text-xs">{selectedMunicipality.currentSystem}</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento:</span>
            <strong className="text-red-300 font-extrabold text-xs">{selectedMunicipality.contractDaysRemaining}d</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Alunos:</span>
            <strong className="text-emerald-300 font-extrabold text-xs">
              {(selectedMunicipality.educationalMetrics?.studentsCount || Math.round(selectedMunicipality.population / 4)).toLocaleString('pt-BR')}
            </strong>
          </div>

        </div>

      </div>

      {/* Bottom Row: 360º Multi-Module Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
        
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
            Opções:
          </span>

          {actionButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;

            return (
              <button
                key={btn.id}
                onClick={() => onNavigateTab(btn.id)}
                className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 ${
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
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <button
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-black px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
            title="Exportar / Imprimir Dossiê Licitatório Completo"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Dossiê</span>
          </button>

          <button
            onClick={onOpenEnricherModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black px-2.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
            title="Atualizar / Enriquecer Dados com IA"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Enriquecer CRM</span>
          </button>
        </div>

      </div>

    </div>
  );
};
