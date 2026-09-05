import { useEffect, useState } from 'react';
import { gerarRecomendacoesSemana } from '../api/ia';
import { getDespesas, getEventos, getMunicipiosCrm, getPontosRota } from '../storage';
import { CATEGORIAS_DESPESA, CategoriaDespesa, Despesa, EventoTimeline, MunicipioCrm, MunicipioIbge } from '../types';
import { calcularKmPeriodo } from '../utils/rota';
import { compartilharOuBaixarPdf, gerarPdfRelatorioSemanal } from '../utils/pdf';
import Icon from './Icon';

interface RelatoriosViewProps {
  municipios: MunicipioIbge[];
  onFechar: () => void;
}

function seteDiasAtras(): { inicio: string; fim: string } {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - 6 * 24 * 60 * 60 * 1000);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default function RelatoriosView({ municipios, onFechar }: RelatoriosViewProps) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [crmPorCodigo, setCrmPorCodigo] = useState<Record<number, MunicipioCrm>>({});
  const [kmRodados, setKmRodados] = useState(0);
  const [recomendacoes, setRecomendacoes] = useState<{ titulo: string; texto: string }[]>([]);
  const [gerandoRecomendacoes, setGerandoRecomendacoes] = useState(false);
  const [exportando, setExportando] = useState(false);

  const { inicio, fim } = seteDiasAtras();

  useEffect(() => {
    let cancelado = false;
    Promise.all([getEventos(), getDespesas(), getMunicipiosCrm(), getPontosRota()])
      .then(([eventosCarregados, despesasCarregadas, crm, pontos]) => {
        if (cancelado) return;
        setEventos(eventosCarregados.filter((e) => e.data >= inicio && e.data <= fim));
        setDespesas(despesasCarregadas.filter((d) => d.data >= inicio && d.data <= fim));
        setCrmPorCodigo(crm);
        setKmRodados(calcularKmPeriodo(pontos, inicio, fim));
      })
      .catch((e: any) => !cancelado && setErro(e.message || 'Falha ao carregar dados do banco'))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cidadesVisitadas = Array.from(new Set(eventos.map((e) => e.codigoIbge)))
    .map((codigo) => municipios.find((m) => m.codigoIbge === codigo))
    .filter((m): m is MunicipioIbge => Boolean(m));
  const reunioesRealizadas = eventos.filter((e) => e.tipo === 'reuniao').length;
  const despesasTotais = despesas.reduce((soma, d) => soma + d.valor, 0);
  const porCategoria: Record<CategoriaDespesa, number> = { combustivel: 0, hospedagem: 0, alimentacao: 0, pedagio: 0, outros: 0 };
  despesas.forEach((d) => (porCategoria[d.categoria] += d.valor));

  async function gerarRecomendacoes() {
    setGerandoRecomendacoes(true);
    setErro(null);
    try {
      const contexto = `Período: ${inicio} a ${fim}. Cidades visitadas: ${cidadesVisitadas.map((m) => `${m.nome}/${m.uf}`).join(', ') || 'nenhuma'}. Reuniões: ${reunioesRealizadas}. Estágios do funil das cidades visitadas: ${cidadesVisitadas
        .map((m) => `${m.nome}=${crmPorCodigo[m.codigoIbge]?.estagioFunil || 'sem dados'}`)
        .join(', ')}. Despesas totais: R$ ${despesasTotais.toFixed(2)}.`;
      const resultado = await gerarRecomendacoesSemana(contexto);
      setRecomendacoes(resultado.recomendacoes);
    } catch (e: any) {
      setErro(e.message || 'Falha ao gerar recomendações com IA');
    } finally {
      setGerandoRecomendacoes(false);
    }
  }

  async function exportarPdf() {
    setExportando(true);
    try {
      const doc = gerarPdfRelatorioSemanal({
        periodoLabel: `${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}`,
        cidadesVisitadas: cidadesVisitadas.map((m) => `${m.nome}/${m.uf}`),
        reunioesRealizadas,
        despesasTotais,
        despesasPorCategoria: CATEGORIAS_DESPESA.map((c) => ({ categoria: c.label, valor: porCategoria[c.value] })).filter((c) => c.valor > 0),
        kmRodados,
        recomendacoesIA: recomendacoes,
      });
      await compartilharOuBaixarPdf(doc, `balanco-semanal-${fim}.pdf`);
    } catch (e: any) {
      setErro(e.message || 'Falha ao gerar PDF');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      <div className="h-16 px-screen-margin-mobile flex items-center justify-between border-b border-surface-container">
        <h2 className="text-headline-sm text-primary">Balanço de Campo &amp; Rota</h2>
        <button onClick={onFechar} className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-screen-margin-mobile flex flex-col gap-space-md pb-28">
        <p className="text-body-sm text-on-surface-variant">
          {inicio.split('-').reverse().join('/')} a {fim.split('-').reverse().join('/')}
        </p>
        {carregando && <p className="text-body-sm text-on-surface-variant">Carregando…</p>}
        {erro && <p className="text-body-sm text-error">{erro}</p>}

        <section className="grid grid-cols-2 gap-3">
          <Metrica icone="location_city" label="Cidades Visitadas" valor={String(cidadesVisitadas.length)} sufixo="municípios" />
          <Metrica icone="groups" label="Reuniões de Gabinete" valor={String(reunioesRealizadas)} sufixo="concluídas" />
          <Metrica icone="directions_car" label="Km Rodados" valor={kmRodados.toFixed(0)} sufixo="km" />
          <Metrica icone="receipt_long" label="Despesas de Rota" valor={`R$ ${despesasTotais.toFixed(0)}`} sufixo={`${despesas.length} comprovantes`} />
        </section>

        {despesasTotais > 0 && (
          <div className="bg-surface-container-low rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant mb-2">
              <span className="font-semibold text-primary">Composição das Despesas</span>
              <span>Total: R$ {despesasTotais.toFixed(2)}</span>
            </div>
            <div className="w-full flex h-2 rounded-full overflow-hidden mb-2.5">
              {CATEGORIAS_DESPESA.map((c) => (
                <div
                  key={c.value}
                  className="h-full bg-primary"
                  style={{ width: `${(porCategoria[c.value] / despesasTotais) * 100}%`, opacity: 0.4 + CATEGORIAS_DESPESA.indexOf(c) * 0.15 }}
                  title={`${c.label}: R$ ${porCategoria[c.value].toFixed(2)}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS_DESPESA.filter((c) => porCategoria[c.value] > 0).map((c) => (
                <div key={c.value} className="flex items-center gap-1.5">
                  <Icon name={c.icone} size={14} className="text-primary" />
                  <span className="text-label-sm text-on-surface-variant">{c.label}:</span>
                  <span className="text-label-sm text-primary font-bold">R$ {porCategoria[c.value].toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="flex flex-col gap-space-xs">
          <h3 className="text-headline-sm text-primary">Praças Percorridas</h3>
          {cidadesVisitadas.length === 0 && <p className="text-body-sm text-on-surface-variant">Nenhuma cidade com evento registrado no período.</p>}
          {cidadesVisitadas.map((m) => (
            <div key={m.codigoIbge} className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex items-center justify-between">
              <span className="text-label-lg text-primary">
                {m.nome} / {m.uf}
              </span>
              <span className="text-label-sm text-on-surface-variant">
                {ESTAGIO_LABEL(crmPorCodigo[m.codigoIbge]?.estagioFunil)}
              </span>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-surface-container p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                <Icon name="psychology" size={18} />
              </div>
              <h3 className="text-headline-sm text-primary font-bold">Recomendações Estratégicas (IA)</h3>
            </div>
            <button
              disabled={gerandoRecomendacoes}
              onClick={gerarRecomendacoes}
              className="text-label-sm text-secondary font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              <Icon name={gerandoRecomendacoes ? 'sync' : 'bolt'} size={14} className={gerandoRecomendacoes ? 'animate-spin' : ''} />
              Gerar
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {recomendacoes.map((r, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                <Icon name="lightbulb" size={20} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-label-md text-primary font-semibold">{r.titulo}</p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">{r.texto}</p>
                </div>
              </div>
            ))}
            {recomendacoes.length === 0 && <p className="text-body-sm text-on-surface-variant">Toque em "Gerar" pra IA sugerir recomendações com base nos dados acima.</p>}
          </div>
        </section>
      </div>

      <div className="p-screen-margin-mobile pb-safe border-t border-surface-container">
        <button
          disabled={exportando}
          onClick={exportarPdf}
          className="w-full h-12 rounded-xl bg-primary text-on-primary text-label-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
        >
          <Icon name={exportando ? 'sync' : 'share'} size={20} className={exportando ? 'animate-spin' : ''} />
          <span>{exportando ? 'Gerando PDF...' : 'Exportar / Compartilhar PDF'}</span>
        </button>
      </div>
    </div>
  );
}

function ESTAGIO_LABEL(estagio: string | undefined): string {
  if (!estagio) return 'sem dados';
  const mapa: Record<string, string> = {
    mapeamento: 'Mapeamento',
    qualificacao: 'Qualificação',
    proposta: 'Proposta',
    juridico: 'Jurídico',
    homologacao: 'Homologação',
  };
  return mapa[estagio] || estagio;
}

function Metrica({ icone, label, valor, sufixo }: { icone: string; label: string; valor: string; sufixo: string }) {
  return (
    <div className="flex flex-col p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
      <span className="p-2 rounded-lg bg-surface-container text-primary flex items-center justify-center w-fit mb-2">
        <Icon name={icone} size={18} />
      </span>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-headline-md text-primary font-bold">{valor}</span>
        <span className="text-body-sm text-on-surface-variant">{sufixo}</span>
      </div>
    </div>
  );
}
