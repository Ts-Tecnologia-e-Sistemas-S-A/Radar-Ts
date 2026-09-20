import { useEffect, useState } from 'react';
import { buscarTodosMunicipios } from './api/ibge';
import BottomNav, { Aba } from './components/BottomNav';
import CapturaDespesaView from './components/CapturaDespesaView';
import FabNovaPraca from './components/FabNovaPraca';
import FichaMunicipalView from './components/FichaMunicipalView';
import GravarReuniaoView from './components/GravarReuniaoView';
import Header from './components/Header';
import MemoriaContaView from './components/MemoriaContaView';
import NovaPracaModal from './components/NovaPracaModal';
import PipelineView from './components/PipelineView';
import RadarView from './components/RadarView';
import RelatorioGestaoView from './components/RelatorioGestaoView';
import AgendaView from './components/AgendaView';
import OfflineStatus from './components/OfflineStatus';
import { getEventos, getMunicipioCrm, getMunicipiosCrm } from './storage';
import { MunicipioIbge, municipioCrmVazio } from './types';
import { compartilharOuBaixarPdf, gerarPdfBriefing } from './utils/pdf';

type Overlay = null | 'nova-praca' | 'despesa' | 'gravar-reuniao' | 'relatorio';
const MUNICIPIOS_OFFLINE_KEY = 'radar_ts_municipios_offline_v1';

const TITULOS: Record<Aba, string> = {
  radar: 'Radar de Praças',
  pipeline: 'Pipeline B2G',
  ficha: 'Ficha Municipal',
  memoria: 'Memória da Conta',
  agenda: 'Agenda de tarefas',
};

export default function App() {
  const [aba, setAba] = useState<Aba>('radar');
  const [municipioAtivo, setMunicipioAtivo] = useState<MunicipioIbge | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [revisaoMemoria, setRevisaoMemoria] = useState(0);
  const [municipios, setMunicipios] = useState<MunicipioIbge[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(true);
  const [erroMunicipios, setErroMunicipios] = useState<string | null>(null);

  async function recarregarMunicipios() {
    setCarregandoMunicipios(true);
    setErroMunicipios(null);
    try {
      const crm = await getMunicipiosCrm();
      const codigos = new Set(Object.keys(crm).map(Number));
      let selecionados: MunicipioIbge[];
      try {
        const todos = await buscarTodosMunicipios();
        selecionados = todos.filter((m) => codigos.has(m.codigoIbge));
        localStorage.setItem(MUNICIPIOS_OFFLINE_KEY, JSON.stringify(selecionados));
      } catch (error) {
        const cache = localStorage.getItem(MUNICIPIOS_OFFLINE_KEY);
        selecionados = cache ? JSON.parse(cache) as MunicipioIbge[] : [];
        if (selecionados.length === 0) throw error;
      }
      setMunicipios(selecionados);
    } catch (e: any) {
      setErroMunicipios(e.message || 'Falha ao carregar municípios');
    } finally {
      setCarregandoMunicipios(false);
    }
  }

  useEffect(() => {
    recarregarMunicipios();
  }, []);

  function abrirMunicipio(m: MunicipioIbge) {
    setMunicipioAtivo(m);
    setAba('ficha');
  }

  function mudarAba(novaAba: Aba) {
    if ((novaAba === 'ficha' || novaAba === 'memoria') && !municipioAtivo) {
      setAba(novaAba);
      return;
    }
    setAba(novaAba);
  }

  async function exportarBriefing() {
    if (!municipioAtivo) return;
    const [crm, eventos] = await Promise.all([
      getMunicipioCrm(municipioAtivo.codigoIbge),
      getEventos(municipioAtivo.codigoIbge),
    ]);
    const doc = gerarPdfBriefing(municipioAtivo, crm || municipioCrmVazio(municipioAtivo.codigoIbge), eventos);
    await compartilharOuBaixarPdf(doc, `briefing-${municipioAtivo.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <OfflineStatus />
      <Header
        titulo={TITULOS[aba]}
        onVoltar={aba === 'radar' ? undefined : () => {
          setOverlay(null);
          setAba('radar');
        }}
      />
      <main className="flex-1 px-screen-margin-mobile pt-16 pb-safe bg-surface">
        {carregandoMunicipios && municipios.length === 0 && (
          <p className="text-body-sm text-on-surface-variant pt-space-xs">Carregando praças…</p>
        )}
        {erroMunicipios && <p className="text-body-sm text-error pt-space-xs">{erroMunicipios}</p>}

        {aba === 'radar' && (
          <RadarView municipios={municipios} onAbrirMunicipio={abrirMunicipio} onNovaDespesa={() => setOverlay('despesa')} onVerRelatorio={() => setOverlay('relatorio')} />
        )}
        {aba === 'pipeline' && (
          <PipelineView municipios={municipios} onAbrirMunicipio={abrirMunicipio} onVerRelatorio={() => setOverlay('relatorio')} />
        )}
        {aba === 'agenda' && <AgendaView municipios={municipios} municipioAtivo={municipioAtivo} />}
        {aba === 'ficha' &&
          (municipioAtivo ? (
            <FichaMunicipalView key={municipioAtivo.codigoIbge} municipio={municipioAtivo} onDespesaCliqueAnexar={() => setOverlay('despesa')} />
          ) : (
            <EstadoVazio texto="Selecione um município no Radar ou no Pipeline pra ver a ficha." />
          ))}
        {aba === 'memoria' &&
          (municipioAtivo ? (
            <MemoriaContaView
              key={municipioAtivo.codigoIbge}
              revisao={revisaoMemoria}
              municipio={municipioAtivo}
              onGravarReuniao={() => setOverlay('gravar-reuniao')}
              onExportarPdf={exportarBriefing}
            />
          ) : (
            <EstadoVazio texto="Selecione um município no Radar ou no Pipeline pra ver a memória da conta." />
          ))}
      </main>

      <BottomNav ativa={aba} onMudar={mudarAba} />
      {overlay === null && <FabNovaPraca onClick={() => setOverlay('nova-praca')} />}

      {overlay === 'nova-praca' && (
        <NovaPracaModal
          municipiosExistentes={municipios}
          onFechar={() => setOverlay(null)}
          onAdicionado={(m) => {
            setOverlay(null);
            recarregarMunicipios();
            abrirMunicipio(m);
          }}
          onAdicionadosEmLote={() => {
            setOverlay(null);
            recarregarMunicipios();
          }}
        />
      )}
      {overlay === 'despesa' && <CapturaDespesaView municipioSugerido={municipioAtivo} onFechar={() => setOverlay(null)} />}
      {overlay === 'gravar-reuniao' && municipioAtivo && (
        <GravarReuniaoView municipio={municipioAtivo} onFechar={() => {
          setOverlay(null);
          setRevisaoMemoria((v) => v + 1);
        }} />
      )}
      {overlay === 'relatorio' && <RelatorioGestaoView municipios={municipios} onFechar={() => setOverlay(null)} onImportado={() => { recarregarMunicipios(); setRevisaoMemoria((r) => r + 1); }} />}
    </div>
  );
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant mt-space-md">
      {texto}
    </div>
  );
}
