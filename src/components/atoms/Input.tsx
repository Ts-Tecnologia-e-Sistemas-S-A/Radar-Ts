import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  icon,
  className = '',
  id,
  disabled,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-extrabold text-slate-700 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full rounded-xl text-xs font-semibold px-3.5 py-2.5 transition-all outline-none border ${
            icon ? 'pl-9' : 'pl-3.5'
          } ${
            error
              ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-300'
              : success
              ? 'border-emerald-400 bg-emerald-50/30 text-slate-900 focus:ring-2 focus:ring-emerald-300'
              : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-slate-900'
          } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 pointer-events-none" />
        )}
        {!error && success && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
          <span>⚠️ {error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-[11px] font-medium text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
