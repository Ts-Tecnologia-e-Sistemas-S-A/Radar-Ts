import React, { useState, useRef, useEffect } from 'react';
import { Radar, Search, Sparkles, FileText, Bell, ShieldCheck, TrendingUp, Database, Building2, MapPin, X, ArrowRight } from 'lucide-react';
import { Municipality, TenderNotice, CommercialAlert } from '../types';
import { AutoSaveIndicator } from './AutoSaveIndicator';

interface NavbarProps {
  municipalities: Municipality[];
  tenders: TenderNotice[];
  alerts: CommercialAlert[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCityFromSearch?: (queryOrMuni: string | Municipality) => void;
  onOpenGlobalReport: () => void;
  onOpenAlertsModal: () => void;
  onOpenRadarEnricher: () => void;
  onOpenCitySearch?: () => void;
  onOpenBackupModal?: () => void;
  pendingSyncCount?: number;
  isSyncingData?: boolean;
  isOnline?: boolean;
  lastSyncTime?: Date | null;
  onTriggerSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  municipalities,
  tenders,
  alerts,
  searchQuery,
  onSearchChange,
  onSelectCityFromSearch,
  onOpenGlobalReport,
  onOpenAlertsModal,
  onOpenRadarEnricher,
  onOpenCitySearch,
  onOpenBackupModal,
  pendingSyncCount = 0,
  isSyncingData = false,
  isOnline = true,
  lastSyncTime = null,
  onTriggerSync = () => {}
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate top bar pipeline KPIs
  const totalPipeline = municipalities.reduce((acc, m) => acc + m.estimatedNewContractValue, 0);
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;
  const highIoCount = municipalities.filter((m) => m.ioScore >= 80).length;
  const openTendersCount = tenders.filter((t) => t.status === 'Aberto' || t.status === 'Em Análise').length;

  // Filter matching municipalities for autocomplete
  const matchingCities = React.useMemo(() => {
    if (!searchQuery.trim()) return municipalities.slice(0, 5);
    const q = searchQuery.toLowerCase().trim();
    return municipalities.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.state.toLowerCase().includes(q) ||
      `${m.name} - ${m.state}`.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [searchQuery, municipalities]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (muni: Municipality) => {
    onSearchChange(muni.name);
    setIsDropdownOpen(false);
    if (onSelectCityFromSearch) {
      onSelectCityFromSearch(muni);
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsDropdownOpen(false);
    if (onSelectCityFromSearch) {
      onSelectCityFromSearch(searchQuery);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Top Row on Mobile: Logo & Quick Alerts/Action Icons */}
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Brand Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
                <Radar className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    SICAP
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    RADAR v3.6
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Inteligência Licitatória & Mercado Educacional
                </p>
              </div>
            </div>

            {/* Mobile Actions Right */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              {/* Alerts Trigger Button */}
              <button
                onClick={onOpenAlertsModal}
                className="relative p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="Alertas Comerciais"
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadAlerts}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Ticker Badges (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 px-4 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pipeline Mapeado</span>
                <span className="font-bold text-emerald-400 text-sm">
                  R$ {(totalPipeline / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prioridade Máxima (IO &gt; 80)</span>
                <span className="font-bold text-orange-300 text-sm">{highIoCount} prefeituras</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Editais Abertos (PNCP)</span>
                <span className="font-bold text-blue-300 text-sm">{openTendersCount} licitações</span>
              </div>
            </div>
          </div>

          {/* Search & Actions Row */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
            {/* Live Interactive City Search Input Box in Header Menu */}
            <div ref={dropdownRef} className="relative flex-1 sm:w-80 min-w-[200px]">
              <form onSubmit={handleSubmitSearch} className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-blue-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar cidade/prefeitura (ex: Esperantina)..."
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-9 pr-16 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-8 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow"
                  title="Pesquisar Cidade na Tela Única"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>

              {/* Autocomplete Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-fadeIn">
                  <div className="p-2 bg-slate-950/80 text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center justify-between">
                    <span>Cidades no Radar</span>
                    <span className="text-slate-500 font-mono">Clique para abrir</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto no-scrollbar">
                    {matchingCities.length > 0 ? (
                      matchingCities.map((muni) => (
                        <button
                          key={muni.id}
                          type="button"
                          onClick={() => handleSelectCity(muni)}
                          className="w-full text-left p-2.5 hover:bg-blue-600/20 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 shrink-0" />
                            <div className="truncate">
                              <span className="font-extrabold text-xs text-white group-hover:text-blue-300 block truncate">
                                {muni.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {muni.currentSystem || 'Concorrente'} • Pop: {muni.population?.toLocaleString('pt-BR') || '35.000'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              {muni.state}
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                              IO {muni.ioScore}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        Nenhuma cidade local encontrada para "{searchQuery}"
                      </div>
                    )}
                  </div>

                  {/* Direct Action Footer */}
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onSelectCityFromSearch) onSelectCityFromSearch(searchQuery);
                      }}
                      className="w-full p-2.5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 text-blue-200 text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        Consultar <strong>"{searchQuery}"</strong> na API Pública
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI Status Badge */}
            <div className="hidden xl:flex items-center gap-1.5 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 px-2.5 py-1.5 rounded-xl text-xs font-medium text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-[11px]">IA Gemini Ativa</span>
            </div>

            {/* Desktop Alerts Trigger Button */}
            <button
              onClick={onOpenAlertsModal}
              className="hidden md:flex relative p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Alertas Comerciais"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Action Buttons Group (Horizontal Swipe on Mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Analyze & Add City Button */}
              {onOpenCitySearch && (
                <button
                  onClick={onOpenCitySearch}
                  className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-2.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Analisar e Lançar Qualquer Cidade com IA no CRM"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-950" />
                  <span>+ Lançar Cidade</span>
                </button>
              )}

              {/* SICAP RADAR CRM Auto-Enricher Button */}
              <button
                onClick={onOpenRadarEnricher}
                className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm border border-purple-400/30 transition-all active:scale-95 shrink-0"
                title="Preenchimento Automático do CRM (Fontes Oficiais PI & MA)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                <span>Preencher CRM</span>
              </button>

              {/* Download Report Button */}
              <button
                onClick={onOpenGlobalReport}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dossiê</span>
              </button>

              {/* Data Backup & Restore Button */}
              {onOpenBackupModal && (
                <button
                  onClick={onOpenBackupModal}
                  className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm border border-emerald-500/30 transition-all active:scale-95 shrink-0"
                  title="Exportar e Importar Backup em JSON (Prevenção de Perdas)"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Backup JSON</span>
                </button>
              )}

              {/* Auto-Save & Cloud Sync Badge */}
              <AutoSaveIndicator
                pendingCount={pendingSyncCount}
                isSyncing={isSyncingData}
                isOnline={isOnline}
                lastSavedTime={lastSyncTime}
                onTriggerSync={onTriggerSync}
              />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
