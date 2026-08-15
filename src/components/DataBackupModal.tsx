import React, { useState, useRef } from 'react';
import { Municipality, CRMInteraction, TenderNotice, CommercialAlert } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  RefreshCw,
  Sparkles,
  Layers,
  Building2,
  Calendar
} from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  municipalities: Municipality[];
  crmInteractions: CRMInteraction[];
  tenders: TenderNotice[];
  alerts: CommercialAlert[];
  onImportData: (data: {
    municipalities?: Municipality[];
    crmInteractions?: CRMInteraction[];
    tenders?: TenderNotice[];
    alerts?: CommercialAlert[];
  }, mode: 'merge' | 'replace') => void;
  onResetData?: () => void;
  onShowToast?: (msg: string) => void;
  firebaseStatus: 'connecting' | 'connected' | 'error';
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  municipalities,
  crmInteractions,
  tenders,
  alerts,
  onImportData,
  onResetData,
  onShowToast,
  firebaseStatus
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedBackup, setParsedBackup] = useState<{
    municipalities?: Municipality[];
    crmInteractions?: CRMInteraction[];
    tenders?: TenderNotice[];
    alerts?: CommercialAlert[];
    exportedAt?: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export JSON
  const handleExportJson = () => {
    const backupData = {
      app: 'SICAP RADAR - Inteligência Licitatória',
      version: '3.6',
      exportedAt: new Date().toISOString(),
      stats: {
        totalMunicipalities: municipalities.length,
        totalInteractions: crmInteractions.length,
        totalTenders: tenders.length,
        totalAlerts: alerts.length
      },
      data: {
        municipalities,
        crmInteractions,
        tenders,
        alerts
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sicap_radar_backup_${dateStr}_${timeStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`📥 Backup exportado com sucesso! (${municipalities.length} prefeituras e ${crmInteractions.length} registros no CRM).`);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setParsedBackup(null);

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Extract data arrays flexibly
        let munis: Municipality[] = [];
        let interactions: CRMInteraction[] = [];
        let tend: TenderNotice[] = [];
        let alt: CommercialAlert[] = [];
        let exportedAtStr = parsed.exportedAt || new Date().toISOString();

        if (parsed.data) {
          munis = Array.isArray(parsed.data.municipalities) ? parsed.data.municipalities : [];
          interactions = Array.isArray(parsed.data.crmInteractions) ? parsed.data.crmInteractions : [];
          tend = Array.isArray(parsed.data.tenders) ? parsed.data.tenders : [];
          alt = Array.isArray(parsed.data.alerts) ? parsed.data.alerts : [];
        } else if (Array.isArray(parsed.municipalities) || Array.isArray(parsed.crmInteractions)) {
          munis = Array.isArray(parsed.municipalities) ? parsed.municipalities : [];
          interactions = Array.isArray(parsed.crmInteractions) ? parsed.crmInteractions : [];
          tend = Array.isArray(parsed.tenders) ? parsed.tenders : [];
          alt = Array.isArray(parsed.alerts) ? parsed.alerts : [];
        } else if (Array.isArray(parsed)) {
          // If the JSON is directly an array of municipalities or interactions
          if (parsed.length > 0 && ('state' in parsed[0] || 'ioScore' in parsed[0])) {
            munis = parsed as Municipality[];
          } else if (parsed.length > 0 && ('municipalityName' in parsed[0] || 'summary' in parsed[0])) {
            interactions = parsed as CRMInteraction[];
          }
        }

        if (munis.length === 0 && interactions.length === 0 && tend.length === 0 && alt.length === 0) {
          setFileError('Nenhum dado compatível de prefeituras ou interações foi encontrado neste arquivo JSON.');
          return;
        }

        setParsedBackup({
          municipalities: munis,
          crmInteractions: interactions,
          tenders: tend,
          alerts: alt,
          exportedAt: exportedAtStr
        });
      } catch (err) {
        setFileError('Erro ao ler arquivo JSON. Verifique se o formato do arquivo é válido.');
      }
    };

    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!parsedBackup) return;

    onImportData(
      {
        municipalities: parsedBackup.municipalities,
        crmInteractions: parsedBackup.crmInteractions,
        tenders: parsedBackup.tenders,
        alerts: parsedBackup.alerts
      },
      importMode
    );

    const mCount = parsedBackup.municipalities?.length || 0;
    const iCount = parsedBackup.crmInteractions?.length || 0;

    if (onShowToast) {
      onShowToast(
        `✅ Backup restaurado! ${mCount} prefeituras e ${iCount} interações ${importMode === 'merge' ? 'mescladas' : 'importadas'} e sincronizadas.`
      );
    }

    // Reset local modal state and close
    setParsedBackup(null);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>Backup & Segurança de Dados (JSON)</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Proteção Ativa
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Exporte, importe e proteja todos os cadastros do SICAP RADAR
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[80vh] text-slate-900">
          
          {/* Active Database Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Base de Dados Atual</span>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                firebaseStatus === 'connected' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {firebaseStatus === 'connected' ? 'Sincronizado na Nuvem' : 'Armazenamento Local'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prefeituras</span>
                <span className="text-lg font-black text-slate-900">{municipalities.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitas / CRM</span>
                <span className="text-lg font-black text-blue-700">{crmInteractions.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Editais</span>
                <span className="text-lg font-black text-indigo-700">{tenders.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Alertas</span>
                <span className="text-lg font-black text-amber-700">{alerts.length}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Export JSON Backup */}
          <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>1. Exportar Backup em Arquivo JSON</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Gere um arquivo `.json` completo contendo todos os dados de prefeituras, contatos, histórico de visitas e contratos mapeados para guardar em seu computador ou enviar a outros membros da equipe.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportJson}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-blue-200" />
              <span>Baixar Backup Completo (.json)</span>
            </button>
          </div>

          {/* Section 2: Import JSON Backup */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>2. Restaurar / Importar Backup (JSON)</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Selecione um arquivo de backup `.json` prévio para restaurar suas cidades e registros de visitas.
              </p>
            </div>

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Custom Select File Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-5 text-center cursor-pointer transition-all hover:bg-emerald-50/30 group"
            >
              <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {fileName ? `📄 Arquivo selecionado: ${fileName}` : 'Clique aqui para escolher o arquivo .json no seu computador'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Suporta backups exportados do SICAP RADAR v3.x
              </p>
            </div>

            {/* Error Message */}
            {fileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* File Preview & Mode Selection if Valid JSON */}
            {parsedBackup && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Arquivo JSON Válido Identificado!</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">PREFEITURAS NO ARQUIVO</span>
                    <span className="font-bold text-slate-900">{parsedBackup.municipalities?.length || 0} cidades</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">INTERAÇÕES / VISITAS</span>
                    <span className="font-bold text-blue-700">{parsedBackup.crmInteractions?.length || 0} registros</span>
                  </div>
                </div>

                {/* Import Strategy Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Modo de Restauração:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2 transition-all ${
                      importMode === 'merge' 
                        ? 'bg-emerald-100/80 border-emerald-500 font-bold text-emerald-950 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="mt-0.5"
                      />
                      <div>
                        <span>Mesclar Dados (Recomendado)</span>
                        <p className="text-[10px] font-normal text-slate-500">
                          Preserva cadastros existentes e acrescenta apenas registros novos.
                        </p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2 transition-all ${
                      importMode === 'replace' 
                        ? 'bg-amber-100/80 border-amber-500 font-bold text-amber-950 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5"
                      />
                      <div>
                        <span>Substituir Base de Dados</span>
                        <p className="text-[10px] font-normal text-slate-500">
                          Substitui toda a base atual pelos dados do arquivo JSON.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirm Import Action Button */}
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-100" />
                  <span>Confirmar Importação e Sincronizar</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Optional Action */}
          {onResetData && (
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Deseja restaurar a base inicial de testes do sistema?</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja restaurar a base de dados inicial?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="text-slate-500 hover:text-red-600 underline font-semibold transition-colors"
              >
                Restaurar Dados Iniciais
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
