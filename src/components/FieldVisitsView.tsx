import React, { useState } from 'react';
import { Municipality, CRMInteraction, FunnelStage } from '../types';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import { AICitySearchModal } from './AICitySearchModal';
import { 
  Navigation, 
  MapPin, 
  Building, 
  PhoneCall, 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  Compass, 
  Sparkles, 
  Calendar, 
  User, 
  Clock, 
  TrendingUp, 
  Send, 
  CheckCircle2, 
  Kanban, 
  Share2, 
  FileText, 
  X, 
  ArrowRight, 
  Bot, 
  Eye, 
  Star, 
  Check,
  Filter,
  Layers,
  Award,
  ChevronRight,
  Loader2,
  Database
} from 'lucide-react';

interface FieldVisitsViewProps {
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  onAddCRMInteraction: (newInteraction: CRMInteraction) => void;
  onUpdateFunnelStage: (municipalityId: string, newStage: FunnelStage) => void;
  onSelectMunicipality: (m: Municipality) => void;
  onNavigateTab: (tab: string) => void;
  onAddMunicipality: (newMuni: Municipality) => void;
  selectedMunicipality?: Municipality | null;
}

export const FieldVisitsView: React.FC<FieldVisitsViewProps> = ({
  municipalities,
  crmInteractions,
  onAddCRMInteraction,
  onUpdateFunnelStage,
  onSelectMunicipality,
  onNavigateTab,
  onAddMunicipality,
  selectedMunicipality,
}) => {
  // 1. Current State Filter (default to selected state or first available)
  const availableStates = Array.from(new Set(municipalities.map((m) => m.state))).sort();
  const [selectedState, setSelectedState] = useState<string>(selectedMunicipality?.state || 'MA');

  // AI City Search Modal State
  const [isAiSearchModalOpen, setIsAiSearchModalOpen] = useState(false);
  const [searchModalCity, setSearchModalCity] = useState('');
  const [searchModalState, setSearchModalState] = useState('MA');

  // 2. Multi-selected cities for Travel Itinerary (Roteiro de Viagem)
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);

  // 3. Active City in Focus for "Cheguei na Cidade" Workflow
  const [activeCityId, setActiveCityId] = useState<string | null>(selectedMunicipality?.id || null);

  React.useEffect(() => {
    if (selectedMunicipality) {
      setActiveCityId(selectedMunicipality.id);
      setSelectedState(selectedMunicipality.state);
    } else if (municipalities.length > 0 && !activeCityId) {
      setActiveCityId(municipalities[0].id);
      setSelectedState(municipalities[0].state);
    }
  }, [selectedMunicipality, municipalities]);

  // 4. Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<'all' | 'maxima' | 'muito_quente' | 'quente' | 'monitorar' | 'baixa'>('all');

  // 5. Cartão de Visita / New Interaction Modal
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitMuniId, setVisitMuniId] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Secretária de Educação');
  const [contactPhone, setContactPhone] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [visitDescription, setVisitDescription] = useState('');
  const [visitOutcome, setVisitOutcome] = useState<CRMInteraction['outcome']>('positivo');
  const [visitNextStep, setVisitNextStep] = useState('');
  const [visitNextStepDueDate, setVisitNextStepDueDate] = useState('');
  const [visitDealOwner, setVisitDealOwner] = useState('José Badotti');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // AI Copilot for current active city
  const [isAiPitchOpen, setIsAiPitchOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Classify all municipalities with Score & Temperature Range
  const classifiedMunicipalities = municipalities
    .map((m) => {
      const scoreBreakdown = calculateCommercialScore(m);
      const score = scoreBreakdown.finalScore;
      const mInteractions = crmInteractions.filter((i) => i.municipalityId === m.id);
      const lastInteraction = mInteractions[0] || null;

      let tempCategory: 'maxima' | 'muito_quente' | 'quente' | 'monitorar' | 'baixa' = 'baixa';
      let tempMeta = {
        label: '🔴 Fria / Baixa',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        short: 'Fria',
        color: 'text-slate-600',
      };

      if (score >= 95) {
        tempCategory = 'maxima';
        tempMeta = {
          label: '⭐ PRIORIDADE MÁXIMA (95+ pts)',
          badge: 'bg-purple-100 text-purple-900 border-purple-300 font-black ring-2 ring-purple-400/30',
          short: '🔥 Prioridade Máxima',
          color: 'text-purple-900',
        };
      } else if (score >= 80) {
        tempCategory = 'muito_quente';
        tempMeta = {
          label: '🟢 MUITO QUENTE (80-94 pts)',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
          short: '🟢 Muito Quente',
          color: 'text-emerald-900',
        };
      } else if (score >= 60) {
        tempCategory = 'quente';
        tempMeta = {
          label: '🟡 QUENTE (60-79 pts)',
          badge: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
          short: '🟡 Quente',
          color: 'text-amber-900',
        };
      } else if (score >= 40) {
        tempCategory = 'monitorar';
        tempMeta = {
          label: '🟠 MONITORAR CONTRATO (40-59 pts)',
          badge: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
          short: '🟠 Monitorar',
          color: 'text-orange-900',
        };
      }

      return {
        m,
        score,
        scoreBreakdown,
        tempCategory,
        tempMeta,
        mInteractions,
        lastInteraction,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Filtered list by Selected State + Search + Temperature Tab
  const stateMunicipalities = classifiedMunicipalities.filter(({ m, tempCategory }) => {
    const matchesState = !selectedState || m.state === selectedState;
    const matchesSearch =
      !searchTerm ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.currentSystem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemp = tempFilter === 'all' || tempCategory === tempFilter;

    return matchesState && matchesSearch && matchesTemp;
  });

  // Currently focused municipality object
  const activeMunicipalityData = classifiedMunicipalities.find(({ m }) => m.id === activeCityId);

  // Toggle city selection for travel itinerary
  const toggleCitySelection = (id: string) => {
    setSelectedCityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible cities in current state
  const handleSelectAllInState = () => {
    const stateIds = stateMunicipalities.map(({ m }) => m.id);
    const allSelected = stateIds.every((id) => selectedCityIds.includes(id));
    if (allSelected) {
      setSelectedCityIds((prev) => prev.filter((id) => !stateIds.includes(id)));
    } else {
      setSelectedCityIds((prev) => Array.from(new Set([...prev, ...stateIds])));
    }
  };

  // Open "Criar Cartão de Visita" Modal
  const handleOpenVisitModalForCity = (m: Municipality) => {
    setVisitMuniId(m.id);
    setContactName(m.keyContacts?.[0]?.name || 'Secretária de Educação');
    setContactRole(m.keyContacts?.[0]?.role || 'Secretária de Educação');
    setContactPhone(m.keyContacts?.[0]?.phone || '');
    setVisitSummary(`Visita Presencial ao Gabinete / Secretaria de Educação em ${m.name}`);
    setVisitDescription(
      `Realizada reunião comercial presencial na Prefeitura de ${m.name} (${m.state}). Apresentada a plataforma SICAP de Gestão Escolar e Diário Eletrônico Offline.`
    );
    setVisitOutcome('positivo');
    setVisitNextStep('Enviar proposta comercial / minuta de ARP');
    setVisitNextStepDueDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setVisitDealOwner('José Badotti');
    setIsVisitModalOpen(true);
  };

  // Save Cartão de Visita
  const handleSaveVisitModal = (e: React.FormEvent) => {
    e.preventDefault();
    const m = municipalities.find((item) => item.id === visitMuniId);
    if (!m || !contactName.trim() || !visitSummary.trim()) return;

    const newInteraction: CRMInteraction = {
      id: `cartao-visita-${Date.now()}`,
      municipalityId: m.id,
      municipalityName: m.name,
      state: m.state,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: 'visita',
      contactName,
      contactRole,
      summary: visitSummary,
      description: `🎴 CARTÃO DE VISITA EM CAMPO:\nContato: ${contactName} (${contactRole}) - Tel: ${contactPhone}\n\n${visitDescription}`,
      outcome: visitOutcome,
      nextStep: visitNextStep || undefined,
      nextStepDueDate: visitNextStepDueDate || undefined,
      dealOwner: visitDealOwner,
    };

    onAddCRMInteraction(newInteraction);
    setIsVisitModalOpen(false);
    setActiveCityId(m.id);
    showToast(`🎴 Cartão de Visita gravado para Prefeitura de ${m.name}!`);
  };

  // Ask AI Pitch
  const handleAskAiPitch = async (m: Municipality) => {
    setIsAiLoading(true);
    setAiResponseText('');
    try {
      const res = await fetch('/api/ai/pitch-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Roteiro de Abordagem para Visita Presencial em ${m.name} (${m.state}). Concorrente: ${m.currentSystem}. Dias para vencer contrato: ${m.contractDaysRemaining}.`,
          context: {
            municipality: m.name,
            state: m.state,
            competitor: m.currentSystem,
            students: m.educationalMetrics?.studentsCount || Math.round(m.population / 4),
            ioScore: m.ioScore,
          },
        }),
      });

      const json = await res.json();
      setAiResponseText(
        json.text ||
          `Em ${m.name}, foque na demonstração do Diário Eletrônico Offline do SICAP e na garantia de transição sem perda de dados do Educacenso.`
      );
    } catch (e) {
      console.error(e);
      setAiResponseText('Erro ao carregar roteiro da IA. Apresente os diferenciais do Diário Eletrônico Offline.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Count metrics for header
  const totalStateCities = stateMunicipalities.length;
  const maximaCount = stateMunicipalities.filter((item) => item.tempCategory === 'maxima').length;
  const muitoQuenteCount = stateMunicipalities.filter((item) => item.tempCategory === 'muito_quente').length;
  const quenteCount = stateMunicipalities.filter((item) => item.tempCategory === 'quente').length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-purple-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-white">{toastMessage}</p>
            <p className="text-[11px] text-slate-300">Ação registrada com sucesso no aplicativo.</p>
          </div>
        </div>
      )}

      {/* Main Header & State Selector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-blue-900/50 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Navegação & Rota de Vendas em Campo</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Roteiro de Campo & Probabilidade de Vendas
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Selecione o estado em que você está para visualizar as cidades ordenadas por <strong>faixa de temperatura (maior probabilidade de fechamento)</strong>. Selecione as cidades desejadas e gere o seu roteiro de viagem.
          </p>
        </div>

        {/* State Selector Box */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3 min-w-[280px]">
          <div>
            <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wider mb-1">
              📍 Estado Atual em Campo (UF):
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCityIds([]);
                setActiveCityId(null);
              }}
              className="w-full bg-slate-900 text-white border border-amber-400/50 rounded-xl px-4 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-lg"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st === 'PI' ? 'Piauí (PI)' : st === 'MA' ? 'Maranhão (MA)' : st === 'CE' ? 'Ceará (CE)' : st === 'SC' ? 'Santa Catarina (SC)' : st}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchModalCity(searchTerm || 'Codó');
              setSearchModalState(selectedState || 'MA');
              setIsAiSearchModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-900 shrink-0" />
            <span>+ Analisar & Cadastrar Cidade com IA</span>
          </button>

          <div className="text-[11px] text-slate-300 font-medium text-center">
            {totalStateCities} cidades mapeadas em <strong>{selectedState}</strong>
          </div>
        </div>
      </div>

      {/* Floating Action Header Bar for Travel Itinerary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-2 z-20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Seleção de Cidades para Rota:</span>
          </span>
          <span className="bg-blue-100 text-blue-900 text-xs font-black px-3 py-1 rounded-full border border-blue-200">
            {selectedCityIds.length} selecionada(s)
          </span>

          <button
            onClick={handleSelectAllInState}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline ml-2"
          >
            {stateMunicipalities.every(({ m }) => selectedCityIds.includes(m.id))
              ? 'Desmarcar Todas do Estado'
              : 'Selecionar Cidades Prioritárias do Estado'}
          </button>
        </div>

        {/* Generate Travel Itinerary Button */}
        <button
          onClick={() => setIsItineraryModalOpen(true)}
          disabled={selectedCityIds.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-900/20 active:scale-95 disabled:shadow-none"
        >
          <Navigation className="w-4 h-4" />
          <span>🚗 Gerar Roteiro de Viagem ({selectedCityIds.length})</span>
        </button>
      </div>

      {/* Temperature Range Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Faixa de Temperatura:</span>

            <button
              onClick={() => setTempFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                tempFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas ({totalStateCities})
            </button>

            <button
              onClick={() => setTempFilter('maxima')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                tempFilter === 'maxima'
                  ? 'bg-purple-900 text-white ring-2 ring-purple-400'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              ⭐ Prioridade Máxima ({maximaCount})
            </button>

            <button
              onClick={() => setTempFilter('muito_quente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                tempFilter === 'muito_quente'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
              }`}
            >
              🟢 Muito Quente ({muitoQuenteCount})
            </button>

            <button
              onClick={() => setTempFilter('quente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                tempFilter === 'quente'
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              🟡 Quente ({quenteCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cidade ou sistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left = City Selector List with Temperature Range, Right = Active City Field Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Cities Classified by Temperature Range */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 bg-slate-200/70 px-4 py-2.5 rounded-xl">
            <span>Cidades em {selectedState} (Ordenadas por Score IO)</span>
            <span className="text-slate-500">{stateMunicipalities.length} cidades</span>
          </div>

          {stateMunicipalities.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-50 to-purple-50/50 p-8 rounded-2xl border border-purple-200 text-center space-y-4">
              <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl w-fit mx-auto border border-purple-200">
                <Sparkles className="w-8 h-8 text-purple-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">
                  Nenhuma cidade encontrada para estes filtros em {selectedState}.
                </p>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Deseja lançar <strong>"{searchTerm || 'Codó'}"</strong> no CRM para extrair inteligência de vendas, concorrente e contatos da Secretaria?
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchModalCity(searchTerm || 'Codó');
                  setSearchModalState(selectedState || 'MA');
                  setIsAiSearchModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-900/20 inline-flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analisar "{searchTerm || 'Codó'}" com IA & Cadastrar no CRM</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
              {stateMunicipalities.map(({ m, score, tempMeta, lastInteraction }) => {
                const isSelectedForItinerary = selectedCityIds.includes(m.id);
                const isActiveInWorkstation = activeCityId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl border p-4 transition-all shadow-sm space-y-3 cursor-pointer ${
                      isActiveInWorkstation
                        ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20'
                        : isSelectedForItinerary
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setActiveCityId(m.id);
                      onSelectMunicipality(m);
                    }}
                  >
                    {/* Top Header: Checkbox + Name + Temperature Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Checkbox for Itinerary */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCitySelection(m.id);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          {isSelectedForItinerary ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900">
                              Prefeitura de {m.name} ({m.state})
                            </h3>
                          </div>

                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                            <span>Sistema: <strong className="text-blue-900">{m.currentSystem}</strong></span>
                            <span>•</span>
                            <span>Alunos: <strong>{(m.educationalMetrics?.studentsCount || Math.round(m.population / 4)).toLocaleString('pt-BR')}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Temperature Badge */}
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${tempMeta.badge}`}>
                        {tempMeta.short} ({score.toFixed(0)} pts)
                      </span>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Vencimento Contrato</span>
                        <span className={`font-extrabold ${m.contractDaysRemaining <= 60 ? 'text-red-700' : 'text-slate-800'}`}>
                          {m.contractDaysRemaining <= 0 ? 'Expirado / Licitação' : `${m.contractDaysRemaining} dias`}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Estágio no Funil</span>
                        <span className="font-extrabold text-blue-900 capitalize">
                          {m.funnelStage.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVisitModalForCity(m);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>🎴 Criar Cartão de Visita</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCityId(m.id);
                          onSelectMunicipality(m);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                      >
                        <span>Abrir Cidade</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active City Field Workstation (Onde o vendedor gerencia a cidade atual) */}
        <div className="lg:col-span-7 space-y-6">
          {activeMunicipalityData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
              
              {/* City Workstation Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
                      UF: {activeMunicipalityData.m.state}
                    </span>
                    <span className={`text-[10px] px-3 py-0.5 rounded-full border ${activeMunicipalityData.tempMeta.badge}`}>
                      {activeMunicipalityData.tempMeta.label}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    Prefeitura de {activeMunicipalityData.m.name} ({activeMunicipalityData.m.state})
                  </h2>

                  <div className="text-xs text-slate-500 font-semibold mt-1 flex flex-wrap items-center gap-3">
                    <span>Concorrente: <strong className="text-blue-900">{activeMunicipalityData.m.currentSystem}</strong></span>
                    <span>•</span>
                    <span>Alunos: <strong className="text-slate-800">{(activeMunicipalityData.m.educationalMetrics?.studentsCount || Math.round(activeMunicipalityData.m.population / 4)).toLocaleString('pt-BR')}</strong></span>
                    <span>•</span>
                    <span>Vencimento: <strong className="text-red-700">{activeMunicipalityData.m.contractDaysRemaining} dias</strong></span>
                  </div>
                </div>

                {/* Score badge */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl text-center border border-slate-800 shadow-inner min-w-[120px]">
                  <span className="text-[9px] font-extrabold text-slate-400 block uppercase">Score IO</span>
                  <span className="text-2xl font-black text-amber-400">
                    {activeMunicipalityData.score.toFixed(0)} <span className="text-xs text-slate-400">/100</span>
                  </span>
                </div>
              </div>

              {/* ACTION STEP 1: FUNNEL STAGE SELECTOR (Colocar no Funil) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Kanban className="w-4 h-4 text-amber-600" />
                    <span>1. Estágio Atual no Funil Comercial:</span>
                  </span>
                  <span className="text-xs font-extrabold text-blue-900 capitalize">
                    {activeMunicipalityData.m.funnelStage.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'prospectado', label: '1. Prospecção' },
                    { id: 'contato_inicial', label: '2. Qualificação' },
                    { id: 'reuniao_agendada', label: '3. Apresentação' },
                    { id: 'proposta_enviada', label: '4. Minuta / ARP' },
                    { id: 'negociacao', label: '5. Negociação' },
                    { id: 'fechado_ganho', label: '6. Fechado / Ganho' },
                  ].map((stage) => {
                    const isCurrent = activeMunicipalityData.m.funnelStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        onClick={() => {
                          onUpdateFunnelStage(activeMunicipalityData.m.id, stage.id as FunnelStage);
                          showToast(`Funil de ${activeMunicipalityData.m.name} alterado para "${stage.label}"!`);
                        }}
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs text-center transition-all border ${
                          isCurrent
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {stage.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION STEP 2: CRIAR CARTÃO DE VISITA BUTTON */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-md">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>2. Chegou na cidade? Registre a Visita</span>
                  </h4>
                  <p className="text-xs text-emerald-100">
                    Crie o cartão de visita presencial, contatos e próximos passos.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenVisitModalForCity(activeMunicipalityData.m)}
                  className="bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                >
                  🎴 Criar Cartão de Visita Presencial
                </button>
              </div>

              {/* ACTION STEP 3: PITCH IA E ESTRATÉGIA DA CIDADE */}
              <div className="bg-purple-950 text-white p-4 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="font-extrabold text-xs uppercase text-purple-200">
                      Roteiro de Abordagem Personalizado IA
                    </h4>
                  </div>
                  <button
                    onClick={() => handleAskAiPitch(activeMunicipalityData.m)}
                    disabled={isAiLoading}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>Gerar Argumentos com IA</span>
                  </button>
                </div>

                {aiResponseText ? (
                  <div className="bg-slate-900/90 p-3.5 rounded-xl text-xs text-purple-100 leading-relaxed border border-purple-800/40 whitespace-pre-wrap">
                    {aiResponseText}
                  </div>
                ) : (
                  <p className="text-xs text-purple-300 italic">
                    Clique no botão acima para gerar o roteiro e os pontos de abordagem para a visita presencial.
                  </p>
                )}
              </div>

              {/* ACTION STEP 4: MONITORAR HISTÓRICOS DA CIDADE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>3. Histórico de Interações desta Cidade ({activeMunicipalityData.mInteractions.length})</span>
                  </h3>
                </div>

                {activeMunicipalityData.mInteractions.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                    <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">Nenhuma visita ou ligação registrada para esta cidade ainda.</p>
                    <button
                      onClick={() => handleOpenVisitModalForCity(activeMunicipalityData.m)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Registrar a primeira visita
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {activeMunicipalityData.mInteractions.map((item) => (
                      <div key={item.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[10px] uppercase font-black">
                              {item.type}
                            </span>
                            <span>{item.summary}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">{item.date}</span>
                        </div>

                        <p className="text-slate-600 leading-snug whitespace-pre-wrap">{item.description}</p>

                        <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                          <span>Contato: <strong className="text-slate-800">{item.contactName}</strong> ({item.contactRole})</span>
                          {item.nextStep && (
                            <span className="text-emerald-700 font-bold">Próximo Passo: {item.nextStep}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <Navigation className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Selecione uma cidade na lista ao lado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique em qualquer cidade da lista de {selectedState} para visualizar os dados completos, atualizar o estágio no funil, criar cartão de visita e monitorar o histórico.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ROTEIRO DE VIAGEM MODAL */}
      {isItineraryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Roteiro de Viagem Comercial — Estado: {selectedState}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCityIds.length} cidade(s) selecionada(s) ordenadas por prioridade de vendas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsItineraryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist de Campo */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs space-y-1.5">
              <span className="font-extrabold text-amber-900 block uppercase text-[10px]">
                📋 Checklist para o Vendedor em Campo:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Minuta de Adesão à Ata (ARP) impressa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Apresentação Comercial SICAP no Tablet/Note</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Demonstração Diário Eletrônico Offline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Termo de Notória Especialização</span>
                </div>
              </div>
            </div>

            {/* Selected Cities Sequence List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedCityIds.map((id, index) => {
                const item = classifiedMunicipalities.find(({ m }) => m.id === id);
                if (!item) return null;
                const { m, score, tempMeta } = item;

                return (
                  <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Prefeitura de {m.name} ({m.state})
                        </h4>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                          <span>Sistema: <strong>{m.currentSystem}</strong></span>
                          <span>•</span>
                          <span>Alunos: <strong>{(m.educationalMetrics?.studentsCount || Math.round(m.population / 4)).toLocaleString('pt-BR')}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border ${tempMeta.badge}`}>
                        {tempMeta.short}
                      </span>

                      <button
                        onClick={() => {
                          setActiveCityId(m.id);
                          setIsItineraryModalOpen(false);
                          handleOpenVisitModalForCity(m);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all"
                      >
                        Cheguei na Cidade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const text = `Roteiro de Viagem SICAP (${selectedState}):\n` + selectedCityIds.map((id, idx) => {
                    const found = municipalities.find(m => m.id === id);
                    return `${idx+1}. ${found?.name} (${found?.state}) - ${found?.currentSystem}`;
                  }).join('\n');
                  navigator.clipboard.writeText(text);
                  showToast('Roteiro copiado para a área de transferência!');
                }}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Copiar Roteiro em Texto</span>
              </button>

              <button
                onClick={() => setIsItineraryModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 py-2.5 rounded-xl"
              >
                Iniciar Rota de Viagem
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CARTÃO DE VISITA PRESENCIAL MODAL */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Criar Cartão de Visita Presencial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lançar reunião presencial e contatos da prefeitura
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsVisitModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitModal} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nome do Contato Visitado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Maria das Graças"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Secretária de Educação / Prefeito"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ex: (86) 99988-7766"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Resultado da Reunião</label>
                  <select
                    value={visitOutcome}
                    onChange={(e) => setVisitOutcome(e.target.value as CRMInteraction['outcome'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="positivo">🟢 Reunião Positiva / Avanço</option>
                    <option value="neutro">🟡 Informativo</option>
                    <option value="critico">🔴 Objeção / Risco</option>
                    <option value="aguardando_retorno">⏳ Aguardando Retorno</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Resumo da Visita *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião no Gabinete com Secretária e equipe pedagógica"
                  value={visitSummary}
                  onChange={(e) => setVisitSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Detalhamento & Notas de Campo</label>
                <textarea
                  rows={3}
                  placeholder="Descreva os assuntos tratados, dores apresentadas e interesse em Diário Eletrônico..."
                  value={visitDescription}
                  onChange={(e) => setVisitDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Próximo Passo Agendado</label>
                  <input
                    type="text"
                    placeholder="Ex: Enviar minuta ARP por e-mail"
                    value={visitNextStep}
                    onChange={(e) => setVisitNextStep(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Data do Follow-Up</label>
                  <input
                    type="date"
                    value={visitNextStepDueDate}
                    onChange={(e) => setVisitNextStepDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl shadow-md active:scale-95"
                >
                  Salvar Cartão de Visita
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal for AI Search & Analyze New Municipality */}
      <AICitySearchModal
        isOpen={isAiSearchModalOpen}
        onClose={() => setIsAiSearchModalOpen(false)}
        onAddMunicipality={(newMuni) => {
          onAddMunicipality(newMuni);
          setSelectedState(newMuni.state);
          setActiveCityId(newMuni.id);
          showToast(`🎉 Prefeitura de ${newMuni.name} (${newMuni.state}) adicionada com sucesso ao Roteiro & CRM!`);
        }}
        initialCityName={searchModalCity}
        initialState={searchModalState}
        onSelectAndNavigate={(muni) => {
          onSelectMunicipality(muni);
        }}
      />

    </div>
  );
};
