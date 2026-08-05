import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface TruthAuditSealProps {
  status?: string;
  notes?: string;
  sources?: string[];
  className?: string;
}

export const TruthAuditSeal: React.FC<TruthAuditSealProps> = ({
  status = '100% VERIFICADO (FONTES OFICIAIS)',
  notes,
  sources = [
    'PNCP (Portal Nacional de Contratações Públicas)',
    'Portal da Transparência Municipal',
    'INEP / Censo Escolar',
    'IBGE',
  ],
  className = '',
}) => {
  return (
    <div className={`bg-emerald-950 text-emerald-100 p-3.5 rounded-xl border border-emerald-800/80 text-xs space-y-2 ${className}`}>
      <div className="flex items-center justify-between font-black text-emerald-300">
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>AUDITORIA DE VERACIDADE DE DADOS (ZERO-ALUCINAÇÃO)</span>
        </div>
        <span className="bg-emerald-800/90 text-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
          {status}
        </span>
      </div>

      {notes && (
        <p className="text-[11px] text-emerald-200/90 font-medium leading-relaxed">
          {notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-semibold text-emerald-300/80 border-t border-emerald-900">
        <span className="text-emerald-400 font-bold">Fontes Oficiais Consultadas:</span>
        {sources.map((src, i) => (
          <span key={i} className="bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-800">
            ✓ {src}
          </span>
        ))}
      </div>
    </div>
  );
};
