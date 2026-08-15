import React, { useState, useEffect } from 'react';
import { Municipality, FunnelStage, CRMInteraction, CompetitorItem } from '../types';
import { CRMInteractionsView } from './CRMInteractionsView';
import { MunicipalityIntelligenceView } from './MunicipalityIntelligenceView';
import { AICommercialAgentView } from './AICommercialAgentView';
import { DossierExportModal } from './DossierExportModal';
import {
  Kanban,
  Building2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Calculator,
  Search,
  Filter,
  Sparkles,
  PhoneCall,
  Calendar,
  User,
  Plus,
  Send,
  X,
  FileText,
  Clock,
  History,
  Building,
  GraduationCap,
  School,
  Bot,
  ExternalLink,
  Pencil,
  Trash2,
  MessageSquare,
  Download
} from 'lucide-react';

// CRM: tela única e principal — Funil (pipeline), Visão Geral (dossiê do município),
// Interações (histórico/cartão de visita) e Estratégia IA, tudo sobre o mesmo município ativo.
type CrmSubTab = 'kanban' | 'crm' | 'geral' | 'ia';

interface SalesFunnelViewProps {
  municipalities: Municipality[];
  crmInteractions?: CRMInteraction[];
  onUpdateFunnelStage: (municipalityId: string, newStage: FunnelStage) => void;
  onSelectMunicipality: (m: Municipality) => void;
  onAddCRMInteraction?: (newInteraction: CRMInteraction) => void;
  onEditCRMInteraction?: (updatedInteraction: CRMInteraction) => void;
  onDeleteCRMInteraction?: (id: string) => void;
  onAddMunicipality?: (newMuni: Municipality) => void;
  onUpdateMunicipality?: (updated: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  onNavigateTab?: (tab: any) => void;
  onOpenAIForMuni?: (m: Municipality) => void;
  initialSubTab?: CrmSubTab;
  competitors?: CompetitorItem[];
  onAddCompetitor?: (c: CompetitorItem) => void;
}

export const FUNNEL_STAGES_CONFIG: { id: FunnelStage; label: string; color: string }[] = [
  { id: 'prospectado', label: '1. Prospectado', color: 'border-slate-300 bg-slate-50' },
  { id: 'primeiro_contato', label: '2. Primeiro Contato', color: 'border-blue-300 bg-blue-50/50' },
  { id: 'reuniao', label: '3. Reunião', color: 'border-indigo-300 bg-indigo-50/50' },
  { id: 'demonstracao', label: '4. Demonstração', color: 'border-purple-300 bg-purple-50/50' },
  { id: 'piloto', label: '5. Piloto', color: 'border-cyan-300 bg-cyan-50/50' },
  { id: 'projeto_apresentado', label: '6. Projeto Apresentado', color: 'border-amber-300 bg-amber-50/50' },
  { id: 'processo_licitatorio', label: '7. Processo Licitatório', color: 'border-orange-300 bg-orange-50/50' },
  { id: 'homologacao', label: '8. Homologação', color: 'border-emerald-300 bg-emerald-50/50' },
  { id: 'implantacao', label: '9. Implantação', color: 'border-green-400 bg-green-50' },
];

export const SalesFunnelView: React.FC<SalesFunnelViewProps> = ({
  municipalities,
  crmInteractions = [],
  onUpdateFunnelStage,
  onSelectMunicipality,
  onAddCRMInteraction,
  onEditCRMInteraction,
  onDeleteCRMInteraction,
  onAddMunicipality,
  onUpdateMunicipality,
  selectedMunicipality,
  onNavigateTab,
  onOpenAIForMuni,
  initialSubTab = 'kanban',
  competitors,
  onAddCompetitor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CrmSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Modal detail state
  const [activeMuniModal, setActiveMuniModal] = useState<Municipality | null>(null);
  
  // Inline CRM interaction form inside Funnel Modal
  const [isAddCrmOpen, setIsAddCrmOpen] = useState(false);
  const [crmType, setCrmType] = useState<CRMInteraction['type']>('ligacao');
  const [crmContactName, setCrmContactName] = useState('');
  const [crmContactRole, setCrmContactRole] = useState('Secretária de Educação');
  const [crmSummary, setCrmSummary] = useState('');
  const [crmDescription, setCrmDescription] = useState('');
  const [crmOutcome, setCrmOutcome] = useState<CRMInteraction['outcome']>('positivo');
  const [crmNextStep, setCrmNextStep] = useState('');
  const [crmNextStepDueDate, setCrmNextStepDueDate] = useState('');

  // Filtering
  const filtered = municipalities.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.currentSystem || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !selectedState || m.state === selectedState;
    return matchesSearch && matchesState;
  });

