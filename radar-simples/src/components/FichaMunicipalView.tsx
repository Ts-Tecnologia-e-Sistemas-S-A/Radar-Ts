import { useEffect, useRef, useState } from 'react';
import { buscarDadosEscolares, type DadosEscolares } from '../api/censoEscolar';
import { buscarDiagnostico, Diagnostico } from '../api/diagnostico';
import { cancelarTarefaSeExistir, getMunicipioCrm, saveMunicipioCrm, saveResultadosMunicipio, saveStandby } from '../storage';
import {
  Contato,
  ESTAGIOS_FUNIL_B2G,
  EstagioFunilB2G,
  MOTIVOS_ESPERA,
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
import { entrarEmStandby, marcarComoVisitada, reativarOportunidade } from '../utils/pipeline';
import { dataLocal } from '../utils/agenda';
import { dataHoraBr } from '../utils/data';

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
    atualizado = atualizado.contatos.length > 0 ? marcarComoVisitada(atualizado) : atualizado;
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

  async function alterarEstagio(estagio: EstagioFunilB2G) {
    if (estagio === 'standby') {
      try {
        const entrada = crm.contatos.length > 0 ? marcarComoVisitada(crm) : crm;
        const resultado = entrarEmStandby(entrada, municipio.nome);
        await saveStandby(resultado.crm, resultado.tarefa);
        setCrm(resultado.crm); setErro(null); setSalvo(true);
      } catch (e: any) { setErro(e.message); }
      return;
    }
    const estavaEmStandby = crm.estagioFunil === 'standby';
    const base = estavaEmStandby ? reativarOportunidade(crm) : crm;
    const visitada = ['visita', 'qualificacao', 'diagnostico', 'proposta', 'juridico', 'homologacao', 'contratado'].includes(estagio)
      ? marcarComoVisitada(base, dataLocal())
      : base;
    if (await salvar({ ...visitada, estagioFunil: estagio }) && estavaEmStandby) {
      await cancelarTarefaSeExistir(`reativacao-standby-${crm.codigoIbge}`);
    }
  }

  if (falhaCarga && !carregando) return <div className="pt-space-xs space-y-3">
    <p role="alert" className="text-error">{erro}</p>
    <button className="text-primary" onClick={() => setRevisaoCarga((v) => v + 1)}>Tentar carregar novamente</button>
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
            <p className="text-label-sm text-on-surface-variant">Consulta realizada em {dataHoraBr(diagnostico.consultadoEm!)}.</p>
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
        <label className="block text-label-sm text-on-surface-variant">Etapa atual
          <select
            className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary"
            value={crm.estagioFunil}
            onChange={(e) => void alterarEstagio(e.target.value as EstagioFunilB2G)}
          >
            {ESTAGIOS_FUNIL_B2G.map((estagio) => <option key={estagio.value} value={estagio.value}>{estagio.label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
          <label className="text-label-sm text-on-surface-variant">Porte populacional
            <select className="mt-1 w-full h-10 px-2 rounded-lg bg-surface-container-low text-primary" value={crm.portePopulacional || ''} onChange={(e) => salvar({ ...crm, portePopulacional: e.target.value as MunicipioCrm['portePopulacional'] || undefined })}>
              <option value="">Não informado</option><option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option>
            </select>
          </label>
          <CampoEditavelNumero label="Estimativa de alunos" valor={crm.alunosCount} onSalvar={(v) => salvar({ ...crm, alunosCount: v })} />
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3 text-label-md text-primary">
            <input type="checkbox" checked={crm.visitada} onChange={(e) => salvar(e.target.checked ? marcarComoVisitada(crm, dataLocal()) : { ...crm, visitada: false, dataPrimeiraVisita: undefined, dataUltimaVisita: undefined })} />
            Cidade visitada
          </label>
          <label className="text-label-sm text-on-surface-variant">Data da primeira visita
            <input type="date" className="mt-1 w-full h-10 px-2 rounded-lg bg-surface-container-low text-primary" value={crm.dataPrimeiraVisita || ''} onChange={(e) => salvar({ ...crm, visitada: Boolean(e.target.value) || crm.visitada, dataPrimeiraVisita: e.target.value || undefined })} />
          </label>
        </div>
        <CampoEditavelMonetario label="Valor anual estimado (R$/ano)" valor={crm.valorAnual} onSalvar={(v) => salvar({ ...crm, valorAnual: v })} />
        <div className="border-t border-surface-container pt-3 space-y-2">
          <h4 className="text-label-lg text-primary">Em Espera / Nutrição</h4>
          <label className="block text-label-sm text-on-surface-variant">Data de reativação
            <input type="date" className="mt-1 w-full h-10 px-2 rounded-lg bg-surface-container-low text-primary" value={crm.dataReativacao || ''} onChange={(e) => setCrm({ ...crm, dataReativacao: e.target.value || undefined })} />
          </label>
          <label className="block text-label-sm text-on-surface-variant">Motivo da espera
            <select className="mt-1 w-full h-10 px-2 rounded-lg bg-surface-container-low text-primary" value={crm.motivoEspera || ''} onChange={(e) => setCrm({ ...crm, motivoEspera: e.target.value as MunicipioCrm['motivoEspera'] || undefined })}>
              <option value="">Selecione</option>{MOTIVOS_ESPERA.map((motivo) => <option key={motivo.value} value={motivo.value}>{motivo.label}</option>)}
            </select>
          </label>
          <label className="block text-label-sm text-on-surface-variant">Detalhes para a retomada
            <textarea rows={2} className="mt-1 w-full rounded-lg bg-surface-container-low p-2 text-primary" value={crm.detalhesEspera || ''} onChange={(e) => setCrm({ ...crm, detalhesEspera: e.target.value || undefined })} />
          </label>
          <button type="button" onClick={() => void alterarEstagio('standby')} className="w-full min-h-11 rounded-lg bg-secondary text-on-secondary px-3">
            {crm.estagioFunil === 'standby' ? 'Atualizar espera e lembrete' : 'Colocar em espera'}
          </button>
          {crm.estagioFunil === 'standby' && <button type="button" onClick={() => void alterarEstagio(crm.estagioAntesStandby || 'qualificacao')} className="w-full min-h-11 rounded-lg border border-primary text-primary px-3">Reativar agora</button>}
        </div>
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

      <section className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-1.5 text-primary">
          <Icon name="edit_note" size={20} className="text-secondary" />
          <h3 className="text-label-lg">Notas da reunião</h3>
        </div>
        <NotaConversa key={municipio.codigoIbge} municipio={municipio} />
      </section>

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

function CampoEditavelNumero({ label, valor, onSalvar }: { label: string; valor: number | undefined; onSalvar: (v: number | undefined) => void }) {
  return <label className="text-label-sm text-on-surface-variant">{label}<input type="number" min={0} className="mt-1 w-full h-10 px-2 rounded-lg bg-surface-container-low text-primary" value={valor ?? ''} onChange={(e) => onSalvar(e.target.value ? Number(e.target.value) : undefined)} /></label>;
}

