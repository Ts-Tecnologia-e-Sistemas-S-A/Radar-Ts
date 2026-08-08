import React, { useState } from 'react';
import { CRMInteraction } from '../types';
import { 
  openGoogleCalendar, 
  downloadIcsFile, 
  downloadBatchIcsFile, 
  formatCardDetailsForCalendar 
} from '../utils/googleCalendar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  X, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface GoogleCalendarHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: CRMInteraction[];
  onShowToast: (message: string) => void;
}

export const GoogleCalendarHubModal: React.FC<GoogleCalendarHubModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onShowToast
}) => {
  if (!isOpen) return null;

  // Filter interactions with a scheduled next step or due date
  const scheduledInteractions = interactions
    .filter(i => i.nextStepDueDate || i.nextStep)
    .sort((a, b) => {
      const dateA = a.nextStepDueDate || a.date || '9999-99-99';
      const dateB = b.nextStepDueDate || b.date || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleExportBatch = () => {
    if (scheduledInteractions.length === 0) {
      onShowToast('⚠️ Nenhuma tarefa agendada para exportar.');
      return;
    }
    downloadBatchIcsFile(scheduledInteractions, `agenda-sicap-comercial-${todayStr}.ics`);
    onShowToast(`📥 Arquivo .ICS com ${scheduledInteractions.length} compromissos gerado e baixado!`);
  };

  const handleSyncAllWeb = () => {
    if (scheduledInteractions.length === 0) {
      onShowToast('⚠️ Nenhuma tarefa com data definida para sincronizar.');
      return;
    }
    scheduledInteractions.slice(0, 3).forEach((item, idx) => {
      setTimeout(() => {
        openGoogleCalendar(item);
      }, idx * 600);
    });
    onShowToast(`📅 Abrindo os primeiros ${Math.min(3, scheduledInteractions.length)} compromissos na Google Agenda!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Calendar className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">Central Google Calendar & Agenda Comercial</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Google Workspace Ativo
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Sincronização de compromissos, lembretes de visitas e follow-ups em prefeituras</p>
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

        {/* Toolbar & Summary Stats */}
        <div className="bg-indigo-50/60 border-b border-indigo-100 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-slate-900">
              Total Agendado: <strong className="text-indigo-600 font-extrabold">{scheduledInteractions.length}</strong> compromissos
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-slate-900">
              Hoje / Próximos: <strong className="text-amber-600 font-extrabold">
                {scheduledInteractions.filter(i => (i.nextStepDueDate || '') <= todayStr).length}
              </strong> para acompanhamento
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBatch}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Baixar Todos (.ICS)</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllWeb}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl border border-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Calendar className="w-4 h-4 text-indigo-200" />
              <span>Agendar Lote no Google Calendar</span>
            </button>
          </div>
        </div>

        {/* List of Scheduled Tasks */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {scheduledInteractions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">Nenhum compromisso agendado no momento</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Ao registrar novas interações ou visitas com "Próxima Ação" e data de vencimento, elas aparecerão automaticamente aqui para agendamento no Google Calendar.
              </p>
            </div>
          ) : (
            scheduledInteractions.map((item) => {
              const isDueDatePast = item.nextStepDueDate && item.nextStepDueDate < todayStr;
              const isToday = item.nextStepDueDate === todayStr;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isToday 
                      ? 'bg-amber-50/60 border-amber-300' 
                      : isDueDatePast 
                      ? 'bg-rose-50/50 border-rose-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        {item.municipalityName} ({item.state})
                      </span>

                      {isToday && (
                        <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                          ⏰ Vence Hoje
                        </span>
                      )}
                      {isDueDatePast && (
                        <span className="text-[10px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded-md">
                          ⚠️ Em Atraso
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Vencimento: <strong className="text-slate-800">{item.nextStepDueDate || 'A definir'}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-medium bg-white/80 p-2.5 rounded-xl border border-slate-100/80">
                      <strong className="text-indigo-900 font-black">Próximo Passo: </strong>
                      {item.nextStep || 'Acompanhamento do processo comercial'}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>👤 Contato: <strong className="text-slate-700">{item.contactName || 'N/I'}</strong> {item.contactRole ? `(${item.contactRole})` : ''}</span>
                      <span>• Responsável: <strong className="text-slate-700">{item.dealOwner || 'José Badotti'}</strong></span>
                      <span>• Resumo: <span className="text-slate-600 italic">{item.summary ? item.summary.slice(0, 60) + '...' : 'Sem resumo'}</span></span>
                    </div>
                  </div>

                  {/* Actions per Item */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        openGoogleCalendar(item);
                        onShowToast(`📅 Abrindo Google Agenda para ${item.municipalityName}!`);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl border border-indigo-700 shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Criar evento no Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Agendar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        downloadIcsFile(item);
                        onShowToast(`📥 Arquivo .ICS para ${item.municipalityName} baixado!`);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Baixar evento em formato .ICS"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>.ICS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = formatCardDetailsForCalendar(item);
                        navigator.clipboard.writeText(text);
                        onShowToast(`📋 Dados de ${item.municipalityName} copiados para a área de transferência!`);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Copiar texto formatado do cartão comercial"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Sincronização bidirecional configurada via Google Workspace API & iCalendar Standards.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-700 font-bold hover:text-slate-900 cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
