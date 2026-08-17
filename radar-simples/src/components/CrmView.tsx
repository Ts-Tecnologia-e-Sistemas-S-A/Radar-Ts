import { MunicipioIbge } from '../types';
import MunicipioDetail from './MunicipioDetail';

interface CrmViewProps {
  municipio: MunicipioIbge | null;
}

export default function CrmView({ municipio }: CrmViewProps) {
  if (!municipio) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Nenhum município selecionado. Vá até a aba <strong>Rota</strong> e clique em "Abrir no CRM".
      </div>
    );
  }

  return <MunicipioDetail municipio={municipio} />;
}
