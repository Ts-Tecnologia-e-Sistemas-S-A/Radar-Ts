import React, { useState, useEffect, useMemo } from 'react';
import { Municipality, CRMInteraction } from '../types';
import { searchIbgeCity, fetchIbgeMunicipalities } from '../services/govApisService';
import { 
  formatCardDetailsForCalendar, 
  openGoogleCalendar, 
  downloadIcsFile,
  ContractDetailsOverride 
} from '../utils/googleCalendar';
import { BusinessCardFormatterModal } from './BusinessCardFormatterModal';
import { 
  findBestMatchingMunicipality, 
  rankMunicipalitiesByQuery, 
  calculateStringSimilarity 
} from '../utils/fuzzyCitySearch';
import { 
  CreditCard, 
  Search, 
  MapPin, 
  Building2, 
  Plus, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar, 
  Copy, 
  MessageSquare, 
  Share2, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Briefcase, 
  Globe, 
  Printer,
  ChevronRight,
  Layers,
  GraduationCap
} from 'lucide-react';

interface BusinessCardsViewProps {
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  onAddCRMInteraction: (interaction: CRMInteraction) => void;
  onEditCRMInteraction?: (interaction: CRMInteraction) => void;
  onDeleteCRMInteraction?: (interactionId: string) => void;
  onAddMunicipality?: (newMuni: Municipality) => void;
  onSelectMunicipality: (muni: Municipality) => void;
  onNavigateTab: (tab: string) => void;
  selectedMunicipality?: Municipality | null;
}

