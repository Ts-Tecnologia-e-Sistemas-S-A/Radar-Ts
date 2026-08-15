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
import { MobileScrollNav } from './components/MobileScrollNav';
import { DossierExportModal } from './components/DossierExportModal';
import { SicapRadarCrmEnricherModal } from './components/SicapRadarCrmEnricherModal';
import { AICitySearchModal } from './components/AICitySearchModal';
import { DataBackupModal } from './components/DataBackupModal';
import { SelectedCityBar } from './components/SelectedCityBar';
import { 
  subscribeToMunicipalities, 
  subscribeToInteractions, 
  saveMunicipalityToFirebase, 
  saveInteractionToFirebase,
  deleteInteractionFromFirebase 
} from './services/firebaseService';
import {
  enqueuePendingSync,
  processAutoSaveQueue,
  auditAndEnqueueUnsyncedItems,
  getPendingQueue
} from './services/autoSaveService';

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

  // Real-time synchronization with Firebase Cloud Firestore (Safe Merge to prevent data loss)
  useEffect(() => {
    const unsubMunicipalities = subscribeToMunicipalities(
      (firestoreData) => {
        if (firestoreData) {
          setMunicipalities((prev) => {
            const map = new Map<string, Municipality>();
            // Keep existing local state first
            prev.forEach((m) => {
              if (m && m.id) map.set(m.id, m);
            });
            // Merge incoming Cloud Firestore data
            firestoreData.forEach((m) => {
              if (m && m.id) map.set(m.id, m);
            });
            return deduplicateMunicipalities(Array.from(map.values()));
          });
          setFirebaseStatus('connected');
        }
      },
      () => setFirebaseStatus('error')
    );

    const unsubInteractions = subscribeToInteractions(
      (firestoreData) => {
        if (firestoreData) {
          setCrmInteractions((prev) => {
            const map = new Map<string, CRMInteraction>();
            // Keep existing local state first so newly registered visits are never wiped
            prev.forEach((item) => {
              if (item && item.id) map.set(item.id, item);
            });
            // Merge incoming Cloud Firestore data
            firestoreData.forEach((item) => {
              if (item && item.id) map.set(item.id, item);
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return merged;
          });
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
  
  // Auto-Save & Offline Queue State
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingData, setIsSyncingData] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // Trigger manual or automatic background sync
  const triggerAutoSaveSync = async () => {
    if (isSyncingData) return;
    setIsSyncingData(true);

    try {
      // First audit local state to catch any unsynced items
      auditAndEnqueueUnsyncedItems(municipalities, crmInteractions);
      
      const res = await processAutoSaveQueue();
      setPendingSyncCount(res.remainingCount);

      if (res.syncedCount > 0) {
        setLastSyncTime(new Date());
        showToast(`☁️ Auto-Save: ${res.syncedCount} registro(s) sincronizado(s) com o Firestore!`);
      }
    } catch (err) {
      console.error('Auto-save sync error:', err);
    } finally {
      setIsSyncingData(false);
    }
  };

  // Listen for online/offline events & background auto-save loop
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 Conexão restabelecida! Iniciando sincronização do Auto-Save...');
      triggerAutoSaveSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Dispositivo em Modo Offline. Registros salvos localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial audit & sync
    auditAndEnqueueUnsyncedItems(municipalities, crmInteractions);
    setPendingSyncCount(getPendingQueue().length);

    // Periodic verification interval (every 10 seconds)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerAutoSaveSync();
      } else {
        setPendingSyncCount(getPendingQueue().length);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [municipalities, crmInteractions]);

  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRadarEnricherModal, setShowRadarEnricherModal] = useState<boolean>(false);
  const [showCitySearchModal, setShowCitySearchModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleImportData = (
    importedData: {
      municipalities?: Municipality[];
      crmInteractions?: CRMInteraction[];
      tenders?: TenderNotice[];
      alerts?: CommercialAlert[];
    },
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      if (importedData.municipalities && importedData.municipalities.length > 0) {
        const dedupedMunis = deduplicateMunicipalities(importedData.municipalities);
        setMunicipalities(dedupedMunis);
        dedupedMunis.forEach((m) => saveMunicipalityToFirebase(m));
      }
      if (importedData.crmInteractions) {
        const dedupedInteractions = deduplicateInteractions(importedData.crmInteractions);
        setCrmInteractions(dedupedInteractions);
        dedupedInteractions.forEach((i) => saveInteractionToFirebase(i));
      }
      if (importedData.tenders) setTenders(importedData.tenders);
      if (importedData.alerts) setAlerts(importedData.alerts);
    } else {
      // Merge Mode (Default)
      if (importedData.municipalities && importedData.municipalities.length > 0) {
        setMunicipalities((prev) => {
          const merged = deduplicateMunicipalities([...prev, ...importedData.municipalities!]);
          merged.forEach((m) => saveMunicipalityToFirebase(m));
          return merged;
        });
      }
      if (importedData.crmInteractions && importedData.crmInteractions.length > 0) {
        setCrmInteractions((prev) => {
          const merged = deduplicateInteractions([...prev, ...importedData.crmInteractions!]);
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          merged.forEach((i) => saveInteractionToFirebase(i));
          return merged;
        });
      }
      if (importedData.tenders && importedData.tenders.length > 0) {
        setTenders((prev) => {
          const map = new Map<string, TenderNotice>();
          prev.forEach((t) => map.set(t.id, t));
          importedData.tenders!.forEach((t) => map.set(t.id, t));
          return Array.from(map.values());
        });
      }
      if (importedData.alerts && importedData.alerts.length > 0) {
        setAlerts((prev) => {
          const map = new Map<string, CommercialAlert>();
          prev.forEach((a) => map.set(a.id, a));
          importedData.alerts!.forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
    }
  };

  const handleResetData = () => {
    const cleanM = deduplicateMunicipalities(MOCK_MUNICIPALITIES);
    const cleanI = deduplicateInteractions(MOCK_CRM_INTERACTIONS);
    setMunicipalities(cleanM);
    setCrmInteractions(cleanI);
    setTenders(MOCK_TENDERS);
    setAlerts(MOCK_ALERTS);
    cleanM.forEach((m) => saveMunicipalityToFirebase(m));
    cleanI.forEach((i) => saveInteractionToFirebase(i));
    showToast('🔄 Base de dados restaurada para o estado inicial com sucesso!');
  };

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
    // Enqueue & auto-save to Firebase Cloud
    enqueuePendingSync('municipality', updated);
    triggerAutoSaveSync();
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
    // Enqueue & auto-save to Firebase Cloud
    enqueuePendingSync('interaction', newInteraction);
    triggerAutoSaveSync();
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

    // Enqueue & auto-save to Firebase Cloud
    enqueuePendingSync('interaction', updatedInteraction);
    triggerAutoSaveSync();
  };

  const handleDeleteCRMInteraction = (id: string) => {
    setCrmInteractions((prev) => prev.filter((item) => item.id !== id));
    deleteInteractionFromFirebase(id);
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

  const handleNavbarCitySearch = (queryOrMuni: string | Municipality) => {
    if (typeof queryOrMuni === 'string') {
      const q = queryOrMuni.trim();
      setSearchQuery(q);
      const match = municipalities.find(
        (m) => m.name.toLowerCase() === q.toLowerCase() || `${m.name} - ${m.state}`.toLowerCase() === q.toLowerCase()
      );
      if (match) {
        setSelectedMunicipality(match);
      }
      setActiveTab('crm');
    } else {
      setSelectedMunicipality(queryOrMuni);
      setSearchQuery(queryOrMuni.name);
      setActiveTab('crm');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden w-full">
      
      {/* Top Main Navigation Header */}
      <Navbar
        municipalities={municipalities}
        tenders={tenders}
        alerts={alerts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCityFromSearch={handleNavbarCitySearch}
        onOpenGlobalReport={() => setShowExportModal(true)}
        onOpenAlertsModal={() => setActiveTab('alerts')}
        onOpenRadarEnricher={() => setShowRadarEnricherModal(true)}
        onOpenCitySearch={() => setShowCitySearchModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        pendingSyncCount={pendingSyncCount}
        isSyncingData={isSyncingData}
        isOnline={isOnline}
        lastSyncTime={lastSyncTime}
        onTriggerSync={triggerAutoSaveSync}
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
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 min-w-0 max-w-full w-full pb-32 sm:pb-24">
          
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
              pendingSyncCount={pendingSyncCount}
              isSyncingData={isSyncingData}
              isOnline={isOnline}
              lastSyncTime={lastSyncTime}
              onTriggerSync={triggerAutoSaveSync}
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
          handleSelectMunicipality(newMuni);
          setActiveTab('field_visits');
        }}
        initialCityName={searchQuery || 'Codó'}
        initialState="MA"
      />

      {/* Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        municipalities={municipalities}
        crmInteractions={crmInteractions}
        tenders={tenders}
        alerts={alerts}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onShowToast={showToast}
        firebaseStatus={firebaseStatus}
      />

      {/* Mobile Scroll & Quick Actions Floating Navigation Dock */}
      <MobileScrollNav />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
