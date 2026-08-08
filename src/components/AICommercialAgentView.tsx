import React, { useState } from 'react';
import { Municipality, AICommercialStrategy, CRMInteraction } from '../types';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Users, 
  Swords, 
  Calendar, 
  AlertOctagon, 
  Copy, 
  Check, 
  Loader2, 
  Building2,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Database
} from 'lucide-react';

interface AICommercialAgentViewProps {
  municipalities: Municipality[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (m: Municipality) => void;
  onAddCRMInteraction?: (interaction: CRMInteraction) => void;
  onNavigateToCRM?: () => void;
}

export const AICommercialAgentView: React.FC<AICommercialAgentViewProps> = ({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  onAddCRMInteraction,
  onNavigateToCRM
}) => {
  const activeMuni = selectedMunicipality || municipalities[0];

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AICommercialStrategy | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time?: string; loggedInCRM?: boolean }>>([]);
  const [isAskingChat, setIsAskingChat] = useState<boolean>(false);

  const [lastSavedStrategyTime, setLastSavedStrategyTime] = useState<string | null>(null);
  const [lastSavedChatTime, setLastSavedChatTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Helper to log strategy to CRM
  const saveStrategyToCRM = (strategy: AICommercialStrategy) => {
    if (!activeMuni || !onAddCRMInteraction) return;

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const strategyInteraction: CRMInteraction = {
      id: `crm-strategy-${Date.now()}`,
      municipalityId: activeMuni.id,
      municipalityName: activeMuni.name,
      state: activeMuni.state,
      date: nowStr,
      type: 'analise_estrategica_ia',
      contactName: 'IA Comercial (Playbook Automático)',
      contactRole: 'Gerador de Inteligência de Mercado',
      summary: `Plano Estratégico de Abordagem IA — ${activeMuni.name} (${activeMuni.state})`,
      description: `🎯 ESTRATÉGIA DE ABORDAGEM:\n${strategy.approachStrategy}\n\n⚔️ ARGUMENTOS CONTRA CONCORRENTE (${activeMuni.currentSystem || 'Atual'}):\n${(strategy.counterArguments || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n🗓️ CRONOGRAMA DE 6 SEMANAS:\n${(strategy.commercialTimeline || []).map((t) => `- ${t.phase} (${t.duration}): ${t.action}`).join('\n')}\n\n📄 MINUTA DE INEXIGIBILIDADE GERADA COM SUCESSO.`,
      outcome: 'positivo',
      nextStep: 'Executar plano comercial de 6 semanas e iniciar contatos',
      nextStepDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      dealOwner: 'José Badotti'
    };

    onAddCRMInteraction(strategyInteraction);
    setLastSavedStrategyTime(timeStr);
    showToast(`✨ Estratégia Comercial registrada com sucesso no Histórico do CRM de ${activeMuni.name}!`);
  };

  // Trigger AI Commercial Strategy Generator
  const handleGenerateStrategy = async () => {
    if (!activeMuni) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/commercial-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality: {
            name: activeMuni.name,
            state: activeMuni.state,
            population: activeMuni.population,
          },
          competitor: activeMuni.currentSystem,
          currentContractValue: activeMuni.currentContractValue,
          daysRemaining: activeMuni.contractDaysRemaining,
          ioScore: activeMuni.ioScore,
          probableModality: activeMuni.probableModality,
          mainPains: activeMuni.educationalMetrics?.mainPains || [],
        }),
      });

      const json = await response.json();
      const generatedData: AICommercialStrategy = json.data || json.fallback;
      
      if (generatedData) {
        setAiResult(generatedData);
        // AUTOMATICALLY LOG INTO CRM HISTORY!
        saveStrategyToCRM(generatedData);
      }
    } catch (err) {
      console.error('Error generating AI strategy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Pitch Assistant
  const handleAskPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !activeMuni) return;

    const userQ = chatQuestion;
    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    setChatQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userQ, time: timeNow }]);
    setIsAskingChat(true);

    try {
      const res = await fetch('/api/ai/pitch-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          context: {
            municipality: activeMuni.name,
            state: activeMuni.state,
            competitor: activeMuni.currentSystem,
            daysRemaining: activeMuni.contractDaysRemaining,
            probableModality: activeMuni.probableModality,
          },
        }),
      });

      const json = await res.json();
      const aiText = json.text || 'Recomendo enfatizar que o SICAP possui notória especialização comprovada e atestados de capacidade técnica para garantir a transição sem interrupção das aulas.';

      setChatHistory((prev) => [...prev, { sender: 'ai', text: aiText, time: timeNow, loggedInCRM: true }]);

      // AUTOMATICALLY LOG CONVERSATION INTO CRM HISTORY!
      if (onAddCRMInteraction) {
        const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const chatInteraction: CRMInteraction = {
          id: `crm-chat-${Date.now()}`,
          municipalityId: activeMuni.id,
          municipalityName: activeMuni.name,
          state: activeMuni.state,
          date: nowStr,
          type: 'chat_assistente_ia',
          contactName: 'Consultoria de Campo IA',
          contactRole: 'Assistente Estratégico de Pitch & Objeções',
          summary: `Consulta IA: "${userQ.length > 55 ? userQ.slice(0, 55) + '...' : userQ}"`,
          description: `💬 PERGUNTA DO VENDEDOR / CAMPO:\n"${userQ}"\n\n🤖 ORIENTAÇÃO DA IA COMERCIAL:\n${aiText}`,
          outcome: 'positivo',
          nextStep: 'Aplicar argumentação em contato presencial ou proposta',
          dealOwner: 'José Badotti'
        };

        onAddCRMInteraction(chatInteraction);
        setLastSavedChatTime(timeNow);
        showToast(`💬 Conversa e orientação gravadas no CRM de ${activeMuni.name}!`);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsAskingChat(false);
    }
  };

  const logFullChatHistoryToCRM = () => {
    if (!activeMuni || chatHistory.length === 0 || !onAddCRMInteraction) return;

    const formattedTranscript = chatHistory
      .map((m) => `${m.sender === 'user' ? '👤 VENDEDOR' : '🤖 IA COMERCIAL'} [${m.time || ''}]:\n${m.text}`)
      .join('\n\n---\n\n');

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const fullChatInteraction: CRMInteraction = {
      id: `crm-fullchat-${Date.now()}`,
      municipalityId: activeMuni.id,
      municipalityName: activeMuni.name,
      state: activeMuni.state,
      date: nowStr,
      type: 'chat_assistente_ia',
      contactName: 'Atendimento de Campo IA',
      contactRole: 'Histórico Completo de Sessão de Pitch',
      summary: `Transcrição Completa da Conversa de Estratégia IA (${chatHistory.length} mensagens)`,
      description: formattedTranscript,
      outcome: 'positivo',
      nextStep: 'Consultar orientações para reunião com Secretário de Educação',
      dealOwner: 'José Badotti'
    };

    onAddCRMInteraction(fullChatInteraction);
    setLastSavedChatTime(timeStr);
    showToast(`📚 Transcrição completa do Chat salva no Histórico de CRM de ${activeMuni.name}!`);
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-purple-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-white">{toastMessage}</p>
            <p className="text-[11px] text-slate-300">Lançado automaticamente no ERP / Histórico do CRM.</p>
          </div>
          {onNavigateToCRM && (
            <button
              onClick={onNavigateToCRM}
              className="ml-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
            >
              <span>Ver CRM</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Módulo 4: Gerador de Inteligência & Estratégias Comerciais</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            IA Comercial SICAP (Gemini 3.6 Flash)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Geração de estratégia de abordagem, argumentos imbatíveis contra concorrentes e chat de suporte de campo — <strong>integrados automaticamente ao histórico do CRM</strong>.
          </p>
        </div>

        {/* Municipality Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={activeMuni?.id}
            onChange={(e) => {
              const m = municipalities.find((item) => item.id === e.target.value);
              if (m) onSelectMunicipality(m);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.state}) - Concorrente: {m.currentSystem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Municipality Summary Banner */}
      {activeMuni && (
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">MUNICÍPIO ALVO SELECIONADO</span>
              <span className="bg-purple-950 text-purple-300 text-[10px] px-2 py-0.5 rounded font-extrabold border border-purple-800">
                Integrado ao CRM
              </span>
            </div>
            <h3 className="text-lg font-black mt-0.5">
              {activeMuni.name} - {activeMuni.state} | IO: {activeMuni.ioScore}/100
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Concorrente Atual: <strong className="text-white">{activeMuni.currentSystem}</strong> | Vencimento: {activeMuni.contractDaysRemaining} dias | Modalidade: {activeMuni.probableModality}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastSavedStrategyTime && (
              <div className="text-right hidden sm:block mr-2">
                <span className="text-[10px] text-emerald-400 font-extrabold block">✓ Lançado no CRM</span>
                <span className="text-[10px] text-slate-400">Às {lastSavedStrategyTime}</span>
              </div>
            )}
            <button
              onClick={handleGenerateStrategy}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Analisando Dados & Gerando Playbook...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>{aiResult ? 'Regerar Plano & Salvar no CRM' : 'Gerar Plano Comercial & Registrar no CRM'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CRM Integration Status Banner */}
      {lastSavedStrategyTime && aiResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span>Estratégia comercial lançada automaticamente no Histórico do CRM de <strong>{activeMuni?.name}</strong> às {lastSavedStrategyTime}.</span>
              <p className="text-[11px] text-emerald-700 font-normal">Qualquer membro da equipe comercial pode acessar este registro no aba de Interações CRM.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveStrategyToCRM(aiResult)}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Re-Salvar no CRM</span>
            </button>
            {onNavigateToCRM && (
              <button
                onClick={onNavigateToCRM}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Ver no Histórico CRM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Generated Strategy Output */}
      {aiResult && (
        <div className="space-y-6">
          
          {/* 1. Estratégia de Abordagem */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>1. Estratégia de Abordagem Recomendada</span>
              </div>
              <button
                onClick={() => copyToClipboard(aiResult.approachStrategy, 'approach')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                {copiedSection === 'approach' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'approach' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100 font-medium">
              {aiResult.approachStrategy}
            </p>
          </div>

          {/* 2. Argumentos Contra o Concorrente (Battlecards) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm pb-2 border-b border-slate-100">
              <Swords className="w-4 h-4" />
              <span>2. Argumentos Contra o Concorrente Atual ({activeMuni?.currentSystem})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(aiResult.counterArguments || []).map((arg, idx) => (
                <div key={idx} className="bg-red-50/60 border border-red-100 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-extrabold text-red-900 block text-[11px]">PONTO DE ATAQUE #{idx + 1}</span>
                  <p className="text-red-800 leading-relaxed">{arg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Minuta de Inexigibilidade ou Adesão à Ata (ARP) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm">
                <FileText className="w-4 h-4" />
                <span>3. Minuta para Inexigibilidade / Adesão à Ata (ARP)</span>
              </div>
              <button
                onClick={() => copyToClipboard(aiResult.inexeligibilityDocument, 'doc')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                {copiedSection === 'doc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'doc' ? 'Copiado!' : 'Copiar Texto Legal'}</span>
              </button>
            </div>
            <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-72 overflow-y-auto">
              {aiResult.inexeligibilityDocument}
            </pre>
          </div>

          {/* 4. Cronograma Comercial */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>4. Cronograma Comercial de Vendas (Timeline de 6 Semanas)</span>
            </div>

            <div className="space-y-2">
              {(aiResult.commercialTimeline || []).map((step, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">{step.phase}</strong>
                      <span className="text-slate-600">{step.action}</span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    Duração: {step.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Matriz de Contato de Pessoas-Chave & 6. Riscos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Decision Makers */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>5. Estratégia por Perfil de Decisor</span>
              </div>

              <div className="space-y-2">
                {(aiResult.decisionMakers || []).map((dm, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                    <span className="font-extrabold text-indigo-900 block">{dm.role}</span>
                    <p className="text-indigo-800 mt-0.5">{dm.strategy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Mitigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                <AlertOctagon className="w-4 h-4 text-orange-600" />
                <span>6. Análise de Riscos & Mitigação</span>
              </div>

              <div className="space-y-2">
                {(aiResult.risksAndMitigation || []).map((rm, idx) => (
                  <div key={idx} className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs space-y-1">
                    <span className="font-bold text-orange-900 block">Risco: {rm.risk}</span>
                    <p className="text-orange-800"><strong className="text-slate-900">Mitigação:</strong> {rm.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Interactive Pitch Q&A Chat */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span>Assistente de Dúvidas & Estratégia Comercial de Campo</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              <span>Gravação Automática no CRM ({activeMuni?.name})</span>
            </span>

            {chatHistory.length > 0 && (
              <button
                onClick={logFullChatHistoryToCRM}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                <span>Lançar Transcrição do Chat no CRM</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Faça perguntas sobre como abordar o prefeito, rebater o concorrente {activeMuni?.currentSystem} ou contornar objeções técnicas. <strong>Cada resposta e estratégia gerada é gravada no ERP/CRM de {activeMuni?.name}.</strong>
        </p>

        {chatHistory.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] opacity-80 border-b border-current pb-1 mb-1 font-bold">
                  <span>{msg.sender === 'user' ? '👤 Pergunta do Vendedor' : '🤖 Orientação IA Comercial'}</span>
                  <span>{msg.time || ''}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
                {msg.sender === 'ai' && msg.loggedInCRM && (
                  <div className="pt-1 flex items-center justify-end text-[9px] text-emerald-600 font-extrabold gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Lançado no CRM de {activeMuni?.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAskPitch} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Como rebater a objeção de que a prefeitura quer fazer aditivo em vez de nova licitação?"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
          <button
            type="submit"
            disabled={isAskingChat}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            {isAskingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Analisar & Lançar no CRM</span>
          </button>
        </form>

        {lastSavedChatTime && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Última orientação gravada no CRM de <strong>{activeMuni?.name}</strong> às {lastSavedChatTime}.</span>
            </span>
            {onNavigateToCRM && (
              <button
                onClick={onNavigateToCRM}
                className="text-purple-700 hover:text-purple-900 font-extrabold text-xs flex items-center gap-1"
              >
                <span>Conferir no CRM</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