  const getNextStage = (current: FunnelStage): FunnelStage | null => {
    const idx = FUNNEL_STAGES_CONFIG.findIndex((s) => s.id === current);
    if (idx >= 0 && idx < FUNNEL_STAGES_CONFIG.length - 1) {
      return FUNNEL_STAGES_CONFIG[idx + 1].id;
    }
    return null;
  };

  const getPrevStage = (current: FunnelStage): FunnelStage | null => {
    const idx = FUNNEL_STAGES_CONFIG.findIndex((s) => s.id === current);
    if (idx > 0) {
      return FUNNEL_STAGES_CONFIG[idx - 1].id;
    }
    return null;
  };

  const handleCreateCrmFromFunnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMuniModal || !crmSummary || !crmContactName) return;

    const newInter: CRMInteraction = {
      id: `crm-funnel-${Date.now()}`,
      municipalityId: activeMuniModal.id,
      municipalityName: activeMuniModal.name,
      state: activeMuniModal.state,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: crmType,
      contactName: crmContactName,
      contactRole: crmContactRole,
      summary: crmSummary,
      description: crmDescription,
      outcome: crmOutcome,
      nextStep: crmNextStep || undefined,
      nextStepDueDate: crmNextStepDueDate || undefined,
      dealOwner: 'José Badotti'
    };

    if (onAddCRMInteraction) {
      onAddCRMInteraction(newInter);
    }

    // Reset form
    setCrmSummary('');
    setCrmDescription('');
    setCrmNextStep('');
    setIsAddCrmOpen(false);
  };

  const muniInteractions = activeMuniModal
    ? crmInteractions.filter((i) => i.municipalityId === activeMuniModal.id)
    : [];

  // Município ativo para Visão Geral / Estratégia IA / Exportar Dossiê (mesmo contexto global do app)
  const activeMuniForTabs = selectedMunicipality || municipalities[0] || null;

  // Ao pedir estratégia de dentro da Visão Geral, troca de sub-aba nesta mesma tela em vez de navegar pra outra
  const handleGenerateAIStrategyHere = (m: Municipality) => {
    onSelectMunicipality(m);
    setActiveSubTab('ia');
  };

  const handleOpenCrmHere = (m: Municipality) => {
    onSelectMunicipality(m);
    setActiveSubTab('crm');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-tab Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
              <Kanban className="w-4 h-4 text-amber-600" />
              <span>CRM · Prefeituras, Funil, Interações & Estratégia</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              CRM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Um único lugar para o município ativo: dados da prefeitura, estágio no funil, histórico de interações e estratégia de abordagem com IA.
            </p>
          </div>

          {/* Sub-tab Navigation Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap items-center gap-1 border border-slate-200 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('geral')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'geral'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('kanban')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'kanban'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Funil (9 Etapas)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('crm')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'crm'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Interações ({crmInteractions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ia')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'ia'
                  ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Estratégia IA</span>
            </button>

            {activeMuniForTabs && (
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border-l border-slate-300 ml-1 pl-3"
                title={`Exportar dossiê de ${activeMuniForTabs.name}`}
              >
                <Download className="w-4 h-4" />
                <span>Dossiê</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters only for Kanban view */}
        {activeSubTab === 'kanban' && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3 flex-wrap">
            <div className="text-xs text-slate-500 font-semibold">
              Mostrando <strong className="text-slate-900">{filtered.length}</strong> município(s) no funil
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todos os Estados (UF)</option>
                {Array.from(new Set(municipalities.map((m) => m.state)))
                  .sort()
                  .map((st) => (
                    <option key={st} value={st}>
                      {st === 'PI' ? 'Piauí (PI)' : st === 'MA' ? 'Maranhão (MA)' : st === 'CE' ? 'Ceará (CE)' : st}
                    </option>
                  ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar prefeitura ou sistema..."
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-64"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {activeSubTab === 'crm' ? (
        <CRMInteractionsView
          interactions={crmInteractions}
          municipalities={municipalities}
          onAddInteraction={onAddCRMInteraction}
          onEditInteraction={onEditCRMInteraction}
          onDeleteInteraction={onDeleteCRMInteraction}
          onAddMunicipality={onAddMunicipality}
          onUpdateMunicipality={onUpdateMunicipality}
          selectedMunicipality={selectedMunicipality}
          onSelectMunicipality={onSelectMunicipality}
          onNavigateTab={onNavigateTab}
        />
      ) : activeSubTab === 'geral' ? (
        <MunicipalityIntelligenceView
          municipalities={municipalities}
          selectedMunicipality={selectedMunicipality || null}
          onSelectMunicipality={onSelectMunicipality}
          onUpdateMunicipality={onUpdateMunicipality}
          onGenerateAIStrategy={handleGenerateAIStrategyHere}
          crmInteractions={crmInteractions}
          onOpenCRM={handleOpenCrmHere}
          competitors={competitors}
          onAddCompetitor={onAddCompetitor}
        />
      ) : activeSubTab === 'ia' ? (
        <AICommercialAgentView
          municipalities={municipalities}
          selectedMunicipality={selectedMunicipality || null}
          onSelectMunicipality={onSelectMunicipality}
          onAddCRMInteraction={onAddCRMInteraction}
          onNavigateToCRM={() => setActiveSubTab('crm')}
        />
      ) : (
        <>
          {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {FUNNEL_STAGES_CONFIG.map((stageCfg) => {
          const stageMunis = filtered.filter((m) => m.funnelStage === stageCfg.id);
          const stageTotalValue = stageMunis.reduce((acc, m) => acc + m.estimatedNewContractValue, 0);

          return (
            <div
              key={stageCfg.id}
              className="w-72 shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200/80 p-3 flex flex-col max-h-[750px]"
            >
              {/* Stage Header */}
              <div className="pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-xs truncate">
                    {stageCfg.label}
                  </h3>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {stageMunis.length}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-slate-600 mt-1 flex items-center justify-between">
                  <span>Valor Estimado:</span>
                  <span className="text-emerald-700 font-extrabold">
                    R$ {(stageTotalValue / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              {/* Stage Items List */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {stageMunis.map((m) => {
                  const prevStage = getPrevStage(m.funnelStage);
                  const nextStage = getNextStage(m.funnelStage);
                  const interactionCount = crmInteractions.filter((i) => i.municipalityId === m.id).length;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setActiveMuniModal(m)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {m.name} ({m.state})
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          IO: {m.ioScore}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p className="truncate"><strong>Sistema:</strong> {m.currentSystem}</p>
                        <p className="truncate"><strong>Modalidade:</strong> {m.probableModality}</p>
                        <p className="font-extrabold text-slate-900 mt-1 text-xs text-blue-700">
                          R$ {m.estimatedNewContractValue.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      {/* Badges line: CRM interactions + AI hint */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <History className="w-3 h-3 text-slate-500" />
                          {interactionCount} interações
                        </span>

                        <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Copilot IA
                        </span>
                      </div>

                      {/* Moving Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <button
                          type="button"
                          disabled={!prevStage}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (prevStage) onUpdateFunnelStage(m.id, prevStage);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30"
                          title="Voltar etapa do funil"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-slate-400 font-semibold text-[10px]">
                          Gerenciar Ficha
                        </span>

                        <button
                          type="button"
                          disabled={!nextStage}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (nextStage) onUpdateFunnelStage(m.id, nextStage);
                          }}
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded disabled:opacity-30"
                          title="Avançar etapa do funil"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {stageMunis.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
                    Nenhum município nesta etapa
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Ficha Completa de Oportunidade do Funil Comercial */}
      {activeMuniModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-lg">
                      {activeMuniModal.name} ({activeMuniModal.state})
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                      IO Score: {activeMuniModal.ioScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Concorrente Atual: <strong className="text-slate-800">{activeMuniModal.currentSystem}</strong> | Vencimento: <strong className="text-slate-800">{activeMuniModal.contractDaysRemaining} dias</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveMuniModal(null);
                  setIsAddCrmOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Selector Bar */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Etapa Atual no Pipeline do Funil Comercial:
                </span>
                <span className="text-xs font-extrabold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded">
                  {FUNNEL_STAGES_CONFIG.find((s) => s.id === activeMuniModal.funnelStage)?.label}
                </span>
              </div>

              <select
                value={activeMuniModal.funnelStage}
                onChange={(e) => {
                  const newS = e.target.value as FunnelStage;
                  onUpdateFunnelStage(activeMuniModal.id, newS);
                  setActiveMuniModal({ ...activeMuniModal, funnelStage: newS });
                }}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {FUNNEL_STAGES_CONFIG.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Estimado</span>
                <span className="font-black text-slate-900 text-sm text-emerald-700">
                  R$ {activeMuniModal.estimatedNewContractValue.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Modalidade Provável</span>
                <span className="font-extrabold text-slate-800 text-xs">
                  {activeMuniModal.probableModality}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Alunos na Rede</span>
                <span className="font-extrabold text-slate-800 text-xs">
                  {(activeMuniModal.educationalMetrics?.studentsCount || 0).toLocaleString('pt-BR')} alunos
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Escolas Municipais</span>
                <span className="font-extrabold text-slate-800 text-xs">
                  {activeMuniModal.educationalMetrics?.schoolsCount || 0} unidades
                </span>
              </div>
            </div>

            {/* AI Copilot & Quick Nav Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-extrabold text-purple-950 text-xs block">Estratégia de Vendas & Objeções com IA</span>
                  <span className="text-[11px] text-purple-800">Gere roteiros customizados para a reunião deste município</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenAIForMuni && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAIForMuni(activeMuniModal);
                      setActiveMuniModal(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Gerar Pitch no Agente IA</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onSelectMunicipality(activeMuniModal);
                    setActiveMuniModal(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Ficha Completa</span>
                </button>
              </div>
            </div>

            {/* CRM History Section inside Funnel Card */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Histórico de Interações CRM deste Município ({muniInteractions.length})</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCrmOpen(!isAddCrmOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Nova Interação</span>
                </button>
              </div>

              {/* Inline Add CRM Form */}
              {isAddCrmOpen && (
                <form onSubmit={handleCreateCrmFromFunnel} className="p-4 bg-slate-50 rounded-xl border border-blue-200 space-y-3 text-xs">
                  <div className="font-extrabold text-blue-900 text-xs">
                    Lançar Registro de CRM no Funil
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipo de Contato</label>
                      <select
                        value={crmType}
                        onChange={(e) => setCrmType(e.target.value as CRMInteraction['type'])}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                      >
                        <option value="ligacao">📞 Ligação Telefônica</option>
                        <option value="visita">🏛️ Visita Presencial</option>
                        <option value="reuniao_virtual">💻 Reunião Virtual</option>
                        <option value="email">✉️ E-mail Enviado</option>
                        <option value="impugnacao">📜 Impugnação de Edital</option>
                        <option value="chat_assistente_ia">🤖 Estudo com IA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nome do Contato *</label>
                      <input
                        type="text"
                        placeholder="Ex: Dra. Marta Ribeiro"
                        value={crmContactName}
                        onChange={(e) => setCrmContactName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        placeholder="Ex: Secretária de Educação"
                        value={crmContactRole}
                        onChange={(e) => setCrmContactRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Resumo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Apresentação das vantagens do Módulo Educacenso para a Secretária"
                      value={crmSummary}
                      onChange={(e) => setCrmSummary(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Detalhamento / Relato da Reunião</label>
                    <textarea
                      rows={2}
                      placeholder="Relate os pontos combinados e principais objeções..."
                      value={crmDescription}
                      onChange={(e) => setCrmDescription(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCrmOpen(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Salvar Interação no CRM
                    </button>
                  </div>
                </form>
              )}

              {/* Interactions List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {muniInteractions.length > 0 ? (
                  muniInteractions.map((inter) => (
                    <div
                      key={inter.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-900">{inter.summary}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{inter.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs">{inter.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                        <span>Contato: {inter.contactName} ({inter.contactRole})</span>
                        {inter.nextStep && (
                          <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                            Próximo passo: {inter.nextStep}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Nenhuma interação cadastrada para este município até o momento.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveMuniModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                Fechar Ficha
              </button>
            </div>

          </div>
        </div>
      )}
        </>
      )}

      {showExportModal && activeMuniForTabs && (
        <DossierExportModal
          municipality={activeMuniForTabs}
          onClose={() => setShowExportModal(false)}
        />
      )}

    </div>
  );
};

