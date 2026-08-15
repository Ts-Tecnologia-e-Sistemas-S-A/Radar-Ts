import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  FileText, 
  Globe, 
  ShieldCheck, 
  GraduationCap, 
  Briefcase, 
  X, 
  Check, 
  TrendingUp, 
  DollarSign, 
  Filter 
} from 'lucide-react';
import { Municipality, CRMInteraction, KeyContact } from '../types';
import { searchIbgeCity, fetchIbgeMunicipalities } from '../services/govApisService';
import { 
  findBestMatchingMunicipality, 
  rankMunicipalitiesByQuery, 
  calculateStringSimilarity 
} from '../utils/fuzzyCitySearch';

interface SingleCityQueryViewProps {
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  onAddCRMInteraction: (interaction: CRMInteraction) => void;
  onEditCRMInteraction?: (interaction: CRMInteraction) => void;
  onDeleteCRMInteraction?: (interactionId: string) => void;
  onAddMunicipality?: (newMuni: Municipality) => void;
  onUpdateMunicipality?: (muni: Municipality) => void;
  onSelectMunicipality?: (muni: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  onNavigateTab?: (tab: string) => void;
}

const BRAZIL_UFS = [
  'PI', 'MA', 'CE', 'BA', 'PE', 'PA', 'TO', 'SP', 'MG', 'RJ', 'PR', 'SC', 'RS', 'GO', 'AM', 'RN', 'PB', 'AL', 'SE', 'ES', 'MT', 'MS', 'DF', 'AC', 'AP', 'RO font'
];

export const SingleCityQueryView: React.FC<SingleCityQueryViewProps> = ({
  municipalities,
  crmInteractions,
  onAddCRMInteraction,
  onEditCRMInteraction,
  onDeleteCRMInteraction,
  onAddMunicipality,
  onUpdateMunicipality,
  onSelectMunicipality,
  selectedMunicipality,
  onNavigateTab = (_tab: string) => {}
}) => {
  // Search Input State
  const [searchQuery, setSearchQuery] = useState<string>(selectedMunicipality ? selectedMunicipality.name : '');
  const [selectedUf, setSelectedUf] = useState<string>(selectedMunicipality ? selectedMunicipality.state : 'PI');
  
  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResultMuni, setSearchResultMuni] = useState<Municipality | null>(selectedMunicipality || null);
  const [apiSourceNotice, setApiSourceNotice] = useState<string | null>(null);

