import { useState } from 'react';
import CrmView from './components/CrmView';
import RotaView from './components/RotaView';
import { MunicipioIbge } from './types';

type Aba = 'rota' | 'crm';

export default function App() {
  const [aba, setAba] = useState<Aba>('rota');
  const [municipioSelecionado, setMunicipioSelecionado] = useState<MunicipioIbge | null>(null);

  function abrirNoCrm(municipio: MunicipioIbge) {
    setMunicipioSelecionado(municipio);
    setAba('crm');
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Radar Comercial de Municípios</h1>
        <nav className="mt-4 flex gap-2 border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              aba === 'rota' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setAba('rota')}
          >
            Rota
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              aba === 'crm' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setAba('crm')}
          >
            CRM
          </button>
        </nav>
      </header>

      <main>
        {aba === 'rota' && <RotaView onAbrirMunicipio={abrirNoCrm} />}
        {aba === 'crm' && <CrmView municipio={municipioSelecionado} />}
      </main>
    </div>
  );
}
