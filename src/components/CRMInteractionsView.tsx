import React, { useState } from 'react';
import { CRMInteraction, Municipality } from '../types';
import { calculateCommercialScore } from '../utils/scoreCalculator';
import { 
  PhoneCall, 
  MapPin, 
  Mail, 
  Video, 
  Scale, 
  HelpCircle, 
  FileText, 
  Handshake, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  MessageSquare,
  Building,
  Paperclip,
  X,
  Send,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bot,
  Database,
  Lightbulb,
  Swords,
  Copy,
  Check,
  TrendingUp,
  Award,
  Navigation,
  Eye,
  Compass,
  Star
} from 'lucide-react';

interface CRMInteractionsViewProps {
  interactions: CRMInteraction[];
  municipalities: Municipality[];
  onAddInteraction: (newInteraction: CRMInteraction) => void;
  onEditInteraction?: (updatedInteraction: CRMInteraction) => void;
  onDeleteInteraction?: (id: string) => void;
  onAddMunicipality?: (newMuni: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  onSelectMunicipality?: (m: Municipality) => void;
  onNavigateTab?: (tab: string) => void;
}

export const CRMInteractionsView: React.FC<CRMInteractionsViewProps> = ({
  interactions,
  municipalities,
  onAddInteraction,
  onEditInteraction,
  onDeleteInteraction,
  onAddMunicipality,
  selectedMunicipality,
  onSelectMunicipality,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [muniFilter, setMuniFilter] = useState<string>(selectedMunicipality?.id || '');
  const [activeCrmTab, setActiveCrmTab] = useState<'prioridades_visita' | 'historico_interacoes'>('prioridades_visita');

  React.useEffect(() => {
    if (selectedMunicipality) {
      setMuniFilter(selectedMunicipality.id);
    }
  }, [selectedMunicipality]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<CRMInteraction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available unique states from dataset
  const availableStates = Array.from(new Set(municipalities.map((m) => m.state))).sort();

  // Municipalities filtered by state
  const stateFilteredMunicipalities = municipalities.filter(
    (m) => !stateFilter || m.state === stateFilter
  );

  const handleStateFilterChange = (newState: string) => {
    setStateFilter(newState);
    if (muniFilter) {
      const selectedM = municipalities.find((m) => m.id === muniFilter);
      if (selectedM && newState && selectedM.state !== newState) {
        setMuniFilter('');
      }
    }
  };

  // --- AI Strategy Copilot State for Top Hub ---
  const [isTopAiPanelOpen, setIsTopAiPanelOpen] = useState(true);
  const [topAiMuniId, setTopAiMuniId] = useState<string>(selectedMunicipality?.id || municipalities[0]?.id || '');
  const [topAiQuestion, setTopAiQuestion] = useState('');
  const [topAiHistory, setTopAiHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([]);
  const [isTopAiLoading, setIsTopAiLoading] = useState(false);

  // --- Per-Interaction AI Drawer/Modal State ---
  const [selectedInteractionForAi, setSelectedInteractionForAi] = useState<CRMInteraction | null>(null);
  const [interactionAiQuestion, setInteractionAiQuestion] = useState('');
  const [interactionAiHistory, setInteractionAiHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([]);
  const [isInteractionAiLoading, setIsInteractionAiLoading] = useState(false);

  // --- Form AI Suggestion State ---
  const [isSuggestingNextStep, setIsSuggestingNextStep] = useState(false);

  // --- Toast Notification State ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // New interaction form state
  const [formMuniId, setFormMuniId] = useState(selectedMunicipality?.id || municipalities[0]?.id || '');
  
  // Fields for registering a brand NEW municipality
  const [newMuniName, setNewMuniName] = useState('');
  const [newMuniState, setNewMuniState] = useState('PI');
  const [newMuniStudents, setNewMuniStudents] = useState('5000');
  const [newMuniFunnelStage, setNewMuniFunnelStage] = useState<Municipality['funnelStage']>('prospectado');
  const [newMuniPhone, setNewMuniPhone] = useState('');
  const [newMuniEmail, setNewMuniEmail] = useState('');

  const [formType, setFormType] = useState<CRMInteraction['type']>('ligacao');
  const [formContactName, setFormContactName] = useState('');
  const [formContactRole, setFormContactRole] = useState('Secretária de Educação');
  const [formSummary, setFormSummary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOutcome, setFormOutcome] = useState<CRMInteraction['outcome']>('positivo');
  const [formNextStep, setFormNextStep] = useState('');
  const [formNextStepDueDate, setFormNextStepDueDate] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 16));
  const [formDealOwner, setFormDealOwner] = useState('José Badotti');

  // Top AI Copilot Handler
  const handleAskTopAi = async (customQ?: string) => {
    const q = customQ || topAiQuestion;
    if (!q.trim()) return;

    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const targetM = municipalities.find((m) => m.id === topAiMuniId) || municipalities[0];

    if (!customQ) setTopAiQuestion('');
    setTopAiHistory((prev) => [...prev, { sender: 'user', text: q, time: timeNow }]);
    setIsTopAiLoading(true);

    try {
      const res = await fetch('/api/ai/pitch-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: {
            municipality: targetM?.name,
            state: targetM?.state,
            competitor: targetM?.currentSystem,
            daysRemaining: targetM?.contractDaysRemaining,
            probableModality: targetM?.probableModality,
            ioScore: targetM?.ioScore
          }
        })
      });

      const json = await res.json();
      const aiResponse = json.text || 'Recomendo demonstrar a notória especialização do SICAP e a garantia de importação de dados do Educacenso em 15 dias sem interrupção de aulas.';

      setTopAiHistory((prev) => [...prev, { sender: 'ai', text: aiResponse, time: timeNow }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTopAiLoading(false);
    }
  };

  const handleSaveTopAiToCRM = (aiText: string, userQ: string) => {
    const targetM = municipalities.find((m) => m.id === topAiMuniId) || municipalities[0];
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newInteraction: CRMInteraction = {
      id: `crm-ai-copilot-${Date.now()}`,
      municipalityId: targetM.id,
      municipalityName: targetM.name,
      state: targetM.state,
      date: nowStr,
      type: 'chat_assistente_ia',
      contactName: 'Copilot de Inteligência Comercial CRM',
      contactRole: 'Assistente Estratégico de Pitch & Objeções',
      summary: `Estudo Comercial IA: "${userQ.length > 50 ? userQ.slice(0, 50) + '...' : userQ}"`,
      description: `💬 PERGUNTA COMERCIAL DO VENDEDOR:\n"${userQ}"\n\n🤖 ORIENTAÇÃO ESTRATÉGICA DA IA:\n${aiText}`,
      outcome: 'positivo',
      nextStep: 'Aplicar orientação em contato com a gestão municipal',
      nextStepDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      dealOwner: 'José Badotti'
    };

    onAddInteraction(newInteraction);
    showToast(`✨ Estudo de Estratégia gravado no histórico de ${targetM.name}!`);
  };

  // Per-Interaction AI Handler
  const handleOpenInteractionAi = (interaction: CRMInteraction) => {
    setSelectedInteractionForAi(interaction);
    setInteractionAiQuestion('');
    setInteractionAiHistory([]);
  };

  const handleAskInteractionAi = async (customQ?: string) => {
    if (!selectedInteractionForAi) return;
    const q = customQ || interactionAiQuestion;
    if (!q.trim()) return;

    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!customQ) setInteractionAiQuestion('');

    setInteractionAiHistory((prev) => [...prev, { sender: 'user', text: q, time: timeNow }]);
    setIsInteractionAiLoading(true);

    try {
      const res = await fetch('/api/ai/pitch-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: {
            municipality: selectedInteractionForAi.municipalityName,
            state: selectedInteractionForAi.state,
            contactName: selectedInteractionForAi.contactName,
            contactRole: selectedInteractionForAi.contactRole,
            type: selectedInteractionForAi.type,
            summary: selectedInteractionForAi.summary,
            sellerRelat: selectedInteractionForAi.description,
            outcome: selectedInteractionForAi.outcome
          }
        })
      });

      const json = await res.json();
      const aiText = json.text || 'Analisando esta interação, a melhor abordagem é agendar uma demonstração técnica com a presença da equipe de suporte do SICAP.';

      setInteractionAiHistory((prev) => [...prev, { sender: 'ai', text: aiText, time: timeNow }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInteractionAiLoading(false);
    }
  };

  const handleAttachAiToCurrentInteraction = (aiText: string) => {
    if (!selectedInteractionForAi || !onEditInteraction) return;

    const updated: CRMInteraction = {
      ...selectedInteractionForAi,
      description: `${selectedInteractionForAi.description}\n\n🤖 [ORIENTAÇÃO ESTRATÉGICA DA IA (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})]:\n${aiText}`
    };

    onEditInteraction(updated);
    setSelectedInteractionForAi(updated);
    showToast(`📌 Orientação da IA anexada com sucesso a este registro!`);
  };

  const handleSetNextStepFromAi = (aiText: string) => {
    if (!selectedInteractionForAi || !onEditInteraction) return;

    const firstLine = aiText.split('\n')[0].replace(/^[*-•\d.]+\s*/, '').slice(0, 120);
    const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const updated: CRMInteraction = {
      ...selectedInteractionForAi,
      nextStep: firstLine || 'Acompanhamento estratégico sugerido pela IA',
      nextStepDueDate: in5Days
    };

    onEditInteraction(updated);
    setSelectedInteractionForAi(updated);
    showToast(`📅 Próximo Passo do CRM atualizado para: "${firstLine.slice(0, 45)}..."`);
  };

  const handleSuggestNextStepInForm = async () => {
    if (!formSummary && !formDescription) {
      showToast('⚠️ Preencha o resumo ou a descrição da interação para pedir sugestão da IA.');
      return;
    }

    setIsSuggestingNextStep(true);
    try {
      const res = await fetch('/api/ai/pitch-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Baseado no relato desta interação, sugira em UMA ÚNICA FRASE CURTA (máximo 12 palavras) a ação prática e direta de Próximo Passo Comercial para a equipe de vendas.',
          context: {
            summary: formSummary,
            description: formDescription,
            contactName: formContactName,
            contactRole: formContactRole,
            type: formType,
            outcome: formOutcome
          }
        })
      });

      const json = await res.json();
      if (json.text) {
        const cleanStep = json.text.replace(/["'*]/g, '').trim().split('\n')[0];
        setFormNextStep(cleanStep);
        const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        setFormNextStepDueDate(in5Days);
        showToast('✨ Próximo Passo sugerido automaticamente pela IA!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggestingNextStep(false);
    }
  };

  // Helper for type metadata
  const getTypeMeta = (type: CRMInteraction['type']) => {
    switch (type) {
      case 'ligacao':
        return { label: 'Ligação Telefônica', icon: PhoneCall, bg: 'bg-blue-50 text-blue-700 border-blue-200', badge: 'bg-blue-100 text-blue-800' };
      case 'visita':
        return { label: 'Visita Presencial', icon: MapPin, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' };
      case 'email':
        return { label: 'E-mail / Ofício', icon: Mail, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' };
      case 'reuniao_virtual':
        return { label: 'Reunião Virtual', icon: Video, bg: 'bg-purple-50 text-purple-700 border-purple-200', badge: 'bg-purple-100 text-purple-800' };
      case 'impugnacao':
        return { label: 'Impugnação de Edital', icon: Scale, bg: 'bg-red-50 text-red-700 border-red-200', badge: 'bg-red-100 text-red-800' };
      case 'esclarecimento':
        return { label: 'Pedido Esclarecimento', icon: HelpCircle, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', badge: 'bg-cyan-100 text-cyan-800' };
      case 'proposta':
        return { label: 'Proposta / Minuta', icon: FileText, bg: 'bg-teal-50 text-teal-700 border-teal-200', badge: 'bg-teal-100 text-teal-800' };
      case 'adesao_ata':
        return { label: 'Adesão à Ata (ARP)', icon: Handshake, bg: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-100 text-amber-800' };
      case 'analise_estrategica_ia':
        return { label: 'Análise Estratégica IA', icon: Sparkles, bg: 'bg-purple-50 text-purple-700 border-purple-200', badge: 'bg-purple-100 text-purple-900 font-bold' };
      case 'chat_assistente_ia':
        return { label: 'Consulta / Pitch IA', icon: Sparkles, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-100 text-indigo-900 font-bold' };
      default:
        return { label: 'Outras Interações', icon: MessageSquare, bg: 'bg-slate-50 text-slate-700 border-slate-200', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  // Helper for outcome pill
  const getOutcomeMeta = (outcome: CRMInteraction['outcome']) => {
    switch (outcome) {
      case 'positivo':
        return { label: 'Avanço / Sucesso', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'neutro':
        return { label: 'Informativo', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'critico':
        return { label: 'Risco / Objeção', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'aguardando_retorno':
        return { label: 'Aguardando Retorno', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'deferido':
        return { label: 'Deferido / Aprovado', color: 'bg-emerald-600 text-white' };
      case 'indeferido':
        return { label: 'Indeferido', color: 'bg-red-600 text-white' };
      default:
        return { label: outcome, color: 'bg-slate-100 text-slate-700' };
    }
  };

  // Ranked Municipalities for Visit Priority List
  const rankedMunicipalities = municipalities
    .map((m) => {
      const scoreBreakdown = calculateCommercialScore(m);
      const mInteractions = interactions.filter((i) => i.municipalityId === m.id);
      const lastInteraction = mInteractions[0] || null;
      const visitCount = mInteractions.filter((i) => i.type === 'visita').length;
      const callCount = mInteractions.filter((i) => i.type === 'ligacao').length;

      const score = scoreBreakdown.finalScore;
      let priorityLevel: 'maxima' | 'muito_quente' | 'quente' | 'monitorar' | 'baixa' = 'baixa';
      let priorityMeta = {
        label: '🔴 Baixa Prioridade',
        badge: 'bg-red-50 text-red-800 border-red-200 font-bold',
        shortLabel: 'Baixa',
      };

      if (score >= 95) {
        priorityLevel = 'maxima';
        priorityMeta = {
          label: '⭐ PRIORIDADE MÁXIMA - VISITAR IMEDIATAMENTE',
          badge: 'bg-purple-100 text-purple-900 border-purple-300 font-black ring-2 ring-purple-400/30',
          shortLabel: 'Prioridade Máxima',
        };
      } else if (score >= 80) {
        priorityLevel = 'muito_quente';
        priorityMeta = {
          label: '🟢 MUITO QUENTE - VISITA RECOMENDADA',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
          shortLabel: 'Muito Quente',
        };
      } else if (score >= 60) {
        priorityLevel = 'quente';
        priorityMeta = {
          label: '🟡 QUENTE - AGENDAR REUNIÃO',
          badge: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
          shortLabel: 'Quente',
        };
      } else if (score >= 40) {
        priorityLevel = 'monitorar';
        priorityMeta = {
          label: '🟠 MONITORAR CONTRATO',
          badge: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
          shortLabel: 'Monitorar',
        };
      }

      return {
        m,
        scoreBreakdown,
        lastInteraction,
        visitCount,
        callCount,
        mInteractionsCount: mInteractions.length,
        priorityLevel,
        priorityMeta,
      };
    })
    .filter(({ m, priorityLevel }) => {
      const matchesState = !stateFilter || m.state === stateFilter;
      const matchesMuni = !muniFilter || m.id === muniFilter;
      const matchesPriority = !priorityFilter || priorityLevel === priorityFilter;
      const matchesSearch =
        !searchTerm ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.currentSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.state.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesState && matchesMuni && matchesPriority && matchesSearch;
    })
    .sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore);

  // Filtered timeline of interactions
  const filteredInteractions = interactions.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.municipalityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = !stateFilter || item.state === stateFilter;
    const matchesMuni = !muniFilter || item.municipalityId === muniFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesOutcome = !outcomeFilter || item.outcome === outcomeFilter;

    return matchesSearch && matchesState && matchesMuni && matchesType && matchesOutcome;
  });

  // Calculate stats
  const totalCount = interactions.length;
  const callsCount = interactions.filter((i) => i.type === 'ligacao').length;
  const visitsCount = interactions.filter((i) => i.type === 'visita').length;
  const impugnacoesCount = interactions.filter((i) => i.type === 'impugnacao').length;
  const pendingNextStepsCount = interactions.filter((i) => i.nextStep).length;

  // Handlers for quick actions on ranked municipalities
  const handleQuickRegisterVisit = (m: Municipality) => {
    setEditingInteraction(null);
    setFormMuniId(m.id);
    setFormType('visita');
    setFormContactName(m.keyContacts?.[0]?.name || 'Secretária de Educação');
    setFormContactRole(m.keyContacts?.[0]?.role || 'Secretária de Educação');
    setFormSummary(`Visita Presencial ao Gabinete / Secretaria de Educação`);
    setFormDescription(`Realizada visita presencial comercial em ${m.name} (${m.state}). Apresentada a plataforma SICAP e alinhadas necessidades de diário eletrônico e gestão.`);
    setFormOutcome('positivo');
    setFormNextStep('Enviar minuta / proposta técnica por e-mail e agendar retorno');
    setFormNextStepDueDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setFormDate(new Date().toISOString().slice(0, 16));
    setFormDealOwner('José Badotti');
    setIsModalOpen(true);
  };

  const handleQuickRegisterCall = (m: Municipality) => {
    setEditingInteraction(null);
    setFormMuniId(m.id);
    setFormType('ligacao');
    setFormContactName(m.keyContacts?.[0]?.name || 'Secretária de Educação');
    setFormContactRole(m.keyContacts?.[0]?.role || 'Secretária de Educação');
    setFormSummary(`Contato telefônico com gestão educacional de ${m.name}`);
    setFormDescription(`Ligação telefônica para qualificação e verificação de vigência de contrato.`);
    setFormOutcome('positivo');
    setFormNextStep('Acompanhar vencimento do contrato do concorrente');
    setFormNextStepDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setFormDate(new Date().toISOString().slice(0, 16));
    setFormDealOwner('José Badotti');
    setIsModalOpen(true);
  };

  const handleOpenCreateNew = () => {
    setEditingInteraction(null);
    setFormMuniId(selectedMunicipality?.id || municipalities[0]?.id || '');
    setFormType('ligacao');
    setFormContactName('');
    setFormContactRole('Secretária de Educação');
    setFormSummary('');
    setFormDescription('');
    setFormOutcome('positivo');
    setFormNextStep('');
    setFormNextStepDueDate('');
    setFormDate(new Date().toISOString().slice(0, 16));
    setFormDealOwner('José Badotti');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CRMInteraction) => {
    setEditingInteraction(item);
    setFormMuniId(item.municipalityId);
    setFormType(item.type);
    setFormContactName(item.contactName);
    setFormContactRole(item.contactRole || 'Secretária de Educação');
    setFormSummary(item.summary);
    setFormDescription(item.description);
    setFormOutcome(item.outcome);
    setFormNextStep(item.nextStep || '');
    setFormNextStepDueDate(item.nextStepDueDate || '');
    setFormDate(item.date);
    setFormDealOwner(item.dealOwner || 'José Badotti');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (onDeleteInteraction) {
      onDeleteInteraction(id);
    }
    setDeleteConfirmId(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInteraction) {
      // EDIT MODE
      let targetMuniId = formMuniId;
      let targetMuniName = editingInteraction.municipalityName;
      let targetState = editingInteraction.state;

      const matchedMuni = municipalities.find((m) => m.id === formMuniId);
      if (matchedMuni) {
        targetMuniName = matchedMuni.name;
        targetState = matchedMuni.state;
      }

      if (!formSummary || !formContactName) return;

      const updatedObj: CRMInteraction = {
        ...editingInteraction,
        municipalityId: targetMuniId,
        municipalityName: targetMuniName,
        state: targetState,
        date: formDate,
        type: formType,
        contactName: formContactName,
        contactRole: formContactRole,
        summary: formSummary,
        description: formDescription,
        outcome: formOutcome,
        nextStep: formNextStep || undefined,
        nextStepDueDate: formNextStepDueDate || undefined,
        dealOwner: formDealOwner
      };

      if (onEditInteraction) {
        onEditInteraction(updatedObj);
      }
      setIsModalOpen(false);
      setEditingInteraction(null);
      return;
    }

    // CREATE MODE
    let targetMuniId = formMuniId;
    let targetMuniName = '';
    let targetState = '';

    if (formMuniId === 'NEW_MUNI') {
      if (!newMuniName.trim() || !newMuniState.trim()) {
        alert('Por favor, informe o Nome da Prefeitura e o Estado (UF).');
        return;
      }

      const createdMuni: Municipality = {
        id: `mun-${Date.now()}`,
        name: newMuniName.trim(),
        state: newMuniState.trim().toUpperCase(),
        region: 'Nordeste',
        population: (Number(newMuniStudents) || 5000) * 4,
        status: 'oportunidade',
        funnelStage: newMuniFunnelStage,
        currentSystem: 'Ainda sem contrato / Em prospecção',
        currentContractValue: 0,
        contractDaysRemaining: 90,
        renewalProbability: 'Baixa',
        tenderProbability: 80,
        estimatedNewContractValue: 450000,
        probableModality: 'Pregão Eletrônico',
        ioScore: 68,
        ioFactors: {
          contractExpiringDays: 80,
          lowIdebScore: 70,
          techInvestmentHistory: 60,
          budgetAvailability: 75,
          managementChange: 50,
          federalFundsAvailable: 80,
          existingRelationship: 60
        },
        educationalMetrics: {
          ideb: 4.2,
          idebTarget: 5.5,
          dropoutRate: 5.8,
          schoolsCount: Math.ceil((Number(newMuniStudents) || 5000) / 180),
          studentsCount: Number(newMuniStudents) || 5000,
          teachersCount: Math.ceil((Number(newMuniStudents) || 5000) / 22),
          fundebBudget: 12000000,
          mainPains: ['Necessidade de Diário Eletrônico Offline', 'Modernização de Gestão']
        },
        keyContacts: [
          {
            name: formContactName || 'Contato Inicial',
            role: formContactRole || 'Secretária de Educação',
            phone: newMuniPhone || '(86) 99999-0000',
            email: newMuniEmail || `educacao@${newMuniName.toLowerCase().replace(/\s+/g, '')}.gov.br`
          }
        ],
        buyingHistory: [],
        lastActivityDate: new Date().toISOString().slice(0, 10),
        dealOwner: formDealOwner,
        notes: 'Prefeitura adicionada diretamente pelo formulário de CRM.'
      };

      if (onAddMunicipality) {
        onAddMunicipality(createdMuni);
      }

      targetMuniId = createdMuni.id;
      targetMuniName = createdMuni.name;
      targetState = createdMuni.state;
    } else {
      const muni = municipalities.find((m) => m.id === formMuniId);
      if (!muni) return;
      targetMuniId = muni.id;
      targetMuniName = muni.name;
      targetState = muni.state;
    }

    if (!formSummary || !formContactName) return;

    const newObj: CRMInteraction = {
      id: `crm-${Date.now()}`,
      municipalityId: targetMuniId,
      municipalityName: targetMuniName,
      state: targetState,
      date: formDate,
      type: formType,
      contactName: formContactName,
      contactRole: formContactRole,
      summary: formSummary,
      description: formDescription,
      outcome: formOutcome,
      nextStep: formNextStep || undefined,
      nextStepDueDate: formNextStepDueDate || undefined,
      dealOwner: formDealOwner
    };

    onAddInteraction(newObj);
    setIsModalOpen(false);

    // Reset fields
    setFormSummary('');
    setFormDescription('');
    setFormNextStep('');
    setFormContactName('');
    setNewMuniName('');
    setNewMuniState('PI');
    setFormMuniId(targetMuniId);
  };

  // When municipality changes in form, auto-fill contact suggestion
  const handleFormMuniChange = (muniId: string) => {
    setFormMuniId(muniId);
    if (muniId === 'NEW_MUNI') {
      setFormContactName('');
      setFormContactRole('Secretária de Educação');
      return;
    }
    const selectedM = municipalities.find((m) => m.id === muniId);
    if (selectedM && selectedM.keyContacts && selectedM.keyContacts.length > 0) {
      setFormContactName(selectedM.keyContacts[0].name);
      setFormContactRole(selectedM.keyContacts[0].role);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-purple-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-white">{toastMessage}</p>
            <p className="text-[11px] text-slate-300">Atualizado e armazenado no Histórico do CRM.</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>CRM Comercial & Histórico de Relacionamento</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Registro de Interações com Prefeituras
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento histórico completo de ligações, visitas presenciais, e-mails, reuniões e estudos de estratégias com IA Copilot.
          </p>
        </div>

        <button
          onClick={handleOpenCreateNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nova Interação</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Interações</span>
          <span className="text-xl font-black text-slate-900">{totalCount}</span>
          <span className="text-[10px] text-slate-500 block">Registradas no CRM</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase block flex items-center gap-1">
            <PhoneCall className="w-3 h-3" /> Ligações
          </span>
          <span className="text-xl font-black text-blue-700">{callsCount}</span>
          <span className="text-[10px] text-slate-500 block">Contatos Telefônicos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Visitas
          </span>
          <span className="text-xl font-black text-emerald-700">{visitsCount}</span>
          <span className="text-[10px] text-slate-500 block">Reuniões Presenciais</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-red-600 uppercase block flex items-center gap-1">
            <Scale className="w-3 h-3" /> Impugnações
          </span>
          <span className="text-xl font-black text-red-700">{impugnacoesCount}</span>
          <span className="text-[10px] text-slate-500 block">Ações em Licitações</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase block flex items-center gap-1">
            <Clock className="w-3 h-3" /> Follow-ups
          </span>
          <span className="text-xl font-black text-amber-700">{pendingNextStepsCount}</span>
          <span className="text-[10px] text-slate-500 block">Ações Pendentes</span>
        </div>
      </div>

      {/* Top AI Strategy Copilot Hub */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl border border-purple-500/30 shadow-xl overflow-hidden transition-all">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setIsTopAiPanelOpen(!isTopAiPanelOpen)}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/40 rounded-xl border border-purple-400/40 text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-400/30">
                  IA Copilot do CRM
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Integrado ao Histórico
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Assistente de Inteligência & Estudo de Estratégias Comerciais
              </h3>
              <p className="text-xs text-purple-200/80 hidden sm:block">
                Analise objeções, gere pitches para reuniões, solicite minutas e registre os estudos no histórico com 1 clique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="bg-purple-600/50 hover:bg-purple-600 text-white p-2 rounded-xl text-xs font-bold transition-colors">
              {isTopAiPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {isTopAiPanelOpen && (
          <div className="p-5 pt-0 border-t border-purple-800/40 space-y-4 text-xs">
            
            {/* Municipality Target Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-purple-900/60">
              <div className="flex flex-wrap items-center gap-2">
                <Building className="w-4 h-4 text-purple-400" />
                <span className="font-extrabold text-slate-200">Município Alvo:</span>
                <select
                  value={topAiMuniId}
                  onChange={(e) => setTopAiMuniId(e.target.value)}
                  className="bg-slate-900 border border-purple-700/50 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.state}) — Concorrente: {m.currentSystem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleAskTopAi('Como estruturar a abordagem presencial para a Secretária de Educação?')}
                  className="bg-purple-950/80 hover:bg-purple-800/80 text-purple-200 font-bold px-2.5 py-1 rounded-lg border border-purple-700/50 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Lightbulb className="w-3 h-3 text-amber-300" />
                  <span>Abordagem Inicial</span>
                </button>
                <button
                  onClick={() => handleAskTopAi('Quais os melhores argumentos contra o concorrente atual do município?')}
                  className="bg-purple-950/80 hover:bg-purple-800/80 text-purple-200 font-bold px-2.5 py-1 rounded-lg border border-purple-700/50 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Swords className="w-3 h-3 text-red-400" />
                  <span>Rebater Concorrente</span>
                </button>
                <button
                  onClick={() => handleAskTopAi('Como fundamentar minuta de Adesão à Ata (ARP) ou Inexigibilidade?')}
                  className="bg-purple-950/80 hover:bg-purple-800/80 text-purple-200 font-bold px-2.5 py-1 rounded-lg border border-purple-700/50 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <FileText className="w-3 h-3 text-blue-400" />
                  <span>Minuta ARP/Inexigibilidade</span>
                </button>
              </div>
            </div>

            {/* Chat History Messages */}
            {topAiHistory.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-slate-950/80 rounded-xl border border-purple-900/60">
                {topAiHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl space-y-1.5 ${
                      m.sender === 'user'
                        ? 'bg-purple-600/80 text-white ml-auto max-w-[85%]'
                        : 'bg-slate-900/90 text-slate-100 border border-purple-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-purple-300 border-b border-purple-500/20 pb-1">
                      <span className="flex items-center gap-1">
                        {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-purple-400" />}
                        {m.sender === 'user' ? 'Vendedor / Campo' : 'Orientação IA Comercial'}
                      </span>
                      <span>{m.time}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-xs">
                      {m.text}
                    </div>

                    {m.sender === 'ai' && (
                      <div className="pt-2 border-t border-purple-800/30 flex items-center justify-between gap-2">
                        <button
                          onClick={() => copyToClipboard(m.text, `top-ai-${i}`)}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === `top-ai-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `top-ai-${i}` ? 'Copiado' : 'Copiar'}</span>
                        </button>

                        <button
                          onClick={() => handleSaveTopAiToCRM(m.text, topAiHistory[i - 1]?.text || 'Consulta Comercial IA')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 transition-all shadow-md active:scale-95"
                        >
                          <Database className="w-3 h-3" />
                          <span>➕ Gravar no Histórico do CRM</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite sua dúvida de estratégia (ex: O Secretário alegou falta de orçamento para este ano. O que responder?)"
                value={topAiQuestion}
                onChange={(e) => setTopAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskTopAi();
                  }
                }}
                className="flex-1 bg-slate-950 border border-purple-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              />
              <button
                onClick={() => handleAskTopAi()}
                disabled={isTopAiLoading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-purple-900/50 shrink-0 disabled:opacity-50 active:scale-95"
              >
                {isTopAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Analisar com IA</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Filtros do CRM Comercial</h3>
          </div>

          {(stateFilter || muniFilter || typeFilter || outcomeFilter || priorityFilter || searchTerm) && (
            <button
              onClick={() => {
                setStateFilter('');
                setMuniFilter('');
                setTypeFilter('');
                setOutcomeFilter('');
                setPriorityFilter('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Todos os Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Estado (UF)</label>
            <select
              value={stateFilter}
              onChange={(e) => handleStateFilterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Estados (UF)</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st === 'PI' ? 'Piauí (PI)' : st === 'MA' ? 'Maranhão (MA)' : st === 'CE' ? 'Ceará (CE)' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality Filter (Filtered by selected State!) */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Município / Prefeitura</label>
            <select
              value={muniFilter}
              onChange={(e) => setMuniFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {stateFilter ? `Todas as Prefeituras (${stateFilter})` : 'Todas as Prefeituras (Todos os UFs)'}
              </option>
              {stateFilteredMunicipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.state})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Level Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Prioridade de Visita</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Prioridades</option>
              <option value="maxima">⭐ Prioridade Máxima (Urgentíssimo)</option>
              <option value="muito_quente">🟢 Muito Quente (Agendar Visita)</option>
              <option value="quente">🟡 Quente (Agendar Reunião)</option>
              <option value="monitorar">🟠 Monitorar Contrato</option>
              <option value="baixa">🔴 Baixa Prioridade</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tipo de Interação</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Tipos</option>
              <option value="visita">🚗 Visita Presencial</option>
              <option value="ligacao">📞 Ligação Telefônica</option>
              <option value="reuniao_virtual">💻 Reunião Virtual</option>
              <option value="email">✉️ E-mail / Ofício</option>
              <option value="impugnacao">⚖️ Impugnação / Jurídico</option>
              <option value="proposta">📄 Proposta / Minuta ARP</option>
              <option value="esclarecimento">❓ Esclarecimento</option>
              <option value="outros">📌 Outros</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Resultado / Status</label>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Resultados</option>
              <option value="positivo">🟢 Avanço / Sucesso</option>
              <option value="neutro">🟡 Informativo</option>
              <option value="critico">🔴 Risco / Objeção</option>
              <option value="aguardando_retorno">⏳ Aguardando Retorno</option>
              <option value="deferido">✅ Deferido</option>
              <option value="indeferido">❌ Indeferido</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Busca por Palavra-Chave</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cidade, sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm gap-2">
        <button
          onClick={() => setActiveCrmTab('prioridades_visita')}
          className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeCrmTab === 'prioridades_visita'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>🚗 Rota de Visitas Prioritárias por Município</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            activeCrmTab === 'prioridades_visita' ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {rankedMunicipalities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCrmTab('historico_interacoes')}
          className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeCrmTab === 'historico_interacoes'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>📋 Histórico Temporal de Interações do CRM</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            activeCrmTab === 'historico_interacoes' ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredInteractions.length}
          </span>
        </button>
      </div>

      {/* CRM SUB-TAB 1: PRIORIDADE DE VISITAS POR MUNICÍPIO */}
      {activeCrmTab === 'prioridades_visita' && (
        <div className="space-y-4">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-blue-900/50 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Planejamento de Vendas & Rota de Campo</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Ranking Inteligente de Prioridade para Visitas Presenciais
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Os municípios estão listados rigorosamente em ordem de prioridade comercial (com base no Score IO, alunos, vencimento do contrato e concorrência). Use esta lista para orientar a equipe comercial em campo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="bg-purple-900/80 border border-purple-500/50 text-purple-200 px-3 py-1.5 rounded-xl">
                ⭐ {rankedMunicipalities.filter((r) => r.priorityLevel === 'maxima').length} Máxima Prioridade
              </span>
              <span className="bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl">
                🟢 {rankedMunicipalities.filter((r) => r.priorityLevel === 'muito_quente').length} Muito Quente
              </span>
              <span className="bg-amber-900/80 border border-amber-500/50 text-amber-200 px-3 py-1.5 rounded-xl">
                🟡 {rankedMunicipalities.filter((r) => r.priorityLevel === 'quente').length} Quente
              </span>
            </div>
          </div>

          {/* Ranked Municipality Cards */}
          {rankedMunicipalities.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <Building className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">Nenhum município encontrado para os filtros selecionados.</p>
              <button
                onClick={() => {
                  setStateFilter('');
                  setMuniFilter('');
                  setPriorityFilter('');
                  setSearchTerm('');
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rankedMunicipalities.map(({ m, scoreBreakdown, lastInteraction, visitCount, callCount, mInteractionsCount, priorityLevel, priorityMeta }, index) => {
                const rankNum = index + 1;
                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md space-y-4 ${
                      priorityLevel === 'maxima'
                        ? 'border-purple-300 ring-1 ring-purple-400/30 bg-gradient-to-r from-purple-50/30 via-white to-white'
                        : priorityLevel === 'muito_quente'
                        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/20 via-white to-white'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row: Rank, Title, Priority Badge & Score */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          rankNum === 1
                            ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/40 ring-2 ring-amber-300'
                            : rankNum === 2
                            ? 'bg-slate-300 text-slate-900 font-extrabold'
                            : rankNum === 3
                            ? 'bg-amber-800 text-amber-100 font-extrabold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          #{rankNum}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                              UF: {m.state}
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900">
                              Prefeitura de {m.name} ({m.state})
                            </h3>
                            <span className={`text-[10px] px-3 py-1 rounded-full border ${priorityMeta.badge}`}>
                              {priorityMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              Sistema Atual: <strong className="text-blue-900">{m.currentSystem}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Alunos: <strong className="text-slate-900">{m.studentCount.toLocaleString('pt-BR')}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Indicator */}
                      <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-inner">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score Comercial IO</div>
                          <div className="text-lg font-black text-amber-400 flex items-center gap-1">
                            <span>{scoreBreakdown.finalScore.toFixed(0)}</span>
                            <span className="text-xs text-slate-400 font-normal">/ 100 pts</span>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-500 uppercase">Vencimento do Contrato</span>
                        <span className={`font-extrabold ${m.contractExpirationDays <= 60 ? 'text-red-700 font-black' : 'text-slate-800'}`}>
                          {m.contractExpirationDays <= 0 ? 'Expirado / Licitação Próxima' : `${m.contractExpirationDays} dias restantes`}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-500 uppercase">Oportunidade Estimada</span>
                        <span className="font-extrabold text-emerald-700">
                          R$ {(m.estimatedNewContractValue / 1000).toFixed(0)}k
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-500 uppercase">Estágio no Funil</span>
                        <span className="font-extrabold text-slate-800 capitalize">
                          {m.funnelStage.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-500 uppercase">Histórico de Contatos</span>
                        <span className="font-bold text-slate-700">
                          🚗 {visitCount} visitas • 📞 {callCount} ligações ({mInteractionsCount} total)
                        </span>
                      </div>
                    </div>

                    {/* Last Interaction Log */}
                    <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Último Contato Registrado no CRM:</span>
                        </span>
                        {lastInteraction && (
                          <span className="text-[11px] text-amber-800">
                            {new Date(lastInteraction.date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {lastInteraction ? (
                        <p className="text-slate-800 font-medium">
                          <strong className="text-slate-900">[{lastInteraction.type.toUpperCase()}]</strong> {lastInteraction.summary} - <span className="text-slate-600">{lastInteraction.description.slice(0, 140)}...</span>
                        </p>
                      ) : (
                        <p className="text-slate-600 italic">Nenhum contato registrado recentemente. Recomendado realizar primeira visita comercial presencial.</p>
                      )}

                      {lastInteraction?.nextStep && (
                        <div className="pt-1.5 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-blue-900 font-bold">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Próximo Passo Agendado: {lastInteraction.nextStep}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Registrar Visita Presencial */}
                        <button
                          onClick={() => handleQuickRegisterVisit(m)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/20 active:scale-95"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>🚗 Registrar Visita Presencial</span>
                        </button>

                        {/* Registrar Ligação */}
                        <button
                          onClick={() => handleQuickRegisterCall(m)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/20 active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>📞 Registrar Ligação</span>
                        </button>

                        {/* Ver Histórico no CRM */}
                        <button
                          onClick={() => {
                            setMuniFilter(m.id);
                            setActiveCrmTab('historico_interacoes');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all border border-slate-200"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>📋 Ver Histórico ({mInteractionsCount})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Pitch com IA */}
                        <button
                          onClick={() => {
                            setTopAiMuniId(m.id);
                            setIsTopAiPanelOpen(true);
                            setTopAiQuestion(`Monte um roteiro de abordagem presencial e argumentos matadores para a visita comercial na Prefeitura de ${m.name} (${m.state}).`);
                            showToast(`Copilot IA configurado para ${m.name}!`);
                          }}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all border border-purple-300"
                        >
                          <Bot className="w-3.5 h-3.5 text-purple-700" />
                          <span>🤖 Pitch IA</span>
                        </button>

                        {/* Ficha de Inteligência */}
                        {onSelectMunicipality && onNavigateTab && (
                          <button
                            onClick={() => {
                              onSelectMunicipality(m);
                              onNavigateTab('intelligence');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>📄 Ficha Completa</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CRM SUB-TAB 2: HISTÓRICO TEMPORAL DE INTERAÇÕES */}
      {activeCrmTab === 'historico_interacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span>Exibindo histórico de interações com os filtros selecionados:</span>
            <strong className="text-slate-900 text-sm">{filteredInteractions.length} registros</strong>
          </div>

          <div className="space-y-4">
            {filteredInteractions.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm text-slate-600">Nenhuma interação encontrada para os filtros selecionados.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('');
                    setOutcomeFilter('');
                    setMuniFilter('');
                    setStateFilter('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              filteredInteractions.map((item) => {
            const meta = getTypeMeta(item.type);
            const Icon = meta.icon;
            const outcomeMeta = getOutcomeMeta(item.outcome);

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 relative group"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl border ${meta.bg} font-bold`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                          UF: {item.state}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Prefeitura de {item.municipalityName} ({item.state})
                        </h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{item.contactName}</strong> ({item.contactRole || 'Contato'})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outcome Badge & Deal Owner */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${outcomeMeta.color}`}>
                      {outcomeMeta.label}
                    </span>
                    {item.dealOwner && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        Resp: {item.dealOwner}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Summary */}
                <h4 className="font-bold text-sm text-slate-900">
                  {item.summary}
                </h4>

                {/* Description Body */}
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {item.description}
                </p>

                {/* Attachments if any */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-500">Anexo(s):</span>
                    {item.attachments.map((att, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                        {att}
                      </span>
                    ))}
                  </div>
                )}

                {/* Next Step / Action Item Box */}
                {item.nextStep && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900 gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong className="block font-extrabold text-[11px] text-amber-800 uppercase tracking-wider">
                          Próxima Ação de Follow-Up:
                        </strong>
                        <span className="text-slate-800 font-medium">{item.nextStep}</span>
                      </div>
                    </div>

                    {item.nextStepDueDate && (
                      <span className="bg-amber-200 text-amber-950 font-bold px-2.5 py-1 rounded-lg shrink-0 text-[11px]">
                        Data Limite: {item.nextStepDueDate}
                      </span>
                    )}
                  </div>
                )}

                {/* Card Actions Footer: Edit & Delete */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    ID: {item.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenInteractionAi(item)}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold px-3 py-1.5 rounded-lg border border-purple-200 transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
                      title="Estudar estratégia e obter orientação da IA para esta interação"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Estudar com IA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 active:scale-95"
                      title="Editar esta interação"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 active:scale-95"
                      title="Apagar do histórico de CRM"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
          </div>
        </div>
      )}

      {/* Modal: Registrar ou Editar Interação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700 font-extrabold text-base">
                {editingInteraction ? (
                  <Pencil className="w-5 h-5 text-blue-600" />
                ) : (
                  <Plus className="w-5 h-5 text-blue-600" />
                )}
                <span>{editingInteraction ? 'Editar Interação Comercial CRM' : 'Registrar Nova Interação Comercial CRM'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Municipality Select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Selecione a Prefeitura <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormMuniId('NEW_MUNI')}
                    className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Cadastrar Nova Prefeitura</span>
                  </button>
                </div>
                <select
                  value={formMuniId}
                  onChange={(e) => handleFormMuniChange(e.target.value)}
                  required
                  className={`w-full border rounded-lg p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formMuniId === 'NEW_MUNI'
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="NEW_MUNI" className="font-extrabold text-blue-700">
                    ➕ [ CADASTRAR NOVA PREFEITURA NÃO LISTADA ]
                  </option>
                  <optgroup label="Prefeituras Mapeadas no Radar">
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        Prefeitura de {m.name} ({m.state}) — Estágio: {m.funnelStage}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Sub-form when registering a BRAND NEW Municipality */}
              {formMuniId === 'NEW_MUNI' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4 rounded-xl border border-blue-200 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                    <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>Dados da Nova Prefeitura (Inclusão Rápida no CRM)</span>
                    </div>
                    <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
                      Integração Automática ao Radar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">
                        Nome do Município / Prefeitura <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Floriano ou Picos"
                        value={newMuniName}
                        onChange={(e) => setNewMuniName(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Estado (UF) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newMuniState}
                        onChange={(e) => setNewMuniState(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-2.5 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {['PI', 'MA', 'CE', 'PE', 'BA', 'PB', 'RN', 'AL', 'SE', 'TO', 'PA', 'MG', 'SP', 'RJ', 'GO', 'MT', 'MS', 'PR', 'SC', 'RS'].map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Estágio no Funil
                      </label>
                      <select
                        value={newMuniFunnelStage}
                        onChange={(e) => setNewMuniFunnelStage(e.target.value as any)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-2 text-slate-800 font-semibold"
                      >
                        <option value="prospectado">1. Prospecção Inicial</option>
                        <option value="primeiro_contato">2. Primeiro Contato Feito</option>
                        <option value="reuniao">3. Reunião Agendada</option>
                        <option value="demonstracao">4. Demonstração / Piloto</option>
                        <option value="projeto_apresentado">5. Projeto Apresentado</option>
                        <option value="processo_licitatorio">6. Processo Licitatório</option>
                        <option value="homologacao">7. Homologação / Vencido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Alunos Estimados
                      </label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={newMuniStudents}
                        onChange={(e) => setNewMuniStudents(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-2 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Telefone de Contato
                      </label>
                      <input
                        type="text"
                        placeholder="(86) 99999-0000"
                        value={newMuniPhone}
                        onChange={(e) => setNewMuniPhone(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-2 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Interaction Type Selection (Pills) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Tipo de Interação <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ligacao', label: '📞 Ligação' },
                    { id: 'visita', label: '🚗 Visita Presencial' },
                    { id: 'email', label: '✉️ E-mail / Ofício' },
                    { id: 'reuniao_virtual', label: '💻 Reunião Virtual' },
                    { id: 'impugnacao', label: '⚖️ Impugnação' },
                    { id: 'esclarecimento', label: '❓ Esclarecimento' },
                    { id: 'proposta', label: '📄 Proposta' },
                    { id: 'adesao_ata', label: '🤝 Adesão à Ata' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id as any)}
                      className={`p-2.5 rounded-lg font-bold transition-all text-left border ${
                        formType === t.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nome do Contato na Prefeitura <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Profa. Maria das Graças"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Cargo / Função do Contato
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Secretária de Educação / Pregoeiro CPL"
                    value={formContactRole}
                    onChange={(e) => setFormContactRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Data e Hora da Interação
                  </label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Executivo Responsável
                  </label>
                  <input
                    type="text"
                    value={formDealOwner}
                    onChange={(e) => setFormDealOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Summary / Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Título Resumido / Assunto Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apresentação do Diário Offline / Protocolo de Impugnação PE 009"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Relatório Detalhado da Interação
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva os detalhes combinados, pontos discutidos, objeções levantadas e percepções da reunião..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Outcome Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Resultado / Percepção Comercial
                </label>
                <select
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="positivo">🟢 Avanço / Sucesso na Reunião</option>
                  <option value="neutro">🟡 Informativo / Em Andamento</option>
                  <option value="critico">🔴 Risco / Objeção Forte do Cliente</option>
                  <option value="aguardando_retorno">⏳ Aguardando Retorno da Prefeitura</option>
                  <option value="deferido">✅ Deferido (Impugnação / Esclarecimento Aprovado)</option>
                  <option value="indeferido">❌ Indeferido</option>
                </select>
              </div>

              {/* Next Step Follow Up */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-amber-900">
                      Próxima Ação / Follow-up Combinado
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestNextStepInForm}
                      disabled={isSuggestingNextStep}
                      className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1 shrink-0"
                    >
                      {isSuggestingNextStep ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-700" />}
                      <span>Sugerir com IA</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Enviar minuta de Termo de Referência em 3 dias"
                    value={formNextStep}
                    onChange={(e) => setFormNextStep(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">
                    Data Limite
                  </label>
                  <input
                    type="date"
                    value={formNextStepDueDate}
                    onChange={(e) => setFormNextStepDueDate(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  {editingInteraction ? 'Salvar Alterações no CRM' : 'Salvar Interação no CRM'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal/Drawer: Estudo de Estratégia IA para Interação Específica */}
      {selectedInteractionForAi && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-purple-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-900 font-black text-base">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">Estudo de Estratégia da Interação</h3>
                  <p className="text-xs text-slate-500 font-normal">
                    {selectedInteractionForAi.municipalityName} ({selectedInteractionForAi.state}) — {selectedInteractionForAi.contactName} ({selectedInteractionForAi.contactRole})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInteractionForAi(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interaction Context Summary Card */}
            <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-purple-900">
                <span className="uppercase text-[10px] tracking-wider text-purple-600 block">DADOS DO CONTATO / EVENTO</span>
                <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px] font-extrabold">
                  {selectedInteractionForAi.type.toUpperCase()} | {selectedInteractionForAi.outcome.toUpperCase()}
                </span>
              </div>
              <p className="font-extrabold text-slate-900 text-sm">{selectedInteractionForAi.summary}</p>
              <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-purple-100 whitespace-pre-wrap">
                {selectedInteractionForAi.description}
              </p>
            </div>

            {/* Suggested Strategy Quick Action Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">AÇÕES RÁPIDAS DE ESTRATÉGIA COM IA</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleAskInteractionAi('Como contornar a objeção ou desafio relatado nesta interação?')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Contornar Objeção</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAskInteractionAi('Elabore um e-mail formal de acompanhamento para este contato com base no relato acima.')}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gerar E-mail de Follow-up</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAskInteractionAi('Qual deve ser a próxima ação estratégica imbatível para garantir o avanço do processo?')}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sugerir Próximo Passo</span>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {interactionAiHistory.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {interactionAiHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl space-y-1.5 ${
                      m.sender === 'user'
                        ? 'bg-purple-600 text-white ml-auto max-w-[85%]'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-80 border-b border-current pb-1">
                      <span>{m.sender === 'user' ? '👤 Pergunta do Vendedor' : '🤖 Orientação Estratégica IA'}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                    {m.sender === 'ai' && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleAttachAiToCurrentInteraction(m.text)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Anexar a este Registro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetNextStepFromAi(m.text)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Definir como Próximo Passo CRM</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pergunte algo específico sobre este contato ou evento..."
                value={interactionAiQuestion}
                onChange={(e) => setInteractionAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskInteractionAi();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAskInteractionAi()}
                disabled={isInteractionAiLoading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                {isInteractionAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Perguntar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Excluir Registro do CRM</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Tem certeza de que deseja remover permanentemente esta interação do histórico de CRM do município?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Sim, Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