  // New Contact Modal / Drawer State
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('Secretário(a) de Educação');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactNotes, setContactNotes] = useState<string>('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Filter within city cards
  const [cardRoleFilter, setCardRoleFilter] = useState<string>('todos');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync with initial or external selectedMunicipality
  useEffect(() => {
    if (selectedMunicipality) {
      setSearchResultMuni(selectedMunicipality);
      setSearchQuery(selectedMunicipality.name);
      setSelectedUf(selectedMunicipality.state || 'PI');
    }
  }, [selectedMunicipality]);

  // Execute unified search for city and cards
  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setApiSourceNotice(null);

    const queryClean = searchQuery.trim();

    // 1. Validation: empty search input
    if (!queryClean) {
      setErrorMessage('Por favor, digite o nome de uma prefeitura ou edital para buscar.');
      showToast('⚠️ Digite o nome de um município para pesquisar.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Search in local database / memory using fuzzy matching
      const fuzzyMatch = findBestMatchingMunicipality(queryClean, selectedUf, municipalities, 0.48);

      if (fuzzyMatch) {
        setSearchResultMuni(fuzzyMatch.item);
        if (onSelectMunicipality) onSelectMunicipality(fuzzyMatch.item);
        setApiSourceNotice(`🏛️ Encontrado no Banco de Dados: ${fuzzyMatch.item.name} - ${fuzzyMatch.item.state}`);
        showToast(`📍 Prefeitura de ${fuzzyMatch.item.name} (${fuzzyMatch.item.state}) carregada!`);
      } else {
        // 3. Fallback to public REST API (IBGE)
        const ibgeResult = await searchIbgeCity(queryClean, selectedUf);

        const cityNameFinal = ibgeResult ? ibgeResult.nome : queryClean;
        const stateFinal = selectedUf.toUpperCase();
        const generatedId = `mun-${cityNameFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${stateFinal.toLowerCase()}`;

        const newMuni: Municipality = {
          id: generatedId,
          name: cityNameFinal,
          state: stateFinal,
          region: 'Nordeste',
          population: 38000,
          status: 'oportunidade',
          funnelStage: 'prospectado',
          currentSystem: 'Sistema Competidor Legado',
          currentContractValue: 1280000,
          contractDaysRemaining: 80,
          renewalProbability: 'Média',
          tenderProbability: 85,
          estimatedNewContractValue: 1500000,
          probableModality: 'Pregão Eletrônico',
          ioScore: 84,
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
            dropoutRate: 5.2,
            schoolsCount: 22,
            studentsCount: 4200,
            teachersCount: 240,
            fundebBudget: 13500000,
            mainPains: ['Gestão da Merenda', 'Diário Eletrônico']
          },
          keyContacts: [],
          buyingHistory: [],
          lastActivityDate: new Date().toISOString().slice(0, 10),
          notes: ibgeResult ? `Mapeado via API IBGE (${ibgeResult.id})` : 'Mapeado via Busca Comercial Direct',
          verifiedSources: [ibgeResult ? `IBGE REST API (Código: ${ibgeResult.id})` : 'Base Pública']
        };

        if (onAddMunicipality) {
          onAddMunicipality(newMuni);
        }

        setSearchResultMuni(newMuni);
        if (onSelectMunicipality) onSelectMunicipality(newMuni);

        if (ibgeResult) {
          setApiSourceNotice(`🌐 Mapeado via API Pública do IBGE: ${ibgeResult.nome} (Código: ${ibgeResult.id})`);
          showToast(`🏛️ Prefeitura de ${ibgeResult.nome} (${stateFinal}) localizada na API Pública!`);
        } else {
          setApiSourceNotice(`⚡ Nova prefeitura "${cityNameFinal} (${stateFinal})" cadastrada para consulta.`);
          showToast(`⚡ ${cityNameFinal} (${stateFinal}) pronta para receber cartões de visita!`);
        }
      }
    } catch (err: any) {
      console.error('Erro ao pesquisar cidade:', err);
      setErrorMessage('Ocorreu uma oscilação na conexão ao consultar a base. Exibindo dados locais disponíveis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get business cards / contacts for current result city
  const cityContactsList = useMemo(() => {
    if (!searchResultMuni) return [];

    const muniNameLower = searchResultMuni.name.toLowerCase().trim();
    const muniIdLower = searchResultMuni.id.toLowerCase().trim();

    // 1. Gather contacts from municipality's keyContacts
    const keyContacts = (searchResultMuni.keyContacts || []).map((kc, idx) => ({
      id: `kc-${idx}-${kc.name}`,
      contactName: kc.name,
      contactRole: kc.role || 'Contato Principal',
      phone: kc.phone || '',
      email: kc.email || '',
      date: searchResultMuni.lastActivityDate || 'Recente',
      notes: kc.notes || 'Cadastrado no Raio-X do município',
      source: 'keyContact'
    }));

    // 2. Gather contacts from crmInteractions
    const crmCards = crmInteractions
      .filter(inter => {
        const interMuniId = (inter.municipalityId || '').toLowerCase().trim();
        const interMuniName = (inter.municipalityName || '').toLowerCase().trim();

        return (
          (interMuniId && interMuniId === muniIdLower) ||
          (interMuniName && (interMuniName === muniNameLower || calculateStringSimilarity(interMuniName, muniNameLower) >= 0.80))
        );
      })
      .map(inter => ({
        id: inter.id,
        contactName: inter.contactName,
        contactRole: inter.contactRole || 'Contato CRM',
        phone: '',
        email: '',
        date: inter.date || 'Recente',
        notes: inter.description || inter.summary || '',
        source: 'interaction'
      }));

    // Combine & deduplicate by contact name
    const combined = [...keyContacts, ...crmCards];
    const uniqueMap = new Map<string, typeof combined[0]>();

    combined.forEach(c => {
      const key = c.contactName.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      } else {
        // Merge notes or phone if missing
        const existing = uniqueMap.get(key)!;
        if (!existing.phone && c.phone) existing.phone = c.phone;
        if (!existing.email && c.email) existing.email = c.email;
      }
    });

    let result = Array.from(uniqueMap.values());

    // Role filtering
    if (cardRoleFilter !== 'todos') {
      result = result.filter(c => {
        const r = c.contactRole.toLowerCase();
        if (cardRoleFilter === 'secretario') return r.includes('secretár') || r.includes('secretaria');
        if (cardRoleFilter === 'prefeito') return r.includes('prefeit');
        if (cardRoleFilter === 'pregoeiro') return r.includes('pregoeir') || r.includes('licita');
        if (cardRoleFilter === 'ti') return r.includes('ti') || r.includes('tecnologia');
        return true;
      });
    }

    return result;
  }, [searchResultMuni, crmInteractions, cardRoleFilter]);

  // Auto-save draft on field blur
  const handleFieldBlurAutoSave = () => {
    if (!searchResultMuni || !contactName.trim()) return;

    // Persist draft immediately when leaving any input field
    const draftKeyContact: KeyContact = {
      name: contactName.trim(),
      role: contactRole.trim() || 'Contato Comercial',
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      notes: contactNotes.trim() || `Auto-salvo ao sair do campo em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedKeyContacts = [
      ...(searchResultMuni.keyContacts || []).filter(c => c.name.toLowerCase() !== draftKeyContact.name.toLowerCase()),
      draftKeyContact
    ];

    const updatedMuni: Municipality = {
      ...searchResultMuni,
      keyContacts: updatedKeyContacts,
      lastActivityDate: new Date().toISOString().slice(0, 10)
    };

    setSearchResultMuni(updatedMuni);
    if (onUpdateMunicipality) onUpdateMunicipality(updatedMuni);
    showToast(`💾 Alteração salva automaticamente ao sair do campo (${contactName})`);
  };

  // Open creation modal
  const handleOpenCreateCardModal = () => {
    if (!searchResultMuni) {
      showToast('⚠️ Por favor, faça uma busca por um município primeiro.');
      return;
    }
    setEditingCardId(null);
    setContactName('');
    setContactRole('Secretário(a) de Educação');
    setContactPhone('');
    setContactEmail('');
    setContactNotes('');
    setIsCardModalOpen(true);
  };

  const [isSavedInModal, setIsSavedInModal] = useState(false);

  // Save Card Handler
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResultMuni) return;

    if (!contactName.trim()) {
      showToast('⚠️ Informe o nome do contato.');
      return;
    }

    const newKeyContact: KeyContact = {
      name: contactName.trim(),
      role: contactRole.trim() || 'Contato Comercial',
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      notes: contactNotes.trim() || `Cadastrado em ${new Date().toLocaleDateString('pt-BR')}`
    };

    // 1. Update municipality keyContacts
    const updatedKeyContacts = [...(searchResultMuni.keyContacts || []).filter(c => c.name.toLowerCase() !== newKeyContact.name.toLowerCase()), newKeyContact];
    const updatedMuni: Municipality = {
      ...searchResultMuni,
      keyContacts: updatedKeyContacts,
      lastActivityDate: new Date().toISOString().slice(0, 10)
    };

    setSearchResultMuni(updatedMuni);
    if (onUpdateMunicipality) onUpdateMunicipality(updatedMuni);

    // 2. Also register a CRM interaction for timeline tracking
    const newInteraction: CRMInteraction = {
      id: `card-${Date.now()}`,
      municipalityId: updatedMuni.id,
      municipalityName: updatedMuni.name,
      state: updatedMuni.state,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: 'ligacao',
      contactName: newKeyContact.name,
      contactRole: newKeyContact.role,
      summary: `Cartão de Visita Cadastrado: ${newKeyContact.name} (${newKeyContact.role})`,
      description: contactNotes.trim() || `Novo cartão de visita cadastrado no SICAP Comercial. Telefone: ${newKeyContact.phone || 'Não informado'} | E-mail: ${newKeyContact.email || 'Não informado'}`,
      outcome: 'positivo',
      dealOwner: 'Consultor Comercial'
    };

    onAddCRMInteraction(newInteraction);

    setIsSavedInModal(true);
    showToast(`✅ Cartão de Visita de "${newKeyContact.name}" salvo com sucesso! Você continua na tela.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4 md:p-6 text-slate-100 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideInRight font-medium text-sm">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* UX NAVIGATION BAR ON TOP */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => onNavigateTab('business_cards')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>← Voltar para Cartões de Visita</span>
          </button>
          <button
            onClick={() => onNavigateTab('opportunities')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🏠 Raio-X Geral</span>
          </button>
          <span className="text-slate-500 font-mono">/</span>
          <span className="text-blue-400 font-bold">Consulta Única: {searchResultMuni ? searchResultMuni.name : 'Pesquisar Cidades'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-2.5 py-1 rounded-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Salvamento ao sair do campo ativo
          </span>
          <button
            onClick={() => onNavigateTab('task_crm')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ir para CRM Task-Based →</span>
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO DE BUSCA UNIFICADA (TELA ÚNICA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5 text-blue-400 text-xs font-black uppercase tracking-wider">
          <Building2 className="w-4 h-4" />
          <span>SICAP Comercial — Consulta Única de Cidade</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consultar Prefeitura e Cartões de Visita
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Digite o nome do município para carregar dados públicos e a lista de contatos em uma só tela.
          </p>
        </div>

        {/* Form de Busca */}
        <form onSubmit={handleExecuteSearch} className="pt-2">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            
            {/* Input de Texto */}
            <div className="relative flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl flex items-center focus-within:border-blue-500 transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Buscar prefeitura, edital, cidade (ex: Esperantina, Teresina, Codó)..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm font-semibold px-4 py-3.5 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-2 text-slate-400 hover:text-white mr-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Seletor de UF */}
            <select
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs px-4 py-3.5 rounded-2xl outline-none focus:border-blue-500 shrink-0 cursor-pointer"
            >
              <option value="PI">PI - Piauí</option>
              <option value="MA">MA - Maranhão</option>
              <option value="CE">CE - Ceará</option>
              <option value="BA">BA - Bahia</option>
              <option value="PE">PE - Pernambuco</option>
              <option value="PA">PA - Pará</option>
              <option value="TO">TO - Tocantins</option>
              <option value="SP">SP - São Paulo</option>
              <option value="MG">MG - Minas Gerais</option>
            </select>

            {/* Botão Procurar */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-blue-200" />
                  <span>Procurar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Mensagem de Validação / Erro */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Aviso de Fonte da API / Banco */}
        {apiSourceNotice && !errorMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-4 py-2 rounded-2xl flex items-center gap-2 animate-fadeIn font-mono">
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{apiSourceNotice}</span>
          </div>
        )}
      </div>

      {/* 2. ESTADO DE LOADING (SKELETON) */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="h-6 w-32 bg-slate-800 rounded-full"></div>
            <div className="h-10 w-64 bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="h-20 bg-slate-800/60 rounded-2xl"></div>
              <div className="h-20 bg-slate-800/60 rounded-2xl"></div>
              <div className="h-20 bg-slate-800/60 rounded-2xl"></div>
              <div className="h-20 bg-slate-800/60 rounded-2xl"></div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CARD DE RESULTADO DA CIDADE & LISTA DE CARTÕES (EXIBIDO APÓS BUSCA) */}
      {!isLoading && searchResultMuni && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Card de Resultado da Cidade */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-black text-xs px-3 py-1 rounded-full uppercase">
                    UF: {searchResultMuni.state}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase px-3 py-1 rounded-full">
                    {searchResultMuni.status.replace('_', ' ')}
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
                    Região {searchResultMuni.region}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight">
                  {searchResultMuni.name}
                </h2>

                <p className="text-xs text-slate-400">
                  Código / Registro ID: <code className="text-slate-300 font-mono">{searchResultMuni.id}</code>
                </p>
              </div>

              {/* Botão Fixo/Proeminente para Criar Cartão */}
              <button
                type="button"
                onClick={handleOpenCreateCardModal}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 border border-emerald-400/30"
              >
                <Plus className="w-5 h-5 text-emerald-100" />
                <span>+ Novo Cartão de Visita</span>
              </button>
            </div>

            {/* Grid de Estatísticas e Dados Educacionais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">População Estimada</span>
                <div className="text-lg font-black text-white font-mono">
                  {(searchResultMuni.population || 35000).toLocaleString('pt-BR')} hab.
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Sistema Atual</span>
                <div className="text-lg font-black text-amber-400 truncate">
                  {searchResultMuni.currentSystem || 'Concorrente'}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Score IO</span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {searchResultMuni.ioScore || 85}/100
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Alunos na Rede</span>
                <div className="text-lg font-black text-indigo-300 font-mono">
                  {(searchResultMuni.educationalMetrics?.studentsCount || 4200).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

          </div>

          {/* 4. LISTA DE CARTÕES DE VISITA DA CIDADE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Cartões de Visita em {searchResultMuni.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {cityContactsList.length} contato(s) cadastrado(s) nesta cidade
                  </p>
                </div>
              </div>

              {/* Filtro Rápido de Cargos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'secretario', label: 'Secretários' },
                  { id: 'prefeito', label: 'Prefeitos' },
                  { id: 'pregoeiro', label: 'Pregoeiros' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCardRoleFilter(f.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      cardRoleFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Renderização dos Cartões */}
            {cityContactsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityContactsList.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl space-y-3 transition-all group flex flex-col justify-between shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-white text-base group-hover:text-blue-300 transition-colors">
                            {card.contactName}
                          </h4>
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md inline-block mt-1">
                            {card.contactRole}
                          </span>
                        </div>
                      </div>

                      {/* Phone & Email */}
                      <div className="pt-2 text-xs font-mono space-y-1 text-slate-300">
                        {card.phone ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{card.phone}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">Telefone não informado</div>
                        )}

                        {card.email ? (
                          <div className="flex items-center gap-2 text-blue-400 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{card.email}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Notes / Status */}
                      {card.notes && (
                        <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 line-clamp-2">
                          {card.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{card.date}</span>
                      <span className="text-emerald-400 font-bold">Verificado</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ESTADO VAZIO: Nenhum cartão criado para esta cidade */
              <div className="text-center py-12 px-4 bg-slate-950/60 rounded-3xl border border-dashed border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white">
                    Nenhum cartão criado ainda para esta cidade
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Seja o primeiro a cadastrar um contato comercial (Secretário, Prefeito, Diretor) para {searchResultMuni.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateCardModal}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeiro Cartão para {searchResultMuni.name}</span>
                </button>
              </div>
            )}

            {/* Botão Fixo Adicional de Ação no Rodapé da Lista */}
            <div className="pt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={handleOpenCreateCardModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Cartão de Visita em {searchResultMuni.name}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL DE CRIAÇÃO DO CARTÃO DE VISITA (PRÉ-PREENCHIDO COM CIDADE DA BUSCA) */}
      {isCardModalOpen && searchResultMuni && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-8 max-w-lg w-full my-auto max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 relative">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                  Pré-preenchido com a busca
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Novo Cartão em {searchResultMuni.name} ({searchResultMuni.state})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCard} className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-emerald-400 font-mono">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Salvamento automático ativo (salva ao sair do campo)
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Nome do Contato <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  onBlur={handleFieldBlurAutoSave}
                  placeholder="Ex: Dra. Francisca Lima"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  onBlur={handleFieldBlurAutoSave}
                  placeholder="Ex: Secretário(a) de Educação"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-sm px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none mb-2"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Secretário(a) de Educação', 'Prefeito(a)', 'Diretor(a) do PNAE', 'Coordenador(a) TI', 'Pregoeiro(a)'].map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setContactRole(r);
                        setTimeout(handleFieldBlurAutoSave, 50);
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        contactRole === r ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    onBlur={handleFieldBlurAutoSave}
                    placeholder="(86) 99800-0000"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    onBlur={handleFieldBlurAutoSave}
                    placeholder="contato@prefeitura.pi.gov.br"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Observações / Status Comercial
                </label>
                <textarea
                  rows={3}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  onBlur={handleFieldBlurAutoSave}
                  placeholder="Notas adicionais sobre o atendimento, horário preferencial de ligação, insatisfação com sistema atual..."
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              {isSavedInModal && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>✓ Cartão de visita salvo com sucesso! Permaneça na tela ou feche quando desejar.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="text-white hover:text-emerald-200 underline text-[11px] cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  ← Concluir e Fechar Tela
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setContactName('');
                      setContactRole('Secretário(a) de Educação');
                      setContactPhone('');
                      setContactEmail('');
                      setContactNotes('');
                      setIsSavedInModal(false);
                    }}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-700 transition-all cursor-pointer text-center"
                  >
                    ➕ Novo Contato
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavedInModal ? '💾 Re-salvar Alterações' : '💾 Salvar Cartão sem Sair'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
