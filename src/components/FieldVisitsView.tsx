import React, { useState } from 'react';
import { Municipality, CRMInteraction } from '../types';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import { openGoogleCalendar, formatCardDetailsForCalendar } from '../utils/googleCalendar';
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
  Pencil,
  Trash2,
  Filter,
  Layers,
  Award,
  ChevronRight,
  Loader2,
  Database,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

interface FieldVisitsViewProps {
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  onAddCRMInteraction: (newInteraction: CRMInteraction) => void;
  onEditCRMInteraction?: (updatedInteraction: CRMInteraction) => void;
  onDeleteCRMInteraction?: (id: string) => void;
  onUpdateMunicipality?: (updated: Municipality) => void;
  onSelectMunicipality: (m: Municipality) => void;
  onNavigateTab: (tab: string) => void;
  onAddMunicipality: (newMuni: Municipality) => void;
  selectedMunicipality?: Municipality | null;
}

export const FieldVisitsView: React.FC<FieldVisitsViewProps> = ({
  municipalities,
  crmInteractions,
  onAddCRMInteraction,
  onEditCRMInteraction,
  onDeleteCRMInteraction,
  onUpdateMunicipality,
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

  // 4. Filters, Search & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<'all' | 'maxima' | 'muito_quente' | 'quente' | 'monitorar' | 'baixa'>('all');
  const [sortBy, setSortBy] = useState<'cards' | 'score' | 'recente' | 'nome'>('cards');

  // 5. Cartão de Visita / Interaction Modal State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<CRMInteraction | null>(null);
  const [visitMuniId, setVisitMuniId] = useState<string>('');
  const [visitMuniName, setVisitMuniName] = useState<string>('');
  const [visitState, setVisitState] = useState<string>('MA');
  const [visitType, setVisitType] = useState<CRMInteraction['type']>('visita');
  const [visitDate, setVisitDate] = useState<string>('');
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

  // Dedicated City Name & Official Data Editing Modal State (Passo 2 · Corrigir Dados)
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
  const [editingCityTarget, setEditingCityTarget] = useState<Municipality | null>(null);
  const [editCityName, setEditCityName] = useState('');
  const [editCityState, setEditCityState] = useState('MA');
  const [editCitySystem, setEditCitySystem] = useState('');
  const [editSchoolsCount, setEditSchoolsCount] = useState('');
  const [editStudentsCount, setEditStudentsCount] = useState('');
  const [editContractValue, setEditContractValue] = useState('');
  const [editBuyingCompany, setEditBuyingCompany] = useState('');
  const [editContractDate, setEditContractDate] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');

  const handleOpenEditCityModal = (m: Municipality) => {
    setEditingCityTarget(m);
    setEditCityName(m.name);
    setEditCityState(m.state);
    setEditCitySystem(m.currentSystem || 'Ainda sem contrato');
    setEditSchoolsCount(m.educationalMetrics?.schoolsCount != null ? String(m.educationalMetrics.schoolsCount) : '');
    setEditStudentsCount(m.educationalMetrics?.studentsCount != null ? String(m.educationalMetrics.studentsCount) : '');
    setEditContractValue(m.currentContractValue != null ? String(m.currentContractValue) : '');
    setEditBuyingCompany(m.buyingHistory?.[0]?.company || '');
    setEditContractDate(m.buyingHistory?.[0]?.contractDate || '');
    setEditContactName(m.keyContacts?.[0]?.name || '');
    setEditContactPhone(m.keyContacts?.[0]?.phone || '');
    setIsEditCityModalOpen(true);
  };

  const handleSaveCityModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCityTarget || !editCityName.trim()) return;

    const existingHistory = editingCityTarget.buyingHistory || [];
    const updatedFirstHistoryEntry = {
      year: editContractDate
        ? Number(editContractDate.slice(0, 4)) || existingHistory[0]?.year || new Date().getFullYear()
        : existingHistory[0]?.year || new Date().getFullYear(),
      company: editBuyingCompany.trim() || existingHistory[0]?.company || 'Não localizado em fonte oficial',
      value: Number(editContractValue) || existingHistory[0]?.value || 0,
      objectStr: existingHistory[0]?.objectStr || 'Locação/Licenciamento de software de gestão pública escolar',
      modality: existingHistory[0]?.modality || editingCityTarget.probableModality,
      addendumsCount: existingHistory[0]?.addendumsCount,
      contractDate: editContractDate.trim() || existingHistory[0]?.contractDate,
    };

    const updatedMuni: Municipality = {
      ...editingCityTarget,
      name: editCityName.trim(),
      state: editCityState.trim().toUpperCase(),
      currentSystem: editCitySystem.trim() || editingCityTarget.currentSystem,
      currentContractValue: Number(editContractValue) || editingCityTarget.currentContractValue,
      educationalMetrics: {
        ...editingCityTarget.educationalMetrics,
        schoolsCount: editSchoolsCount ? Number(editSchoolsCount) : editingCityTarget.educationalMetrics?.schoolsCount,
        studentsCount: editStudentsCount ? Number(editStudentsCount) : editingCityTarget.educationalMetrics?.studentsCount,
      },
      buyingHistory: [updatedFirstHistoryEntry, ...existingHistory.slice(1)],
      keyContacts: [
        {
          ...(editingCityTarget.keyContacts?.[0] || { role: 'Secretário(a) de Educação' }),
          name: editContactName.trim() || editingCityTarget.keyContacts?.[0]?.name || 'Secretário(a) de Educação',
          phone: editContactPhone.trim() || editingCityTarget.keyContacts?.[0]?.phone,
        },
        ...(editingCityTarget.keyContacts || []).slice(1),
      ],
    };

    if (onUpdateMunicipality) {
      onUpdateMunicipality(updatedMuni);
    }
    if (activeCityId === editingCityTarget.id) {
      onSelectMunicipality(updatedMuni);
    }
    setIsEditCityModalOpen(false);
    showToast(`✏️ Dados de ${updatedMuni.name} (${updatedMuni.state}) corrigidos e salvos com sucesso!`);
  };

  // AI Copilot for current active city
  const [isAiPitchOpen, setIsAiPitchOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Filter inside active city's interaction history
  const [interactionSearchTerm, setInteractionSearchTerm] = useState('');
  const [interactionTypeFilter, setInteractionTypeFilter] = useState<string>('all');

  // Smooth scroll to city workstation when opening a city on mobile or desktop
  const handleOpenCity = (m: Municipality) => {
    if (!m) return;
    setActiveCityId(m.id);
    if (onSelectMunicipality) {
      onSelectMunicipality(m);
    }
    showToast(`📍 Cidade de ${m.name} (${m.state}) aberta! Cartões de visita e histórico carregados abaixo.`);
    setTimeout(() => {
      const el = document.getElementById('active-city-workstation');
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100;
        window.scrollTo({ top: targetY > 0 ? targetY : 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Classify all municipalities with Score & Temperature Range
  const classifiedMunicipalities = municipalities
    .map((m) => {
      const scoreBreakdown = calculateCommercialScore(m);
      const score = scoreBreakdown.finalScore;
      const mInteractions = (crmInteractions || []).filter(
        (i) =>
          i &&
          (i.municipalityId === m.id ||
            (i.municipalityId && m.id && i.municipalityId.toLowerCase() === m.id.toLowerCase()) ||
            (i.municipalityName && m.name && i.municipalityName.toLowerCase().trim() === m.name.toLowerCase().trim()))
      );
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
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Filtered and Sorted list by Selected State + Search + Temperature Tab + Sort Mode
  const stateMunicipalities = classifiedMunicipalities
    .filter(({ m, tempCategory }) => {
      if (!m) return false;
      const matchesState = !selectedState || m.state === selectedState;
      const matchesSearch =
        !searchTerm ||
        (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.currentSystem || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTemp = tempFilter === 'all' || tempCategory === tempFilter;

      return matchesState && matchesSearch && matchesTemp;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortBy === 'cards') {
        // Priority 1: Number of registered cards / interactions (descending)
        const countA = (a.mInteractions || []).length;
        const countB = (b.mInteractions || []).length;
        const countDiff = countB - countA;
        if (countDiff !== 0) return countDiff;
        // Tie-breaker: Commercial Score IO
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === 'score') {
        // Priority 1: Commercial Score IO (descending)
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.mInteractions || []).length - (a.mInteractions || []).length;
      }
      if (sortBy === 'recente') {
        // Priority 1: Date of most recent interaction
        const dateA = a.lastInteraction?.date || '';
        const dateB = b.lastInteraction?.date || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateB) return 1;
        if (dateA) return -1;
        return (b.mInteractions || []).length - (a.mInteractions || []).length;
      }
      if (sortBy === 'nome') {
        return (a.m?.name || '').localeCompare(b.m?.name || '', 'pt-BR');
      }
      return 0;
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
    setEditingInteraction(null);
    setVisitMuniId(m.id);
    setVisitMuniName(m.name);
    setVisitState(m.state);
    setVisitType('visita');
    setVisitDate(new Date().toISOString().slice(0, 16).replace('T', ' '));
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

  // Open "Editar Cartão de Visita" Modal for an existing interaction
  const handleOpenEditModalForInteraction = (item: CRMInteraction) => {
    setEditingInteraction(item);
    setVisitMuniId(item.municipalityId);
    setVisitMuniName(item.municipalityName);
    setVisitState(item.state || 'MA');
    setVisitType(item.type || 'visita');
    setVisitDate(item.date || new Date().toISOString().slice(0, 16).replace('T', ' '));
    setContactName(item.contactName || '');
    setContactRole(item.contactRole || 'Secretária de Educação');
    setContactPhone('');
    setVisitSummary(item.summary || '');
    setVisitDescription(item.description || '');
    setVisitOutcome(item.outcome || 'positivo');
    setVisitNextStep(item.nextStep || '');
    setVisitNextStepDueDate(item.nextStepDueDate || '');
    setVisitDealOwner(item.dealOwner || 'José Badotti');
    setIsVisitModalOpen(true);
  };

  // Delete an interaction
  const handleDeleteInteraction = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cartão de visita de ${name}?`)) {
      if (onDeleteCRMInteraction) {
        onDeleteCRMInteraction(id);
        showToast('🗑️ Cartão de visita excluído com sucesso.');
      }
    }
  };

  // Save Cartão de Visita (Create or Edit)
  const handleSaveVisitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitMuniName.trim() || !contactName.trim() || !visitSummary.trim()) {
      showToast('⚠️ Preencha Nome da Cidade, Nome do Contato e Resumo.');
      return;
    }

    if (editingInteraction) {
      // EDIT MODE
      const updatedInteraction: CRMInteraction = {
        ...editingInteraction,
        municipalityId: visitMuniId || editingInteraction.municipalityId,
        municipalityName: visitMuniName.trim(),
        state: visitState.trim().toUpperCase(),
        date: visitDate || editingInteraction.date,
        type: visitType,
        contactName: contactName.trim(),
        contactRole: contactRole.trim(),
        summary: visitSummary.trim(),
        description: visitDescription.trim(),
        outcome: visitOutcome,
        nextStep: visitNextStep.trim() || undefined,
        nextStepDueDate: visitNextStepDueDate || undefined,
        dealOwner: visitDealOwner.trim() || 'José Badotti',
      };

      if (onEditCRMInteraction) {
        onEditCRMInteraction(updatedInteraction);
      } else {
        onAddCRMInteraction(updatedInteraction);
      }

      // Sync the underlying municipality if found
      const matchedMuni = municipalities.find(
        (m) =>
          m.id === visitMuniId ||
          m.id === editingInteraction.municipalityId ||
          (m.name || '').toLowerCase().trim() === (editingInteraction.municipalityName || '').toLowerCase().trim()
      );
      if (matchedMuni && onUpdateMunicipality) {
        onUpdateMunicipality({
          ...matchedMuni,
          name: visitMuniName.trim(),
          state: visitState.trim().toUpperCase(),
        });
      }

      setIsVisitModalOpen(false);
      setEditingInteraction(null);

      if (matchedMuni) {
        const updatedMuni = { ...matchedMuni, name: visitMuniName.trim(), state: visitState.trim().toUpperCase() };
        setActiveCityId(updatedMuni.id);
        onSelectMunicipality(updatedMuni);
      }
      showToast(`✏️ Cartão de Visita de ${visitMuniName} (${visitState}) atualizado com sucesso!`);
    } else {
      // CREATE MODE
      const newInteraction: CRMInteraction = {
        id: `cartao-visita-${Date.now()}`,
        municipalityId: visitMuniId || 'custom_muni',
        municipalityName: visitMuniName.trim(),
        state: visitState.trim().toUpperCase(),
        date: visitDate || new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: visitType,
        contactName: contactName.trim(),
        contactRole: contactRole.trim(),
        summary: visitSummary.trim(),
        description: visitDescription.trim(),
        outcome: visitOutcome,
        nextStep: visitNextStep.trim() || undefined,
        nextStepDueDate: visitNextStepDueDate || undefined,
        dealOwner: visitDealOwner.trim() || 'José Badotti',
      };

      onAddCRMInteraction(newInteraction);

      // Sync municipality if found
      const matchedMuni = municipalities.find(
        (item) => item.id === visitMuniId || (item.name || '').toLowerCase().trim() === visitMuniName.toLowerCase().trim()
      );
      if (matchedMuni && onUpdateMunicipality && (matchedMuni.name !== visitMuniName.trim() || matchedMuni.state !== visitState.trim().toUpperCase())) {
        onUpdateMunicipality({
          ...matchedMuni,
          name: visitMuniName.trim(),
          state: visitState.trim().toUpperCase(),
        });
      }

      setIsVisitModalOpen(false);

      if (matchedMuni) {
        setActiveCityId(matchedMuni.id);
        onSelectMunicipality(matchedMuni);
      }
      showToast(`🎴 Cartão de Visita gravado para Prefeitura de ${visitMuniName}!`);
    }
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
            Roteiro de Campo: Cidade → Dados → Cartão de Visita
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-300">Passo 1:</strong> encontre ou pesquise a cidade na lista abaixo. <strong className="text-blue-300">Passo 2:</strong> confira/corrija os dados oficiais e estude a estratégia. <strong className="text-emerald-300">Passo 3:</strong> abra o cartão de visita da interação (visita, ligação, e-mail, contrato...).
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
          <div className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
            Formatador de Cartões e Agenda Google ficam na aba <strong className="text-slate-200">CRM</strong>, junto do histórico de interações.
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
          {/* Header Bar with Sort Controls */}
          <div className="bg-slate-200/90 p-3 rounded-2xl border border-slate-300 space-y-2 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-blue-800 shrink-0" />
                <span>Passo 1 · Encontrar Cidade ({stateMunicipalities.length}):</span>
              </div>

              {/* Sort Options */}
              <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSortBy('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortBy === 'cards'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Exibir primeiro as cidades com mais cartões de visita e interações cadastradas"
                >
                  <span>🎴</span>
                  <span>Nº de Cartões</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('score')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortBy === 'score'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Ordenar por maior Score IO Comercial"
                >
                  <span>⭐</span>
                  <span>Score IO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('recente')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortBy === 'recente'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Ordenar por data da última visita/interação recente"
                >
                  <span>🕒</span>
                  <span>Recentes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('nome')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortBy === 'nome'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Ordenar em ordem alfabética"
                >
                  <span>🔤</span>
                  <span>A-Z</span>
                </button>
              </div>
            </div>

            {sortBy === 'cards' && (
              <div className="text-[11px] font-bold text-blue-950 bg-blue-50 p-2 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  <strong>Ordem de Trabalho no Campo:</strong> Exibindo primeiro as cidades com mais cartões de visita e registros no CRM.
                </span>
              </div>
            )}
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
              {stateMunicipalities.map(({ m, score, tempMeta, mInteractions, lastInteraction }) => {
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
                    onClick={() => handleOpenCity(m)}
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
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-sm text-slate-900">
                              Prefeitura de {m.name} ({m.state})
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditCityModal(m);
                              }}
                              className="text-slate-400 hover:text-amber-700 bg-slate-100 hover:bg-amber-100 p-1 rounded-md transition-colors cursor-pointer"
                              title="Editar nome e dados desta cidade"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
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

                    {/* Key Metrics & Registered Cards Badge */}
                    <div className="space-y-2">
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
                            {(m.funnelStage || 'prospectado').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Card Count Status Badge */}
                      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl border font-bold bg-slate-50 border-slate-200">
                        <span className="text-slate-500 font-semibold text-[10px] uppercase">Trabalho Registrado:</span>
                        {mInteractions.length > 0 ? (
                          <span className="text-emerald-950 bg-emerald-100 border border-emerald-300 font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <span>🎴</span>
                            <span>{mInteractions.length} cartão(ões) cadastrado(s)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 border border-slate-200 font-medium px-2 py-0.5 rounded-lg text-[10px]">
                            ⚪ Sem cartões ainda
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVisitModalForCity(m);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>🎴 Criar Cartão de Visita</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCity(m);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        title="Abrir dossiê, contatos e histórico de conversas desta cidade"
                      >
                        <span>📍 Abrir Cidade ({mInteractions.length})</span>
                        <ChevronRight className="w-4 h-4 text-amber-300" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active City Field Workstation (Onde o vendedor gerencia a cidade atual) */}
        <div id="active-city-workstation" className="lg:col-span-7 space-y-6 scroll-mt-20">
          {activeMunicipalityData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-md space-y-6">
              
              {/* Mobile Active City Quick Status Bar */}
              <div className="lg:hidden bg-blue-900 text-white p-3 rounded-xl border border-blue-800 flex items-center justify-between gap-2 shadow">
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                    📍 CIDADE ABERTA EM TELA:
                  </span>
                  <span className="text-xs font-black truncate block text-white">
                    Prefeitura de {activeMunicipalityData.m.name} ({activeMunicipalityData.m.state})
                  </span>
                </div>
                <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase shrink-0">
                  {activeMunicipalityData.m.currentSystem}
                </span>
              </div>
              
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

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Prefeitura de {activeMunicipalityData.m.name} ({activeMunicipalityData.m.state})
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCityModal(activeMunicipalityData.m)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-xl border border-amber-300 transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                      title="Editar o nome e estado desta prefeitura"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-800" />
                      <span>Editar Nome da Cidade</span>
                    </button>
                  </div>

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

              {/* Estágio no Funil: somente leitura aqui. Alterar sempre pelo Funil Kanban (aba Funil), evitando estágios divergentes entre telas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Kanban className="w-4 h-4 text-amber-600" />
                  <span>Estágio no Funil:</span>
                  <span className="text-blue-900 capitalize font-black normal-case">
                    {(activeMunicipalityData.m.funnelStage || 'prospectado').replace(/_/g, ' ')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('funnel')}
                  className="text-xs font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                  title="Alterar o estágio no Funil Kanban (aba Funil)"
                >
                  <span>Ver/Alterar no Funil</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* PASSO 2: DADOS OFICIAIS DA CIDADE (pesquisados via IA em fontes do governo) */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-700" />
                    <span>Passo 2 · Dados Oficiais da Cidade</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditCityModal(activeMunicipalityData.m)}
                    className="bg-white hover:bg-blue-100 text-blue-900 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-blue-300 transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Corrigir Dados</span>
                  </button>
                </div>

                <p className="text-[11px] text-blue-900/80 leading-relaxed">
                  Use o botão <strong>"🔄 Enriquecer CRM"</strong> na barra da cidade (no topo da página) para pesquisar/atualizar estes dados via IA em fontes oficiais (PNCP, TCE, INEP, IBGE). Depois, confira em campo e corrija manualmente o que for preciso.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Escolas</span>
                    <span className="font-extrabold text-slate-900">
                      {activeMunicipalityData.m.educationalMetrics?.schoolsCount ?? '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Estudantes</span>
                    <span className="font-extrabold text-slate-900">
                      {(activeMunicipalityData.m.educationalMetrics?.studentsCount ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 col-span-2">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Empresa Vencedora da Última Licitação</span>
                    <span className="font-extrabold text-slate-900 truncate block">
                      {activeMunicipalityData.m.buyingHistory?.[0]?.company || 'Não pesquisado ainda'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Data do Contrato</span>
                    <span className="font-extrabold text-slate-900">
                      {activeMunicipalityData.m.buyingHistory?.[0]?.contractDate ||
                        (activeMunicipalityData.m.buyingHistory?.[0]?.year ? `Ano ${activeMunicipalityData.m.buyingHistory[0].year}` : 'Não pesquisado')}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Contato Principal</span>
                    <span className="font-extrabold text-slate-900 truncate block">
                      {activeMunicipalityData.m.keyContacts?.[0]?.name || 'Não pesquisado'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Telefone</span>
                    <span className="font-extrabold text-slate-900">
                      {activeMunicipalityData.m.keyContacts?.[0]?.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PASSO 2 (continuação): ESTUDAR ESTRATÉGIA PARA A VISITA (IA) */}
              <div className="bg-purple-950 text-white p-4 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="font-extrabold text-xs uppercase text-purple-200">
                      Passo 2 · Estudar Estratégia para a Visita (IA)
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

              {/* PASSO 3: CARTÃO DE VISITA & HISTÓRICO DE INTERAÇÕES */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <span>Passo 3 · Cartão de Visita ({activeMunicipalityData.mInteractions.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registre cada interação (visita, ligação, e-mail, contrato...) com a gestão de {activeMunicipalityData.m.name}. Aqui fica o histórico completo.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenVisitModalForCity(activeMunicipalityData.m)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/20 active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>🎴 Abrir / Novo Cartão de Visita</span>
                  </button>
                </div>

                {/* Sub-Filters & Search within this city's history */}
                {activeMunicipalityData.mInteractions.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Type Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                        <button
                          onClick={() => setInteractionTypeFilter('all')}
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                            interactionTypeFilter === 'all'
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          Ver Tudo ({activeMunicipalityData.mInteractions.length})
                        </button>
                        <button
                          onClick={() => setInteractionTypeFilter('visita')}
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center gap-1 ${
                            interactionTypeFilter === 'visita'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <span>🚗 Visitas Presenciais</span>
                          <span className="text-[10px] font-black opacity-80">
                            ({activeMunicipalityData.mInteractions.filter((i) => i.type === 'visita').length})
                          </span>
                        </button>
                        <button
                          onClick={() => setInteractionTypeFilter('ligacao')}
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center gap-1 ${
                            interactionTypeFilter === 'ligacao'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <span>📞 Ligações</span>
                          <span className="text-[10px] font-black opacity-80">
                            ({activeMunicipalityData.mInteractions.filter((i) => i.type === 'ligacao').length})
                          </span>
                        </button>
                        <button
                          onClick={() => setInteractionTypeFilter('reuniao_virtual')}
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all flex items-center gap-1 ${
                            interactionTypeFilter === 'reuniao_virtual'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <span>💻 Reuniões</span>
                          <span className="text-[10px] font-black opacity-80">
                            ({activeMunicipalityData.mInteractions.filter((i) => i.type === 'reuniao_virtual').length})
                          </span>
                        </button>
                      </div>

                      {/* Search Input for City Interactions */}
                      <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar no histórico..."
                          value={interactionSearchTerm}
                          onChange={(e) => setInteractionSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interaction Cards List */}
                {activeMunicipalityData.mInteractions.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Nenhum cartão de visita ou histórico registrado para {activeMunicipalityData.m.name}.</p>
                      <p className="text-xs text-slate-500 mt-1">Registre a primeira visita presencial ou contato telefônico para guardar o histórico da negociação.</p>
                    </div>
                    <button
                      onClick={() => handleOpenVisitModalForCity(activeMunicipalityData.m)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Primeiro Cartão de Visita</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {activeMunicipalityData.mInteractions
                      .filter((item) => {
                        const matchesType = interactionTypeFilter === 'all' || item.type === interactionTypeFilter;
                        const term = (interactionSearchTerm || '').toLowerCase();
                        const matchesSearch =
                          !term ||
                          (item.summary || '').toLowerCase().includes(term) ||
                          (item.description || '').toLowerCase().includes(term) ||
                          (item.contactName || '').toLowerCase().includes(term) ||
                          (item.contactRole || '').toLowerCase().includes(term);
                        return matchesType && matchesSearch;
                      })
                      .map((item) => {
                        const isVisita = item.type === 'visita';
                        const isCall = item.type === 'ligacao';
                        const isMeeting = item.type === 'reuniao_virtual';

                        return (
                          <div
                            key={item.id}
                            className={`rounded-2xl border p-4 text-xs space-y-3 transition-all shadow-sm ${
                              isVisita
                                ? 'bg-gradient-to-r from-emerald-50/50 via-white to-white border-emerald-200'
                                : isCall
                                ? 'bg-gradient-to-r from-blue-50/50 via-white to-white border-blue-200'
                                : isMeeting
                                ? 'bg-gradient-to-r from-purple-50/50 via-white to-white border-purple-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            {/* Card Top Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 ${
                                  isVisita
                                    ? 'bg-emerald-600 text-white'
                                    : isCall
                                    ? 'bg-blue-600 text-white'
                                    : isMeeting
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-white'
                                }`}>
                                  {isVisita ? '🚗 CARTÃO DE VISITA PRESENCIAL' : isCall ? '📞 LIGAÇÃO TELEFÔNICA' : isMeeting ? '💻 REUNIÃO VIRTUAL' : item.type.toUpperCase()}
                                </span>

                                <span className="text-[11px] font-bold text-slate-500">
                                  {item.date ? `${item.date}` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                                  👤 Vendedor: {item.dealOwner || 'José Badotti'}
                                </span>
                              </div>
                            </div>

                            {/* Contact & Summary Info */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                  <span>📌</span>
                                  <span>{item.summary}</span>
                                </h4>

                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  item.outcome === 'positivo'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : item.outcome === 'critico'
                                    ? 'bg-red-100 text-red-900 border-red-300'
                                    : item.outcome === 'aguardando_retorno'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}>
                                  Status: {item.outcome === 'positivo' ? '🟢 Avanço / Sucesso' : item.outcome === 'critico' ? '🔴 Risco / Objeção' : item.outcome === 'aguardando_retorno' ? '⏳ Aguardando Retorno' : item.outcome}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                                <span className="text-blue-900 font-extrabold">Pessoa Contatada:</span>
                                <span><strong>{item.contactName}</strong> ({item.contactRole || 'Gestão Escolar'})</span>
                              </div>
                            </div>

                            {/* Full Narrative Box (O que foi conversado) */}
                            <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed font-normal text-xs whitespace-pre-wrap">
                              <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                                📝 Relato do que foi conversado na visita / contato:
                              </span>
                              {item.description}
                            </div>

                            {/* Next Step & Actions */}
                            {item.nextStep && (
                              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>Próximo Passo Agendado: {item.nextStep}</span>
                                </div>
                                {item.nextStepDueDate && (
                                  <span className="bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded text-[10px] font-black">
                                    Prazo: {item.nextStepDueDate}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Card Action Buttons: Edit all fields & Delete */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-2">
                              <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-[11px] bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200">
                                <span>📍 Cidade:</span>
                                <span className="font-black text-slate-900">{item.municipalityName} ({item.state})</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openGoogleCalendar(item);
                                    showToast(`📅 Abrindo Google Agenda com a cópia do cartão de ${item.municipalityName}!`);
                                  }}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black px-3 py-1.5 rounded-xl border border-indigo-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                  title="Salvar e agendar compromisso no Google Agenda com a cópia completa do cartão"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                                  <span>📅 Agenda Google</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = formatCardDetailsForCalendar(item);
                                    navigator.clipboard.writeText(text);
                                    showToast(`📋 Cópia do cartão de ${item.municipalityName} copiada para a área de transferência!`);
                                  }}
                                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                                  title="Copiar relatório completo do cartão para colar no WhatsApp, e-mail ou agenda"
                                >
                                  <span>📋 Copiar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModalForInteraction(item)}
                                  className="text-xs bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-xl border border-amber-500 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                  title="Editar todos os campos do cartão de visita (inclusive nome da cidade e estado)"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-950" />
                                  <span>✏️ Editar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteInteraction(item.id, item.municipalityName)}
                                  className="text-xs bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-extrabold px-2.5 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                                  title="Excluir este cartão de visita"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <Navigation className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Passo 1 · Selecione uma cidade na lista ao lado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique em qualquer cidade da lista de {selectedState} para conferir/corrigir os dados oficiais (Passo 2) e abrir o cartão de visita (Passo 3).
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

      {/* CARTÃO DE VISITA PRESENCIAL / INTERACTION MODAL */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${editingInteraction ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                  {editingInteraction ? <Pencil className="w-5 h-5 text-amber-700" /> : <Plus className="w-5 h-5 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {editingInteraction ? '✏️ Editar Cartão de Visita Presencial' : '🎴 Criar Cartão de Visita Presencial'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingInteraction ? 'Atualize todos os campos, incluindo nome da cidade, contatos e relatos' : 'Lançar reunião presencial e contatos da prefeitura'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsVisitModalOpen(false);
                  setEditingInteraction(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitModal} className="space-y-4 text-xs">
              
              {/* Municipality Name & State Edit Section */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📍 Dados da Cidade / Prefeitura *</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold">Você pode editar o nome diretamente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Nome do Município / Cidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Teresina, Esperantina, Caxias..."
                      value={visitMuniName}
                      onChange={(e) => setVisitMuniName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Estado (UF) *</label>
                    <select
                      value={visitState}
                      onChange={(e) => setVisitState(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="PI">PI (Piauí)</option>
                      <option value="MA">MA (Maranhão)</option>
                      <option value="CE">CE (Ceará)</option>
                      <option value="PB">PB (Paraíba)</option>
                      <option value="RN">RN (Rio Grande do Norte)</option>
                      <option value="PE">PE (Pernambuco)</option>
                      <option value="BA">BA (Bahia)</option>
                      <option value="TO">TO (Tocantins)</option>
                      <option value="PA">PA (Pará)</option>
                    </select>
                  </div>
                </div>

                {/* Optional select from registered municipalities */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Vincular a uma prefeitura existente no cadastro (opcional):</label>
                  <select
                    value={visitMuniId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setVisitMuniId(id);
                      const matched = municipalities.find(m => m.id === id);
                      if (matched) {
                        setVisitMuniName(matched.name);
                        setVisitState(matched.state);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Selecionar Prefeitura da Lista --</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.state}) - {m.currentSystem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type, Date and Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tipo de Interação *</label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as CRMInteraction['type'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="visita">🚗 Visita Presencial</option>
                    <option value="ligacao">📞 Ligação Telefônica</option>
                    <option value="reuniao_virtual">💻 Reunião Virtual</option>
                    <option value="email">✉️ E-mail / Ofício</option>
                    <option value="proposta">📄 Proposta / Minuta ARP</option>
                    <option value="impugnacao">⚖️ Impugnação / Recurso</option>
                    <option value="outros">📌 Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Data / Hora *</label>
                  <input
                    type="text"
                    required
                    placeholder="AAAA-MM-DD HH:MM"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Vendedor / Responsável *</label>
                  <input
                    type="text"
                    required
                    value={visitDealOwner}
                    onChange={(e) => setVisitDealOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <option value="deferido">✅ Deferido</option>
                    <option value="indeferido">❌ Indeferido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Resumo / Título do Cartão *</label>
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
                  rows={4}
                  placeholder="Descreva os assuntos tratados, dores apresentadas, concorrentes citados e nível de interesse..."
                  value={visitDescription}
                  onChange={(e) => setVisitDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
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
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Data do Follow-Up / Prazo</label>
                  <input
                    type="date"
                    value={visitNextStepDueDate}
                    onChange={(e) => setVisitNextStepDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVisitModalOpen(false);
                    setEditingInteraction(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!visitMuniName.trim() || !contactName.trim() || !visitSummary.trim()) {
                      showToast('⚠️ Preencha Nome da Cidade, Nome do Contato e Resumo.');
                      return;
                    }
                    const tempInteraction: CRMInteraction = {
                      id: editingInteraction ? editingInteraction.id : `cartao-visita-${Date.now()}`,
                      municipalityId: visitMuniId || 'custom_muni',
                      municipalityName: visitMuniName.trim(),
                      state: visitState.trim().toUpperCase(),
                      date: visitDate || new Date().toISOString().slice(0, 16).replace('T', ' '),
                      type: visitType,
                      contactName: contactName.trim(),
                      contactRole: contactRole.trim(),
                      summary: visitSummary.trim(),
                      description: visitDescription.trim(),
                      outcome: visitOutcome,
                      nextStep: visitNextStep.trim() || undefined,
                      nextStepDueDate: visitNextStepDueDate || undefined,
                      dealOwner: visitDealOwner.trim() || 'José Badotti',
                    };

                    if (editingInteraction && onEditCRMInteraction) {
                      onEditCRMInteraction(tempInteraction);
                    } else {
                      onAddCRMInteraction(tempInteraction);
                    }

                    setIsVisitModalOpen(false);
                    setEditingInteraction(null);
                    openGoogleCalendar(tempInteraction);
                    showToast(`📅 Cartão de ${visitMuniName} gravado e aberto no Google Agenda!`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  title="Salvar cartão de visita e abrir o compromisso diretamente no Google Agenda com a cópia completa do cartão"
                >
                  <Calendar className="w-4 h-4 text-indigo-200" />
                  <span>📅 Salvar + Agendar no Google Agenda</span>
                </button>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>{editingInteraction ? 'Salvar Alterações' : 'Salvar Apenas Cartão'}</span>
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

      {/* Modal Passo 2: Corrigir Dados Oficiais da Cidade */}
      {isEditCityModalOpen && editingCityTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-900 font-bold">
                  <Pencil className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Passo 2 · Corrigir Dados Oficiais</h3>
                  <p className="text-xs text-slate-500 font-normal">Ajuste os dados pesquisados via IA com o que você confirmou em campo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCityModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCityModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nome da Prefeitura / Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCityName}
                  onChange={(e) => setEditCityName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Codó"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Estado (UF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={editCityState}
                    onChange={(e) => setEditCityState(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="MA"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Sistema Concorrente Atual
                  </label>
                  <input
                    type="text"
                    value={editCitySystem}
                    onChange={(e) => setEditCitySystem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Educar / Betha / Sem Sistema"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="block font-black text-slate-500 uppercase text-[10px] tracking-wider">Indicadores do Último Ano</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Número de Escolas</label>
                    <input
                      type="number"
                      min={0}
                      value={editSchoolsCount}
                      onChange={(e) => setEditSchoolsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: 130"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Número de Estudantes</label>
                    <input
                      type="number"
                      min={0}
                      value={editStudentsCount}
                      onChange={(e) => setEditStudentsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: 26000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="block font-black text-slate-500 uppercase text-[10px] tracking-wider">Última Licitação / Contrato Vigente</span>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Empresa Vencedora da Última Licitação</label>
                  <input
                    type="text"
                    value={editBuyingCompany}
                    onChange={(e) => setEditBuyingCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Educar Tecnologia Ltda"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Data do Contrato</label>
                    <input
                      type="date"
                      value={editContractDate}
                      onChange={(e) => setEditContractDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Valor do Contrato (R$)</label>
                    <input
                      type="number"
                      min={0}
                      value={editContractValue}
                      onChange={(e) => setEditContractValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: 1850000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="block font-black text-slate-500 uppercase text-[10px] tracking-wider">Contato Principal</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: Dra. Maria das Graças"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: (99) 3661-2200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCityModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black px-5 py-2 rounded-xl shadow transition-all cursor-pointer"
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
