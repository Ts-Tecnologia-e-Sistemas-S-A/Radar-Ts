import React, { useState, useEffect } from 'react';
import { CRMInteraction, Municipality } from '../types';
import { 
  formatCardDetailsForCalendar, 
  openGoogleCalendar, 
  downloadIcsFile,
  ContractDetailsOverride
} from '../utils/googleCalendar';
import { 
  CreditCard, 
  Sparkles, 
  Building2, 
  User, 
  FileText, 
  Calendar, 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Briefcase, 
  Wand2,
  RefreshCw,
  Send,
  GraduationCap,
  School,
  Users,
  Share2,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface BusinessCardFormatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  municipalities?: Municipality[];
  onSaveInteraction?: (interaction: CRMInteraction) => void;
  onShowToast: (message: string) => void;
  initialMunicipalityId?: string;
}

export const BusinessCardFormatterModal: React.FC<BusinessCardFormatterModalProps> = ({
  isOpen,
  onClose,
  municipalities = [],
  onSaveInteraction,
  onShowToast,
  initialMunicipalityId
}) => {
  if (!isOpen) return null;

  // Selected Municipality
  const [selectedMuniId, setSelectedMuniId] = useState<string>(initialMunicipalityId || '');
  
  // Raw Input for AI Formatting
  const [rawText, setRawText] = useState<string>('');
  const [isFormattingWithAi, setIsFormattingWithAi] = useState<boolean>(false);

  // Form Fields
  const [muniName, setMuniName] = useState<string>('');
  const [muniState, setMuniState] = useState<string>('PI');
  const [contactName, setContactName] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('');
  const [winningCompany, setWinningCompany] = useState<string>('');
  const [currentSystem, setCurrentSystem] = useState<string>('');
  const [contractValue, setContractValue] = useState<number>(0);
  const [contractItems, setContractItems] = useState<string>('');
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [schoolsCount, setSchoolsCount] = useState<number>(0);
  const [contractExpirationDate, setContractExpirationDate] = useState<string>('');
  const [contractDaysRemaining, setContractDaysRemaining] = useState<number>(0);
  const [interactionType, setInteractionType] = useState<CRMInteraction['type']>('visita');
  const [outcome, setOutcome] = useState<CRMInteraction['outcome']>('positivo');
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [nextStep, setNextStep] = useState<string>('');
  const [nextStepDueDate, setNextStepDueDate] = useState<string>('');
  const [dealOwner, setDealOwner] = useState<string>('José Badotti');

  // Sync when municipality selection changes
  useEffect(() => {
    if (selectedMuniId) {
      const muni = municipalities.find(m => m.id === selectedMuniId);
      if (muni) {
        setMuniName(muni.name);
        setMuniState(muni.state || 'PI');
        setCurrentSystem(muni.currentSystem || 'Sistema Competidor');
        setContractValue(muni.currentContractValue || muni.estimatedNewContractValue || 0);
        setContractDaysRemaining(muni.contractDaysRemaining || 90);
        
        if (muni.educationalMetrics) {
          setStudentsCount(muni.educationalMetrics.studentsCount || 0);
          setSchoolsCount(muni.educationalMetrics.schoolsCount || 0);
        }
        
        // Calculate expiration date
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (muni.contractDaysRemaining || 90));
        setContractExpirationDate(expDate.toISOString().slice(0, 10));

        // Get winning company from buying history or competitor
        if (muni.buyingHistory && muni.buyingHistory.length > 0) {
          setWinningCompany(muni.buyingHistory[0].company || muni.currentSystem || 'Empresa Atual');
        } else {
          setWinningCompany(muni.currentSystem || 'Empresa Atual');
        }

        // Key features or items
        if (muni.keyFeatures && muni.keyFeatures.length > 0) {
          setContractItems(muni.keyFeatures.join(', '));
        } else {
          setContractItems('Módulos de Gestão Pública, Licitações, Folha e Transparência');
        }

        // Key contact
        if (muni.keyContacts && muni.keyContacts.length > 0) {
          setContactName(muni.keyContacts[0].name);
          setContactRole(muni.keyContacts[0].role);
        }
      }
    }
  }, [selectedMuniId, municipalities]);

  // AI Formatting Trigger
  const handleAutoFormatWithAI = async () => {
    if (!rawText.trim()) {
      onShowToast('⚠️ Insira o texto ou notas da reunião para formatar.');
      return;
    }

    setIsFormattingWithAi(true);
    try {
      const response = await fetch('/api/ai/commercial-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipalityName: muniName || 'Prefeitura Identificada no Texto',
          state: muniState || 'PI',
          rawNotes: rawText,
          task: 'FORMAT_BUSINESS_CARD_WITH_CONTRACT_INTELLIGENCE'
        })
      });

      const json = await response.json();
      
      // Parse structured info or smart fallback
      if (json.success && json.strategy) {
        const strat = json.strategy;
        if (strat.approachStrategy) setSummary(strat.approachStrategy.slice(0, 150));
      }

      // Smart regex parsing on rawText for quick extraction
      const textLower = rawText.toLowerCase();

      // Extract contact
      const contactMatch = rawText.match(/(?:contato|falou com|secretário|secretaria|diretor|pregoeiro|atendido por|com)\s*:?\s*([A-Z][a-zà-ú]+\s+[A-Z][a-zà-ú]+)/i);
      if (contactMatch && contactMatch[1]) setContactName(contactMatch[1]);

      // Extract company / system
      const companyMatch = rawText.match(/(?:empresa|ganhadora|fornecedor|contratada|sistema)\s*:?\s*([A-Z0-9\s\.\-]{3,30})/i);
      if (companyMatch && companyMatch[1]) setWinningCompany(companyMatch[1].trim());

      // Extract contract value
      const valueMatch = rawText.match(/(?:R\$|R\$\s?|valor|contrato de)\s?([\d\.\,]+)/i);
      if (valueMatch && valueMatch[1]) {
        const val = parseFloat(valueMatch[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(val) && val > 0) setContractValue(val);
      }

      // Extract contract items / scope
      const itemsMatch = rawText.match(/(?:itens|módulos|objeto|serviços|escopo|contratado[s]?)\s*:?\s*([^\n\.]+)/i);
      if (itemsMatch && itemsMatch[1]) setContractItems(itemsMatch[1].trim());

      // Extract students count
      const studentsMatch = rawText.match(/(?:(\d[\d\.\,]*)\s*(?:alunos|estudantes|matrículas|alunos atendidos))|(?:alunos|estudantes|matrículas)\s*:?\s*(\d[\d\.\,]*)/i);
      if (studentsMatch) {
        const numStr = studentsMatch[1] || studentsMatch[2];
        if (numStr) {
          const val = parseInt(numStr.replace(/\./g, ''), 10);
          if (!isNaN(val) && val > 0) setStudentsCount(val);
        }
      }

      // Extract schools count
      const schoolsMatch = rawText.match(/(?:(\d+)\s*(?:escolas|colégios|unidades escolares))|(?:escolas|colégios|unidades)\s*:?\s*(\d+)/i);
      if (schoolsMatch) {
        const numStr = schoolsMatch[1] || schoolsMatch[2];
        if (numStr) {
          const val = parseInt(numStr, 10);
          if (!isNaN(val) && val > 0) setSchoolsCount(val);
        }
      }

      // Default next step
      if (!nextStep) {
        setNextStep('Enviar proposta de transição tecnológica e agendar apresentação do SICAP');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3);
        setNextStepDueDate(tomorrow.toISOString().slice(0, 10));
      }

      if (!summary) {
        setSummary(rawText.slice(0, 120) + (rawText.length > 120 ? '...' : ''));
      }
      if (!description) {
        setDescription(rawText);
      }

      onShowToast('✨ Cartão de visita formatado com sucesso pela IA!');
    } catch (err) {
      console.error(err);
      onShowToast('✨ Cartão de visita pré-formatado com base no algoritmo estruturado.');
    } finally {
      setIsFormattingWithAi(false);
    }
  };

  // Construct CRMInteraction object
  const currentInteraction: CRMInteraction = {
    id: `card-fmt-${Date.now()}`,
    municipalityId: selectedMuniId || 'custom_muni',
    municipalityName: muniName || 'Prefeitura Municipal',
    state: muniState || 'PI',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    type: interactionType,
    contactName: contactName || 'Contato Principal',
    contactRole: contactRole || 'Cargo / Função',
    summary: summary || 'Reunião comercial e verificação de contratos firmados',
    description: description || rawText || 'Discussão sobre vigência contratual e modernização da gestão pública',
    outcome: outcome,
    nextStep: nextStep || 'Enviar proposta comercial e agendar nova reunião',
    nextStepDueDate: nextStepDueDate || new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    dealOwner: dealOwner || 'José Badotti'
  };

  const contractOverride: ContractDetailsOverride = {
    winningCompany: winningCompany || 'A consultar no PNCP',
    currentSystem: currentSystem || 'Sistema em Uso',
    contractValue: contractValue || 0,
    contractItems: contractItems || 'Módulos e Serviços de Gestão Pública',
    studentsCount: studentsCount || 0,
    schoolsCount: schoolsCount || 0,
    contractDaysRemaining: contractDaysRemaining || 60,
    contractExpirationDate: contractExpirationDate || 'A verificar'
  };

  const formattedCardText = formatCardDetailsForCalendar(currentInteraction, contractOverride);

  const handleCopyCardText = () => {
    navigator.clipboard.writeText(formattedCardText);
    onShowToast('📋 Cartão de visita formatado copiado para a área de transferência!');
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(formattedCardText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onShowToast('📲 Abrindo WhatsApp para compartilhar cartão e resumo!');
  };

  const handleSendToGoogleCalendar = () => {
    openGoogleCalendar(currentInteraction);
    onShowToast(`📅 Abrindo Google Agenda para agendar compromisso comercial!`);
  };

  const handleSendContractExpirationToGoogleCalendar = () => {
    const expDateStr = contractExpirationDate || new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10);
    const title = `🚨 [SICAP] ALERTA VENCIMENTO DE CONTRATO - ${muniName || 'Prefeitura'}`;
    const cleanDate = expDateStr.replace(/-/g, '').slice(0, 8);
    const startIso = `${cleanDate}T090000`;
    const endIso = `${cleanDate}T100000`;
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startIso}/${endIso}`,
      details: `🚨 ALERTA DE REPACTUAÇÃO / LICITAÇÃO\n\nContrato Vigente: ${winningCompany || 'Empresa Atual'} (${currentSystem || 'Sistema'})\nValor: R$ ${contractValue}\nVencimento: ${expDateStr}\n\n${formattedCardText}`,
      location: `Prefeitura Municipal de ${muniName || 'Prefeitura'}`
    });
    
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
    onShowToast('🚨 Alerta de Vencimento de Contrato criado na Google Agenda!');
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(currentInteraction);
    onShowToast(`📥 Evento .ICS baixado com sucesso!`);
  };

  const handleSaveToCrm = () => {
    if (onSaveInteraction) {
      onSaveInteraction(currentInteraction);
      onShowToast(`💾 Interação consolidada e salva com sucesso sem duplicidades no CRM!`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 md:p-5 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <CreditCard className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Formatador Automático de Cartões de Visita</h3>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Inteligência de Contratos
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Estruturação automática de contratos firmados, vencimentos, empresa ganhadora, nome do sistema e agendamento
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View (Form / AI Input vs Live Formatted Preview) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Left Column: Input Form & Contract Data */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Quick AI Text Input Box */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  <span>Anotação Bruta / Texto do Cartão ou Reunião</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoFormatWithAI}
                  disabled={isFormattingWithAi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isFormattingWithAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Formatando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Formatar com IA</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={3}
                placeholder="Cole aqui anotações de reunião, texto de WhatsApp ou dados do cartão... Ex: Reunião com Dr. Marcos (Secretário de Educação de Esperantina-PI). Empresa atual: TechGov com o sistema Educar. Contrato de R$ 850mil vence em 60 dias. Próximo passo: apresentar o SICAP dia 20..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* Municipality & Contact Selectors */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                1. Identificação do Ente Público & Contato
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prefeitura Cadastrada</label>
                  <select
                    value={selectedMuniId}
                    onChange={(e) => setSelectedMuniId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="">-- Selecionar Prefeitura --</option>
                    {municipalities.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.state}) - {m.currentSystem || 'Sem sistema'}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome da Prefeitura</label>
                    <input
                      type="text"
                      value={muniName}
                      onChange={(e) => setMuniName(e.target.value)}
                      placeholder="Ex: Prefeitura de Teresina"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">UF</label>
                    <input
                      type="text"
                      value={muniState}
                      onChange={(e) => setMuniState(e.target.value.toUpperCase())}
                      placeholder="PI"
                      maxLength={2}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white text-center font-bold focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contato Principal</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="Ex: Secretário de Educação / Pregoeiro"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Contract Intelligence Fields */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                2. Inteligência do Contrato Vigente & Concorrente
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Empresa Ganhadora / Fornecedora</label>
                  <input
                    type="text"
                    value={winningCompany}
                    onChange={(e) => setWinningCompany(e.target.value)}
                    placeholder="Ex: TechGov Sistemas Ltda"
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Nome do Sistema em Uso</label>
                  <input
                    type="text"
                    value={currentSystem}
                    onChange={(e) => setCurrentSystem(e.target.value)}
                    placeholder="Ex: Gestão Escolar Cloud v3"
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Valor do Contrato Firmado (R$)</label>
                  <input
                    type="number"
                    value={contractValue || ''}
                    onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
                    placeholder="850000"
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 font-extrabold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Data de Vencimento do Contrato</label>
                  <input
                    type="date"
                    value={contractExpirationDate}
                    onChange={(e) => {
                      setContractExpirationDate(e.target.value);
                      if (e.target.value) {
                        const diffMs = new Date(e.target.value).getTime() - new Date().getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
                        setContractDaysRemaining(diffDays > 0 ? diffDays : 0);
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Itens / Módulos Contratados (Escopo do Contrato)</label>
                  <input
                    type="text"
                    value={contractItems}
                    onChange={(e) => setContractItems(e.target.value)}
                    placeholder="Ex: Módulos de Folha de Pagamento, Transparência, Protocolo, Compras e Licitações"
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Next Steps & Action Item */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                3. Próxima Ação & Compromisso para Agenda
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Próximo Passo / Ação de Follow-Up</label>
                  <input
                    type="text"
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value)}
                    placeholder="Ex: Apresentar proposta de transição antes do vencimento do contrato"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Data Limite / Agendamento</label>
                  <input
                    type="date"
                    value={nextStepDueDate}
                    onChange={(e) => setNextStepDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsável Comercial</label>
                  <input
                    type="text"
                    value={dealOwner}
                    onChange={(e) => setDealOwner(e.target.value)}
                    placeholder="José Badotti"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Formatted Card Preview & Action Bar */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-indigo-800 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Preview do Cartão Formatado
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-800/60 text-indigo-200 px-2 py-0.5 rounded-md">
                    Pronto para Agenda
                  </span>
                </div>

                {/* Card Output Pre Block */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-900/60 font-mono text-[11px] leading-relaxed text-indigo-100 overflow-x-auto max-h-[380px] whitespace-pre-wrap select-all border-dashed">
                  {formattedCardText}
                </div>
              </div>

              {/* Action Buttons - Phase 3 Complete Export Suite */}
              <div className="mt-4 pt-4 border-t border-indigo-800/80 space-y-2">
                <button
                  type="button"
                  onClick={handleSendToGoogleCalendar}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-indigo-400/30"
                >
                  <Calendar className="w-4 h-4 text-indigo-200" />
                  <span>📅 Agendar Reunião no Google Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendContractExpirationToGoogleCalendar}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-amber-400/30"
                  title="Criar lembrete de janela de renovação / licitação na data de vencimento do contrato"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  <span>🚨 Criar Alerta de Vencimento de Contrato no Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-emerald-400/30"
                  title="Enviar cartão formatado e ata resumida via WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>📲 Compartilhar no WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCardText}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Copiar Texto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Baixar .ICS</span>
                  </button>
                </div>

                {onSaveInteraction && (
                  <button
                    type="button"
                    onClick={handleSaveToCrm}
                    className="w-full bg-slate-100 hover:bg-white text-slate-900 font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-slate-300"
                  >
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>💾 Salvar / Atualizar Registro sem Duplicidade no CRM</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
