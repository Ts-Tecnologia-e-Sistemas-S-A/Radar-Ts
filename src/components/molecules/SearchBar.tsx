import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../atoms/Button';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar cidade, fornecedor ou contrato...',
  onSearch,
  isLoading = false,
  initialValue = '',
  className = '',
}) => {
  const [term, setTerm] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term.trim());
    }
  };

  const handleClear = () => {
    setTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1 flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-slate-900 text-xs font-semibold pl-10 pr-9 py-2.5 rounded-xl transition-all outline-none disabled:opacity-60"
        />
        {term && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
            title="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        disabled={!term.trim()}
      >
        Buscar
      </Button>
    </form>
  );
};
