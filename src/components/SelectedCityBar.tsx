import React from 'react';
import { Municipality, CRMInteraction } from '../types';
import { ActiveTab } from './Sidebar';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import {
  Building2,
  Compass,
  MessageSquare,
  Swords,
  Download,
  Zap,
  Clock,
  Users,
  Award,
  Pencil,
  SearchCheck,
  X
} from 'lucide-react';

interface SelectedCityBarProps {
  municipalities: Municipality[];
  crmInteractions?: CRMInteraction[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  onUpdateMunicipality?: (updated: Municipality) => void;
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenExportModal: () => void;
  onOpenEnricherModal: () => void;
}

export const SelectedCityBar: React.FC<SelectedCityBarProps> = ({
  municipalities,
  crmInteractions = [],
  selectedMunicipality,
  onSelectMunicipality,
  onUpdateMunicipality,
  activeTab,
  onNavigateTab,
  onOpenExportModal,
  onOpenEnricherModal,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [cityNameInput, setCityNameInput] = React.useState('');
  const [cityStateInput, setCityStateInput] = React.useState('');

  if (!selectedMunicipality || municipalities.length === 0) return null;

  const handleOpenEdit = () => {
    setCityNameInput(selectedMunicipality.name);
    setCityStateInput(selectedMunicipality.state);
    setIsEditModalOpen(true);
  };

  const handleSaveCityEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityNameInput.trim() || !cityStateInput.trim()) return;

    const updated: Municipality = {
      ...selectedMunicipality,
      name: cityNameInput.trim(),
      state: cityStateInput.trim().toUpperCase(),
    };

    if (onUpdateMunicipality) {
      onUpdateMunicipality(updated);
    }
    onSelectMunicipality(updated);
    setIsEditModalOpen(false);
  };

  const scoreData = calculateCommercialScore(selectedMunicipality);

  // Calculate city specific past interactions
  const cityInteractions = (crmInteractions || []).filter(
    (i) =>
      i &&
      (i.municipalityId === selectedMunicipality.id ||
        (i.municipalityId &&
          selectedMunicipality.id &&
          i.municipalityId.toLowerCase() === selectedMunicipality.id.toLowerCase()) ||
        (i.municipalityName &&
          selectedMunicipality.name &&
          i.municipalityName.toLowerCase().trim() === selectedMunicipality.name.toLowerCase().trim()))
  );

  // Sorted municipalities for select dropdown: cities with registered cards / interactions first
  const sortedMunicipalitiesForSelect = [...municipalities].sort((a, b) => {
    const countA = (crmInteractions || []).filter(
      (i) =>
        i &&
        (i.municipalityId === a.id ||
          (i.municipalityId && a.id && i.municipalityId.toLowerCase() === a.id.toLowerCase()) ||
          (i.municipalityName && a.name && i.municipalityName.toLowerCase().trim() === a.name.toLowerCase().trim()))
    ).length;
    const countB = (crmInteractions || []).filter(
      (i) =>
        i &&
        (i.municipalityId === b.id ||
          (i.municipalityId && b.id && i.municipalityId.toLowerCase() === b.id.toLowerCase()) ||
          (i.municipalityName && b.name && i.municipalityName.toLowerCase().trim() === b.name.toLowerCase().trim()))
    ).length;
    if (countB !== countA) return countB - countA;
    return (a.name || '').localeCompare(b.name || '');
  });

  const cityVisitsCount = cityInteractions.filter((i) => i.type === 'visita').length;

  // As 3 funções do app — mesma navegação principal do Sidebar, só que com atalho para a cidade ativa
  const actionButtons = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Oportunidades',
      icon: SearchCheck,
      color: 'bg-indigo-600 text-white hover:bg-indigo-500',
    },
    {
      id: 'field_visits' as ActiveTab,
      label: `Roteiro de Campo (${cityVisitsCount})`,
      icon: Compass,
      color: 'bg-emerald-600 text-white hover:bg-emerald-500',
    },
    {
      id: 'crm' as ActiveTab,
      label: `CRM (${cityInteractions.length})`,
      icon: MessageSquare,
      color: 'bg-amber-600 text-white hover:bg-amber-500',
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

            <div className="relative flex items-center gap-2 mt-0.5 w-full">
              <select
                value={selectedMunicipality.id}
                onChange={(e) => {
                  const m = municipalities.find((item) => item.id === e.target.value);
                  if (m) onSelectMunicipality(m);
                }}
                className="bg-slate-800 text-white font-black text-xs sm:text-sm border border-slate-700 rounded-lg px-2 py-1 pr-7 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer w-full max-w-full sm:max-w-xs truncate"
              >
                {sortedMunicipalitiesForSelect.map((m) => {
                  const cardCount = (crmInteractions || []).filter(
                    (i) =>
                      i &&
                      (i.municipalityId === m.id ||
                        (i.municipalityId && m.id && i.municipalityId.toLowerCase() === m.id.toLowerCase()) ||
                        (i.municipalityName && m.name && i.municipalityName.toLowerCase().trim() === m.name.toLowerCase().trim()))
                  ).length;
                  return (
                    <option key={m.id} value={m.id}>
                      Prefeitura de {m.name} ({m.state}) {cardCount > 0 ? `🎴 (${cardCount} cartões)` : '⚪'} — {m.currentSystem}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={handleOpenEdit}
                className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                title="Editar Nome e Estado da Cidade Ativa"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Nome</span>
              </button>
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
            <strong className="text-blue-200 font-extrabold text-xs">{selectedMunicipality.currentSystem || 'N/I'}</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimento:</span>
            <strong className="text-red-300 font-extrabold text-xs">{selectedMunicipality.contractDaysRemaining ?? 0}d</strong>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Alunos:</span>
            <strong className="text-emerald-300 font-extrabold text-xs">
              {(selectedMunicipality.educationalMetrics?.studentsCount || Math.round((selectedMunicipality.population || 0) / 4)).toLocaleString('pt-BR')}
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

      {/* Modal para Editar Nome do Município Selecionado */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base">Editar Nome da Prefeitura</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCityEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nome Oficial da Prefeitura / Cidade <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cityNameInput}
                  onChange={(e) => setCityNameInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Ex: Codó"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Estado (UF) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={cityStateInput}
                  onChange={(e) => setCityStateInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="MA"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
