import React, { useState, useEffect } from 'react';
import { 
  MOCK_MUNICIPALITIES, 
  MOCK_TENDERS, 
  MOCK_ALERTS, 
  MOCK_COMPETITORS,
  MOCK_CRM_INTERACTIONS
} from './data/mockData';
import { Municipality, TenderNotice, CommercialAlert, FunnelStage, CRMInteraction, CompetitorItem } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TenderRadarView } from './components/TenderRadarView';
import { MunicipalityIntelligenceView } from './components/MunicipalityIntelligenceView';
import { AlertsView } from './components/AlertsView';
import { AICommercialAgentView } from './components/AICommercialAgentView';
import { SalesFunnelView } from './components/SalesFunnelView';
import { CRMInteractionsView } from './components/CRMInteractionsView';
import { CompetitorRadarView } from './components/CompetitorRadarView';
import { IOScoreCalculatorView } from './components/IOScoreCalculatorView';
import { EducationalCockpitBridge } from './components/EducationalCockpitBridge';
import { FieldVisitsView } from './components/FieldVisitsView';
import { DossierExportModal } from './components/DossierExportModal';
import { SicapRadarCrmEnricherModal } from './components/SicapRadarCrmEnricherModal';
import { AICitySearchModal } from './components/AICitySearchModal';
import { SelectedCityBar } from './components/SelectedCityBar';
import { 
  subscribeToMunicipalities, 
  subscribeToInteractions, 
  saveMunicipalityToFirebase, 
  saveInteractionToFirebase 
} from './services/firebaseService';

function deduplicateMunicipalities(list: Municipality[]): Municipality[] {
  const map = new Map<string, Municipality>();
  const nameStateSet = new Set<string>();
  list.forEach((m) => {
    if (m && m.id && m.name && m.state) {
      const nameKey = `${m.name.trim().toLowerCase()}-${m.state.trim().toLowerCase()}`;
      if (!map.has(m.id) && !nameStateSet.has(nameKey)) {
        map.set(m.id, m);
        nameStateSet.add(nameKey);
      }
    }
  });
  return Array.from(map.values());
}

