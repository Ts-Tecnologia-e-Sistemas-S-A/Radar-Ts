import Icon from './Icon';

interface HeaderProps {
  titulo: string;
  onVoltar?: () => void;
}

export default function Header({ titulo, onVoltar }: HeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-screen-margin-mobile flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs min-w-0">
          {onVoltar && (
            <button
              aria-label="Voltar"
              className="w-11 h-11 -ml-space-xs flex items-center justify-center rounded-lg text-primary hover:bg-surface-container transition-colors"
              onClick={onVoltar}
            >
              <Icon name="arrow_back" size={22} />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-2xs text-on-surface-variant text-label-sm leading-none">
              <span className="truncate">GovTrack</span>
              <Icon name="chevron_right" size={12} />
              <span className="text-secondary font-semibold uppercase tracking-wider">B2G CRM</span>
            </div>
            <h1 className="text-headline-sm text-primary truncate leading-tight mt-0.5">{titulo}</h1>
          </div>
        </div>
        <div className="flex items-center gap-space-xs flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="hidden sm:inline font-semibold">Sincronizado</span>
            <Icon name="cloud_done" size={14} />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Icon name="person" size={18} className="text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
