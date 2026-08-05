import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  SearchCheck, 
  Building2, 
  BellRing, 
  Sparkles, 
  Kanban, 
  MessageSquare,
  Swords, 
  Calculator, 
  GraduationCap,
  Compass,
  Menu,
  X,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type ActiveTab = 
  | 'field_visits'
  | 'dashboard'
  | 'tenders'
  | 'intelligence'
  | 'alerts'
  | 'ai_agent'
  | 'funnel'
  | 'crm'
  | 'competitors'
  | 'io_score'
  | 'cockpit';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unreadAlertsCount,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Desktop Sidebar collapse state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sicap_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem('sicap_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const menuItems = [
    {
      id: 'field_visits' as ActiveTab,
      label: 'Roteiro de Campo & Vendas',
      icon: Compass,
      badge: 'Campo',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      desc: 'Seleção UF, Faixa Temp. & Cartão'
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard & Mapa',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Visão Geral & Cobertura Brasil'
    },
    {
      id: 'tenders' as ActiveTab,
      label: 'Radar de Licitações',
      icon: SearchCheck,
      badge: 'PNCP Live',
      badgeColor: 'bg-blue-100 text-blue-800',
      desc: '1. Monitoramento Nacional'
    },
    {
      id: 'intelligence' as ActiveTab,
      label: 'Inteligência Municipal',
      icon: Building2,
      badge: null,
      desc: '2. Contratos & Equipe Técnica'
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Alertas Comerciais',
      icon: BellRing,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : null,
      badgeColor: 'bg-red-500 text-white font-bold',
      desc: '3. Notificações & Oportunidades'
    },
    {
      id: 'ai_agent' as ActiveTab,
      label: 'IA Comercial',
      icon: Sparkles,
      badge: 'IA Gemini',
      badgeColor: 'bg-purple-100 text-purple-800 font-bold',
      desc: '4. Estratégias & Argumentos'
    },
    {
      id: 'funnel' as ActiveTab,
      label: 'Funil Comercial',
      icon: Kanban,
      badge: '9 Etapas',
      badgeColor: 'bg-amber-100 text-amber-800',
      desc: '5. Pipeline CRM em Tempo Real'
    },
    {
      id: 'crm' as ActiveTab,
      label: 'Interações CRM',
      icon: MessageSquare,
      badge: 'Ligaç./Visita',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      desc: '6. Registro de Reuniões & Impugnações'
    },
    {
      id: 'competitors' as ActiveTab,
      label: 'Radar Concorrentes',
      icon: Swords,
      badge: null,
      desc: '7. Inteligência Competitiva'
    },
    {
      id: 'io_score' as ActiveTab,
      label: 'Índice Oportunidade (IO)',
      icon: Calculator,
      badge: 'Formula SICAP',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      desc: '8. Indicador de Prioridade 0-100'
    },
    {
      id: 'cockpit' as ActiveTab,
      label: 'Cockpit Educacional',
      icon: GraduationCap,
      badge: 'Hub Vendas',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      desc: 'Integração Pedagógica & Dores'
    },
  ];

  const currentItem = menuItems.find((item) => item.id === activeTab) || menuItems[0];
  const CurrentIcon = currentItem.icon;

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar Toggle (< lg) */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between sticky top-[61px] z-30 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1.5 bg-blue-600 rounded-lg text-white shrink-0">
            <CurrentIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-extrabold text-blue-400 block tracking-wider">
              Módulo Ativo:
            </span>
            <span className="text-xs font-black truncate block text-slate-100">
              {currentItem.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
        >
          {isMobileOpen ? (
            <>
              <X className="w-4 h-4 text-amber-400" />
              <span>Fechar</span>
            </>
          ) : (
            <>
              <Menu className="w-4 h-4 text-amber-400" />
              <span>Módulos ({menuItems.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </>
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer Overlay (< lg) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                  MÓDULOS DE INTELIGÊNCIA COMERCIAL
                </span>
                <h3 className="text-sm font-extrabold">Selecione uma Tela do SICAP RADAR</h3>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Items */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
                        : 'text-slate-800 hover:bg-slate-100 bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-2 rounded-xl shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate">{item.label}</span>
                        <span className={`text-[11px] block truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 font-extrabold ${
                          item.badgeColor || 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
              SICAP RADAR v3.6 — Otimizado para Dispositivos Móveis
            </div>

          </div>
        </div>
      )}

      {/* Desktop Sidebar (>= lg) */}
      <aside
        className={`hidden lg:flex bg-white border-r border-slate-200 shrink-0 flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="p-3 space-y-2">
          
          {/* Header Bar with Toggle Collapse Button */}
          <div className={`px-2 py-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 pb-2.5`}>
            {!isCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                MÓDULOS SICAP
              </span>
            )}
            
            <button
              onClick={toggleCollapse}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-xs active:scale-95 group"
              title={isCollapsed ? 'Expandir Menu Lateral (Mais detalhes)' : 'Recolher Menu Lateral (Mais espaço na tela)'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              ) : (
                <div className="flex items-center gap-1 text-xs font-extrabold text-slate-600">
                  <PanelLeftClose className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                  <span className="text-[11px]">Recolher</span>
                </div>
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={`${item.label} — ${item.desc}`}
                    className={`w-full p-2.5 rounded-xl transition-all flex flex-col items-center justify-center relative group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    
                    {/* Tiny Indicator Dot if badge or unread alerts */}
                    {item.id === 'alerts' && unreadAlertsCount ? (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border border-white" />
                    ) : item.badge ? (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-white" />
                    ) : null}

                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 flex flex-col">
                      <span>{item.label}</span>
                      <span className="text-[10px] font-normal text-slate-300">{item.desc}</span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block truncate">{item.label}</span>
                      <span className={`text-[10px] block truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Commercial Info Box */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80">
          {!isCollapsed ? (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-blue-900">
                <span>Cockpit & Radar SICAP</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Sincronizado automaticamente com PNCP, Diários Oficiais e Tribunais de Contas.
              </p>
            </div>
          ) : (
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all"
              title="Expandir Menu Lateral"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

