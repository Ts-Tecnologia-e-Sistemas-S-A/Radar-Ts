import { useEffect, useMemo, useState } from 'react';
import { gerarBriefing } from '../api/ia';
import { getEventos, getMunicipioCrm } from '../storage';
import { EventoTimeline, MunicipioCrm, MunicipioIbge, TipoEventoTimeline, municipioCrmVazio } from '../types';
import Icon from './Icon';

const ICONE_TIPO: Record<TipoEventoTimeline, string> = {
  reuniao: 'groups',
  documento: 'description',
  deslocamento: 'directions_car',
};

interface MemoriaContaViewProps {
  municipio: MunicipioIbge;
  onGravarReuniao: () => void;
  onExportarPdf: () => void;
}

export default function MemoriaContaView({ municipio, onGravarReuniao, onExportarPdf }: MemoriaContaViewProps) {
  const [crm, setCrm] = useState<MunicipioCrm>(municipioCrmVazio(municipio.codigoIbge));
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [gerandoBriefing, setGerandoBriefing] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setBriefing(null);
    Promise.all([getMunicipioCrm(municipio.codigoIbge), getEventos(municipio.codigoIbge)])
      .then(([crmCarregado, eventosCarregados]) => {
        if (cancelado) return;
        setCrm(crmCarregado || municipioCrmVazio(municipio.codigoIbge));
        setEventos([...eventosCarregados].sort((a, b) => b.data.localeCompare(a.data)));
      })
      .catch((e: any) => !cancelado && setErro(e.message || 'Falha ao carregar dados do banco'))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [municipio.codigoIbge]);

  const grupos = useMemo(() => {
    const porMandato = new Map<string, EventoTimeline[]>();
    for (const ev of eventos) {
      if (!porMandato.has(ev.mandato)) porMandato.set(ev.mandato, []);
      porMandato.get(ev.mandato)!.push(ev);
    }
    return Array.from(porMandato.entries());
  }, [eventos]);

  async function sintetizarBriefing() {
    setGerandoBriefing(true);
    setErro(null);
    try {
      const contatos = crm.contatos.map((c) => `${c.nome} (${c.cargo})`).join(', ') || 'nenhum contato registrado';
      const ultimosEventos = eventos
        .slice(0, 3)
        .map((e) => `${e.data}: ${e.sinteseIA || e.resumo}`)
        .join(' | ') || 'nenhum evento registrado ainda';
      const contexto = `Município: ${municipio.nome}/${municipio.uf}. Contatos: ${contatos}. Últimos eventos: ${ultimosEventos}.`;
      const resultado = await gerarBriefing(contexto);
      setBriefing(resultado.diretriz);
    } catch (e: any) {
      setErro(e.message || 'Falha ao gerar briefing com IA');
    } finally {
      setGerandoBriefing(false);
    }
  }

  if (carregando) {
    return <p className="text-body-sm text-on-surface-variant pt-space-xs">Carregando dados do banco…</p>;
  }

  return (
    <div className="flex flex-col gap-space-md pt-space-xs pb-32">
      {erro && <p className="text-body-sm text-error">{erro}</p>}

      <div className="flex items-center justify-between gap-space-xs">
        <div className="flex items-center gap-space-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
            <Icon name="history_edu" size={22} />
          </div>
          <div>
            <h2 className="text-headline-md text-primary leading-tight">Memória da Conta</h2>
            <p className="text-body-sm text-on-surface-variant">
              {municipio.nome} / {municipio.uf} — prontuário B2G para briefing em campo
            </p>
          </div>
        </div>
      </div>

      <div className="p-space-card-padding rounded-xl bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-md flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
              <Icon name="psychology" size={20} className="text-secondary-fixed" />
            </div>
            <div>
              <div className="text-label-lg text-on-primary">Resumo Relâmpago IA</div>
              <div className="text-body-sm text-on-primary-container">Gera síntese tática antes de entrar no gabinete</div>
            </div>
          </div>
          <button
            disabled={gerandoBriefing}
            onClick={sintetizarBriefing}
            className="px-3 py-2 rounded-lg bg-secondary text-on-secondary text-label-md shadow flex items-center gap-1 disabled:opacity-60"
          >
            <Icon name={gerandoBriefing ? 'sync' : 'bolt'} size={16} className={gerandoBriefing ? 'animate-spin' : ''} />
            <span>{gerandoBriefing ? 'Gerando...' : 'Sintetizar'}</span>
          </button>
        </div>
        {briefing && (
          <p className="text-on-primary/95 text-body-sm pt-space-xs border-t border-on-primary/10">
            <strong className="text-secondary-fixed">Diretriz:</strong> {briefing}
          </p>
        )}
      </div>

      <section className="flex flex-col mt-space-md">
        {grupos.length === 0 && (
          <p className="text-center text-on-surface-variant py-8">
            Nenhum evento registrado ainda. Use "Gravar Reunião" ou a captura rápida na Ficha Municipal.
          </p>
        )}
        {grupos.map(([mandato, eventosDoGrupo], grupoIdx) => {
          const ativo = eventosDoGrupo[0]?.mandatoAtivo;
          return (
            <div key={mandato} className={grupoIdx > 0 ? 'mt-space-md' : ''}>
              <div className="sticky top-16 z-20 py-2 bg-surface/95 backdrop-blur-sm">
                <div className="p-space-xs rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ativo ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                      <Icon name={ativo ? 'account_balance' : 'history'} size={18} />
                    </div>
                    <div className="text-label-md text-primary font-bold tracking-tight">{mandato.toUpperCase()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-label-sm font-bold ${ativo ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                    {ativo ? 'ATIVO' : 'ARQUIVADO'}
                  </span>
                </div>
              </div>

              <div className="relative pl-6 ml-2 flex flex-col gap-space-md pt-space-xs">
                <div className="absolute left-2 top-2 bottom-0 w-1 bg-primary/20 rounded-full" />
                {eventosDoGrupo.map((ev) => (
                  <div key={ev.id} className="relative flex flex-col gap-space-xs">
                    <div className="absolute -left-[27px] top-3.5 w-4 h-4 rounded-full bg-secondary ring-4 ring-surface flex items-center justify-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-secondary" />
                    </div>
                    <div className="p-space-card-padding rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-xs">
                      <div className="flex items-start justify-between gap-space-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm">
                            <span className="font-bold text-primary">{ev.data.split('-').reverse().join('/')}</span>
                            {ev.local && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Icon name="pin_drop" size={14} />
                                  {ev.local}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-headline-sm text-primary mt-0.5 flex items-center gap-1.5">
                            <Icon name={ICONE_TIPO[ev.tipo]} size={16} className="text-secondary" />
                            {ev.resumo.length > 60 ? `${ev.resumo.slice(0, 60)}…` : ev.resumo}
                          </h3>
                        </div>
                      </div>
                      {ev.participantes && (
                        <div className="flex items-center gap-space-xs p-2 rounded-lg bg-surface-container-low">
                          <Icon name="badge" size={18} className="text-on-surface-variant" />
                          <div className="text-body-sm text-on-surface truncate">{ev.participantes}</div>
                        </div>
                      )}
                      {ev.sinteseIA && (
                        <div className="p-space-xs rounded-lg bg-surface-container text-on-surface flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-primary text-label-sm">
                            <Icon name="auto_awesome" size={14} />
                            <span>Síntese da Memória (IA)</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant leading-relaxed">{ev.sinteseIA}</p>
                        </div>
                      )}
                      {ev.proximoPassoIA && (
                        <div className="pt-space-xs flex items-center justify-between">
                          <span className="text-label-sm text-on-surface-variant">Próximo passo</span>
                          <span className="text-label-sm text-primary font-semibold">{ev.proximoPassoIA}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <div className="fixed bottom-16 inset-x-0 z-40 p-screen-margin-mobile bg-surface/90 backdrop-blur-md pb-safe">
        <div className="flex items-center gap-space-xs max-w-lg mx-auto">
          <button
            onClick={onExportarPdf}
            className="flex-1 h-input-height rounded-xl bg-surface-container-highest text-primary text-label-lg flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Icon name="share" size={20} />
            <span className="truncate">Exportar Briefing</span>
          </button>
          <button
            onClick={onGravarReuniao}
            className="flex-1 h-input-height rounded-xl bg-primary text-on-primary text-label-lg flex items-center justify-center gap-1.5 shadow-md"
          >
            <Icon name="mic" size={20} className="text-secondary-fixed" />
            <span className="truncate">Gravar Reunião</span>
          </button>
        </div>
      </div>
    </div>
  );
}
