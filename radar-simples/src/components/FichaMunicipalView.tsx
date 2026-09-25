import { useEffect, useRef, useState } from 'react';
import { buscarDadosEscolares, type DadosEscolares } from '../api/censoEscolar';
import { buscarDiagnostico, Diagnostico } from '../api/diagnostico';
import { analisarPlanilha } from '../api/ia';
import { prepararTextoPlanilha, type RelatorioPlanilha } from '../utils/relatorioPlanilha';
import RelatorioPlanilhaCard from './RelatorioPlanilhaCard';
import { addEvento, getEventos, getMunicipioCrm, saveMunicipioCrm, saveResultadosMunicipio } from '../storage';
import {
  Contato,
  ESTAGIOS_FUNIL_B2G,
  EstagioFunilB2G,
  MunicipioCrm,
  MunicipioIbge,
  SolucaoOfertada,
  STATUS_SOLUCAO,
  StatusSolucao,
  municipioCrmVazio,
} from '../types';
import { compartilharOuBaixarPdf, gerarPdfDiagnostico } from '../utils/pdf';
import Icon from './Icon';
import AvaliacaoVaarCard from './AvaliacaoVaarCard';
import ComparativoEstadualCard from './ComparativoEstadualCard';
import NotaConversa from './NotaConversa';

interface FichaMunicipalViewProps {
  municipio: MunicipioIbge;
  onDespesaCliqueAnexar: () => void;
}

