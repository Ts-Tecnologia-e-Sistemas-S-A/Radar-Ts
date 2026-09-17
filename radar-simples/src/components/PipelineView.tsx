import { useEffect, useMemo, useState } from 'react';
import { getMunicipiosCrm } from '../storage';
import { ESTAGIOS_FUNIL_B2G, MunicipioCrm, MunicipioIbge } from '../types';
import { forecastPonderado } from '../utils/forecast';
import Icon from './Icon';

interface PipelineViewProps {
  municipios: MunicipioIbge[];
  onAbrirMunicipio: (municipio: MunicipioIbge) => void;
  onVerRelatorio: () => void;
}

export default function PipelineView({ municipios, onAbrirMunicipio, onVerRelatorio }: PipelineViewProps) {
  const [crmPorCodigo, setCrmPorCodigo] = useState<Record<number, MunicipioCrm>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    getMunicipiosCrm()
      .then((crm) => {
        if (!cancelado) setCrmPorCodigo(crm);
      })
      .catch((e: any) => {
        if (!cancelado) setErro(e.message || 'Falha ao carregar dados do banco');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [municipios]);

  const linhas = useMemo(
    () =>
      municipios
        .map((municipio) => ({ municipio, crm: crmPorCodigo[municipio.codigoIbge] }))
        .filter((l): l is { municipio: MunicipioIbge; crm: MunicipioCrm } => Boolean(l.crm)),
    [municipios, crmPorCodigo]
  );

  const totalPipeline = linhas.reduce((soma, l) => soma + (l.crm.valorAnual || 0), 0);
  const totalPonderado = linhas.reduce((soma, l) => soma + forecastPonderado(l.crm.valorAnual, l.crm.estagioFunil), 0);

  return (
    <div className="flex flex-col gap-space-lg pt-space-xs pb-24">
      <section className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-headline-md text-primary tracking-tight">Pipeline B2G</h2>
            <p className="text-body-sm text-on-surface-variant">Visão macro &amp; previsão de contratos</p>
          </div>
          <button
            onClick={onVerRelatorio}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container text-primary text-label-sm font-semibold shadow-sm"
          >
            <Icon name="summarize" size={14} />
            <span>Balanço da Rota</span>
          </button>
        </div>

        <div className="bg-primary-container text-on-primary rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between text-label-sm text-primary-fixed-dim">
            <span>Forecast ponderado por etapa</span>
            <span>{linhas.length} oportunidades</span>
          </div>
          <div className="grid grid-cols-2 gap-space-xs">
            <div className="flex flex-col">
              <span className="text-label-sm text-on-primary-container uppercase tracking-wider">Total em Pipeline</span>
              <span className="text-headline-lg-mobile text-white font-bold leading-tight">
                R$ {(totalPipeline / 1000).toFixed(0)}k
              </span>
              <span className="text-body-sm text-on-primary-container">R$ {totalPipeline.toLocaleString('pt-BR')} / ano</span>
            </div>
            <div className="flex flex-col bg-surface-container-lowest/10 p-2.5 rounded-lg">
              <span className="text-label-sm text-primary-fixed-dim uppercase tracking-wider">Prev. Ponderada</span>
              <span className="text-headline-md text-secondary-fixed font-bold leading-tight">
                R$ {totalPonderado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {carregando && <p className="text-body-sm text-on-surface-variant">Carregando…</p>}
      {erro && <p className="text-body-sm text-error">{erro}</p>}

      {ESTAGIOS_FUNIL_B2G.map((estagio, idx) => {
        const doEstagio = linhas.filter((l) => l.crm.estagioFunil === estagio.value);
        const totalEstagio = doEstagio.reduce((soma, l) => soma + (l.crm.valorAnual || 0), 0);
        return (
          <section key={estagio.value} className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-surface-container-highest text-primary flex items-center justify-center text-label-sm font-bold">
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-headline-sm text-primary">{estagio.label}</span>
                  <span className="text-body-sm text-on-surface-variant">{estagio.prazoMedio}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-label-lg text-primary">R$ {totalEstagio.toLocaleString('pt-BR')}</span>
                <span className="text-label-sm text-on-surface-variant">{doEstagio.length} cidades</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              {doEstagio.map(({ municipio, crm }) => (
                <button
                  key={municipio.codigoIbge}
                  onClick={() => onAbrirMunicipio(municipio)}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs text-left"
                >
                  <div className="flex items-start justify-between gap-space-xs">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-headline-sm text-primary truncate">{municipio.nome}</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-label-sm font-semibold">
                          {municipio.uf}
                        </span>
                      </div>
                      {crm.alunosCount !== undefined && (
                        <span className="text-body-sm text-on-surface-variant">{crm.alunosCount.toLocaleString('pt-BR')} alunos</span>
                      )}
                    </div>
                    {crm.valorAnual !== undefined && (
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-label-lg text-primary font-bold">R$ {crm.valorAnual.toLocaleString('pt-BR')}</span>
                        <span className="text-label-sm text-on-surface-variant">/ano</span>
                      </div>
                    )}
                  </div>
                  {crm.solucoes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {crm.solucoes.map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-label-sm">
                          {s.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {doEstagio.length === 0 && <p className="text-body-sm text-on-surface-variant px-1">Nenhum município nesta etapa.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