export const BusinessCardsView: React.FC<BusinessCardsViewProps> = ({
  municipalities,
  crmInteractions,
  onAddCRMInteraction,
  onEditCRMInteraction,
  onDeleteCRMInteraction,
  onAddMunicipality,
  onSelectMunicipality,
  onNavigateTab,
  selectedMunicipality
}) => {
  // Search State for City & State typing
  const [typedCity, setTypedCity] = useState<string>(selectedMunicipality ? selectedMunicipality.name : '');
  const [typedState, setTypedState] = useState<string>(selectedMunicipality ? selectedMunicipality.state : 'PI');
  const [isSearchingIbge, setIsSearchingIbge] = useState<boolean>(false);
  const [ibgeMatchInfo, setIbgeMatchInfo] = useState<string | null>(null);

  // Active Filters
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Formatter Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialMuniId, setModalInitialMuniId] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync when selectedMunicipality changes externally
  useEffect(() => {
    if (selectedMunicipality) {
      setTypedCity(selectedMunicipality.name);
      setTypedState(selectedMunicipality.state || 'PI');
    }
  }, [selectedMunicipality]);

  // Handle searching city by typing with Intelligent Fuzzy Match
  const handleSearchCityAndState = async (cityName: string, stateUf: string) => {
    if (!cityName.trim()) return;
    setIsSearchingIbge(true);
    setIbgeMatchInfo(null);

    try {
      const targetState = stateUf.trim().toUpperCase();

      // 1. Check local DB with intelligent fuzzy algorithm
      const fuzzyLocal = findBestMatchingMunicipality(cityName.trim(), targetState, municipalities, 0.52);

      if (fuzzyLocal) {
        onSelectMunicipality(fuzzyLocal.item);
        setTypedCity(fuzzyLocal.item.name);
        setTypedState(fuzzyLocal.item.state);
        setIbgeMatchInfo(`🏛️ Encontrada no CRM Local: ${fuzzyLocal.item.name} - ${fuzzyLocal.item.state}`);
        showToast(`📍 Prefeitura de ${fuzzyLocal.item.name} (${fuzzyLocal.item.state}) selecionada!`);
      } else {
        // 2. Search IBGE REST API using fuzzy matching against official IBGE cities
        const ibgeResult = await searchIbgeCity(cityName.trim(), targetState);
        const finalCityName = ibgeResult ? ibgeResult.nome : cityName.trim();
        const cleanId = `mun-${finalCityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${targetState.toLowerCase()}`;

        const newMuni: Municipality = {
          id: cleanId,
          name: finalCityName,
          state: targetState || 'PI',
          region: 'Nordeste',
          population: 35000,
          status: 'oportunidade',
          funnelStage: 'prospectado',
          currentSystem: 'Sistema Competidor Legado',
          currentContractValue: 1250000,
          contractDaysRemaining: 75,
          renewalProbability: 'Média',
          tenderProbability: 85,
          estimatedNewContractValue: 1500000,
          probableModality: 'Pregão Eletrônico',
          ioScore: 82,
          ioFactors: {
            contractExpiringDays: 85,
            lowIdebScore: 75,
            techInvestmentHistory: 80,
            budgetAvailability: 70,
            managementChange: 65,
            federalFundsAvailable: 90,
            existingRelationship: 60
          },
          educationalMetrics: {
            ideb: 4.2,
            idebTarget: 5.2,
            dropoutRate: 5.5,
            schoolsCount: 18,
            studentsCount: 3800,
            teachersCount: 210,
            fundebBudget: 12500000,
            mainPains: ['Falta de Diário do Professor', 'Controle do PNAE']
          },
          keyContacts: [],
          buyingHistory: [],
          lastActivityDate: new Date().toISOString().slice(0, 10),
          notes: ibgeResult ? `Cadastrada via IBGE REST API (${ibgeResult.id})` : 'Cadastrada via busca direta de cartões de visita',
          verifiedSources: [ibgeResult ? `IBGE REST API (Código IBGE: ${ibgeResult.id})` : 'Mapeamento Comercial']
        };

        if (onAddMunicipality) {
          onAddMunicipality(newMuni);
        }
        onSelectMunicipality(newMuni);
        setTypedCity(newMuni.name);
        setTypedState(newMuni.state);

        if (ibgeResult) {
          setIbgeMatchInfo(`🌐 IBGE REST API: ${ibgeResult.nome} (Código IBGE: ${ibgeResult.id})`);
          showToast(`🏛️ Município ${ibgeResult.nome} (${newMuni.state}) localizado e cadastrado!`);
        } else {
          setIbgeMatchInfo(`🏛️ Nova prefeitura "${finalCityName} (${targetState})" cadastrada e selecionada no CRM.`);
          showToast(`🏛️ Prefeitura de ${finalCityName} (${targetState}) selecionada!`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingIbge(false);
    }
  };

  // Active matched municipality object
  const currentMuni = useMemo(() => {
    // If typedCity is set, try fuzzy match first
    if (typedCity.trim()) {
      const fuzzyLocal = findBestMatchingMunicipality(typedCity.trim(), typedState, municipalities, 0.48);
      if (fuzzyLocal) return fuzzyLocal.item;
    }

    if (selectedMunicipality) return selectedMunicipality;
    return null;
  }, [selectedMunicipality, typedCity, typedState, municipalities]);

  // Real-time fuzzy suggestions for auto-complete when typing
  const citySuggestions = useMemo(() => {
    if (!typedCity.trim() || typedCity.trim().length < 2) return [];
    return rankMunicipalitiesByQuery(typedCity, typedState, municipalities, 4);
  }, [typedCity, typedState, municipalities]);

  // Filter cards/interactions strictly by current filtered municipality
  const filteredCards = useMemo(() => {
    return crmInteractions.filter(item => {
      // STRICT FILTERING: When a city is filtered, show ONLY cards for that city!
      if (currentMuni) {
        const cardMuniId = (item.municipalityId || '').toLowerCase().trim();
        const cardMuniName = (item.municipalityName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const targetMuniId = (currentMuni.id || '').toLowerCase().trim();
        const targetMuniName = (currentMuni.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        const matchesId = cardMuniId && targetMuniId && cardMuniId === targetMuniId;
        const matchesName = cardMuniName && targetMuniName && (cardMuniName === targetMuniName || calculateStringSimilarity(cardMuniName, targetMuniName) >= 0.80);

        if (!matchesId && !matchesName) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'todos') {
        const roleLower = (item.contactRole || '').toLowerCase();
        if (roleFilter === 'secretario' && !roleLower.includes('secretár') && !roleLower.includes('secretaria')) return false;
        if (roleFilter === 'prefeito' && !roleLower.includes('prefeit')) return false;
        if (roleFilter === 'pregoeiro' && !roleLower.includes('pregoeir') && !roleLower.includes('licita')) return false;
        if (roleFilter === 'ti' && !roleLower.includes('ti') && !roleLower.includes('tecnologia') && !roleLower.includes('informática')) return false;
      }

      // Search Query
      if (cardSearchQuery.trim()) {
        const q = cardSearchQuery.toLowerCase();
        const textToSearch = `${item.contactName} ${item.contactRole} ${item.municipalityName} ${item.summary} ${item.description} ${item.dealOwner}`.toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });
  }, [crmInteractions, currentMuni, roleFilter, cardSearchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalCards = crmInteractions.length;
    const cardsForCurrentMuni = currentMuni 
      ? crmInteractions.filter(i => i.municipalityId === currentMuni.id || i.municipalityName === currentMuni.name).length
      : totalCards;
    const secretariosCount = crmInteractions.filter(i => (i.contactRole || '').toLowerCase().includes('secretár')).length;
    const pregoeirosCount = crmInteractions.filter(i => (i.contactRole || '').toLowerCase().includes('pregoeir') || (i.contactRole || '').toLowerCase().includes('licita')).length;

    return {
      totalCards,
      cardsForCurrentMuni,
      secretariosCount,
      pregoeirosCount
    };
  }, [crmInteractions, currentMuni]);

  // Handle Quick Open Modal for current city
  const handleOpenFormatterModalForCity = () => {
    if (currentMuni) {
      setModalInitialMuniId(currentMuni.id);
    } else {
      setModalInitialMuniId('');
    }
    setIsModalOpen(true);
  };

  // Copy Card Text Helper
  const handleCopyCard = (card: CRMInteraction) => {
    const text = `📇 CARTÃO DE VISITA - ${card.municipalityName} (${card.state})\n👤 Contato: ${card.contactName}\n💼 Cargo: ${card.contactRole || 'Gestor Publico'}\n📅 Data: ${card.date}\n📝 Resumo: ${card.summary}\n📌 Próximo Passo: ${card.nextStep || 'Acompanhamento'}\n👤 Responsável: ${card.dealOwner || 'José Badotti'}`;
    navigator.clipboard.writeText(text);
    showToast(`📋 Cartão de ${card.contactName} copiado!`);
  };

  // WhatsApp Share Helper
  const handleShareWhatsApp = (card: CRMInteraction) => {
    const text = `📇 *CARTÃO DE VISITA & CONTATO MUNICIPAL*\n\n🏛️ *Prefeitura:* ${card.municipalityName} - ${card.state}\n👤 *Contato:* ${card.contactName}\n💼 *Cargo:* ${card.contactRole || 'Gestor'}\n\n📝 *Anotações:* ${card.summary}\n📌 *Próximo Passo:* ${card.nextStep || 'Agendamento'}\n📆 *Prazo:* ${card.nextStepDueDate || 'A definir'}\n\n_SICAP Radar Comercial_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    showToast(`📲 Compartilhando cartão de ${card.contactName} no WhatsApp...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* UX Navigation Breadcrumb Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => onNavigateTab('opportunities')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>← Voltar para Dashboard / Raio-X</span>
          </button>
          <button
            onClick={() => onNavigateTab('single_city_query')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🔍 Consulta Única de Cidade</span>
          </button>
          <span className="text-slate-500 font-mono">/</span>
          <span className="text-indigo-400 font-bold">Cartões de Visita & Contatos</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-2.5 py-1 rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Salvamento ao sair do campo ativo
          </span>
          <button
            onClick={() => onNavigateTab('task_crm')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Task-Based CRM (4 Telas) →</span>
          </button>
        </div>
      </div>

      {/* Header Banner - 100% Cartão de Visita */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Módulo 100% Cartão de Visita
              </span>
              <span className="bg-indigo-800/60 text-indigo-200 border border-indigo-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" /> Integrado ao IBGE & PNCP
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cartões de Visita & Fichas Comerciais por Cidade
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Digite qualquer cidade e estado para carregar os dados públicos oficiais e visualizar todos os cartões de visita, contatos de secretários e registros de reuniões cadastrados para o município.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigateTab('task_crm' as any)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 border border-emerald-400/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Modo Task-Based (4 Telas)</span>
            </button>

            <button
              onClick={handleOpenFormatterModalForCity}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95 border border-blue-400/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Novo Cartão de Visita</span>
            </button>

            <button
              onClick={() => onNavigateTab('field_visits')}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-3 rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Ver Roteiro de Visitas</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quick Executive Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-900/60 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/50">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase">Total de Cartões Salvos</span>
            <span className="text-xl font-black text-white">{stats.totalCards}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/50">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase">
              {currentMuni ? `Cartões em ${currentMuni.name}` : 'Cartões na Cidade'}
            </span>
            <span className="text-xl font-black text-amber-400">{stats.cardsForCurrentMuni}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/50">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase">Secretários Mapeados</span>
            <span className="text-xl font-black text-emerald-400">{stats.secretariosCount}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/50">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase">Pregoeiros & Licitações</span>
            <span className="text-xl font-black text-blue-400">{stats.pregoeirosCount}</span>
          </div>
        </div>
      </div>

      {/* 🔍 Interactive City & State Typing Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Buscar Cidade & Estado para Cartões de Visita</h3>
              <p className="text-xs text-slate-500">Digite o nome do município e a UF para carregar a ficha e os cartões criados</p>
            </div>
          </div>

          <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {municipalities.length} Cidades Cadastradas
          </span>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchCityAndState(typedCity, typedState);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-6">
            <label className="block text-xs font-black text-slate-700 mb-1">
              Nome da Cidade (Município)
            </label>
            <div className="relative">
              <input
                type="text"
                value={typedCity}
                onChange={(e) => setTypedCity(e.target.value)}
                placeholder="Ex: Esperantina, Teresina, São Luís, Timon..."
                className="w-full text-xs p-3 pl-9 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800 bg-slate-50/50"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 mb-1">
              UF (Estado)
            </label>
            <select
              value={typedState}
              onChange={(e) => setTypedState(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-extrabold text-slate-800 bg-slate-50/50 uppercase"
            >
              {['PI', 'MA', 'CE', 'BA', 'PE', 'RN', 'PB', 'AL', 'SE', 'PA', 'TO', 'SP', 'MG', 'RJ', 'PR', 'SC', 'RS', 'GO', 'MT', 'MS', 'DF', 'AM', 'RO', 'AC', 'RR', 'AP', 'ES'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSearchingIbge}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs p-3 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSearchingIbge ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Consultando IBGE...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-300" />
                  <span>Carregar Cidade & Cartões</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 💡 Real-Time Fuzzy Match Suggestions (Typo Corrector) */}
        {citySuggestions.length > 0 && typedCity.trim().length >= 2 && (!currentMuni || calculateStringSimilarity(typedCity, currentMuni.name) < 0.95) && (
          <div className="bg-amber-50/90 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Busca Inteligente (Corretor de Digitação): Você quis dizer...</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {citySuggestions.map(sugg => (
                <button
                  key={sugg.item.id}
                  type="button"
                  onClick={() => {
                    setTypedCity(sugg.item.name);
                    setTypedState(sugg.item.state);
                    onSelectMunicipality(sugg.item);
                    showToast(`📍 Prefeitura de ${sugg.item.name} (${sugg.item.state}) selecionada!`);
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-black text-xs px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <span>{sugg.item.name} ({sugg.item.state})</span>
                  <span className="text-[10px] text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                    {Math.round(sugg.score * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Pick Buttons for Popular Cities in Database */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Atalhos de Cidades:</span>
          {municipalities.slice(0, 8).map(m => (
            <button
              key={m.id}
              onClick={() => {
                setTypedCity(m.name);
                setTypedState(m.state);
                onSelectMunicipality(m);
                showToast(`📍 Cidade selecionada: ${m.name} - ${m.state}`);
              }}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all border cursor-pointer ${
                currentMuni?.id === m.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-extrabold'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {m.name} ({m.state})
            </button>
          ))}
        </div>

        {ibgeMatchInfo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center justify-between">
            <span>{ibgeMatchInfo}</span>
            <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Validação REST API</span>
          </div>
        )}
      </div>

      {/* 🏛️ Active Selected City Dossier Card */}
      {currentMuni && (
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                {currentMuni.state}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{currentMuni.name}</h2>
                  <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    {currentMuni.state}
                  </span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Pop. {(currentMuni.population || 0).toLocaleString('pt-BR')} hab.
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span><strong>Sistema Atual:</strong> {currentMuni.currentSystem || 'A consultar'}</span>
                  <span>•</span>
                  <span><strong>Contrato:</strong> R$ {(currentMuni.currentContractValue || 0).toLocaleString('pt-BR')}</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">Vence em {currentMuni.contractDaysRemaining || 60} dias</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenFormatterModalForCity}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Adicionar Cartão para {currentMuni.name}</span>
              </button>

              <button
                onClick={() => {
                  onSelectMunicipality(currentMuni);
                  onNavigateTab('intelligence');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ver Dossiê 360º</span>
              </button>
            </div>
          </div>

          {/* Key Contacts Registered on Municipality */}
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-2">
              Contatos Oficiais Cadastrados no Dossiê da Cidade:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(currentMuni.keyContacts && currentMuni.keyContacts.length > 0) ? (
                currentMuni.keyContacts.map((contact, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{contact.name}</span>
                      <span className="text-[10px] font-bold text-indigo-600 block">{contact.role}</span>
                    </div>
                    {contact.phone && (
                      <a
                        href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        title="Abrir conversa no WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="sm:col-span-3 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500 text-center">
                  Nenhum contato oficial cadastrado ainda. Use o botão acima para adicionar o primeiro cartão de visita!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📇 Business Cards Gallery & Filter Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Cartões de Visita {currentMuni ? `em ${currentMuni.name}` : 'Mapeados'} ({filteredCards.length})
              </h3>
              <p className="text-xs text-slate-500">
                Lista completa de contatos, dados de reuniões e formatos prontos para compartilhamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Role */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              <button
                onClick={() => setRoleFilter('todos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  roleFilter === 'todos' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setRoleFilter('secretario')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  roleFilter === 'secretario' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Secretários
              </button>
              <button
                onClick={() => setRoleFilter('pregoeiro')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  roleFilter === 'pregoeiro' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pregoeiros
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <input
                type="text"
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                placeholder="Filtrar por nome, cargo ou nota..."
                className="text-xs p-2.5 pl-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Business Cards Display Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((card) => {
              const matchedMuniForCard = municipalities.find(
                m => m.id === card.municipalityId || m.name === card.municipalityName
              );

              return (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-800/80 flex flex-col justify-between hover:border-indigo-500 transition-all group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Bar */}
                    <div className="flex items-start justify-between border-b border-indigo-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center font-black text-sm text-indigo-200 shadow-inner">
                          {(card.contactName || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                            {card.contactName}
                          </h4>
                          <span className="text-[10px] font-extrabold bg-indigo-800/80 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-700/60 block mt-0.5">
                            {card.contactRole || 'Gestor Público'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-400" />
                        {card.municipalityName} ({card.state})
                      </span>
                    </div>

                    {/* Contract & Competitor Intelligence Badge */}
                    <div className="bg-slate-950/70 p-3 rounded-2xl border border-indigo-900/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-bold">Sistema Atual:</span>
                        <span className="font-black text-amber-300">
                          {matchedMuniForCard?.currentSystem || 'Sistema Registrado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-bold">Valor Estimado:</span>
                        <span className="font-extrabold text-white">
                          R$ {(matchedMuniForCard?.currentContractValue || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-bold">Vencimento:</span>
                        <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {matchedMuniForCard?.contractDaysRemaining || 60} dias restantes
                        </span>
                      </div>
                    </div>

                    {/* Summary & Notes */}
                    <div className="text-xs text-indigo-100/90 bg-indigo-950/40 p-3 rounded-2xl border border-indigo-900/40 leading-relaxed font-sans">
                      <p className="font-medium line-clamp-3">{card.summary || card.description}</p>
                    </div>

                    {/* Next Action Item */}
                    {card.nextStep && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs flex items-center justify-between text-amber-200">
                        <span className="font-bold text-[11px] truncate flex-1 mr-2">📌 {card.nextStep}</span>
                        {card.nextStepDueDate && (
                          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono font-black shrink-0">
                            {card.nextStepDueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-4 pt-3 border-t border-indigo-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleShareWhatsApp(card)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Compartilhar Cartão no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        openGoogleCalendar(card);
                        showToast(`📅 Abrindo Google Agenda para ${card.contactName}...`);
                      }}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Agendar Reunião na Agenda"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Calendar</span>
                    </button>

                    <button
                      onClick={() => handleCopyCard(card)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                      title="Copiar Texto do Cartão"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteCRMInteraction && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o cartão de ${card.contactName}?`)) {
                            onDeleteCRMInteraction(card.id);
                            showToast(`🗑️ Cartão de ${card.contactName} removido.`);
                          }
                        }}
                        className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                        title="Excluir Cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-800">
              Nenhum cartão de visita encontrado {currentMuni ? `para ${currentMuni.name}` : ''}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Você pode criar um novo cartão digitando anotações brutas para a IA formatar ou cadastrando os dados do secretário manualmente.
            </p>
            <button
              onClick={handleOpenFormatterModalForCity}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Criar Primeiro Cartão de Visita</span>
            </button>
          </div>
        )}

      </div>

      {/* Business Card Formatter Modal */}
      <BusinessCardFormatterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        municipalities={municipalities}
        initialMunicipalityId={modalInitialMuniId}
        onSaveInteraction={(newInteraction) => {
          onAddCRMInteraction(newInteraction);
          showToast(`💾 Cartão de Visita de ${newInteraction.contactName} salvo com sucesso!`);
        }}
        onShowToast={showToast}
      />

    </div>
  );
};
