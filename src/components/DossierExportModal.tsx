import React from 'react';
import { Municipality } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers,
  Users,
  School,
  GraduationCap,
  AlertTriangle,
  MessageSquare,
  Share2,
  Copy
} from 'lucide-react';

interface DossierExportModalProps {
  municipality: Municipality;
  onClose: () => void;
  onShowToast?: (message: string) => void;
}

export const DossierExportModal: React.FC<DossierExportModalProps> = ({
  municipality,
  onClose,
  onShowToast,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedContractValue = (municipality.currentContractValue || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const formattedEstimatedValue = (municipality.estimatedNewContractValue || municipality.currentContractValue || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleCopySummary = () => {
    const summaryText = `
=== DOSSIÊ EXECUTIVO DE INTELIGÊNCIA COMERCIAL SICAP - FASE 4 ===
Prefeitura Municipal de: ${(municipality.name || '').toUpperCase()} - ${municipality.state}
Índice de Oportunidade (IO): ${municipality.ioScore ?? 0}/100

1. DADOS DO CONTRATO VIGENTE (PNCP)
- Empresa / Concorrente Atual: ${municipality.currentSystem || 'N/I'}
- Valor do Contrato Vigente: ${formattedContractValue}
- Dias para Vencimento: ${municipality.contractDaysRemaining ?? 0} dias
- Escopo / Itens Contratados: Módulos de Gestão Pública, Folha de Pagamento, Licitações, Transparência e Portal Escolar.

2. INDICADORES EDUCACIONAIS & ESTRUTURA
- Alunos Atendidos: ${(municipality.educationalMetrics?.studentCount || 8500).toLocaleString('pt-BR')}
- Escolas na Rede: ${municipality.educationalMetrics?.schoolCount || 42}
- Estágio do Funil: ${(municipality.funnelStage || 'prospectado').toUpperCase()}

3. PRINCIPAIS DORES MAPEADAS
${(municipality.educationalMetrics?.mainPains || ['Lentidão no sistema antigo', 'Exportação Educacenso com pendências', 'Falta de diário de classe off-line']).map(p => `- ${p}`).join('\n')}

4. ESTRATÉGIA DE FECHAMENTO (FASE 4)
- Proposta de Substituição Tecnológica SICAP focando em redução de custos operacionais e nota máxima no Tribunal de Contas.
    `.trim();

    navigator.clipboard.writeText(summaryText);
    if (onShowToast) {
      onShowToast('📋 Dossiê Executivo (Fase 4) copiado com sucesso para a área de transferência!');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🚨 *DOSSIÊ COMERCIAL SICAP (FASE 4)* - Prefeitura de *${municipality.name}-${municipality.state}*\n` +
                 `• *IO Score*: ${municipality.ioScore}/100\n` +
                 `• *Sistema Atual*: ${municipality.currentSystem || 'N/A'}\n` +
                 `• *Valor Vigente*: ${formattedContractValue}\n` +
                 `• *Vencimento*: ${municipality.contractDaysRemaining} dias\n` +
                 `• *Modalidade Provável*: ${municipality.probableModality || 'Pregão Eletrônico'}\n\n` +
                 `📄 *Resumo*: Pronto para apresentação executiva e homologação.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Dossiê de Inteligência Comercial SICAP - Fase 4 (Fechamento)
              </h3>
              <p className="text-[11px] text-slate-400">
                {municipality.name} ({municipality.state}) | Relatório Completo para Decisores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl items-center gap-1.5 transition-all border border-slate-700"
              title="Copiar resumo textual"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar Resumo</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Content View - High-Precision Executive PDF Style */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-slate-900 printable-dossier text-xs">
          
          {/* Header Cover */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-900 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                  SICAP RADAR V3.6
                </span>
                <span className="text-blue-600 font-black text-xs uppercase tracking-widest">
                  RELATÓRIO CONFIDENCIAL DE INTELIGÊNCIA COMERCIAL
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                PREFEITURA MUNICIPAL DE {(municipality.name || '').toUpperCase()} - {municipality.state}
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Emissão: {new Date().toLocaleDateString('pt-BR')} | Estágio do Funil: <span className="font-bold text-slate-800 uppercase">{municipality.funnelStage || 'Prospectado'}</span> | Consultor: <span className="font-bold text-blue-800">{municipality.dealOwner || 'José Badotti'}</span>
              </p>
            </div>

            <div className="text-right bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Índice IO</span>
              <span className="text-3xl font-black text-emerald-400">{municipality.ioScore ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span></span>
            </div>
          </div>

          {/* Key Indicators Table - Phase 2 & 3 Integrated */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-900">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>1. Auditoria de Contratos & Oportunidade Financeira</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Empresa / Concorrente</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">{municipality.currentSystem || 'Empresa Local'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Valor do Contrato Vigente</span>
                <span className="font-black text-emerald-700 text-sm block mt-0.5">{formattedContractValue}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Janela de Vencimento</span>
                <span className="font-black text-red-600 text-sm block mt-0.5">
                  {(municipality.contractDaysRemaining ?? 0) <= 0 ? '⚠️ Contrato Vencido' : `${municipality.contractDaysRemaining ?? 0} dias restantes`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Modalidade Provável</span>
                <span className="font-black text-blue-800 text-sm block mt-0.5">{municipality.probableModality || 'Pregão Eletrônico'}</span>
              </div>
            </div>
          </div>

          {/* Scope / Contracted Items */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Escopo dos Módulos / Itens Mapeados</span>
            <p className="font-bold text-xs text-amber-950">
              Módulos de Gestão Pública, Escolar, Folha de Pagamento, Tributação, Compras e Licitações, e Portal da Transparência.
            </p>
          </div>

          {/* Educational Infrastructure Metrics */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-900">
              <School className="w-4 h-4 text-blue-600" />
              <span>2. Infraestrutura & Porte Educacional</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-blue-600 p-1 bg-white rounded-lg shadow-sm" />
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Alunos Atendidos</span>
                  <span className="font-black text-slate-900 text-sm">{(municipality.educationalMetrics?.studentCount || 8500).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <School className="w-7 h-7 text-indigo-600 p-1 bg-white rounded-lg shadow-sm" />
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Escolas Municipais</span>
                  <span className="font-black text-slate-900 text-sm">{municipality.educationalMetrics?.schoolCount || 42} unidades</span>
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                <ShieldCheck className="w-7 h-7 text-emerald-600 p-1 bg-white rounded-lg shadow-sm" />
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Conformidade Educacenso</span>
                  <span className="font-black text-emerald-700 text-sm">{municipality.educationalMetrics?.educacensoStatus || '94% Auditado'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Decision Makers */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-900">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>3. Equipe Técnica & Decisores Mapeados</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(municipality.keyContacts || [
                { name: 'Secretário(a) de Educação', role: 'Decisor Principal', phone: '(99) 98800-0000' },
                { name: 'Coordenação de Tecnologia', role: 'Avaliador Técnico', phone: '(99) 3661-0000' }
              ]).map((c, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                    <span className="text-blue-700 font-semibold text-[11px]">{c.role}</span>
                  </div>
                  {c.phone && <span className="text-slate-600 font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200">{c.phone}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Educational Pains */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>4. Gargalos Operacionais e Dores Prioritárias</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              {(municipality.educationalMetrics?.mainPains || [
                'Lentidão na exportação de dados do Educacenso ao MEC/FUNDEB',
                'Professores sem diário de classe off-line em povoados rurais',
                'Dificuldade de prestação de contas no Tribunal de Contas (TCE)',
                'Ausência de acompanhamento em tempo real da frequência escolar'
              ]).map((p, idx) => (
                <li key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 4 Strategic Closing Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
            <h5 className="font-extrabold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Plano de Substituição Tecnológica SICAP (Fase 4)</span>
            </h5>
            <p className="text-slate-300 text-xs leading-relaxed">
              Substituição imediata do sistema <strong className="text-white">{municipality.currentSystem || 'atual'}</strong> com migração 100% automatizada de histórico de matrículas e lançamento de diários off-line, assegurando conformidade com o FUNDEB e aprovação sem ressalvas no Tribunal de Contas.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

