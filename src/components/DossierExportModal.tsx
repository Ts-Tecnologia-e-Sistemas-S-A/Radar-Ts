import React from 'react';
import { Municipality } from '../types';
import { X, Printer, Download, Building2, ShieldCheck, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface DossierExportModalProps {
  municipality: Municipality;
  onClose: () => void;
}

export const DossierExportModal: React.FC<DossierExportModalProps> = ({
  municipality,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">
              Dossiê de Inteligência Comercial SICAP - {municipality.name} ({municipality.state})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Content View */}
        <div className="p-8 space-y-6 overflow-y-auto text-slate-900 printable-dossier text-xs">
          
          {/* Header Cover */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <span className="text-blue-600 font-black text-sm uppercase tracking-widest block">RELATÓRIO CONFIDENCIAL DE VENDAS</span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                PREFEITURA MUNICIPAL DE {municipality.name.toUpperCase()} - {municipality.state}
              </h1>
              <p className="text-slate-500 mt-1">
                Data do Relatório: {new Date().toLocaleDateString('pt-BR')} | Módulo Radar SICAP v3.6
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Índice IO</span>
              <span className="text-3xl font-black text-emerald-600">{municipality.ioScore}/100</span>
            </div>
          </div>

          {/* Key Indicators Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">CONCORRENTE ATUAL</span>
              <span className="font-black text-slate-900 text-sm">{municipality.currentSystem}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">DIAS VENCIMENTO</span>
              <span className="font-black text-red-600 text-sm">
                {municipality.contractDaysRemaining < 0 ? 'Encerrado' : `${municipality.contractDaysRemaining} dias`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">VALOR ESTIMADO</span>
              <span className="font-black text-emerald-600 text-sm">
                R$ {municipality.estimatedNewContractValue.toLocaleString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">MODALIDADE PROVÁVEL</span>
              <span className="font-black text-blue-700 text-sm">{municipality.probableModality}</span>
            </div>
          </div>

          {/* Key Decision Makers */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm border-b pb-1">
              Equipe Técnica & Decisores Mapeados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {municipality.keyContacts.map((c, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block">{c.name}</span>
                  <span className="text-blue-700 font-semibold">{c.role}</span>
                  {c.phone && <p className="text-slate-500 mt-1">Tel: {c.phone}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Educational Pains */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm border-b pb-1">
              Dores do Cockpit Educacional
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {municipality.educationalMetrics.mainPains.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
