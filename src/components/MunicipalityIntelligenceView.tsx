import React, { useState } from 'react';
import { Municipality, KeyContact, CRMInteraction } from '../types';
import { 
  Building2, 
  Users, 
  History, 
  Calculator, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  GraduationCap, 
  ShieldAlert,
  Search,
  Phone,
  Mail,
  FileCheck,
  MessageSquare,
  Plus,
  Clock,
  PhoneCall,
  MapPin,
  Scale
} from 'lucide-react';

interface MunicipalityIntelligenceViewProps {
  municipalities: Municipality[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  onGenerateAIStrategy: (m: Municipality) => void;
  crmInteractions?: CRMInteraction[];
  onOpenCRM?: (m: Municipality) => void;
}

export const MunicipalityIntelligenceView: React.FC<MunicipalityIntelligenceViewProps> = ({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  onGenerateAIStrategy,
  crmInteractions = [],
  onOpenCRM,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'equipe' | 'historico' | 'educacional' | 'crm'>('geral');

  const filteredMunis = municipalities.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.currentSystem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMuni = selectedMunicipality || filteredMunis[0] || municipalities[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Módulo 2: Inteligência Municipal & Mapeamento Comercial</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Raio-X de Contratos & Pessoas-Chave
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mapeamento profundo de prazos contratuais, secretários, pregoeiros, histórico e propensão de compra.
          </p>
        </div>

        {/* Municipality Picker */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Filtrar município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-40"
          />
        </div>
      </div>

      {/* Grid: Left List (4 cols) + Right Detail Dossier (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List of Municipalities */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            Prefeituras Mapeadas ({filteredMunis.length})
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredMunis.map((m) => {
              const isSelected = activeMuni?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMunicipality(m)}
                  className={`p-3.5 transition-all cursor-pointer border-l-4 ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-blue-600 font-semibold'
                      : 'hover:bg-slate-50 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {m.name} ({m.state})
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      IO: {m.ioScore}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span className="truncate max-w-[150px]">{m.currentSystem}</span>
                    <span className={m.contractDaysRemaining <= 60 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                      {m.contractDaysRemaining < 0
                        ? 'Encerrado'
                        : `${m.contractDaysRemaining} dias`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Municipality Full Intelligence Dossier */}
        {activeMuni && (
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            
            {/* Dossier Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    Prefeitura Municipal de {activeMuni.name} - {activeMuni.state}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    Índice IO: {activeMuni.ioScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Região {activeMuni.region} | População: {activeMuni.population.toLocaleString('pt-BR')} habitantes | Responsável: {activeMuni.dealOwner}
                </p>
              </div>

              <button
                onClick={() => onGenerateAIStrategy(activeMuni)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Gerar Estratégia de Abordagem IA</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Chance de Licitação</span>
                <span className="text-xl font-black text-orange-600">{activeMuni.tenderProbability}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Probabilidade calculada</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Vencimento Contratual</span>
                <span className={`text-xl font-black ${activeMuni.contractDaysRemaining <= 60 ? 'text-red-600' : 'text-slate-900'}`}>
                  {activeMuni.contractDaysRemaining < 0
                    ? 'Encerrado'
                    : `${activeMuni.contractDaysRemaining} dias`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Sistema: {activeMuni.currentSystem}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Estimado</span>
                <span className="text-xl font-black text-emerald-600">
                  R$ {(activeMuni.estimatedNewContractValue / 1000).toFixed(0)}k
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Anual projetado</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Modalidade Provável</span>
                <span className="text-xs font-extrabold text-blue-700 block mt-1">{activeMuni.probableModality}</span>
                <span className="text-[10px] text-slate-500 block">Renovação: {activeMuni.renewalProbability}</span>
              </div>

            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
              <button
                onClick={() => setActiveTab('geral')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'geral'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Panorama Geral</span>
              </button>

              <button
                onClick={() => setActiveTab('equipe')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'equipe'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Pessoas-Chave ({activeMuni.keyContacts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('historico')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'historico'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Histórico de Compras</span>
              </button>

              <button
                onClick={() => setActiveTab('educacional')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'educacional'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Indicadores Educacionais</span>
              </button>

              <button
                onClick={() => setActiveTab('crm')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'crm'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Interações CRM ({crmInteractions.filter(i => i.municipalityId === activeMuni.id).length})</span>
              </button>
            </div>

            {/* Sub Tab Content */}
            {activeTab === 'geral' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Diagnóstico de Mercado & Observações Comerciais</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {activeMuni.notes || 'Sem observações adicionais gravadas.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-800">Principais Dores da Secretaria</h4>
                    <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                      {activeMuni.educationalMetrics.mainPains.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-800">Recursos Orcamentários & Fundeb</h4>
                    <div className="space-y-1 text-slate-700">
                      <p><strong>Orçamento Fundeb:</strong> R$ {activeMuni.educationalMetrics.fundebBudget.toLocaleString('pt-BR')}</p>
                      <p><strong>Escolas atendidas:</strong> {activeMuni.educationalMetrics.schoolsCount} unidades</p>
                      <p><strong>Alunos matriculados:</strong> {activeMuni.educationalMetrics.studentsCount.toLocaleString('pt-BR')}</p>
                      <p><strong>Professores da rede:</strong> {activeMuni.educationalMetrics.teachersCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipe' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeMuni.keyContacts.map((contact, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                      <span className="font-bold text-slate-900 text-sm block">{contact.name}</span>
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] inline-block">
                        {contact.role}
                      </span>
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100 mt-1">
                          "{contact.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {activeMuni.buyingHistory.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.company}</span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                            {item.year}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{item.objectStr}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-emerald-600 text-sm block">
                          R$ {item.value.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.modality}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'educacional' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">IDEB Atual</span>
                  <span className="text-2xl font-black text-blue-700">{activeMuni.educationalMetrics.ideb}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Meta: {activeMuni.educationalMetrics.idebTarget}</span>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Taxa de Abandono</span>
                  <span className="text-2xl font-black text-red-600">{activeMuni.educationalMetrics.dropoutRate}%</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Abandono escolar</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Verba Fundeb</span>
                  <span className="text-lg font-black text-emerald-700">
                    R$ {(activeMuni.educationalMetrics.fundebBudget / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Anual</span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-center">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Alunos / Escolas</span>
                  <span className="text-lg font-black text-indigo-700">
                    {activeMuni.educationalMetrics.studentsCount} / {activeMuni.educationalMetrics.schoolsCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Total da rede</span>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-extrabold text-slate-900 block">
                      Histórico CRM de {activeMuni.name} ({activeMuni.state})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Registro de visitas, chamadas, reuniões e impugnações a editais.
                    </span>
                  </div>
                  {onOpenCRM && (
                    <button
                      onClick={() => onOpenCRM(activeMuni)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Interação</span>
                    </button>
                  )}
                </div>

                {crmInteractions.filter(i => i.municipalityId === activeMuni.id).length === 0 ? (
                  <div className="p-8 border border-slate-200 rounded-xl text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">Nenhuma interação CRM registrada até o momento para esta prefeitura.</p>
                    {onOpenCRM && (
                      <button
                        onClick={() => onOpenCRM(activeMuni)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Clique para adicionar o primeiro contato
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {crmInteractions
                      .filter(i => i.municipalityId === activeMuni.id)
                      .map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.summary}</span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Contato: <strong>{item.contactName}</strong> ({item.contactRole || 'N/I'})</span>
                            <span>•</span>
                            <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 text-xs">
                            {item.description}
                          </p>
                          {item.nextStep && (
                            <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-medium text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Próximo Passo: <strong>{item.nextStep}</strong></span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
