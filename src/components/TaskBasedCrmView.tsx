import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Building2, 
  UserPlus, 
  Save, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Phone, 
  Mail, 
  Briefcase, 
  Check, 
  Calendar, 
  FileText, 
  Tag, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  School, 
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Globe,
  Database
} from 'lucide-react';
import { Municipality, KeyContact, CRMInteraction } from '../types';
import { rankMunicipalitiesByQuery, normalizeString } from '../utils/fuzzyCitySearch';

interface TaskBasedCrmViewProps {
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  onAddMunicipality: (muni: Municipality) => void;
  onUpdateMunicipality: (muni: Municipality) => void;
  onAddCRMInteraction: (interaction: CRMInteraction) => void;
  selectedMunicipality?: Municipality | null;
  onSelectMunicipality?: (muni: Municipality) => void;
}

type ScreenStep = 'search' | 'raio_x' | 'create_card' | 'log_journal';

export const TaskBasedCrmView: React.FC<TaskBasedCrmViewProps> = ({
  municipalities,
  crmInteractions,
  onAddMunicipality,
  onUpdateMunicipality,
  onAddCRMInteraction,
  selectedMunicipality: initialSelectedMuni,
  onSelectMunicipality
}) => {
  // Screen state
  const [currentStep, setCurrentStep] = useState<ScreenStep>('search');
  const [selectedMuni, setSelectedMuni] = useState<Municipality | null>(initialSelectedMuni || null);
  
  // Search state (Tela 1)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Contact Creation state (Tela 3)
  const [contactName, setContactName] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('Secretário(a) de Educação');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [savedContact, setSavedContact] = useState<KeyContact | null>(null);

  // Journal / Enrichment state (Tela 4)
  const [currentSystem, setCurrentSystem] = useState<string>('');
  const [painNotes, setPainNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [interactionType, setInteractionType] = useState<'ligacao' | 'visita' | 'email' | 'reuniao_virtual' | 'outros'>('ligacao');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize initialSelectedMuni if passed from outside
  useEffect(() => {
    if (initialSelectedMuni) {
      setSelectedMuni(initialSelectedMuni);
      if (currentStep === 'search') {
        setCurrentStep('raio_x');
      }
    }
  }, [initialSelectedMuni]);

  // Focus search input on step 'search'
  useEffect(() => {
    if (currentStep === 'search') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [currentStep]);

  // Autocomplete suggestions based on query
  const citySuggestions = searchQuery.trim().length >= 2 
    ? rankMunicipalitiesByQuery(searchQuery, undefined, municipalities, 6)
    : [];

  // Commercial Triggers / Tags Options
  const TRIGGER_TAGS = [
    { id: 'contrato_vencendo', label: '⚡ Contrato Vencendo (< 90 dias)', color: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 'usa_papel', label: '📝 Usa Diário em Papel', color: 'border-blue-300 bg-blue-50 text-blue-900' },
    { id: 'insatisfeito_suporte', label: '🔴 Insatisfeito com Suporte Atual', color: 'border-red-300 bg-red-50 text-red-900' },
    { id: 'troca_gestao', label: '🔄 Troca de Gestão / Novo Secretário', color: 'border-purple-300 bg-purple-50 text-purple-900' },
    { id: 'verba_fundeb', label: '💰 Verba FUNDEB Disponível', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
    { id: 'demanda_diario_eletronico', label: '📱 Demanda Diário Eletrônico', color: 'border-indigo-300 bg-indigo-50 text-indigo-900' },
    { id: 'meta_ideb_baixa', label: '📊 Abaixo da Meta do IDEB', color: 'border-rose-300 bg-rose-50 text-rose-900' },
    { id: 'prepara_licitacao', label: '🏛️ Prepara Nova Licitação (PNCP)', color: 'border-cyan-300 bg-cyan-50 text-cyan-900' },
  ];

  const COMMON_COMPETITORS = [
    'Betha Sistemas',
    'Fly2000 / Fiorilli',
    'IPM Sistemas',
    'Pátio / SmarAPD',
    'Desenvolvimento Próprio',
    'Diário em Papel (Sem Sistema)'
  ];

  const COMMON_ROLES = [
    'Secretário(a) de Educação',
    'Prefeito(a)',
    'Diretor(a) do PNAE',
    'Coordenador(a) Pedagógico(a)',
    'Chefe de Gabinete',
    'Coordenador(a) de T.I.',
    'Pregoeiro(a) / Presidente da CPL'
  ];

  // Actions
  const handleSelectCity = (muni: Municipality) => {
    setSelectedMuni(muni);
    if (onSelectMunicipality) onSelectMunicipality(muni);
    setCurrentStep('raio_x');
    setShowSuggestions(false);
    showToast(`📍 Município de ${muni.name} (${muni.state}) selecionado!`);
  };

  const handleCreateNewCityFromQuery = () => {
    const raw = searchQuery.trim();
    if (!raw) return;

    let cityName = raw;
    let stateName = 'PI';

    if (raw.includes('-')) {
      const parts = raw.split('-');
      cityName = parts[0].trim();
      stateName = parts[1].trim().toUpperCase().slice(0, 2);
    }

    const newMuni: Municipality = {
      id: `mun-${cityName.toLowerCase().replace(/\s+/g, '-')}-${stateName.toLowerCase()}`,
      name: cityName,
      state: stateName,
      region: 'Nordeste',
      population: 35000,
      status: 'oportunidade',
      funnelStage: 'prospectado',
      currentSystem: 'Não informado',
      currentContractValue: 1200000,
      contractDaysRemaining: 90,
      renewalProbability: 'Média',
      tenderProbability: 80,
      estimatedNewContractValue: 1400000,
      probableModality: 'Pregão Eletrônico',
      ioScore: 85,
      ioFactors: {
        contractExpiringDays: 80,
        lowIdebScore: 70,
        techInvestmentHistory: 75,
        budgetAvailability: 85,
        managementChange: 60,
        federalFundsAvailable: 85,
        existingRelationship: 50
      },
      educationalMetrics: {
        ideb: 4.1,
        idebTarget: 5.2,
        dropoutRate: 5.0,
        schoolsCount: 28,
        studentsCount: 5400,
        teachersCount: 320,
        fundebBudget: 15000000,
        mainPains: ['Gestão Escolar']
      },
      keyContacts: [],
      buyingHistory: [],
      lastActivityDate: new Date().toISOString().slice(0, 10),
      notes: `Município criado via Busca Direta em ${new Date().toLocaleDateString('pt-BR')}`
    };

    onAddMunicipality(newMuni);
    handleSelectCity(newMuni);
  };

  const handleStartCreateCard = () => {
    setContactName('');
    setContactRole('Secretário(a) de Educação');
    setContactPhone('');
    setContactEmail('');
    setCurrentStep('create_card');
  };

  const [isContactSavedInStep, setIsContactSavedInStep] = useState(false);
  const [isJournalSavedInStep, setIsJournalSavedInStep] = useState(false);

  const handleSaveContactInPlace = (e: React.FormEvent, shouldAdvance: boolean = false) => {
    e.preventDefault();
    if (!selectedMuni) return;
    if (!contactName.trim()) {
      showToast('⚠️ Por favor, informe o nome do contato.');
      return;
    }

    const newContact: KeyContact = {
      name: contactName.trim(),
      role: contactRole.trim() || 'Contato Principal',
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      notes: `Cadastrado em ${new Date().toLocaleDateString('pt-BR')}`
    };

    // Update municipality contacts
    const updatedContacts = [...(selectedMuni.keyContacts || []).filter(c => c.name.toLowerCase() !== newContact.name.toLowerCase()), newContact];
    const updatedMuni: Municipality = {
      ...selectedMuni,
      keyContacts: updatedContacts,
      lastActivityDate: new Date().toISOString().slice(0, 10)
    };

    onUpdateMunicipality(updatedMuni);
    setSelectedMuni(updatedMuni);
    setSavedContact(newContact);

    // Initialize journal screen fields if empty
    if (!currentSystem) setCurrentSystem(selectedMuni.currentSystem || '');

    setIsContactSavedInStep(true);
    showToast(`✅ Contato de ${newContact.name} salvo com sucesso! Você continua na tela.`);

    if (shouldAdvance) {
      setCurrentStep('log_journal');
    }
  };

  // Auto-save contact on field blur
  const handleBlurAutoSaveContact = () => {
    if (!selectedMuni || !contactName.trim()) return;

    const newContact: KeyContact = {
      name: contactName.trim(),
      role: contactRole.trim() || 'Contato Principal',
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      notes: `Auto-salvo ao sair do campo em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const existingWithoutThis = (selectedMuni.keyContacts || []).filter(
      c => c.name.toLowerCase() !== newContact.name.toLowerCase()
    );
    const updatedContacts = [...existingWithoutThis, newContact];
    const updatedMuni: Municipality = {
      ...selectedMuni,
      keyContacts: updatedContacts,
      lastActivityDate: new Date().toISOString().slice(0, 10)
    };

    onUpdateMunicipality(updatedMuni);
    setSelectedMuni(updatedMuni);
    setSavedContact(newContact);
    showToast(`💾 Contato auto-salvo ao sair do campo (${newContact.name})`);
  };

  // Auto-save journal notes on field blur
  const handleBlurAutoSaveJournal = () => {
    if (!selectedMuni || !savedContact) return;
    if (currentSystem.trim() && currentSystem !== selectedMuni.currentSystem) {
      const updatedMuni = {
        ...selectedMuni,
        currentSystem: currentSystem.trim()
      };
      onUpdateMunicipality(updatedMuni);
      setSelectedMuni(updatedMuni);
    }
    if (painNotes.trim() || currentSystem.trim()) {
      showToast('💾 Diário e informações salvas automaticamente ao sair do campo');
    }
  };

  const handleToggleTag = (tagLabel: string) => {
    setSelectedTags(prev => 
      prev.includes(tagLabel)
        ? prev.filter(t => t !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  const handleSaveJournalInPlace = (e: React.FormEvent, shouldAdvance: boolean = false) => {
    e.preventDefault();
    if (!selectedMuni || !savedContact) return;

    // Build interaction description
    const tagsText = selectedTags.length > 0 ? `\nGatilhos e Situação: ${selectedTags.join(', ')}` : '';
    const systemText = currentSystem ? `\nSistema Atual Declarado: ${currentSystem}` : '';
    const fullDescription = `${painNotes}${systemText}${tagsText}`.trim() || 'Atendimento comercial realizado.';

    const newInteraction: CRMInteraction = {
      id: `inter-${Date.now()}`,
      municipalityId: selectedMuni.id,
      municipalityName: selectedMuni.name,
      state: selectedMuni.state,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: interactionType,
      contactName: savedContact.name,
      contactRole: savedContact.role,
      summary: `Atendimento / Diário de Bordo: ${savedContact.name} (${savedContact.role})`,
      description: fullDescription,
      outcome: 'positivo',
      nextStep: 'Acompanhar proposta / Retorno comercial',
      nextStepDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      dealOwner: 'Consultor Comercial'
    };

    onAddCRMInteraction(newInteraction);

    // Update current system on municipality if changed
    if (currentSystem && currentSystem !== selectedMuni.currentSystem) {
      const updatedMuni: Municipality = {
        ...selectedMuni,
        currentSystem: currentSystem,
        lastActivityDate: new Date().toISOString().slice(0, 10)
      };
      onUpdateMunicipality(updatedMuni);
      setSelectedMuni(updatedMuni);
    }

    setIsJournalSavedInStep(true);
    showToast('📝 Histórico de atendimento registrado e salvo! Você continua na tela.');

    if (shouldAdvance) {
      setCurrentStep('raio_x');
    }
  };

  // Filter CRM interactions for current selected municipality
  const muniInteractions = selectedMuni 
    ? crmInteractions.filter(i => i.municipalityId === selectedMuni.id || i.municipalityName.toLowerCase() === selectedMuni.name.toLowerCase())
    : [];

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideInRight font-medium text-sm">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP TASK BREADCRUMB & ESCAPE BAR */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-slate-500">Municípios</span>
          
          {selectedMuni && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button 
                type="button"
                onClick={() => setCurrentStep('raio_x')}
                className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
              >
                {selectedMuni.name} - {selectedMuni.state}
              </button>
            </>
          )}

          {currentStep === 'create_card' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-black bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Novo Cartão de Visita
              </span>
            </>
          )}

          {currentStep === 'log_journal' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Diário de Bordo ({savedContact?.name || 'Contato'})
              </span>
            </>
          )}
        </div>

        {/* Escape Navigation Action Buttons */}
        <div className="flex items-center gap-2">
          {currentStep !== 'search' && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 'create_card' || currentStep === 'log_journal') {
                  setCurrentStep('raio_x');
                } else {
                  setCurrentStep('search');
                  setSelectedMuni(null);
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{currentStep === 'raio_x' ? 'Nova Busca' : 'Voltar ao Raio-X'}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN TASK BODY CONTAINER */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8">

        {/* ========================================================================= */}
        {/* TELA 1: TELA INICIAL (PONTO DE ENTRADA - BUSCA DIRETA CENTRADA) */}
        {/* ========================================================================= */}
        {currentStep === 'search' && (
          <div className="max-w-2xl w-full mx-auto text-center space-y-8 my-auto py-12 animate-fadeIn">
            {/* Logo / Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>CRM de Municípios — Busca Inteligente</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Qual município você vai <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">atender hoje?</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
                Digite o nome da cidade para acessar o Raio-X completo, contatos e registrar o diário de bordo.
              </p>
            </div>

            {/* Central Prominent Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="relative flex items-center shadow-2xl shadow-blue-500/10 rounded-2xl overflow-hidden border-2 border-slate-700 focus-within:border-blue-500 transition-all bg-slate-900/90">
                <Search className="w-6 h-6 text-slate-400 ml-4 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (citySuggestions.length > 0) {
                        handleSelectCity(citySuggestions[0].item);
                      } else if (searchQuery.trim().length >= 2) {
                        handleCreateNewCityFromQuery();
                      }
                    }
                  }}
                  placeholder="Digite o nome da cidade (ex: Esperantina, Teresina, Codó)..."
                  className="w-full bg-transparent text-white placeholder-slate-500 text-base font-semibold px-4 py-4 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-2 text-slate-400 hover:text-white mr-2 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Live Autocomplete Dropdown */}
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-40 overflow-hidden text-left animate-fadeIn">
                  {citySuggestions.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 px-3 py-1.5 tracking-wider">
                        Municípios Encontrados ({citySuggestions.length})
                      </div>
                      {citySuggestions.map((sugg) => (
                        <button
                          key={sugg.item.id}
                          type="button"
                          onClick={() => handleSelectCity(sugg.item)}
                          className="w-full hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                              {sugg.item.state}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-white group-hover:text-blue-300">
                                {sugg.item.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Sistema: {sugg.item.currentSystem || 'Competidor'}</span>
                                <span>•</span>
                                <span>Contatos: {sugg.item.keyContacts?.length || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white px-2.5 py-1 rounded-full font-extrabold transition-all">
                              Acessar Raio-X →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center space-y-3">
                      <p className="text-xs font-semibold text-slate-400">
                        Nenhum município cadastrado com o nome "<span className="text-white">{searchQuery}</span>".
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateNewCityFromQuery}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 mx-auto"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Cadastrar "{searchQuery}" e Acessar Raio-X</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Popular Quick-Pick Pills */}
            <div className="pt-4 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                Atalhos Rápidos de Cidades Ativas:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {municipalities.slice(0, 6).map((muni) => (
                  <button
                    key={muni.id}
                    type="button"
                    onClick={() => handleSelectCity(muni)}
                    className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{muni.name} - {muni.state}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA 2: TELA DE MUNICÍPIO (RAIO-X READ-ONLY COM AÇÃO PRIMÁRIA DE CARTÃO) */}
        {/* ========================================================================= */}
        {currentStep === 'raio_x' && selectedMuni && (
          <div className="max-w-5xl w-full mx-auto space-y-6 animate-fadeIn py-4">
            
            {/* Header Area with Primary Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-black text-xs px-3 py-1 rounded-full uppercase">
                    UF: {selectedMuni.state}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase px-3 py-1 rounded-full">
                    {selectedMuni.status.replace('_', ' ')}
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
                    Região {selectedMuni.region}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {selectedMuni.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-4 flex-wrap">
                  <span>População: <b>{(selectedMuni.population || 0).toLocaleString('pt-BR')} hab.</b></span>
                  <span>•</span>
                  <span>Sistema Atual: <b className="text-amber-400">{selectedMuni.currentSystem || 'Competidor'}</b></span>
                  <span>•</span>
                  <span>IO Score: <b className="text-emerald-400">{selectedMuni.ioScore || 85}/100</b></span>
                </p>
              </div>

              {/* Primary Action Button: [+ Criar Cartão de Visita] */}
              <div className="relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={handleStartCreateCard}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm px-6 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 group"
                >
                  <UserPlus className="w-5 h-5 text-blue-200 group-hover:scale-110 transition-transform" />
                  <span>+ Criar Cartão de Visita</span>
                </button>
              </div>
            </div>

            {/* Read-Only Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Valor Contratual Vigente</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  R$ {(selectedMuni.currentContractValue || 0).toLocaleString('pt-BR')}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Risco de Encerramento: {selectedMuni.contractDaysRemaining || 90} dias</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Alunos e Escolas</span>
                <div className="text-xl font-black text-white">
                  {(selectedMuni.educationalMetrics?.studentsCount || 4500).toLocaleString('pt-BR')} alunos
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">{selectedMuni.educationalMetrics?.schoolsCount || 25} escolas municipais</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Orçamento FUNDEB</span>
                <div className="text-xl font-black text-indigo-300 font-mono">
                  R$ {((selectedMuni.educationalMetrics?.fundebBudget || 12000000) / 1000000).toFixed(1)}M
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Meta IDEB: {selectedMuni.educationalMetrics?.idebTarget || 5.2}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Contatos Cadastrados</span>
                <div className="text-xl font-black text-blue-400">
                  {selectedMuni.keyContacts?.length || 0} contatos
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Última atividade: {selectedMuni.lastActivityDate || 'Hoje'}</span>
              </div>
            </div>

            {/* Existing Contacts Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-black text-white">Cartões de Visita & Contatos da Cidade</h3>
                </div>
                <button
                  type="button"
                  onClick={handleStartCreateCard}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Novo Contato</span>
                </button>
              </div>

              {selectedMuni.keyContacts && selectedMuni.keyContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMuni.keyContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-start justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{contact.name}</span>
                        </div>
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md inline-block">
                          {contact.role}
                        </span>
                        
                        <div className="pt-2 text-xs text-slate-400 space-y-1 font-mono">
                          {contact.phone && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Mail className="w-3 h-3 text-blue-400" />
                              <span className="truncate max-w-[200px]">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSavedContact(contact);
                          setCurrentSystem(selectedMuni.currentSystem || '');
                          setPainNotes('');
                          setSelectedTags([]);
                          setCurrentStep('log_journal');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Diário</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                  <UserPlus className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">Nenhum cartão de visita cadastrado para {selectedMuni.name}.</p>
                  <button
                    type="button"
                    onClick={handleStartCreateCard}
                    className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Primeiro Contato</span>
                  </button>
                </div>
              )}
            </div>

            {/* Timeline of Journal Entries */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">Histórico do Diário de Bordo ({muniInteractions.length})</h3>
                </div>
              </div>

              {muniInteractions.length > 0 ? (
                <div className="space-y-3">
                  {muniInteractions.slice(0, 5).map((inter) => (
                    <div key={inter.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-extrabold text-blue-300">{inter.contactName} ({inter.contactRole || 'Contato'})</span>
                        <span className="font-mono text-[10px] text-slate-500">{inter.date}</span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-line">{inter.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhuma anotação comercial registrada ainda para este município.</p>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA 3: TELA DO CARTÃO DE VISITA (MODO CRIAÇÃO LIMPO E SEM DISTRAÇÕES) */}
        {/* ========================================================================= */}
        {currentStep === 'create_card' && selectedMuni && (
          <div className="max-w-xl w-full mx-auto my-auto py-8 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-wider">
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Cartão de Visita</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Novo Contato em {selectedMuni.name} ({selectedMuni.state})
                </h2>
                <p className="text-xs text-slate-400">
                  Preencha os dados do responsável público para dar sequência ao atendimento.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={(e) => handleSaveContactInPlace(e, false)} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-blue-400 font-mono">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Salvamento automático ativo (salva ao sair do campo)
                  </span>
                </div>

                {isContactSavedInStep && (
                  <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>✓ Contato salvo com sucesso! Você continua na tela de edição.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('log_journal')}
                      className="text-white hover:text-emerald-200 underline text-[11px] cursor-pointer"
                    >
                      Ir para Diário →
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome do Contato <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    onBlur={handleBlurAutoSaveContact}
                    placeholder="Ex: Dra. Maria das Dores Silva"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    onBlur={handleBlurAutoSaveContact}
                    placeholder="Ex: Secretário(a) de Educação"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COMMON_ROLES.map((role, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setContactRole(role);
                          setTimeout(handleBlurAutoSaveContact, 50);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          contactRole === role
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      onBlur={handleBlurAutoSaveContact}
                      placeholder="(86) 99800-1234"
                      className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      onBlur={handleBlurAutoSaveContact}
                      placeholder="educacao@cidade.pi.gov.br"
                      className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('select_muni')}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    ← Voltar (Trocar Cidade)
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isContactSavedInStep ? '💾 Re-salvar Alterações' : '💾 Salvar sem Sair'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSaveContactInPlace(e, true)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Avançar para Diário →</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA 4: TELA DE DIÁRIO DE BORDO / ENRIQUECIMENTO (PÓS-SALVAMENTO) */}
        {/* ========================================================================= */}
        {currentStep === 'log_journal' && selectedMuni && savedContact && (
          <div className="max-w-2xl w-full mx-auto my-auto py-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Header & Contact Identity */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contato Salvo! Diário de Bordo Ativo</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedMuni.name} - {selectedMuni.state}</span>
                </div>

                <h2 className="text-2xl font-black text-white">
                  {savedContact.name}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Cargo: <b>{savedContact.role}</b></span>
                  {savedContact.phone && <span>• Tel: <b>{savedContact.phone}</b></span>}
                </p>
              </div>

              {/* Enrichment Form */}
              <form onSubmit={(e) => handleSaveJournalInPlace(e, false)} className="space-y-5">
                
                {isJournalSavedInStep && (
                  <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>✓ Histórico salvo no Diário de Bordo com sucesso! Permaneça na edição ou veja o Raio-X.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('raio_x')}
                      className="text-white hover:text-emerald-200 underline text-[11px] cursor-pointer"
                    >
                      Ver Raio-X →
                    </button>
                  </div>
                )}
                
                {/* Tipo de Atendimento */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                    Tipo de Atendimento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'ligacao', label: '📞 Ligação' },
                      { id: 'reuniao_virtual', label: '💻 Reunião' },
                      { id: 'visita', label: '🚗 Visita' },
                      { id: 'email', label: '✉️ E-mail/Zap' },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setInteractionType(type.id as any)}
                        className={`text-xs font-bold p-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                          interactionType === type.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sistema Atual (Concorrente / Legado) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Sistema Atual na Prefeitura (Concorrente)
                  </label>
                  <input
                    type="text"
                    value={currentSystem}
                    onChange={(e) => setCurrentSystem(e.target.value)}
                    onBlur={handleBlurAutoSaveJournal}
                    placeholder="Ex: Betha Sistemas, Fly2000, Diário em Papel..."
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COMMON_COMPETITORS.map((comp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentSystem(comp);
                          setTimeout(handleBlurAutoSaveJournal, 50);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          currentSystem === comp
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dores e Dificuldades (Anotações Livres) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Dores e Dificuldades Relatadas (Anotações do Atendimento)
                  </label>
                  <textarea
                    rows={4}
                    value={painNotes}
                    onChange={(e) => setPainNotes(e.target.value)}
                    onBlur={handleBlurAutoSaveJournal}
                    placeholder="Descreva o que o responsável relatou na ligação: insatisfação com diário de classe, atrasos no módulo de merenda, erro no fechamento do censo, interesse em nova licitação..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Situação / Gatilhos (Tags Clicáveis) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                    Situação / Gatilhos Comerciais (Tags Clicáveis)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGER_TAGS.map(tag => {
                      const isSelected = selectedTags.includes(tag.label);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.label)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : `${tag.color} hover:opacity-90`
                          }`}
                        >
                          <span>{tag.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Action */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('create_card')}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    ← Voltar (Editar Contato)
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isJournalSavedInStep ? '💾 Re-salvar Alterações' : '💾 Salvar Histórico sem Sair'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSaveJournalInPlace(e, true)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Concluir e Ver Raio-X →</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