function deduplicateInteractions(list: CRMInteraction[]): CRMInteraction[] {
  const map = new Map<string, CRMInteraction>();
  list.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('field_visits');
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  // App persistent state with Firebase Cloud & LocalStorage fallback
  const [municipalities, setMunicipalities] = useState<Municipality[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_municipalities_v2');
      const raw = saved ? JSON.parse(saved) : MOCK_MUNICIPALITIES;
      return deduplicateMunicipalities(raw);
    } catch (e) {
      return deduplicateMunicipalities(MOCK_MUNICIPALITIES);
    }
  });

  const [tenders, setTenders] = useState<TenderNotice[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_tenders_v2');
      return saved ? JSON.parse(saved) : MOCK_TENDERS;
    } catch (e) {
      return MOCK_TENDERS;
    }
  });

  const [alerts, setAlerts] = useState<CommercialAlert[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_alerts_v2');
      return saved ? JSON.parse(saved) : MOCK_ALERTS;
    } catch (e) {
      return MOCK_ALERTS;
    }
  });

  const [crmInteractions, setCrmInteractions] = useState<CRMInteraction[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_crm_interactions_v2');
      const raw = saved ? JSON.parse(saved) : MOCK_CRM_INTERACTIONS;
      return deduplicateInteractions(raw);
    } catch (e) {
      return deduplicateInteractions(MOCK_CRM_INTERACTIONS);
    }
  });

  const [competitors, setCompetitors] = useState<CompetitorItem[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_competitors_v1');
      return saved ? JSON.parse(saved) : MOCK_COMPETITORS;
    } catch (e) {
      return MOCK_COMPETITORS;
    }
  });

  // Real-time synchronization with Firebase Cloud Firestore
  useEffect(() => {
    const unsubMunicipalities = subscribeToMunicipalities(
      (data) => {
        if (data && data.length > 0) {
          setMunicipalities(deduplicateMunicipalities(data));
          setFirebaseStatus('connected');
        }
      },
      () => setFirebaseStatus('error')
    );

    const unsubInteractions = subscribeToInteractions(
      (data) => {
        if (data && data.length > 0) {
          setCrmInteractions(deduplicateInteractions(data));
          setFirebaseStatus('connected');
        }
      },
      () => setFirebaseStatus('error')
    );

    return () => {
      unsubMunicipalities();
      unsubInteractions();
    };
  }, []);

  // Automatic state persistence to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('sicap_municipalities_v2', JSON.stringify(municipalities));
    } catch (e) {
      console.error('Error saving municipalities to localStorage', e);
    }
  }, [municipalities]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sicap_crm_interactions_v2', JSON.stringify(crmInteractions));
    } catch (e) {
      console.error('Error saving crmInteractions to localStorage', e);
    }
  }, [crmInteractions]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sicap_competitors_v1', JSON.stringify(competitors));
    } catch (e) {
      console.error('Error saving competitors to localStorage', e);
    }
  }, [competitors]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sicap_tenders_v2', JSON.stringify(tenders));
    } catch (e) {
      console.error('Error saving tenders to localStorage', e);
    }
  }, [tenders]);

  React.useEffect(() => {
    try {
      localStorage.setItem('sicap_alerts_v2', JSON.stringify(alerts));
    } catch (e) {
      console.error('Error saving alerts to localStorage', e);
    }
  }, [alerts]);

  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(municipalities[0] || null);

  // Keep selectedMunicipality in sync when municipalities list updates
  useEffect(() => {
    if (selectedMunicipality) {
      const updatedMatch = municipalities.find((m) => m.id === selectedMunicipality.id);
      if (updatedMatch) setSelectedMunicipality(updatedMatch);
    } else if (municipalities.length > 0) {
      setSelectedMunicipality(municipalities[0]);
    }
  }, [municipalities]);

  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRadarEnricherModal, setShowRadarEnricherModal] = useState<boolean>(false);
  const [showCitySearchModal, setShowCitySearchModal] = useState<boolean>(false);

  const handleUpdateMunicipality = (updated: Municipality) => {
    setMunicipalities((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    if (selectedMunicipality?.id === updated.id) {
      setSelectedMunicipality(updated);
    }
    // Update municipalityName and state on all CRM interactions linked to this municipality ID
    setCrmInteractions((prev) =>
      prev.map((i) =>
        i.municipalityId === updated.id
          ? { ...i, municipalityName: updated.name, state: updated.state }
          : i
      )
    );
    // Save to Firebase Cloud
    saveMunicipalityToFirebase(updated);
  };

  // Handlers
  const handleSelectMunicipality = (m: Municipality) => {
    setSelectedMunicipality(m);
  };

  const handleUpdateFunnelStage = (municipalityId: string, newStage: FunnelStage) => {
    const muni = municipalities.find((m) => m.id === municipalityId);
    if (muni) {
      const updatedMuni = { ...muni, funnelStage: newStage };
      handleUpdateMunicipality(updatedMuni);
    }
  };

  const handleOpenAIForMuni = (m: Municipality) => {
    setSelectedMunicipality(m);
    setActiveTab('ai_agent');
  };

  const handleAddCRMInteraction = (newInteraction: CRMInteraction) => {
    setCrmInteractions((prev) => [newInteraction, ...prev]);
    // Save to Firebase Cloud
    saveInteractionToFirebase(newInteraction);
  };

  const handleEditCRMInteraction = (updatedInteraction: CRMInteraction) => {
    setCrmInteractions((prev) =>
      prev.map((item) => (item.id === updatedInteraction.id ? updatedInteraction : item))
    );

    // If municipalityId exists, update the corresponding municipality's name and state as well
    if (updatedInteraction.municipalityId) {
      setMunicipalities((prev) =>
        prev.map((m) =>
          m.id === updatedInteraction.municipalityId
            ? { ...m, name: updatedInteraction.municipalityName, state: updatedInteraction.state }
            : m
        )
      );
      if (selectedMunicipality?.id === updatedInteraction.municipalityId) {
        setSelectedMunicipality((prev) =>
          prev ? { ...prev, name: updatedInteraction.municipalityName, state: updatedInteraction.state } : null
        );
      }
      // Update all other interactions for this municipality
      setCrmInteractions((prev) =>
        prev.map((i) =>
          i.municipalityId === updatedInteraction.municipalityId
            ? { ...i, municipalityName: updatedInteraction.municipalityName, state: updatedInteraction.state }
            : i
        )
      );
    }

    // Save to Firebase Cloud
    saveInteractionToFirebase(updatedInteraction);
  };

  const handleDeleteCRMInteraction = (id: string) => {
    setCrmInteractions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddMunicipality = (newMuni: Municipality) => {
    const normNewName = newMuni.name.trim().toLowerCase();
    const normNewState = newMuni.state.trim().toLowerCase();

    // Check if city already exists in current dataset (by ID or normalized name+state)
    const existingIndex = municipalities.findIndex(
      (m) =>
        m.id === newMuni.id ||
        (m.name.trim().toLowerCase() === normNewName &&
          m.state.trim().toLowerCase() === normNewState)
    );

    let finalMuniToSave: Municipality;

    if (existingIndex >= 0) {
      const existing = municipalities[existingIndex];

      // Combine buyingHistory without duplicate entries
      const combinedHistory = [...(existing.buyingHistory || [])];
      if (newMuni.buyingHistory) {
        newMuni.buyingHistory.forEach((bh) => {
          const isDupBH = combinedHistory.some(
            (item) => item.year === bh.year && item.company === bh.company
          );
          if (!isDupBH) {
            combinedHistory.push(bh);
          }
        });
      }

      // Combine keyContacts without duplicate names
      const combinedContacts = [...(existing.keyContacts || [])];
      if (newMuni.keyContacts) {
        newMuni.keyContacts.forEach((kc) => {
          const isDupKC = combinedContacts.some(
            (c) => c.name.trim().toLowerCase() === kc.name.trim().toLowerCase()
          );
          if (!isDupKC) {
            combinedContacts.push(kc);
          }
        });
      }

      // Append IA query note to existing notes with date
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const updateNote = `\n[Consulta/Atualização IA em ${todayStr}]: Score IO ${newMuni.ioScore}/100. Sistema: ${newMuni.currentSystem}. Valor: R$ ${(newMuni.currentContractValue || 0).toLocaleString('pt-BR')}.`;
      const updatedNotes = existing.notes
        ? existing.notes.includes(updateNote.trim()) ? existing.notes : `${existing.notes}${updateNote}`
        : newMuni.notes || `Consulta IA realizada em ${todayStr}`;

      finalMuniToSave = {
        ...existing, // Preserves canonical ID, funnelStage, dealOwner
        population: newMuni.population || existing.population,
        currentSystem: newMuni.currentSystem || existing.currentSystem,
        currentContractValue: newMuni.currentContractValue || existing.currentContractValue,
        contractDaysRemaining: newMuni.contractDaysRemaining || existing.contractDaysRemaining,
        renewalProbability: newMuni.renewalProbability || existing.renewalProbability,
        tenderProbability: newMuni.tenderProbability || existing.tenderProbability,
        estimatedNewContractValue: newMuni.estimatedNewContractValue || existing.estimatedNewContractValue,
        probableModality: newMuni.probableModality || existing.probableModality,
        ioScore: newMuni.ioScore || existing.ioScore,
        ioFactors: newMuni.ioFactors || existing.ioFactors,
        educationalMetrics: {
          ...existing.educationalMetrics,
          ...newMuni.educationalMetrics,
          mainPains: Array.from(
            new Set([
              ...(existing.educationalMetrics?.mainPains || []),
              ...(newMuni.educationalMetrics?.mainPains || []),
            ])
          ),
        },
        keyContacts: combinedContacts,
        buyingHistory: combinedHistory,
        lastActivityDate: new Date().toISOString().slice(0, 10),
        notes: updatedNotes,
      };

      setMunicipalities((prev) => {
        const copy = [...prev];
        copy[existingIndex] = finalMuniToSave;
        return deduplicateMunicipalities(copy);
      });
    } else {
      // Clean normalized ID for brand new city
      const cleanId = `mun-${normNewName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${normNewState}`;
      finalMuniToSave = {
        ...newMuni,
        id: newMuni.id || cleanId,
      };

      setMunicipalities((prev) => deduplicateMunicipalities([finalMuniToSave, ...prev]));
    }

    setSelectedMunicipality(finalMuniToSave);

    // Save to Firebase Cloud
    saveMunicipalityToFirebase(finalMuniToSave);

    // Create an automatic CRM Interaction to increment the historical activity log!
    const todayIso = new Date().toISOString().slice(0, 10);
    const consultationInteraction: CRMInteraction = {
      id: `int-ia-${finalMuniToSave.id}-${Date.now()}`,
      municipalityId: finalMuniToSave.id,
      municipalityName: finalMuniToSave.name,
      state: finalMuniToSave.state,
      date: todayIso,
      type: 'analise_estrategica_ia',
      contactName: finalMuniToSave.keyContacts?.[0]?.name || 'Secretaria de Educação',
      contactRole: finalMuniToSave.keyContacts?.[0]?.role || 'Gestão Escolar',
      summary: `Consulta de Inteligência Comercial IA (${new Date().toLocaleDateString('pt-BR')})`,
      description: `Consulta/Diagnóstico de inteligência comercial realizado via Radar SICAP. Score IO: ${finalMuniToSave.ioScore}/100. Sistema concorrente: ${finalMuniToSave.currentSystem}. Valor estimado: R$ ${(finalMuniToSave.currentContractValue || 0).toLocaleString('pt-BR')}. Dores mapeadas: ${finalMuniToSave.educationalMetrics?.mainPains?.join('; ') || 'Geral'}.`,
      outcome: 'positivo',
      nextStep: 'Analisar plano de abordagem com Secretário(a) e equipe pedagógica',
      dealOwner: finalMuniToSave.dealOwner || 'José Badotti',
    };

    handleAddCRMInteraction(consultationInteraction);
  };

  const handleOpenCRMForMuni = (m: Municipality) => {
    setSelectedMunicipality(m);
    setActiveTab('crm');
  };

  const handleAddCompetitor = (newCompetitor: CompetitorItem) => {
    setCompetitors((prev) => [newCompetitor, ...prev]);
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
  };

  const handleOpenTenderDetail = (tender: TenderNotice) => {
    const m = municipalities.find((item) => item.id === tender.municipalityId);
    if (m) setSelectedMunicipality(m);
    setActiveTab('intelligence');
  };

  const handleNavigateTenderToAI = (tender: TenderNotice) => {
    const m = municipalities.find((item) => item.id === tender.municipalityId);
    if (m) setSelectedMunicipality(m);
    setActiveTab('ai_agent');
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden w-full">
      
      {/* Top Main Navigation Header */}
      <Navbar
        municipalities={municipalities}
        tenders={tenders}
        alerts={alerts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenGlobalReport={() => setShowExportModal(true)}
        onOpenAlertsModal={() => setActiveTab('alerts')}
        onOpenRadarEnricher={() => setShowRadarEnricherModal(true)}
        onOpenCitySearch={() => setShowCitySearchModal(true)}
      />

      {/* Main Layout: Left Sidebar + Right Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1700px] w-full mx-auto min-w-0">
        
        {/* Module Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Dynamic Main Workspace View - Single Scroll Container */}
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 min-w-0 max-w-full w-full">
          
          {/* Active City 360º Commercial Context & Navigation Bar */}
          <SelectedCityBar
            municipalities={municipalities}
            crmInteractions={crmInteractions}
            selectedMunicipality={selectedMunicipality}
            onSelectMunicipality={handleSelectMunicipality}
            onUpdateMunicipality={handleUpdateMunicipality}
            activeTab={activeTab}
            onNavigateTab={setActiveTab}
            onOpenExportModal={() => setShowExportModal(true)}
            onOpenEnricherModal={() => setShowRadarEnricherModal(true)}
          />

          {activeTab === 'field_visits' && (
            <FieldVisitsView
              municipalities={municipalities}
              crmInteractions={crmInteractions}
              onAddCRMInteraction={handleAddCRMInteraction}
              onEditCRMInteraction={handleEditCRMInteraction}
              onDeleteCRMInteraction={handleDeleteCRMInteraction}
              onUpdateMunicipality={handleUpdateMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onAddMunicipality={handleAddMunicipality}
              selectedMunicipality={selectedMunicipality}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              municipalities={municipalities}
              tenders={tenders}
              alerts={alerts}
              competitors={competitors}
              onAddCompetitor={handleAddCompetitor}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              selectedStateFilter={selectedStateFilter}
              onStateFilterChange={setSelectedStateFilter}
              onNavigateTab={setActiveTab}
              onOpenAISystem={handleOpenAIForMuni}
              onMarkAsReadAlert={handleMarkAlertAsRead}
              onOpenTenderDetail={handleOpenTenderDetail}
              onNavigateTenderToAI={handleNavigateTenderToAI}
            />
          )}

          {(activeTab === 'tenders' || activeTab === 'alerts') && (
            <TenderRadarView
              tenders={tenders}
              alerts={alerts}
              municipalities={municipalities}
              initialSubTab={activeTab === 'alerts' ? 'alerts' : 'tenders'}
              onSelectMunicipality={handleSelectMunicipality}
              onOpenAIStrategy={handleOpenAIForMuni}
              onMarkAsReadAlert={handleMarkAlertAsRead}
              onOpenTenderDetail={handleOpenTenderDetail}
              onNavigateToAI={handleNavigateTenderToAI}
            />
          )}

          {(activeTab === 'intelligence' || activeTab === 'cockpit' || activeTab === 'io_score' || activeTab === 'competitors') && (
            <MunicipalityIntelligenceView
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onUpdateMunicipality={handleUpdateMunicipality}
              onGenerateAIStrategy={handleOpenAIForMuni}
              crmInteractions={crmInteractions}
              onOpenCRM={handleOpenCRMForMuni}
              initialSubTab={activeTab}
              competitors={competitors}
              onAddCompetitor={handleAddCompetitor}
            />
          )}

          {activeTab === 'ai_agent' && (
            <AICommercialAgentView
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onAddCRMInteraction={handleAddCRMInteraction}
              onNavigateToCRM={() => setActiveTab('crm')}
            />
          )}

          {(activeTab === 'funnel' || activeTab === 'crm') && (
            <SalesFunnelView
              municipalities={municipalities}
              crmInteractions={crmInteractions}
              initialSubTab={activeTab === 'crm' ? 'crm' : 'kanban'}
              onUpdateFunnelStage={handleUpdateFunnelStage}
              onSelectMunicipality={(m) => {
                setSelectedMunicipality(m);
                setActiveTab('intelligence');
              }}
              onAddCRMInteraction={handleAddCRMInteraction}
              onEditCRMInteraction={handleEditCRMInteraction}
              onDeleteCRMInteraction={handleDeleteCRMInteraction}
              onAddMunicipality={handleAddMunicipality}
              onUpdateMunicipality={handleUpdateMunicipality}
              selectedMunicipality={selectedMunicipality}
              onNavigateTab={setActiveTab}
              onOpenAIForMuni={handleOpenAIForMuni}
              competitors={competitors}
              onAddCompetitor={handleAddCompetitor}
            />
          )}

        </main>
      </div>

      {/* Printable / Downloadable Commercial Dossier Modal */}
      {showExportModal && selectedMunicipality && (
        <DossierExportModal
          municipality={selectedMunicipality}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* SICAP RADAR CRM Auto-Enricher Modal */}
      <SicapRadarCrmEnricherModal
        isOpen={showRadarEnricherModal}
        onClose={() => setShowRadarEnricherModal(false)}
        municipalities={municipalities}
        onUpdateMunicipality={handleUpdateMunicipality}
        selectedMunicipalityId={selectedMunicipality?.id}
      />

      {/* AI City Search & Analyzer Modal */}
      <AICitySearchModal
        isOpen={showCitySearchModal}
        onClose={() => setShowCitySearchModal(false)}
        existingMunicipalities={municipalities}
        onAddMunicipality={(newMuni) => {
          handleAddMunicipality(newMuni);
          setActiveTab('field_visits');
        }}
        initialCityName={searchQuery || 'Codó'}
        initialState="MA"
      />

    </div>
  );
}
