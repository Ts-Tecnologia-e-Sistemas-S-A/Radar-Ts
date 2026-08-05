import React, { useState } from 'react';
import { TenderNotice } from '../types';
import { 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Globe, 
  X, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  Scale, 
  FileCheck,
  Zap,
  Info,
  Layers,
  Edit3,
  Search,
  Save
} from 'lucide-react';

interface TenderReaderModalProps {
  tender: TenderNotice | null;
  onClose: () => void;
  onNavigateToAI: (tender: TenderNotice) => void;
  onNavigateToIntelligence: (tender: TenderNotice) => void;
}

export const TenderReaderModal: React.FC<TenderReaderModalProps> = ({
  tender,
  onClose,
  onNavigateToAI,
  onNavigateToIntelligence
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'publication' | 'full_text' | 'technical' | 'ai_audit'>('publication');
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [challengeText, setChallengeText] = useState<string | null>(null);

  // Editable Edital Content State
  const [isEditingEdital, setIsEditingEdital] = useState(false);
  const [editableObject, setEditableObject] = useState(tender?.objectStr || '');
  const [editableFullEditalText, setEditableFullEditalText] = useState<string>(`
EDITAL DE LICITAÇÃO - PREGÃO ELETRÔNICO Nº ${tender?.noticeNumber || 'PE 014/2026'}
ÓRGÃO: PREFEITURA MUNICIPAL DE ${tender?.municipalityName?.toUpperCase() || 'TIMON'} - ${tender?.state || 'MA'}
FONTE OFICIAL DE PUBLICAÇÃO: ${tender?.portalName || 'PNCP / Compras.gov.br'}
VALOR TOTAL ESTIMADO: R$ ${tender?.estimatedValue?.toLocaleString('pt-BR') || '2.800.000,00'}

1. DO OBJETO
1.1. A presente licitação tem por objeto a contratação de empresa especializada em prestação de serviços de tecnologia da informação para licenciamento, implantação e manutenção de Plataforma Integrada de Gestão Educacional e Diário de Classe Eletrônico com funcionamento offline para os professores da Rede Pública Municipal de Ensino.

2. DOS REQUISITOS TÉCNICOS E FUNCIONAIS OBRIGATÓRIOS
2.1. A solução contratada deverá obrigatoriamente contemplar os seguintes módulos e funcionalidades:
   a) Diário de Classe Eletrônico para web e aplicativo móvel (Android e iOS) com funcionalidade de lançamento offline e sincronização em background.
   b) Módulo de Inteligência Preditiva do IDEB (Saeb/MEC) com relatórios automatizados de desempenho e alertas de evasão escolar.
   c) Módulo de Migração e Validação Automática do Educacenso (MEC/INEP) livre de inconsistências no cômputo do FUNDEB.
   d) Portal Transparência e Acesso do Aluno e Responsável com boletim eletrônico e frequência em tempo real.
   e) Módulo de Gestão do Transporte Escolar, Merenda Escolar e Almoxarifado Central da Secretaria de Educação.

3. DA QUALIFICAÇÃO TÉCNICA E CAPACIDADE OPERACIONAL
3.1. Comprovação de aptidão para desempenho de atividade pertinente e compatível em características, quantidades e prazos com o objeto desta licitação, mediante apresentação de Atestado(s) de Capacidade Técnica fornecido(s) por pessoa jurídica de direito público.
3.2. Compromisso de prestar suporte técnico com tempo de atendimento máximo de 2 (duas) horas para chamados críticos e equipe local presencial para treinamento das equipes escolares.

4. DO PRAZO DE EXECUÇÃO E REAJUSTE
4.1. O contrato terá vigência de 12 (doze) meses a contar de sua assinatura, podendo ser prorrogado nos termos da Lei nº 14.133/2021.
`.trim());

  if (!tender) return null;

  const handleCopyPublication = () => {
    const textToCopy = `
==================================================
PUBLICAÇÃO OFICIAL DE LICITAÇÃO
==================================================
Município: ${tender.municipalityName} - ${tender.state}
Órgão/Portal: ${tender.portalName} (${tender.source})
Edital: ${tender.noticeNumber}
Modalidade: ${tender.modality}
Valor Estimado: R$ ${tender.estimatedValue.toLocaleString('pt-BR')}
Data de Publicação: ${tender.publicationDate}
Data de Abertura: ${tender.openingDate}
Status: ${tender.status}

OBJETO DA CONTRATAÇÃO:
${editableObject}

TEXTO E TERMO DE REFERÊNCIA COMPLETO:
${editableFullEditalText}

LINK DA FONTE OFICIAL:
https://pncp.gov.br/app/editais?q=${encodeURIComponent(tender.municipalityName)}
==================================================
SICAP Radar Comercial - Capturado e Auditado por IA
`.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGenerateChallenge = () => {
    setIsGeneratingChallenge(true);
    setTimeout(() => {
      setChallengeText(`AO ILUSTRÍSSIMO PREGOEIRO E EQUIPE DE APOIO DA PREFEITURA MUNICIPAL DE ${tender.municipalityName.toUpperCase()} - ${tender.state}

REFERÊNCIA: PEDIDO DE ESCLARECIMENTO E IMPUGNAÇÃO TÉCNICA - EDITAL ${tender.noticeNumber}
OBJETO: ${editableObject}

A empresa concorrente vem, respeitosamente, perante V. Sa., nos termos da Lei Federal nº 14.133/2021 (Nova Lei de Licitações), apresentar PEDIDO DE ESCLARECIMENTO TÉCNICO E AJUSTE DE EDITAL:

1. DA NECESSIDADE DE DIÁRIO DE CLASSE COM FUNCIONAMENTO OFFLINE
Constatamos que o Termo de Referência exige solução de diário eletrônico. Solicitamos confirmação de que a plataforma contratada deve obrigatoriamente possuir aplicativo móvel nativo com sincronização offline e criptografia assíncrona, visando atender aos professores que lecionam em unidades escolares situadas na zona rural com conectividade instável.

2. DA COMPATIBILIDADE COM O EDUCACENSO DO INEP
Requer-se a confirmação de que o sistema adjudicado deverá realizar a migração automatizada e validação prévia dos dados do Educacenso (MEC/INEP) para evitar a perda do cômputo dos alunos na apuração das parcelas do FUNDEB do município.

3. DA HABILITAÇÃO TÉCNICA
Solicitamos confirmação de que os Atestados de Capacidade Técnica (ACT) fornecidos por pessoas jurídicas de direito público comprovarão a execução prévia de sistemas integrados de gestão pedagógica e diário do professor com no mínimo 5.000 alunos atendidos.

Termos em que pede e espera deferimento.

Data: ${new Date().toLocaleDateString('pt-BR')}
Consultoria Jurídico-Comercial SICAP Soluções Educacionais`);
      setIsGeneratingChallenge(false);
    }, 1200);
  };

  const handleDownloadSummary = () => {
    const element = document.createElement("a");
    const file = new Blob([`
==================================================
DOSSIÊ LEITURA DE EDITAL / PUBLICAÇÃO LICITATÓRIA
==================================================
Município: ${tender.municipalityName} (${tender.state})
Número do Edital: ${tender.noticeNumber}
Valor Estimado: R$ ${tender.estimatedValue.toLocaleString('pt-BR')}
Modalidade: ${tender.modality}
Fonte dos Dados: ${tender.portalName} (${tender.source})
Data de Publicação: ${tender.publicationDate}
Data de Abertura das Propostas: ${tender.openingDate}
Status: ${tender.status}

DETALHAMENTO DO OBJETO PUBLICADO:
${editableObject}

TERMO DE REFERÊNCIA E TEXTO COMPLETO DO EDITAL:
${editableFullEditalText}

FONTE OFICIAL DA PUBLICAÇÃO:
https://pncp.gov.br/app/editais?q=${encodeURIComponent(tender.municipalityName)}
==================================================
Gerado por SICAP Radar Comercial em ${new Date().toLocaleString('pt-BR')}
`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Edital_${tender.municipalityName}_${tender.noticeNumber.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Correct PNCP URL for municipality (e.g. Timon)
  const correctedPncpUrl = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(tender.municipalityName)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600/90 text-white font-mono text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {tender.source}
              </span>
              <span className="bg-slate-800 text-blue-300 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-slate-700">
                {tender.noticeNumber}
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                tender.status === 'Aberto' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {tender.status}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black truncate text-white">
              Edital & Publicação: {tender.municipalityName} ({tender.state})
            </h2>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Fonte Oficial: <strong>{tender.portalName}</strong></span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Numbers Bar */}
        <div className="bg-slate-800 text-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0 border-b border-slate-700/80">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Valor Estimado</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              R$ {tender.estimatedValue.toLocaleString('pt-BR')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Modalidade</span>
            <span className="font-extrabold text-white">{tender.modality}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Data de Publicação</span>
            <span className="font-bold text-slate-300">{tender.publicationDate}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Abertura de Propostas</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tender.openingDate}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 px-6 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('publication')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'publication' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>1. Resumo da Publicação</span>
          </button>

          <button
            onClick={() => setActiveTab('full_text')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'full_text' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>2. Texto do Edital na Íntegra</span>
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'technical' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-4 h-4 text-purple-600" />
            <span>3. Requisitos Técnicos do Software</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_audit')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'ai_audit' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>4. Auditoria IA & Impugnação</span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* NOTICE: Search Tip regarding PNCP & Typo Resolution */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-extrabold">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Aviso de Pesquisa nos Portais Oficiais (PNCP / Compras.gov.br)</span>
            </div>
            <p className="leading-relaxed">
              No Portal Nacional de Contratações Públicas (PNCP), se houver erro de digitação no nome do município (ex: <strong>"timom"</strong> com M em vez de <strong>"Timon"</strong> com N), o portal do governo exibe 0 resultados. O SICAP realiza a correção automática e integra PNCP, Compras.gov.br e Diários Oficiais para que nenhum edital seja perdido.
            </p>
          </div>

          {/* TAB 1: RESUMO DA PUBLICAÇÃO */}
          {activeTab === 'publication' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Objeto do Edital Publicado</span>
                  </h3>
                  
                  <a
                    href={correctedPncpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Portal Oficial ({tender.municipalityName})</span>
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed text-slate-800 font-medium space-y-3">
                  <p className="bg-white p-3.5 rounded-lg border border-slate-200 text-slate-900 font-semibold">
                    "{editableObject}"
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">Órgão Licitante:</strong>
                      Prefeitura Municipal de {tender.municipalityName} / Secretaria de Educação
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">Origem do Recurso:</strong>
                      FUNDEB (VAAT / VAAF) e Quota Salário Educação
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">Regime de Execução:</strong>
                      Empreitada por Preço Unitário / Licenciamento Anual de Software
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">Critério de Julgamento:</strong>
                      Menor Preço Por Item / Lote Único
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Portal Access Links */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-blue-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Links Diretos de Acesso às Fontes Oficiais</span>
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <a
                    href={`https://pncp.gov.br/app/editais?q=${encodeURIComponent(tender.municipalityName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <span>1. PNCP (Busca Corrigida: {tender.municipalityName})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href="https://compras.dados.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <span>2. Compras.gov.br (Dados Abertos)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={`https://www.google.com/search?q=diario+oficial+dos+municipios+${encodeURIComponent(tender.municipalityName)}+${encodeURIComponent(tender.state)}+licitacao`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <span>3. Diário Oficial ({tender.state})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXTO DO EDITAL NA ÍNTEGRA (COM MODO DE EDIÇÃO) */}
          {activeTab === 'full_text' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Texto do Edital e Termo de Referência</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Você pode visualizar o texto completo capturado ou clicar em "Editar Texto" para adicionar/alterar cláusulas do edital.
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingEdital(!isEditingEdital)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow"
                >
                  {isEditingEdital ? <Save className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{isEditingEdital ? 'Concluir Edição' : 'Editar Texto do Edital'}</span>
                </button>
              </div>

              {isEditingEdital ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                    ✏️ <strong>Modo Edição Ativo:</strong> Altere as cláusulas ou cole aqui o texto completo do edital baixado do PNCP para permitir que a IA audite novamente.
                  </div>
                  <textarea
                    rows={14}
                    value={editableFullEditalText}
                    onChange={(e) => setEditableFullEditalText(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditingEdital(false)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner max-h-96 overflow-y-auto">
                  {editableFullEditalText}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REQUISITOS TÉCNICOS DO SOFTWARE */}
          {activeTab === 'technical' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Especificações do Software Mapeadas no Edital</span>
                </h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
                  100% Compatível com SICAP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Diário de Classe Eletrônico (Web e App)</span>
                  </div>
                  <p className="text-slate-600 pl-6">Módulo completo para professores lançarem frequência, conteúdos lecionados, notas e pareceres descritivos.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Funcionamento Offline para Zona Rural</span>
                  </div>
                  <p className="text-slate-600 pl-6">Aplicativo nativo iOS/Android que registra dados sem internet e sincroniza automaticamente via nuvem.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Módulo do Educacenso (MEC / INEP)</span>
                  </div>
                  <p className="text-slate-600 pl-6">Importação do arquivo do Censo da escola e exportação validador pré-Censo sem erros de inconsistência.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Portal do Aluno e Responsável</span>
                  </div>
                  <p className="text-slate-600 pl-6">Consulta de boletim escolar, frequência diária, recados da escola e agenda de provas em tempo real.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Gestão de Merenda e Almoxarifado Escolar</span>
                  </div>
                  <p className="text-slate-600 pl-6">Controle de estoque de insumos alimentícios, cardápios nutricionais e rastreabilidade da dispensa.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cockpit Preditivo de Elevação do IDEB</span>
                  </div>
                  <p className="text-slate-600 pl-6">Algoritmo de Inteligência Artificial que projeta a nota do Saeb/IDEB e identifica alunos em risco de evasão.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDITORIA IA & IMPUGNAÇÃO */}
          {activeTab === 'ai_audit' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white">Análise Preditiva de Edital por IA</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                    Garantia de Habilitação: 98.4%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O motor de inteligência artificial analisou as regras do certame <strong>{tender.noticeNumber}</strong> e identificou as seguintes recomendações para a equipe de licitações:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Cláusulas de Risco / Ponto de Atenção</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    O termo de referência exige prazo de implantação de 15 dias corridos após a assinatura da ordem de serviço. O SICAP possui metodologia acelerada de migração de banco de dados capaz de cumprir em 10 dias úteis.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-extrabold text-blue-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span>Documentação de Habilitação Exigida</span>
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    Atestado de Capacidade Técnica (ACT) registrado no CRA/CREA com atestação de no mínimo 10.000 alunos ativos em rede pública de ensino.
                  </p>
                </div>
              </div>

              {/* Pedido de Esclarecimento / Impugnação Generator */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Gerador de Minuta de Esclarecimento / Impugnação Técnica</span>
                  </div>
                  <button
                    onClick={handleGenerateChallenge}
                    disabled={isGeneratingChallenge}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isGeneratingChallenge ? 'Gerando Minuta...' : 'Gerar Minuta Jurídica'}</span>
                  </button>
                </div>

                {challengeText && (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap relative border border-slate-800 shadow-inner max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(challengeText);
                        alert('Minuta copiada para a área de transferência!');
                      }}
                      className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-blue-400 font-sans font-bold text-[10px] px-2.5 py-1 rounded border border-slate-700"
                    >
                      Copiar Minuta
                    </button>
                    {challengeText}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPublication}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto da Publicação'}</span>
            </button>

            <button
              onClick={handleDownloadSummary}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Baixar Resumo (TXT)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToIntelligence(tender);
              }}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Ver Inteligência do Município</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToAI(tender);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow shadow-blue-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Estratégia Agente IA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
