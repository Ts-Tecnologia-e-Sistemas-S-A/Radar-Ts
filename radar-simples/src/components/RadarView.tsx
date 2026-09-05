import { useEffect, useMemo, useState } from 'react';
import { getDespesas, getMunicipiosCrm, getPontosRota } from '../storage';
import { ESTAGIOS_FUNIL_B2G, MunicipioCrm, MunicipioIbge } from '../types';
import { isUrgente } from '../utils/urgencia';
import { calcularKmHoje } from '../utils/rota';
import Icon from './Icon';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface LinhaMunicipio {
  municipio: MunicipioIbge;
  crm: MunicipioCrm;
}

interface RadarViewProps {
  municipios: MunicipioIbge[];
  onAbrirMunicipio: (municipio: MunicipioIbge) => void;
  onNovaDespesa: () => void;
}

export default function RadarView({ municipios, onAbrirMunicipio, onNovaDespesa }: RadarViewProps) {
  const [crmPorCodigo, setCrmPorCodigo] = useState<Record<number, MunicipioCrm>>({});
  const [despesasHoje, setDespesasHoje] = useState(0);
  const [kmHoje, setKmHoje] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'urgentes'>('todos');

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    Promise.all([getMunicipiosCrm(), getDespesas(), getPontosRota()])
      .then(([crm, despesas, pontos]) => {
        if (cancelado) return;
        setCrmPorCodigo(crm);
        const hojeISO = new Date().toISOString().slice(0, 10);
        setDespesasHoje(despesas.filter((d) => d.data === hojeISO).reduce((soma, d) => soma + d.valor, 0));
        setKmHoje(calcularKmHoje(pontos));
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

  const linhas: LinhaMunicipio[] = useMemo(() => {
    const alvo = normalizar(busca.trim());
    return municipios
      .map((municipio) => ({ municipio, crm: crmPorCodigo[municipio.codigoIbge] }))
      .filter((l): l is LinhaMunicipio => Boolean(l.crm))
      .filter((l) => !alvo || normalizar(l.municipio.nome).includes(alvo) || normalizar(l.municipio.uf).includes(alvo))
      .filter((l) => filtro !== 'urgentes' || isUrgente(l.crm))
      .sort((a, b) => {
        if (a.crm.prioritario !== b.crm.prioritario) return a.crm.prioritario ? -1 : 1;
        return a.municipio.nome.localeCompare(b.municipio.nome);
      });
  }, [municipios, crmPorCodigo, busca, filtro]);

  const urgentesCount = useMemo(
    () => municipios.filter((m) => crmPorCodigo[m.codigoIbge] && isUrgente(crmPorCodigo[m.codigoIbge])).length,
    [municipios, crmPorCodigo]
  );

  return (
    <div className="flex flex-col gap-space-sm pt-space-xs pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-headline-lg-mobile text-primary tracking-tight">Radar de Praças</h2>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-primary">{municipios.length} praças ativas</span>
            <span className="inline-block w-1 h-1 rounded-full bg-outline-variant" />
            <span className="text-secondary font-semibold">{urgentesCount} com ações atrasadas</span>
          </p>
        </div>
      </div>

      <div className="relative flex items-center w-full">
        <span className="absolute left-3.5 text-on-surface-variant pointer-events-none">
          <Icon name="search" size={20} />
        </span>
        <input
          className="w-full h-12 pl-11 pr-3 bg-surface-container-lowest text-on-surface text-body-md rounded-xl shadow-sm focus:outline-none placeholder:text-outline-variant"
          placeholder="Buscar município ou UF..."
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <button
        onClick={onNovaDespesa}
        className="w-full h-10 px-3 rounded-xl bg-secondary text-on-secondary flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-label-md font-semibold"
      >
        <Icon name="receipt_long" size={18} />
        <span>Despesa / Ler Cupom</span>
      </button>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-3.5 py-1.5 rounded-full text-label-md whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 ${
            filtro === 'todos' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface'
          }`}
        >
          <span>Todos</span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container-lowest/20 text-label-sm">
            {municipios.length}
          </span>
        </button>
        <button
          onClick={() => setFiltro('urgentes')}
          className={`px-3.5 py-1.5 rounded-full text-label-md whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 ${
            filtro === 'urgentes' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface'
          }`}
        >
          <span>Ações atrasadas</span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container-lowest/20 text-label-sm">
            {urgentesCount}
          </span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-sm shadow-sm flex items-center gap-space-sm">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <Icon name="directions_car" size={18} className="text-on-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-sm uppercase tracking-wider text-secondary font-semibold">
            Ritmo de Campo • Hoje
          </span>
          <div className="flex items-center gap-2 mt-0.5 text-label-sm font-semibold text-primary flex-wrap">
            <span className="flex items-center gap-1">
              🚗 Km rodados: <span className="text-secondary">{kmHoje.toFixed(0)} km</span>
            </span>
            <span className="text-outline-variant">|</span>
            <span className="flex items-center gap-1">
              💳 Despesas: <span className="text-secondary">R$ {despesasHoje.toFixed(2)}</span>
            </span>
          </div>
        </div>
      </div>

      {carregando && <p className="text-body-sm text-on-surface-variant">Carregando…</p>}
      {erro && <p className="text-body-sm text-error">{erro}</p>}

      <div className="flex flex-col gap-space-sm">
        {linhas.map(({ municipio, crm }) => {
          const contatoPrincipal = crm.contatos[0];
          const urgente = isUrgente(crm);
          return (
            <article
              key={municipio.codigoIbge}
              onClick={() => onAbrirMunicipio(municipio)}
              className="bg-surface-container-lowest rounded-xl p-card-padding shadow-sm flex flex-col gap-2.5 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-space-xs">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-headline-sm text-primary truncate">{municipio.nome}</span>
                    <span className="text-label-sm text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded">
                      {municipio.uf}
                    </span>
                  </div>
                  {(crm.escolasCount !== undefined || crm.alunosCount !== undefined) && (
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm mt-0.5">
                      <Icon name="school" size={14} />
                      {crm.alunosCount !== undefined && <span>{crm.alunosCount.toLocaleString('pt-BR')} alunos</span>}
                      {crm.escolasCount !== undefined && crm.alunosCount !== undefined && (
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      )}
                      {crm.escolasCount !== undefined && <span>{crm.escolasCount} escolas</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {crm.prioritario && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold flex items-center gap-1">
                      <Icon name="grade" size={12} />
                      Prioritário
                    </span>
                  )}
                  <Icon name="chevron_right" size={20} className="text-outline-variant" />
                </div>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-primary text-label-md">
                  <Icon name="conversion_path" size={14} className="text-secondary" />
                  <span className="font-semibold">Etapa:</span>
                  <span className="text-on-surface-variant">
                    {ESTAGIOS_FUNIL_B2G.find((e) => e.value === crm.estagioFunil)?.label}
                  </span>
                </span>
              </div>

              {crm.proximaAcao ? (
                <div
                  className={`rounded-lg p-2.5 flex items-center justify-between gap-2 ${
                    urgente ? 'bg-error-container/40' : 'bg-secondary-container/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${urgente ? 'bg-error' : 'bg-secondary'}`}>
                      <Icon name={urgente ? 'priority_high' : 'schedule'} size={16} className={urgente ? 'text-on-error' : 'text-on-secondary'} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-label-sm font-semibold ${urgente ? 'text-error uppercase tracking-wider' : 'text-secondary'}`}>
                        {urgente ? `Atrasado desde ${crm.proximaAcao.data.split('-').reverse().join('/')}` : `${crm.proximaAcao.data.split('-').reverse().join('/')}${crm.proximaAcao.hora ? ` às ${crm.proximaAcao.hora}` : ''}${crm.proximaAcao.presencial ? ' (Presencial)' : ''}`}
                      </span>
                      <p className="text-body-sm text-primary font-semibold truncate leading-tight">
                        {crm.proximaAcao.descricao}
                      </p>
                    </div>
                  </div>
                  {contatoPrincipal && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {contatoPrincipal.telefone && (
                        <a
                          href={`tel:${contatoPrincipal.telefone}`}
                          className="w-9 h-9 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Icon name="call" size={18} />
                        </a>
                      )}
                      {contatoPrincipal.whatsapp && (
                        <a
                          href={`https://wa.me/${contatoPrincipal.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Icon name="chat" size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Sem próxima ação agendada.</p>
              )}
            </article>
          );
        })}
        {!carregando && linhas.length === 0 && (
          <p className="text-center text-on-surface-variant py-8">
            Nenhum município encontrado. Toque em "Nova Praça" para adicionar.
          </p>
        )}
      </div>
    </div>
  );
}
