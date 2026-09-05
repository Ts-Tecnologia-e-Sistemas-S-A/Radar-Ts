import Icon from './Icon';

interface FabNovaPracaProps {
  onClick: () => void;
}

export default function FabNovaPraca({ onClick }: FabNovaPracaProps) {
  return (
    <div className="fixed right-4 bottom-20 z-40">
      <button
        aria-label="Nova Praça"
        onClick={onClick}
        className="h-12 px-4 rounded-full bg-primary-container text-white shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Icon name="add_location_alt" size={20} className="text-secondary-fixed" />
        <span className="text-label-md font-semibold tracking-wide">Nova Praça</span>
      </button>
    </div>
  );
}
