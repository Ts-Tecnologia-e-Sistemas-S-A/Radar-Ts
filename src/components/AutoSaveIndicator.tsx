import React, { useState } from 'react';
import { CloudCheck, CloudOff, RefreshCw, CheckCircle2, ShieldCheck, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastSavedTime: Date | null;
  onTriggerSync: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  pendingCount,
  isSyncing,
  isOnline,
  lastSavedTime,
  onTriggerSync
}) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);

  const formatLastTime = (d: Date | null) => {
    if (!d) return 'Recentemente';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="relative">
      {/* Badge Button */}
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border active:scale-95 cursor-pointer shrink-0 ${
          !isOnline
            ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
            : isSyncing
            ? 'bg-blue-900/80 text-blue-200 border-blue-500/40'
            : pendingCount > 0
            ? 'bg-amber-900/80 text-amber-200 border-amber-500/40'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/80'
        }`}
        title="Status de Auto-Save e Sincronização em Nuvem (Firebase Firestore)"
      >
        {isSyncing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
        ) : !isOnline ? (
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        ) : pendingCount > 0 ? (
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        )}

        <span className="hidden sm:inline text-[11px] font-bold">
          {isSyncing
            ? 'Sincronizando...'
            : !isOnline
            ? `Offline (${pendingCount})`
            : pendingCount > 0
            ? `Auto-Save (${pendingCount})`
            : 'Auto-Save Ativo'}
        </span>
      </button>

      {/* Popover Status Card */}
      {showPopover && (
        <div className="absolute right-0 top-11 z-50 w-72 bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-xs text-white">Mecanismo Auto-Save CRM</span>
            </div>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-xl">
              <span className="text-slate-400 flex items-center gap-1.5">
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
                Conexão:
              </span>
              <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? 'Online (Conectado)' : 'Offline (Modo Local)'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-xl">
              <span className="text-slate-400">Itens Pendentes:</span>
              <span className={`font-black ${pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingCount} registro(s)
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-xl">
              <span className="text-slate-400">Última Sincronização:</span>
              <span className="font-semibold text-slate-200">{formatLastTime(lastSavedTime)}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            💡 O Auto-Save monitora continuamente o CRM. Registros feitos offline são mantidos em segurança no dispositivo e enviados automaticamente ao reconectar.
          </p>

          <button
            onClick={() => {
              onTriggerSync();
              setShowPopover(false);
            }}
            disabled={isSyncing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Agora com Firestore</span>
          </button>
        </div>
      )}
    </div>
  );
};
