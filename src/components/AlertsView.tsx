import React, { useState } from 'react';
import { CommercialAlert, Municipality } from '../types';
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Building2, 
  ArrowRight,
  Filter,
  Flame,
  ListOrdered,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react';

interface AlertsViewProps {
  alerts: CommercialAlert[];
  municipalities: Municipality[];
  onSelectMunicipality: (m: Municipality) => void;
  onOpenAIStrategy: (m: Municipality) => void;
  onMarkAsRead: (alertId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  municipalities,
  onSelectMunicipality,
  onOpenAIStrategy,
  onMarkAsRead,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'alt-esperantina-01': true,
    'alt-caruaru-03': true,
    'alt-petrolina-06': false,
    'alt-timon-02': false,
    'alt-parnaiba-04': false,
    'alt-juazeiro-05': false
  });

  const toggleExpandItems = (alertId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  };

  const filteredAlerts = severityFilter
    ? alerts.filter((a) => a.severity === severityFilter)
    : alerts;

  // Find Esperantina alert for featured card
  const esperantinaAlert = alerts.find((a) => a.municipalityName.includes('Esperantina')) || alerts[0];
  const esperantinaMuni = municipalities.find((m) => m.name.includes('Esperantina')) || municipalities[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Módulo 3: Alertas Inteligentes em Tempo Real</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Central de Alertas Comerciais & Itens do Pregão / Licitações
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Notificações prioritárias de vencimentos, trocas de gestão, suplementações do Fundeb e composição detalhada dos lotes e itens de cada certame.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Severidades ({alerts.length})</option>
            <option value="critico">Crítico (Urgência Máxima)</option>
            <option value="alto">Alto Risco / Oportunidade</option>
            <option value="medio">Médio Impacto</option>
          </select>
        </div>
      </div>

      {/* FEATURED EXAMPLE CARD AS EXPLICITLY REQUESTED IN PROMPT */}
      {esperantinaAlert && esperantinaMuni && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-500/30 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Flame className="w-40 h-40 text-amber-500" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  CASO DE EXEMPLO RADAR SICAP - ALERTA CRÍTICO
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5 flex items-center gap-2">
                  <span>Prefeitura de Esperantina - PI</span>
                  {esperantinaAlert.noticeNumber && (
                    <span className="text-xs bg-indigo-900/80 text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-700 font-mono font-normal">
                      {esperantinaAlert.noticeNumber}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onOpenAIStrategy(esperantinaMuni)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-purple-900/50 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Gerar Abordagem Comercial IA</span>
            </button>
          </div>

          {/* Structured Alert Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-4">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block font-semibold text-[10px]">DIAS PARA VENCIMENTO</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">Contrato vence em {esperantinaAlert.daysLeft || 63} dias</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block font-semibold text-[10px]">ÚLTIMA EMPRESA / VALOR</span>
              <span className="text-sm font-bold text-white mt-1 block">{esperantinaAlert.currentCompany}</span>
              <span className="text-xs text-emerald-400 font-mono font-bold">R$ {esperantinaAlert.value.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block font-semibold text-[10px]">POSSIBILIDADE RENOVAÇÃO</span>
              <span className="text-base font-extrabold text-red-400 mt-1 block">{esperantinaAlert.renewalChance.toUpperCase()}</span>
              <span className="text-[10px] text-slate-400">Insatisfação técnica em diário offline</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block font-semibold text-[10px]">PROBABILIDADE NOVA LICITAÇÃO</span>
              <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{esperantinaAlert.tenderProb}%</span>
            </div>
          </div>

          {/* Object of Tender */}
          {esperantinaAlert.objectStr && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 mb-4 text-xs">
              <span className="text-indigo-300 font-bold block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Objeto Principal da Licitação / Contrato:
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {esperantinaAlert.objectStr}
              </p>
            </div>
          )}

          {/* DETAILED ITEMS / LOTS OF THE PREGÃO */}
          {esperantinaAlert.items && esperantinaAlert.items.length > 0 && (
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                    Itens e Lotes Integrantes do Pregão / Edital ({esperantinaAlert.items.length} Itens Mapeados)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Soma Total: R$ {esperantinaAlert.items.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {esperantinaAlert.items.map((item) => (
                  <div key={item.itemNumber} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-amber-500/20 text-amber-300 font-black text-[10px] px-2 py-0.5 rounded border border-amber-500/30">
                          Item 0{item.itemNumber}
                        </span>
                        {item.category && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 text-[11px] font-semibold leading-tight pt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400 font-mono">
                      <span>Qtd: <strong>{item.quantity}</strong> {item.unit}</span>
                      {item.estimatedValue && (
                        <span className="text-emerald-400 font-bold">
                          R$ {item.estimatedValue.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <span>Recomendação Comercial:</span>
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-200 px-3 py-1 rounded-lg">
                {esperantinaAlert.recommendation}
              </span>
            </div>

            <button
              onClick={() => onSelectMunicipality(esperantinaMuni)}
              className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <span>Acessar Raio-X Esperantina</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* List of Alerts */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-blue-600" />
          <span>Alertas do Radar e Composição de Licitações ({filteredAlerts.length})</span>
        </h3>

        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const muni = municipalities.find((m) => m.id === alert.municipalityId);
            const isExpanded = expandedItems[alert.id] !== false; // Default open or check state

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all bg-white shadow-sm hover:border-blue-300 space-y-3 ${
                  alert.severity === 'critico'
                    ? 'border-l-4 border-l-red-600'
                    : alert.severity === 'alto'
                    ? 'border-l-4 border-l-orange-500'
                    : 'border-l-4 border-l-yellow-400'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-2 rounded-lg text-xs font-bold shrink-0 mt-0.5 ${
                        alert.severity === 'critico'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'alto'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {alert.municipalityName} - {alert.state}
                        </h4>
                        {alert.noticeNumber && (
                          <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200 font-bold">
                            {alert.noticeNumber}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Empresa Atual: <strong className="text-slate-800">{alert.currentCompany}</strong> | Valor Estimado: <strong className="text-emerald-700 font-mono">R$ {alert.value.toLocaleString('pt-BR')}</strong>
                      </p>

                      {alert.objectStr && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-2 italic">
                          <strong>Objeto:</strong> "{alert.objectStr}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {muni && (
                      <button
                        onClick={() => onOpenAIStrategy(muni)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-purple-200 transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Estratégia IA</span>
                      </button>
                    )}

                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      title="Marcar como lido"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items/Lots of the Procurement */}
                {alert.items && alert.items.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <button
                      onClick={() => toggleExpandItems(alert.id)}
                      className="flex items-center justify-between w-full text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-indigo-900">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span>Composição dos Itens / Lotes do Pregão ({alert.items.length} Itens)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-mono text-[11px] text-slate-600 font-normal">
                          {isExpanded ? 'Ocultar itens' : 'Ver todos os itens'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                        {alert.items.map((item) => (
                          <div
                            key={item.itemNumber}
                            className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-1.5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Item {item.itemNumber}
                                </span>
                                {item.category && (
                                  <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 text-xs font-semibold mt-1">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                              <span>Qtd: <strong>{item.quantity}</strong> {item.unit}</span>
                              {item.estimatedValue && (
                                <span className="font-bold text-emerald-700">
                                  R$ {item.estimatedValue.toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendation */}
                <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-900 shrink-0">Recomendação Comercial:</span>
                    <span className="text-amber-950 font-medium">{alert.recommendation}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

