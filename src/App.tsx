import React, { useState } from 'react';
import { 
  MOCK_MUNICIPALITIES, 
  MOCK_TENDERS, 
  MOCK_ALERTS, 
  MOCK_COMPETITORS,
  MOCK_CRM_INTERACTIONS
} from './data/mockData';
import { Municipality, TenderNotice, CommercialAlert, FunnelStage, CRMInteraction } from './types';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('field_visits');
  
  // App persistent state with localStorage synchronization
  const [municipalities, setMunicipalities] = useState<Municipality[]>(() => {
    try {
      const saved = localStorage.getItem('sicap_municipalities_v2');
      return saved ? JSON.parse(saved) : MOCK_MUNICIPALITIES;
    } catch (e) {
      return MOCK_MUNICIPALITIES;
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
      return saved ? JSON.parse(saved) : MOCK_CRM_INTERACTIONS;
    } catch (e) {
      return MOCK_CRM_INTERACTIONS;
    }
  });

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
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRadarEnricherModal, setShowRadarEnricherModal] = useState<boolean>(false);
  const [showCitySearchModal, setShowCitySearchModal] = useState<boolean>(false);
  const [selectedTenderDetail, setSelectedTenderDetail] = useState<TenderNotice | null>(null);

  const handleUpdateMunicipality = (updated: Municipality) => {
    setMunicipalities((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    if (selectedMunicipality?.id === updated.id) {
      setSelectedMunicipality(updated);
    }
  };

  // Handlers
  const handleSelectMunicipality = (m: Municipality) => {
    setSelectedMunicipality(m);
  };

  const handleUpdateFunnelStage = (municipalityId: string, newStage: FunnelStage) => {
    setMunicipalities((prev) =>
      prev.map((m) => (m.id === municipalityId ? { ...m, funnelStage: newStage } : m))
    );
  };

  const handleOpenAIForMuni = (m: Municipality) => {
    setSelectedMunicipality(m);
    setActiveTab('ai_agent');
  };

  const handleAddCRMInteraction = (newInteraction: CRMInteraction) => {
    setCrmInteractions((prev) => [newInteraction, ...prev]);
  };

  const handleEditCRMInteraction = (updatedInteraction: CRMInteraction) => {
    setCrmInteractions((prev) =>
      prev.map((item) => (item.id === updatedInteraction.id ? updatedInteraction : item))
    );
  };

  const handleDeleteCRMInteraction = (id: string) => {
    setCrmInteractions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddMunicipality = (newMuni: Municipality) => {
    setMunicipalities((prev) => [newMuni, ...prev]);
    setSelectedMunicipality(newMuni);
  };

  const handleOpenCRMForMuni = (m: Municipality) => {
    setSelectedMunicipality(m);
    setActiveTab('crm');
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      
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

      {/* Main Full Height Layout: Left Sidebar + Right Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1700px] w-full mx-auto">
        
        {/* Module Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          
          {activeTab === 'field_visits' && (
            <FieldVisitsView
              municipalities={municipalities}
              crmInteractions={crmInteractions}
              onAddCRMInteraction={handleAddCRMInteraction}
              onUpdateFunnelStage={handleUpdateFunnelStage}
              onSelectMunicipality={handleSelectMunicipality}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onAddMunicipality={handleAddMunicipality}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              municipalities={municipalities}
              tenders={tenders}
              alerts={alerts}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              selectedStateFilter={selectedStateFilter}
              onStateFilterChange={setSelectedStateFilter}
              onNavigateTab={setActiveTab}
              onOpenAISystem={handleOpenAIForMuni}
            />
          )}

          {activeTab === 'tenders' && (
            <TenderRadarView
              tenders={tenders}
              onOpenTenderDetail={(tender) => {
                const m = municipalities.find((item) => item.id === tender.municipalityId);
                if (m) setSelectedMunicipality(m);
                setActiveTab('intelligence');
              }}
              onNavigateToAI={(tender) => {
                const m = municipalities.find((item) => item.id === tender.municipalityId);
                if (m) setSelectedMunicipality(m);
                setActiveTab('ai_agent');
              }}
            />
          )}

          {activeTab === 'intelligence' && (
            <MunicipalityIntelligenceView
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onGenerateAIStrategy={handleOpenAIForMuni}
              crmInteractions={crmInteractions}
              onOpenCRM={handleOpenCRMForMuni}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              alerts={alerts}
              municipalities={municipalities}
              onSelectMunicipality={(m) => {
                setSelectedMunicipality(m);
                setActiveTab('intelligence');
              }}
              onOpenAIStrategy={handleOpenAIForMuni}
              onMarkAsRead={(alertId) => {
                setAlerts((prev) =>
                  prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
                );
              }}
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

          {activeTab === 'funnel' && (
            <SalesFunnelView
              municipalities={municipalities}
              crmInteractions={crmInteractions}
              onUpdateFunnelStage={handleUpdateFunnelStage}
              onSelectMunicipality={(m) => {
                setSelectedMunicipality(m);
                setActiveTab('intelligence');
              }}
              onAddCRMInteraction={handleAddCRMInteraction}
              onEditCRMInteraction={handleEditCRMInteraction}
              onDeleteCRMInteraction={handleDeleteCRMInteraction}
              onNavigateTab={setActiveTab}
              onOpenAIForMuni={handleOpenAIForMuni}
            />
          )}

          {activeTab === 'crm' && (
            <CRMInteractionsView
              interactions={crmInteractions}
              municipalities={municipalities}
              onAddInteraction={handleAddCRMInteraction}
              onEditInteraction={handleEditCRMInteraction}
              onDeleteInteraction={handleDeleteCRMInteraction}
              onAddMunicipality={handleAddMunicipality}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'competitors' && (
            <CompetitorRadarView
              competitors={MOCK_COMPETITORS}
            />
          )}

          {activeTab === 'io_score' && (
            <IOScoreCalculatorView
              municipalities={municipalities}
              onSelectMunicipality={(m) => {
                setSelectedMunicipality(m);
                setActiveTab('intelligence');
              }}
            />
          )}

          {activeTab === 'cockpit' && (
            <EducationalCockpitBridge
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={handleSelectMunicipality}
              onGenerateAIStrategy={handleOpenAIForMuni}
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
        onAddMunicipality={(newMuni) => {
          handleAddMunicipality(newMuni);
          setSelectedMunicipality(newMuni);
          setActiveTab('field_visits');
        }}
        initialCityName={searchQuery || 'Codó'}
        initialState="MA"
      />

    </div>
  );
}
