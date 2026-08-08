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

  const menuSections = [
    {
      title: 'SISTEMA 1: BUSCA DE PREFEITURAS & EDITAIS',
      systemId: 'system_radar',
      items: [
        {
          id: 'tenders' as ActiveTab,
          label: 'Monitor de Editais PNCP',
          icon: SearchCheck,
          badge: 'Cidade Ativa',
          badgeColor: 'bg-indigo-100 text-indigo-800 font-bold',
          desc: 'Rastreamento de licitações públicas abertas e prefeituras ativas',
        },
        {
          id: 'alerts' as ActiveTab,
          label: 'Alertas Comerciais Críticos',
          icon: BellRing,
          badge: unreadAlertsCount > 0 ? `${unreadAlertsCount} Alertas` : null,
          badgeColor: 'bg-red-500 text-white font-bold',
          desc: 'Contratos vincendos, prazos e impugnações',
        },
      ],
    },
    {
      title: 'SISTEMA 2: ROTEIRO DE CAMPO & PROBABILIDADE',
      systemId: 'system_field',
      items: [
        {
          id: 'field_visits' as ActiveTab,
          label: 'Roteiros de Campo & Visitas',
          icon: Compass,
          badge: 'Operação',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
          desc: 'Planejamento de rotas, reuniões e atas presenciais',
        },
        {
          id: 'io_score' as ActiveTab,
          label: 'Calculadora IO & Probabilidade',
          icon: Calculator,
          badge: 'Score IO',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
          desc: 'Algoritmo de viabilidade de fechamento comercial',
        },
        {
          id: 'cockpit' as ActiveTab,
          label: 'Indicadores Educacionais MEC',
          icon: GraduationCap,
          badge: 'IDEB / INEP',
          badgeColor: 'bg-indigo-100 text-indigo-800 font-bold',
          desc: 'Dados do censo escolar, Fundeb e dores pedagógicas',
        },
      ],
    },
    {
      title: 'SISTEMA 3: MÓDULO DE FORMULÁRIO & CRM DE VENDAS',
      systemId: 'system_crm',
      items: [
        {
          id: 'crm' as ActiveTab,
          label: 'Formulário & Registro CRM',
          icon: MessageSquare,
          badge: 'Formulários',
          badgeColor: 'bg-blue-100 text-blue-800 font-bold',
          desc: 'Formulário de cadastro de reuniões, e-mails, atas e ligações',
        },
        {
          id: 'funnel' as ActiveTab,
          label: 'Funil Kanban de Contratos',
          icon: Kanban,
          badge: '9 Etapas',
          badgeColor: 'bg-amber-100 text-amber-800 font-bold',
          desc: 'Gestão visual da negociação e estágios de proposta',
        },
        {
          id: 'intelligence' as ActiveTab,
          label: 'Dossiê 360º da Prefeitura',
          icon: Building2,
          badge: 'Ficha 360º',
          badgeColor: 'bg-blue-100 text-blue-800 font-bold',
          desc: 'Secretários, fornecedores atuais e verbas municipais',
        },
        {
          id: 'competitors' as ActiveTab,
          label: 'Radar de Concorrentes',
          icon: Swords,
          badge: 'Battlecards',
          badgeColor: 'bg-slate-200 text-slate-800 font-bold',
          desc: 'Mapeamento de sistemas rivais e pontos fracos',
        },
      ],
    },
    {
      title: 'SISTEMA 4: COPILOTO IA & PAINEL',
      systemId: 'system_ai',
      items: [
        {
          id: 'ai_agent' as ActiveTab,
          label: 'Copiloto Comercial IA',
          icon: Sparkles,
          badge: 'IA Gemini',
          badgeColor: 'bg-purple-100 text-purple-800 font-bold',
          desc: 'Gerador de pitches, propostas e respostas de editais',
        },
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard & Mapa Geral',
          icon: LayoutDashboard,
          badge: 'Visão Macro',
          badgeColor: 'bg-slate-100 text-slate-700 font-bold',
          desc: 'Visão executiva das metas e cobertura geográfica',
        },
      ],
    },
  ];

  const allItems = menuSections.flatMap((s) => s.items);
  const currentItem = allItems.find((item) => item.id === activeTab) || allItems[0];
  const CurrentIcon = currentItem.icon;

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar Toggle (< lg) */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-3.5 py-2 flex items-center justify-between sticky top-[57px] z-30 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shrink-0 active:scale-95 transition-transform flex items-center gap-1.5 px-2.5 font-bold text-xs"
            title="Abrir Menu de Módulos"
          >
            <Menu className="w-4 h-4 text-amber-300" />
            <span>Menu</span>
          </button>

          <div className="min-w-0 border-l border-slate-800 pl-2">
            <span className="text-[9px] uppercase font-extrabold text-blue-400 block tracking-wider leading-none">
              Módulo Ativo:
            </span>
            <span className="text-xs font-black truncate block text-slate-100 mt-0.5">
              {currentItem.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shrink-0"
        >
          <span>{allItems.length} Módulos</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Mobile Off-Canvas Left Drawer Overlay (< lg) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-start animate-in fade-in duration-200">
          {/* Backdrop Dismiss Area */}
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Left Slide-in Drawer Container */}
          <div className="relative z-10 w-[82vw] max-w-xs h-full bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shrink-0 shadow-sm">
                  <CurrentIcon className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                    SICAP RADAR v3.6
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-100">Módulos do Sistema</h3>
                </div>
              </div>

              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                aria-label="Fechar Menu"
              >
                <X className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {/* Scrollable Categories & Items */}
            <div className="p-3 overflow-y-auto space-y-4 flex-1">
              {menuSections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="px-2 py-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {section.title}
                    </span>
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold ring-1 ring-blue-400/30'
                            : 'text-slate-300 hover:bg-slate-800/80 bg-slate-800/40 border border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`p-2 rounded-lg shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{item.label}</span>
                            <span className={`text-[10px] block truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 font-extrabold ${
                              item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] font-medium text-slate-400">SICAP Radar Comercial</span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Online
              </span>
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

          <nav className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      {section.title}
                    </span>
                  </div>
                )}
                {section.items.map((item) => {
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
                        
                        {/* Indicator Dot */}
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
              </div>
            ))}
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

