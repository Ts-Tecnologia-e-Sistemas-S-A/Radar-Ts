import React from 'react';
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
  Compass
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

  return (
    <aside className="w-full lg:w-72 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            MÓDULOS DE INTELIGÊNCIA SICAP
          </span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

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
      <div className="p-4 border-t border-slate-100 bg-slate-50/80">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-blue-900">
            <span>Cockpit & Radar SICAP</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Sincronizado automaticamente com PNCP, Diários Oficiais e Tribunais de Contas.
          </p>
        </div>
      </div>
    </aside>
  );
};
