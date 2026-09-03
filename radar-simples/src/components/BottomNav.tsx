import Icon from './Icon';

export type Aba = 'radar' | 'pipeline' | 'ficha' | 'memoria';

const ITENS: { aba: Aba; label: string; icone: string }[] = [
  { aba: 'radar', label: 'Radar', icone: 'radar' },
  { aba: 'pipeline', label: 'Pipeline', icone: 'view_kanban' },
  { aba: 'ficha', label: 'Ficha', icone: 'description' },
  { aba: 'memoria', label: 'Memória', icone: 'history_edu' },
];

interface BottomNavProps {
  ativa: Aba;
  onMudar: (aba: Aba) => void;
}

export default function BottomNav({ ativa, onMudar }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="h-16 px-screen-margin-mobile flex items-center justify-around">
        {ITENS.map((item) => {
          const ativo = item.aba === ativa;
          return (
            <button
              key={item.aba}
              onClick={() => onMudar(item.aba)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors relative ${
                ativo ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon name={item.icone} size={22} filled={ativo} />
              <span className="text-label-sm">{item.label}</span>
              {ativo && <span className="w-1.5 h-1.5 rounded-full bg-secondary absolute bottom-1.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