export default function FichaMunicipalView({ municipio, onDespesaCliqueAnexar }: FichaMunicipalViewProps) {
  const [crm, setCrm] = useState<MunicipioCrm>(municipioCrmVazio(municipio.codigoIbge));
  const [carregando, setCarregando] = useState(true);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [revisaoCarga, setRevisaoCarga] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [atualizandoCenso, setAtualizandoCenso] = useState(false);
  const [avisoCenso, setAvisoCenso] = useState<string | null>(null);
  const [censoAtual, setCensoAtual] = useState<(DadosEscolares & { codigoIbge: number }) | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [gerandoDiagnostico, setGerandoDiagnostico] = useState(false);
  const [exportandoDiagnostico, setExportandoDiagnostico] = useState(false);
  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);

  const requisicao = useRef(0);
  const requisicaoCenso = useRef(0);
  const cidadeAtual = useRef(municipio.codigoIbge);
  cidadeAtual.current = municipio.codigoIbge;

  useEffect(() => {
    const codigoIbge = municipio.codigoIbge;
    const id = ++requisicaoCenso.current;
    const vigente = () => requisicaoCenso.current === id && cidadeAtual.current === codigoIbge;
    setCensoAtual(null);
    setAtualizandoCenso(true);
    setAvisoCenso(null);
    buscarDadosEscolares(codigoIbge).then((dados) => {
      if (!vigente()) return;
      if (dados) setCensoAtual({ ...dados, codigoIbge });
      else setAvisoCenso('Sem dado publicado na edição atual. Valores históricos não serão apresentados como atuais.');
    }).catch((e: Error) => { if (vigente()) setAvisoCenso(e.message); })
      .finally(() => { if (vigente()) setAtualizandoCenso(false); });
    return () => { requisicaoCenso.current++; };
  }, [municipio.codigoIbge, revisaoCarga]);

  useEffect(() => {
    requisicao.current++;
    setGerandoDiagnostico(false);
    setExportandoDiagnostico(false);
    setErroDiagnostico(null);
    let cancelado = false;
    setCarregando(true);
    setFalhaCarga(false);
    setDiagnostico(null);
    getMunicipioCrm(municipio.codigoIbge)
      .then((existente) => {
        if (cancelado) return;
        setCrm(existente || municipioCrmVazio(municipio.codigoIbge));
        // Diagnósticos salvos são históricos. Exibir números exige nova consulta.
      })
      .catch((e: any) => { if (!cancelado) { setFalhaCarga(true); setErro(e.message || 'Falha ao carregar dados do banco'); } })
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
      requisicao.current++;
    };
  }, [municipio.codigoIbge, revisaoCarga]);

  async function salvar(atualizado: MunicipioCrm, otimista = true) {
    setSalvo(false);
    if (otimista) setCrm(atualizado);
    try {
      await saveMunicipioCrm(atualizado);
      if (!otimista) setCrm(atualizado);
      setSalvo(true);
      setErro(null);
      setTimeout(() => setSalvo(false), 2000);
      return true;
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar no banco');
      return false;
    }
  }

  async function atualizarCensoEscolar() {
    const codigoIbge = crm.codigoIbge;
    const id = ++requisicaoCenso.current;
    const vigente = () => cidadeAtual.current === codigoIbge && requisicaoCenso.current === id;
    setAtualizandoCenso(true);
    setCensoAtual(null);
    setAvisoCenso(null);
    try {
      const dados = await buscarDadosEscolares(codigoIbge);
      if (!vigente()) return;
      if (dados) {
        setCensoAtual({ ...dados, codigoIbge });
        const atualizado = { ...crm, escolasCount: dados.escolas, alunosCount: dados.alunos, censoEscolarAno: dados.ano };
        await saveMunicipioCrm(atualizado);
        if (vigente()) setCrm(atualizado);
      } else {
        setAvisoCenso('Sem dado do Censo Escolar publicado pra esse município.');
      }
    } catch (e: any) {
      if (vigente()) setAvisoCenso(e.message || 'Falha ao consultar o Censo Escolar.');
    } finally {
      if (vigente()) setAtualizandoCenso(false);
    }
  }

  async function consultarDiagnostico(exportar = false) {
    const codigoIbge = municipio.codigoIbge;
    const id = ++requisicao.current;
    const vigente = () => requisicao.current === id && cidadeAtual.current === codigoIbge;
    setGerandoDiagnostico(!exportar);
    setExportandoDiagnostico(exportar);
    setErroDiagnostico(null);
    setDiagnostico(null);
    try {
      const resultado = await buscarDiagnostico(codigoIbge);
      if (!vigente()) return;
      setDiagnostico(resultado);
      requisicaoCenso.current++;
      setAtualizandoCenso(false);
      setCensoAtual(resultado.resumo ? { ...resultado.resumo, codigoIbge } : null);
      setAvisoCenso(resultado.avisoCenso || null);
      await saveResultadosMunicipio(codigoIbge, { diagnostico: resultado });
      if (!vigente()) return;
      if (exportar) {
        const doc = gerarPdfDiagnostico(municipio, resultado);
        await compartilharOuBaixarPdf(doc, `diagnostico-${municipio.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      }
    } catch (e: any) {
      if (vigente()) setErroDiagnostico(e.message || 'Falha ao consultar o diagnóstico.');
    } finally {
      if (vigente()) { setGerandoDiagnostico(false); setExportandoDiagnostico(false); }
    }
  }

  function adicionarContato() {
    const novo: Contato = { id: crypto.randomUUID(), nome: 'Novo contato', cargo: '' };
    salvar({ ...crm, contatos: [...crm.contatos, novo] });
  }

  function atualizarContato(id: string, campos: Partial<Contato>) {
    salvar({ ...crm, contatos: crm.contatos.map((c) => (c.id === id ? { ...c, ...campos } : c)) });
  }

  function adicionarSolucao() {
    const nova: SolucaoOfertada = { id: crypto.randomUUID(), nome: 'Nova solução', descricao: '', status: 'contato_inicial' };
    salvar({ ...crm, solucoes: [...crm.solucoes, nova] });
  }

  function atualizarSolucao(id: string, campos: Partial<SolucaoOfertada>) {
    salvar({ ...crm, solucoes: crm.solucoes.map((s) => (s.id === id ? { ...s, ...campos } : s)) });
  }

  if (falhaCarga && !carregando) return <div className="pt-space-xs space-y-3">
    <p role="alert" className="text-error">{erro}</p>
    <button className="text-primary" onClick={() => setRevisaoCarga((v) => v + 1)}>Tentar carregar novamente</button>
    {!navigator.onLine && <section className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm">
      <h3 className="text-label-lg text-primary mb-3">Nota de reunião</h3>
      <NotaConversa municipio={municipio} />
    </section>}
  </div>;
  if (carregando) {
    return <p className="text-body-sm text-on-surface-variant pt-space-xs">Carregando dados do banco…</p>;
  }

  return (
    <div className="flex flex-col gap-space-md pt-space-xs pb-24">
      {erro && <p className="text-body-sm text-error">{erro}</p>}

      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <Icon name="location_city" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-headline-md text-primary tracking-tight">
                  {municipio.nome} - {municipio.uf}
                </h2>
                <button
                  onClick={() => salvar({ ...crm, prioritario: !crm.prioritario })}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-semibold ${
                    crm.prioritario ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {crm.prioritario ? 'Prioritário' : 'Marcar prioritário'}
                </button>
              </div>
              <span className="text-label-sm text-on-surface-variant tracking-wider uppercase">
                IBGE: {municipio.codigoIbge}
                {crm.macrorregiao ? ` • ${crm.macrorregiao}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <NumeroOficial
            label="Rede Escolar"
            valor={censoAtual?.codigoIbge === municipio.codigoIbge ? censoAtual.escolas : undefined}
            sufixo="escolas"
          />
          <NumeroOficial
            label="Matrículas Totais"
            valor={censoAtual?.codigoIbge === municipio.codigoIbge ? censoAtual.alunos : undefined}
            sufixo="alunos"
          />
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-label-sm text-on-surface-variant">
            {censoAtual?.codigoIbge === municipio.codigoIbge
              ? `Censo Escolar INEP ${censoAtual.ano}: edição atual verificada nesta consulta.`
              : 'Dados atuais pendentes de verificação. Registros antigos não são exibidos como atuais.'}
          </span>
          <button
            disabled={atualizandoCenso}
            onClick={atualizarCensoEscolar}
            className="text-label-sm text-secondary font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <Icon name={atualizandoCenso ? 'sync' : 'cloud_download'} size={14} className={atualizandoCenso ? 'animate-spin' : ''} />
            {atualizandoCenso ? 'Buscando…' : 'Atualizar do Censo'}
          </button>
        </div>
        {avisoCenso && <p className="text-label-sm text-on-surface-variant">{avisoCenso}</p>}
      </section>

      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="fact_check" size={18} />
            <h3 className="text-label-lg">Diagnóstico Gratuito</h3>
          </div>
          <button
            disabled={gerandoDiagnostico || exportandoDiagnostico}
            onClick={() => consultarDiagnostico()}
            className="text-label-sm text-secondary font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <Icon name={gerandoDiagnostico ? 'sync' : 'fact_check'} size={14} className={gerandoDiagnostico ? 'animate-spin' : ''} />
            {gerandoDiagnostico || exportandoDiagnostico ? 'Consultando fontes…' : diagnostico ? 'Atualizar' : 'Gerar'}
          </button>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Cidade selecionada e maiores repasses recebidos do Fundeb no estado, além de aprendizagem VAAR e IDEB. A consulta oficial pode levar até três minutos. O PDF atualiza as fontes antes de ser gerado.
        </p>
        {erroDiagnostico && <p className="text-body-sm text-error">{erroDiagnostico}</p>}
        {diagnostico && diagnostico.codigoIbge === municipio.codigoIbge && (
          <>
            {diagnostico.comparativoRepasses && <ComparativoEstadualCard comparativo={diagnostico.comparativoRepasses} />}
            {diagnostico.avisoRepasses && <p role="status" className="text-body-sm">Repasses recebidos pendentes: {diagnostico.avisoRepasses}</p>}
            {diagnostico.vaar?.comparativoAprendizagem && <ComparativoEstadualCard comparativo={diagnostico.vaar.comparativoAprendizagem} />}
            {diagnostico.vaar?.avisoComparativo && <p role="status" className="text-body-sm">Comparação VAAR pendente: {diagnostico.vaar.avisoComparativo}</p>}
            {diagnostico.comparativosIdeb?.map((comparativo) => <ComparativoEstadualCard key={comparativo.titulo} comparativo={comparativo} />)}
            {diagnostico.avisoIdeb && <p role="status" className="text-body-sm">Comparação IDEB pendente: {diagnostico.avisoIdeb}</p>}
            {diagnostico.vaar ? <AvaliacaoVaarCard vaar={diagnostico.vaar} /> : (
              <p role="status" className="text-body-sm text-on-surface-variant">VAAR pendente: {diagnostico.avisoVaar || 'Fonte oficial indisponível.'}</p>
            )}
            <p className="text-label-sm text-on-surface-variant">Consulta realizada em {new Date(diagnostico.consultadoEm!).toLocaleString('pt-BR')}.</p>
            <div className="space-y-1.5">
              {diagnostico.avisoCenso ? (
                <p className="text-body-sm text-on-surface-variant">Censo Escolar: {diagnostico.avisoCenso}</p>
              ) : diagnostico.achados.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Nenhuma inconsistência encontrada nos critérios avaliados.</p>
              ) : (
                diagnostico.achados.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-body-sm">
                    <Icon name="info" size={14} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-on-surface-variant">{a.detalhe}</span>
                  </div>
                ))
              )}
            </div>
            <button
              disabled={exportandoDiagnostico}
              onClick={() => consultarDiagnostico(true)}
              className="w-full h-10 rounded-lg bg-primary text-on-primary text-label-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Icon name={exportandoDiagnostico ? 'sync' : 'share'} size={16} className={exportandoDiagnostico ? 'animate-spin' : ''} />
              {exportandoDiagnostico ? 'Gerando PDF…' : 'Baixar / Compartilhar PDF'}
            </button>
          </>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="contacts" size={18} />
            <h3 className="text-label-lg">Contatos-Chave da Praça</h3>
          </div>
          <button onClick={adicionarContato} className="text-label-sm text-secondary font-semibold flex items-center gap-1">
            <Icon name="add" size={14} />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {crm.contatos.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low gap-2">
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <input
                  className="bg-transparent text-label-md text-primary font-bold focus:outline-none"
                  value={c.nome}
                  onChange={(e) => atualizarContato(c.id, { nome: e.target.value })}
                />
                <input
                  className="bg-transparent text-body-sm text-on-surface-variant focus:outline-none"
                  placeholder="Cargo"
                  value={c.cargo}
                  onChange={(e) => atualizarContato(c.id, { cargo: e.target.value })}
                />
                <div className="flex gap-2 mt-0.5">
                  <input
                    className="bg-surface-container-lowest rounded px-1.5 py-0.5 text-body-sm w-32 focus:outline-none"
                    placeholder="Telefone"
                    value={c.telefone || ''}
                    onChange={(e) => atualizarContato(c.id, { telefone: e.target.value })}
                  />
                  <input
                    className="bg-surface-container-lowest rounded px-1.5 py-0.5 text-body-sm w-32 focus:outline-none"
                    placeholder="WhatsApp"
                    value={c.whatsapp || ''}
                    onChange={(e) => atualizarContato(c.id, { whatsapp: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {c.telefone && (
                  <a href={`tel:${c.telefone}`} className="w-8 h-8 rounded-md bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="call" size={16} />
                  </a>
                )}
                {c.whatsapp && (
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-md bg-secondary text-on-secondary flex items-center justify-center"
                  >
                    <Icon name="chat" size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {crm.contatos.length === 0 && <p className="text-body-sm text-on-surface-variant">Nenhum contato ainda.</p>}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="conversion_path" size={18} className="text-secondary" />
            <h3 className="text-label-lg">Funil da Oportunidade B2G</h3>
          </div>
        </div>
        <div className="relative flex items-center justify-between px-2 pt-1">
          <div className="absolute left-6 right-6 top-4 h-1 bg-surface-container -z-0" />
          <div
            className="absolute left-6 top-4 h-1 bg-secondary -z-0 transition-all duration-300"
            style={{ width: `${(ESTAGIOS_FUNIL_B2G.findIndex((e) => e.value === crm.estagioFunil) / (ESTAGIOS_FUNIL_B2G.length - 1)) * 100}%` }}
          />
          {ESTAGIOS_FUNIL_B2G.map((estagio, idx) => {
            const idxAtual = ESTAGIOS_FUNIL_B2G.findIndex((e) => e.value === crm.estagioFunil);
            const concluido = idx < idxAtual;
            const atual = idx === idxAtual;
            return (
              <button
                key={estagio.value}
                type="button"
                onClick={() => salvar({ ...crm, estagioFunil: estagio.value as EstagioFunilB2G })}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-sm ${
                    concluido
                      ? 'bg-secondary text-on-secondary'
                      : atual
                        ? 'bg-primary text-on-primary ring-4 ring-secondary-container'
                        : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                  }`}
                >
                  {concluido ? <Icon name="check" size={14} /> : idx + 1}
                </div>
                <span className={`text-[11px] text-center leading-tight whitespace-nowrap ${atual ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'}`}>
                  {idx + 1}. {estagio.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant text-body-sm">
          Etapa atual: <strong className="text-primary">{ESTAGIOS_FUNIL_B2G.find((e) => e.value === crm.estagioFunil)?.label}</strong>
        </div>
        <CampoEditavelMonetario label="Valor anual estimado (R$/ano)" valor={crm.valorAnual} onSalvar={(v) => salvar({ ...crm, valorAnual: v })} />
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="inventory_2" size={18} />
            <h3 className="text-label-lg">Esteira de Soluções Ofertadas</h3>
          </div>
          <button onClick={adicionarSolucao} className="text-label-sm text-secondary font-semibold flex items-center gap-1">
            <Icon name="add" size={14} />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {crm.solucoes.map((s) => (
            <div key={s.id} className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
              <input
                className="min-w-0 flex-1 bg-transparent text-label-md text-primary font-semibold focus:outline-none"
                value={s.nome}
                onChange={(e) => atualizarSolucao(s.id, { nome: e.target.value })}
              />
              <select
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-variant text-primary-container text-label-sm font-semibold"
                value={s.status}
                onChange={(e) => atualizarSolucao(s.id, { status: e.target.value as StatusSolucao })}
              >
                {STATUS_SOLUCAO.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {crm.solucoes.length === 0 && <p className="text-body-sm text-on-surface-variant">Nenhuma solução ainda.</p>}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="payments" size={18} className="text-secondary" />
            <h3 className="text-label-lg">Custos da Praça</h3>
          </div>
          <button
            onClick={onDespesaCliqueAnexar}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-primary text-label-sm font-semibold"
          >
            <Icon name="add" size={15} />
            Anexar Recibo
          </button>
        </div>
      </div>

      <RegistroRapidoIA
        key={municipio.codigoIbge}
        municipio={municipio}
        onEventoSalvo={() => setSalvo(true)}
      />

      {salvo && <p className="text-label-sm text-green-600 text-center">Salvo.</p>}
    </div>
  );
}

function NumeroOficial({
  label,
  valor,
  sufixo,
}: {
  label: string;
  valor: number | undefined;
  sufixo: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-headline-md text-primary font-bold">{valor === undefined ? '—' : valor.toLocaleString('pt-BR')}</span>
        <span className="text-label-md text-on-surface-variant">{sufixo}</span>
      </div>
    </div>
  );
}

function CampoEditavelMonetario({ label, valor, onSalvar }: { label: string; valor: number | undefined; onSalvar: (v: number | undefined) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-sm text-on-surface-variant">{label}</label>
      <input
        type="number"
        min={0}
        className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md text-on-surface focus:outline-none"
        value={valor ?? ''}
        onChange={(e) => onSalvar(e.target.value ? Number(e.target.value) : undefined)}
      />
    </div>
  );
}

function RegistroRapidoIA({ municipio, onEventoSalvo }: {
  municipio: MunicipioIbge;
  onEventoSalvo: () => void;
}) {
  const [modo, setModo] = useState<'nota' | 'planilha'>('nota');
  return <section className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3.5">
    <div className="flex items-center gap-1.5 text-primary">
      <Icon name="smart_toy" size={20} className="text-secondary" />
      <h3 className="text-label-lg">Registro Rápido de Campo</h3>
    </div>
    <label className="text-label-sm text-on-surface-variant block" htmlFor="tipo-registro">Tipo de registro</label>
    <select id="tipo-registro" value={modo} onChange={(e) => setModo(e.target.value as 'nota' | 'planilha')}
      className="w-full rounded-lg bg-surface-container-low p-2 text-primary">
      <option value="nota">Nota de reunião</option>
      <option value="planilha">Dados de planilha — gerar relatório</option>
    </select>
    {modo === 'nota'
      ? <NotaConversa municipio={municipio} />
      : <RegistroPlanilha municipio={municipio} onEventoSalvo={onEventoSalvo} />}
  </section>;
}

function RegistroPlanilha({ municipio, onEventoSalvo }: { municipio: MunicipioIbge; onEventoSalvo: () => void }) {
  const chave = `radar_ts_planilha_${municipio.codigoIbge}`;
  const [nota, setNota] = useState(() => {
    try {
      const atual = localStorage.getItem(chave);
      if (atual !== null) return atual;
      const antigo = JSON.parse(localStorage.getItem(`radar_ts_registro_rapido_${municipio.codigoIbge}`) || 'null');
      return antigo?.modo === 'planilha' && typeof antigo.nota === 'string' ? antigo.nota : '';
    } catch { return ''; }
  });
  const [relatorio, setRelatorio] = useState<RelatorioPlanilha | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    getEventos(municipio.codigoIbge).then((eventos) => {
      if (cancelado) return;
      const ultimo = eventos.filter((e) => e.relatorioPlanilha)
        .sort((a, b) => (b.criadaEm || b.data).localeCompare(a.criadaEm || a.data))[0];
      if (ultimo?.relatorioPlanilha) setRelatorio(ultimo.relatorioPlanilha);
    }).catch((e) => { if (!cancelado) setErro(e.message || 'Falha ao recuperar relatório.'); });
    return () => { cancelado = true; };
  }, [municipio.codigoIbge]);
  function editar(texto: string) {
    setNota(texto);
    try { localStorage.setItem(chave, texto); }
    catch { setErro('Não foi possível guardar o rascunho neste aparelho.'); }
  }
  async function processar() {
    if (!nota.trim() || processando) return;
    setProcessando(true); setErro(null);
    try {
      const texto = prepararTextoPlanilha(nota);
      const analise = navigator.onLine ? await analisarPlanilha(texto) : null;
      await addEvento({
        id: crypto.randomUUID(), codigoIbge: municipio.codigoIbge, tipo: 'documento',
        data: new Date().toISOString().slice(0, 10), criadaEm: new Date().toISOString(),
        resumo: analise?.titulo || 'Planilha registrada offline — análise pendente',
        textoPlanilha: texto, relatorioPlanilha: analise || undefined,
        anexos: [], mandato: 'Atual', mandatoAtivo: true,
      });
      setRelatorio(analise); onEventoSalvo(); editar('');
    } catch (e: any) { setErro(e.message || 'Falha ao processar a planilha.'); }
    finally { setProcessando(false); }
  }
  return <div className="space-y-3">
    <label htmlFor="texto-planilha" className="text-label-sm text-on-surface-variant block">Cole os cabeçalhos e as linhas da planilha</label>
    <textarea id="texto-planilha" rows={7} disabled={processando} value={nota} onChange={(e) => editar(e.target.value)}
      className="w-full rounded-lg bg-surface-container-low p-3 text-body-md text-primary resize-y"
      placeholder={'Escola\tMatrículas\nEscola A\t120\nEscola B\t85'} />
    <p className="text-label-sm text-on-surface-variant">Inclua unidades e período nos cabeçalhos. O relatório ficará salvo na Memória da Conta.</p>
    <button disabled={processando || !nota.trim()} onClick={processar}
      className="w-full h-12 rounded-lg bg-primary text-on-primary text-label-lg disabled:opacity-50">{processando ? 'Processando e salvando…' : 'Gerar e salvar relatório com IA'}</button>
    {erro && <p className="text-body-sm text-error">{erro}</p>}
    {relatorio && <RelatorioPlanilhaCard relatorio={relatorio} />}
  </div>;
}
