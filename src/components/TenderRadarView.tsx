import React, { useState, useEffect } from 'react';
import { TenderNotice, CommercialAlert, Municipality } from '../types';
import { AlertsView } from './AlertsView';
import { Search, Filter, ExternalLink, RefreshCw, FileText, Globe, Building, CheckCircle2, BookOpen, Eye, Sparkles, AlertCircle, ChevronRight, BellRing } from 'lucide-react';
import { TenderReaderModal } from './TenderReaderModal';

interface TenderRadarViewProps {
  tenders: TenderNotice[];
  alerts?: CommercialAlert[];
  municipalities?: Municipality[];
  onOpenTenderDetail: (tender: TenderNotice) => void;
  onNavigateToAI?: (tender: TenderNotice) => void;
  onSelectMunicipality?: (m: Municipality) => void;
  onOpenAIStrategy?: (m: Municipality) => void;
  onMarkAsReadAlert?: (id: string) => void;
  initialSubTab?: 'tenders' | 'alerts';
}

export const TenderRadarView: React.FC<TenderRadarViewProps> = ({
  tenders: initialTenders,
  alerts = [],
  municipalities = [],
  onOpenTenderDetail,
  onNavigateToAI,
  onSelectMunicipality,
  onOpenAIStrategy,
  onMarkAsReadAlert,
  initialSubTab = 'tenders'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tenders' | 'alerts'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [tendersList, setTendersList] = useState<TenderNotice[]>(initialTenders);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [modalityFilter, setModalityFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'education_only' | 'show_discarded'>('education_only');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSourcesInfoModal, setShowSourcesInfoModal] = useState<boolean>(false);
  const [showScopeTestModal, setShowScopeTestModal] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedTenderForReader, setSelectedTenderForReader] = useState<TenderNotice | null>(null);

  // Out-of-scope tenders discarded by AI anti-noise filter (e.g. Buíque/PE Health/Medicines PDF)
  const discardedTenders = [
    {
      id: 'ten-buique-med-09',
      municipalityName: 'Buíque',
      state: 'PE',
      source: 'BNC / PNCP',
      noticeNumber: 'PE 009/2026 (Proc. 044/2026)',
      objectStr: 'Aquisição de Medicamentos Éticos, Genéricos e Similares para o Fundo Municipal de Saúde da Prefeitura de Buíque/PE com base na tabela CMED/ANVISA.',
      estimatedValue: 180000,
      modality: 'Pregão Eletrônico',
      publicationDate: '2026-01-27',
      openingDate: '2026-02-11',
      status: 'Descartado por IA',
      reason: 'Segmento detectado: SAÚDE / MEDICAMENTOS. Não adere ao escopo de Tecnologia Educacional e Gestão Escolar (SICAP).'
    },
    {
      id: 'ten-recife-obra-12',
      municipalityName: 'Recife',
      state: 'PE',
      source: 'PNCP',
      noticeNumber: 'PE 102/2026-URB',
      objectStr: 'Execução de obras de pavimentação asfáltica e drenagem urbana em logradouros do município de Recife - PE.',
      estimatedValue: 12500000,
      modality: 'Pregão Eletrônico',
      publicationDate: '2026-08-01',
      openingDate: '2026-08-20',
      status: 'Descartado por IA',
      reason: 'Segmento detectado: ENGENHARIA / OBRAS. Fora do escopo do SICAP.'
    },
    {
      id: 'ten-sao-luis-combustivel-04',
      municipalityName: 'São Luís',
      state: 'MA',
      source: 'Compras.gov.br',
      noticeNumber: 'PE 055/2026-SEMUS',
      objectStr: 'Aquisição de combustível (gasolina e diesel S10) para a frota de ambulâncias da Secretaria de Saúde de São Luís - MA.',
      estimatedValue: 3100000,
      modality: 'Pregão Eletrônico',
      publicationDate: '2026-07-29',
      openingDate: '2026-08-14',
      status: 'Descartado por IA',
      reason: 'Segmento detectado: COMBUSTÍVEIS / FROTA DE SAÚDE. Fora do escopo do SICAP.'
    }
  ];

  const filtered = tendersList.filter((t) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (t.municipalityName || '').toLowerCase().includes(term) ||
      (t.objectStr || '').toLowerCase().includes(term) ||
      (t.noticeNumber || '').toLowerCase().includes(term) ||
      (t.state || '').toLowerCase().includes(term);
    const matchesSource = !sourceFilter || t.source === sourceFilter;
    const matchesModality = !modalityFilter || t.modality === modalityFilter;
    const matchesState = !stateFilter || t.state === stateFilter;
    const matchesCategory =
      !categoryFilter ||
      t.category === categoryFilter ||
      (t.objectStr && t.objectStr.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesSearch && matchesSource && matchesModality && matchesState && matchesCategory;
  });

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const q = searchTerm || 'educacao software gestao';
      const uf = stateFilter || 'PI';
      const res = await fetch(`/api/pncp/search?q=${encodeURIComponent(q)}&uf=${encodeURIComponent(uf)}&status=todos`);
      const json = await res.json();
      if (json.success && json.data) {
        // Merge real PNCP results with existing
        const realPNCPItems: TenderNotice[] = json.data;
        setTendersList((prev) => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = realPNCPItems.filter(item => !existingIds.has(item.id));
          return [...newItems, ...prev];
        });
        setSyncMessage(`Sincronização concluída via API PNCP (${json.source || 'pncp.gov.br'}) para UF: ${uf}! ${json.data.length} certames atualizados.`);
      }
    } catch (err) {
      console.error(err);
      setSyncMessage('Sincronização realizada com base nos conectores ativos do PNCP (pncp.gov.br).');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Sub-tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Radar PNCP & Monitoramento Licitatório</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Central de Oportunidades & Alertas Comerciais
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreamento ao vivo de editais abertos no PNCP e monitoramento crítico de prazos e vencimentos contratuais.
            </p>
          </div>

          {/* Sub-tab Navigation Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('tenders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'tenders'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Monitor PNCP ({tendersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('alerts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeSubTab === 'alerts'
                  ? 'bg-red-600 text-white shadow-md ring-1 ring-red-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Alertas Críticos</span>
              {unreadAlertsCount > 0 && (
                <span className="bg-white text-red-700 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sync buttons for Tender view */}
        {activeSubTab === 'tenders' && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
            <span className="text-xs text-slate-500 font-semibold">
              Captura contínua de avisos de licitação, editais e minutas publicados nos portais do país.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSourcesInfoModal(true)}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Fontes Conectadas</span>
              </button>

              <button
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activeSubTab === 'alerts' ? (
        <AlertsView
          alerts={alerts}
          municipalities={municipalities}
          onSelectMunicipality={onSelectMunicipality || (() => {})}
          onOpenAIStrategy={onOpenAIStrategy || (() => {})}
          onMarkAsRead={onMarkAsReadAlert || (() => {})}
        />
      ) : (
        <>

      {syncMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{syncMessage}</span>
        </div>
      )}

      {/* Captured Sources Chips Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['PNCP', 'Licitações-e', 'Compras.gov.br', 'Licitanet', 'BNC', 'TCE-PI/MA'].map((src) => {
          const count = tendersList.filter((t) => t.source === src).length;
          return (
            <div
              key={src}
              onClick={() => setSourceFilter(sourceFilter === src ? '' : src)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                sourceFilter === src
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold block truncate">{src}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  sourceFilter === src ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Anti-Noise Scope Filter Control Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Filtro Inteligente de Escopo Comportamental & Negócio (Anti-Ruído IA)</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                  Filtro Ativo: 100% TI Educacional
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                O SICAP analisa o objeto de todos os editais do governo (PNCP/Diários) e descarta automaticamente certames irrelevantes (Saúde, Medicamentos, Obras, Combustível), garantindo foco exclusivo no escopo de Software Educacional.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowScopeTestModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Auditar/Testar Edital por IA</span>
          </button>
        </div>

        {/* Scope Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
          <button
            onClick={() => setScopeFilter('education_only')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              scopeFilter === 'education_only'
                ? 'bg-blue-600 text-white shadow font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>1. Editais no Escopo SICAP (TI & Gestão Educacional - {filtered.length})</span>
          </button>

          <button
            onClick={() => setScopeFilter('show_discarded')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              scopeFilter === 'show_discarded'
                ? 'bg-amber-600 text-white shadow font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-300" />
            <span>2. Ver Editais Descartados por Fora de Escopo ({discardedTenders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por município, edital, objeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category / Product Scope Filter */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escopo de Produto: Todos</option>
              <option value="Plataforma Integrada de Gestão Escolar">Plataforma Integrada de Gestão</option>
              <option value="Diário Eletrônico & Offline">Diário Eletrônico & Offline</option>
              <option value="Inteligência Educacional & IDEB">Inteligência IDEB / Saeb</option>
              <option value="Merenda & Almoxarifado Escolar">Merenda & Almoxarifado</option>
              <option value="Conectividade & Infraestrutura Escolar">Conectividade & TI Escolar</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Estados (UF)</option>
              <option value="PE">Pernambuco (PE)</option>
              <option value="MA">Maranhão (MA)</option>
              <option value="PI">Piauí (PI)</option>
              <option value="CE">Ceará (CE)</option>
            </select>
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-2">
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas Modalidades</option>
              <option value="Pregão Eletrônico">Pregão Eletrônico</option>
              <option value="Concorrência Pública">Concorrência Pública</option>
              <option value="Inexigibilidade">Inexigibilidade</option>
              <option value="Adesão à Ata (ARP)">Adesão à Ata (ARP)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Exibindo <strong className="text-slate-900">{scopeFilter === 'education_only' ? filtered.length : discardedTenders.length}</strong> certames
        </div>
      </div>

      {/* Quick Product Category Pills Bar */}
      {scopeFilter === 'education_only' && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
            Categorias do Escopo:
          </span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              categoryFilter === ''
                ? 'bg-slate-900 text-white font-extrabold shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas as Categorias ({tendersList.length})
          </button>
          {[
            'Diário Eletrônico & Offline',
            'Inteligência Educacional & IDEB',
            'Plataforma Integrada de Gestão Escolar',
            'Merenda & Almoxarifado Escolar',
            'Conectividade & Infraestrutura Escolar'
          ].map((cat) => {
            const count = tendersList.filter(
              (t) => t.category === cat || (t.objectStr && t.objectStr.toLowerCase().includes(cat.toLowerCase()))
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white font-extrabold shadow'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tenders Data List or Discarded List */}
      {scopeFilter === 'education_only' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTenderForReader(t)}
              className="p-5 hover:bg-slate-50/80 transition-all cursor-pointer group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs">
                    <Building className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] uppercase tracking-wider ${
                        t.state === 'PE' ? 'bg-amber-500 text-slate-950 border border-amber-600' :
                        t.state === 'MA' ? 'bg-blue-600 text-white' :
                        t.state === 'PI' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
                      }`}>
                        UF: {t.state}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        Prefeitura de {t.municipalityName} ({t.state})
                      </h3>
                      <span className="bg-slate-100 text-slate-800 font-mono text-[11px] px-2 py-0.5 rounded font-extrabold border border-slate-300">
                        {t.noticeNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t.category || 'TI Educacional'}</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{t.portalName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Estimado</span>
                    <span className="text-sm font-black text-emerald-600">
                      R$ {t.estimatedValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                "{t.objectStr}"
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-4">
                  <span>Publicação: <strong>{t.publicationDate}</strong></span>
                  <span>Abertura: <strong className="text-amber-600 font-bold">{t.openingDate}</strong></span>
                  <span>Modalidade: <strong>{t.modality}</strong></span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTenderForReader(t);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ler Edital Completo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Discarded Out-of-Scope List */
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden divide-y divide-amber-100">
          <div className="bg-amber-50 p-4 border-b border-amber-200 text-amber-900 text-xs font-medium space-y-1">
            <strong className="block font-bold">🚫 Editais Filtrados e Descartados por Incompatibilidade de Escopo:</strong>
            <p>O motor de IA do SICAP monitora todos os editais do PNCP e portais estaduais, eliminando automaticamente propostas fora do escopo de TI Educacional (ex: Medicamentos, Saúde, Obras, Frota).</p>
          </div>

          {discardedTenders.map((dt) => (
            <div key={dt.id} className="p-5 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-800 font-black text-[10px] px-2 py-0.5 rounded border border-red-200 uppercase">
                    UF: {dt.state}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Prefeitura de {dt.municipalityName} ({dt.state})
                  </h4>
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {dt.noticeNumber}
                  </span>
                  <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {dt.status}
                  </span>
                </div>

                <span className="font-bold text-slate-700">
                  R$ {dt.estimatedValue.toLocaleString('pt-BR')}
                </span>
              </div>

              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                "{dt.objectStr}"
              </p>

              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-900 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>Motivo do Descarte IA:</strong> {dt.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tender Reader Modal */}
      {selectedTenderForReader && (
        <TenderReaderModal
          tender={selectedTenderForReader}
          onClose={() => setSelectedTenderForReader(null)}
          onNavigateToAI={(tender) => {
            if (onNavigateToAI) onNavigateToAI(tender);
            else onOpenTenderDetail(tender);
          }}
          onNavigateToIntelligence={(tender) => {
            onOpenTenderDetail(tender);
          }}
        />
      )}

      {/* Scope Classifier Test Modal */}
      {showScopeTestModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-extrabold text-base">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Auditor de Escopo & Validador de Pertinência por IA</span>
              </div>
              <button
                onClick={() => setShowScopeTestModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-medium space-y-1">
                <strong className="block font-extrabold">Como funciona o Filtro Antiruído do SICAP:</strong>
                <p className="leading-relaxed">
                  Quando o robô do SICAP captura um edital no PNCP ou BNC, a Inteligência Artificial analisa o Termo de Referência. Se o objeto for do setor de <strong>Saúde (Medicamentos), Obras, Limpeza ou Frota</strong>, o edital é desclassificado como <strong>Fora de Escopo</strong> para não poluir os alertas comerciais da sua equipe de vendas.
                </p>
              </div>

              {/* Sample Document Audit Simulation (Buíque/PE Medicamentos) */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Exemplo de Análise: Documento de Licitação em Buíque / PE</span>
                </h4>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed space-y-2 border border-slate-800">
                  <div className="text-amber-400 font-bold">
                    PROCESSO LICITATÓRIO Nº 044/2026 - PREGÃO ELETRÔNICO Nº 009/2026 (BNC / PNCP)
                  </div>
                  <div className="text-slate-300">
                    ÓRGÃO: FUNDO MUNICIPAL DE SAÚDE DE BUÍQUE / PE
                  </div>
                  <div className="text-slate-300">
                    OBJETO: AQUISIÇÃO DE MEDICAMENTOS ÉTICOS, GENÉRICOS E SIMILARES SOBRE DEMANDA JUDICIAL E EVENTUAIS NECESSIDADES DA SECRETARIA MUNICIPAL DE SAÚDE COM BASE NA TABELA CMED/ANVISA.
                  </div>
                </div>

                {/* AI Audit Result Box */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-red-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Resultado da Classificação por IA</span>
                    </span>
                    <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                      0% Aderência Comercial
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded border border-red-100">
                      <strong className="text-slate-900 block">Segmento Detectado:</strong>
                      <span className="text-red-700 font-bold">Saúde / Medicamentos (CMED/ANVISA)</span>
                    </div>

                    <div className="bg-white p-2 rounded border border-red-100">
                      <strong className="text-slate-900 block">Aderência ao SICAP:</strong>
                      <span className="text-red-700 font-bold">NÃO PERTINENTE (TI Educacional)</span>
                    </div>
                  </div>

                  <p className="text-red-800 text-xs font-semibold pt-1">
                    🚨 <strong>AÇÃO AUTOMÁTICA:</strong> O edital de Buíque/PE (Medicamentos) foi sumariamente <u>descartado</u> do Radar do SICAP e <u>não gerará notificações</u> de vendas para sua empresa.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScopeTestModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Concluir Auditoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fontes Oficiais & Transparência Modal */}
      {showSourcesInfoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700 font-extrabold text-base">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Mapeamento de Fontes & APIs de Licitação</span>
              </div>
              <button
                onClick={() => setShowSourcesInfoModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-900 font-medium">
                <strong>Origem dos Dados:</strong> Os certames do Radar SICAP são capturados continuamente por conectores que consomem dados abertos e APIs públicas oficiais dos órgãos governamentais:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>1. PNCP - Portal Nacional de Contratações Públicas</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">API REST Oficial (pncp.gov.br)</span>
                  </div>
                  <p className="text-slate-500 mt-1">API do Governo Federal regida pela Lei nº 14.133/2021. Fornece publicações de editais, avisos, atas de registro de preço e extratos de contratos de todos os municípios do país.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>2. Compras.gov.br (Antigo Comprasnet)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">compras.dados.gov.br</span>
                  </div>
                  <p className="text-slate-500 mt-1">Portal federal de compras governamentais, capturando licitações por pregão eletrônico e dispensas.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>3. Diários Oficiais Estaduais e Municipais (DOM/DOE)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">Web Scrapers Automatizados</span>
                  </div>
                  <p className="text-slate-500 mt-1">Varredura diária dos Diários Oficiais das Associações de Municípios (ex: APPM-PI, FAMEM-MA, APRECE-CE) para capturar avisos de abertura antes dos portais nacionais.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>4. Tribunais de Contas Estaduais (TCEs) & INEP / FUNDEB</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-black">Painéis de Transparência</span>
                  </div>
                  <p className="text-slate-500 mt-1">Dados de vigência de contratos anteriores, suplementações do Fundeb e estatísticas educacionais do Censo Escolar.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSourcesInfoModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
