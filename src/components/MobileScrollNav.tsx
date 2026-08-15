import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Menu, Compass } from 'lucide-react';

interface MobileScrollNavProps {
  onOpenMobileMenu?: () => void;
}

export const MobileScrollNav: React.FC<MobileScrollNavProps> = ({ onOpenMobileMenu }) => {
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="lg:hidden fixed bottom-4 right-3 z-40 flex flex-col items-end gap-2 pointer-events-none">
      
      {/* Scroll to Top Button */}
      {showTopButton && (
        <button
          type="button"
          onClick={scrollToTop}
          className="pointer-events-auto bg-slate-900/95 hover:bg-slate-800 text-amber-400 border border-slate-700/80 p-3 rounded-full shadow-2xl backdrop-blur transition-all active:scale-90 flex items-center justify-center cursor-pointer ring-2 ring-amber-400/20"
          title="Rolar para o Topo"
          aria-label="Rolar para o Topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Action Dock */}
      <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur flex items-center gap-1.5 text-white">
        
        {/* Scroll to Bottom / Action Buttons */}
        <button
          type="button"
          onClick={scrollToBottom}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Rolar até os Botões de Ação no fim da tela"
        >
          <ArrowDown className="w-4 h-4 text-amber-300 animate-bounce" />
          <span>Ver Botões Abaixo</span>
        </button>

        {/* Quick Menu Button */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-2.5 py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Abrir Menu de Módulos"
            aria-label="Abrir Menu"
          >
            <Menu className="w-4 h-4 text-amber-300" />
          </button>
        )}
      </div>

    </div>
  );
};
