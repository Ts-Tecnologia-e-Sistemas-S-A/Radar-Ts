import React from 'react';
import { Municipality, TenderNotice, CommercialAlert } from '../types';
import { BrazilMap } from './BrazilMap';
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  SearchCheck, 
  Sparkles, 
  ArrowUpRight, 
  Calculator,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  municipalities: Municipality[];
  tenders: TenderNotice[];
  alerts: CommercialAlert[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  selectedStateFilter: string;
  onStateFilterChange: (st: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAISystem: (m: Municipality) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  municipalities,
  tenders,
  alerts,
  selectedMunicipality,
  onSelectMunicipality,
  selectedStateFilter,
  onStateFilterChange,
  onNavigateTab,
  onOpenAISystem,
}) => {
  const highIoMunicipalities = [...municipalities].sort((a, b) => b.ioScore - a.ioScore);
  const criticalAlerts = alerts.filter((a) => a.severity === 'critico');

  // Stats
  const totalValue = municipalities.reduce((acc, m) => acc + m.estimatedNewContractValue, 0);
  const totalClients = municipalities.filter((m) => m.status === 'cliente').length;
  const totalUpcoming = municipalities.filter((m) => m.status === 'licitacao_proxima' || m.status === 'edital_publicado').length;
  const avgIo = Math.round(municipalities.reduce((acc, m) => acc + m.ioScore, 0) / (municipalities.length || 1));

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert Ticker */}
      {criticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <span className="font-extrabold text-sm uppercase tracking-wide block">
                ALERTA COMERCIAL CRÍTICO: {criticalAlerts[0].municipalityName} ({criticalAlerts[0].state})
              </span>
              <p className="text-xs text-white/90">
                {criticalAlerts[0].daysLeft && criticalAlerts[0].daysLeft > 0
                  ? `Contrato da ${criticalAlerts[0].currentCompany} vence em ${criticalAlerts[0].daysLeft} dias!`
                  : `Contrato encerrado! Edital/Oportunidade urgente.`}{' '}
                {criticalAlerts[0].recommendation}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="bg-white text-red-700 hover:bg-slate-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow shrink-0 flex items-center gap-1"
          >
            <span>Ver Todos Alertas ({alerts.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Mapeado</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              R$ {(totalValue / 1000000).toFixed(2)}M
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">100% oportunidade</span> educacional pública
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Licitações & Editais</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <SearchCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-orange-600">{totalUpcoming} municípios</span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{tenders.length} editais ativos PNCP</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Média Índice IO</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">{avgIo} / 100</span>
            <p className="text-xs text-slate-500 mt-1">
              Fórmula de propensão de venda SICAP
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clientes Ativos</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{totalClients} prefeituras</span>
            <p className="text-xs text-slate-500 mt-1">
              Casos de sucesso e referências
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Map + Priority Opportunity Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Brazil SVG Interactive Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[500px]">
          <BrazilMap
            municipalities={municipalities}
            selectedMunicipality={selectedMunicipality}
            onSelectMunicipality={onSelectMunicipality}
            selectedStateFilter={selectedStateFilter}
            onStateFilterChange={onStateFilterChange}
          />
        </div>

        {/* Right Column: Top Opportunities Ranking by IO Score (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
                  <Calculator className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-800 text-sm">
                  Prioridade Máxima (Maior IO SICAP)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('io_score')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Calculadora IO</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of High IO Municipalities */}
            <div className="divide-y divide-slate-100 mt-2 space-y-2">
              {highIoMunicipalities.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMunicipality(m)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    selectedMunicipality?.id === m.id
                      ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {m.name} ({m.state})
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white ${
                          m.status === 'licitacao_proxima'
                            ? 'bg-orange-500'
                            : m.status === 'edital_publicado'
                            ? 'bg-red-500'
                            : m.status === 'contrato_encerrado'
                            ? 'bg-slate-800'
                            : 'bg-yellow-500'
                        }`}
                      >
                        {m.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <span>IO:</span>
                      <span>{m.ioScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Concorrente Atual:</span>
                      <span className="font-medium text-slate-800 truncate block">{m.currentSystem}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vencimento / Status:</span>
                      <span className="font-bold text-slate-900">
                        {m.contractDaysRemaining < 0
                          ? `Encerrado há ${Math.abs(m.contractDaysRemaining)} dias`
                          : `${m.contractDaysRemaining} dias restantes`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-semibold text-blue-700">
                      R$ {m.estimatedNewContractValue.toLocaleString('pt-BR')}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAISystem(m);
                      }}
                      className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm hover:opacity-90 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-purple-200" />
                      <span>Gerar Estratégia IA</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Mostrando os 5 maiores indicadores de oportunidade</span>
            <button
              onClick={() => onNavigateTab('intelligence')}
              className="font-bold text-blue-600 hover:underline"
            >
              Ver todos ({municipalities.length})
            </button>
          </div>
        </div>

      </div>

      {/* Selected Municipality Quick Dossier Drawer Card */}
      {selectedMunicipality && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">
                  {selectedMunicipality.name} - {selectedMunicipality.state}
                </h3>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  População: {selectedMunicipality.population.toLocaleString('pt-BR')} hab
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Concorrente Atual: <strong className="text-white">{selectedMunicipality.currentSystem}</strong> | Responsável comercial: {selectedMunicipality.dealOwner}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateTab('intelligence')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors"
              >
                Ver Raio-X Completo
              </button>
              <button
                onClick={() => onOpenAISystem(selectedMunicipality)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span>Gerar Plano de Abordagem IA</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block">Probabilidade de Licitação:</span>
              <span className="text-lg font-black text-orange-400">{selectedMunicipality.tenderProbability}%</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block">Vencimento Contrato:</span>
              <span className="text-lg font-black text-white">
                {selectedMunicipality.contractDaysRemaining < 0
                  ? `Encerrado`
                  : `${selectedMunicipality.contractDaysRemaining} dias`}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block">Valor Estimado:</span>
              <span className="text-lg font-black text-emerald-400">
                R$ {selectedMunicipality.estimatedNewContractValue.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block">Modalidade Provável:</span>
              <span className="text-sm font-bold text-blue-300 mt-1 block">
                {selectedMunicipality.probableModality}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
