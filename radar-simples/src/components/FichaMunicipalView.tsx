import { useEffect, useState } from 'react';
import { buscarDadosEscolares } from '../api/censoEscolar';
import { buscarDiagnostico, Diagnostico } from '../api/diagnostico';
import { ContatoDetectado, sintetizarNota } from '../api/ia';
import { addEvento, getMunicipioCrm, saveMunicipioCrm } from '../storage';
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

interface FichaMunicipalViewProps {
  municipio: MunicipioIbge;
  onDespesaCliqueAnexar: () => void;
}

export default function FichaMunicipalView({ municipio, onDespesaCliqueAnexar }: FichaMunicipalViewProps) {
  const [crm, setCrm] = useState<MunicipioCrm>(municipioCrmVazio(municipio.codigoIbge));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [atualizandoCenso, setAtualizandoCenso] = useState(false);
  const [avisoCenso, setAvisoCenso] = useState<string | null>(null);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [gerandoDiagnostico, setGerandoDiagnostico] = useState(false);
  const [exportandoDiagnostico, setExportandoDiagnostico] = useState(false);
  const [erroDiagnostico, setErroDiagnostico] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    getMunicipioCrm(municipio.codigoIbge)
      .then((existente) => {
        if (!cancelado) setCrm(existente || municipioCrmVazio(municipio.codigoIbge));
      })
      .catch((e: any) => !cancelado && setErro(e.message || 'Falha ao carregar dados do banco'))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [municipio.codigoIbge]);

  async function salvar(atualizado: MunicipioCrm) {
    setCrm(atualizado);
    try {
      await saveMunicipioCrm(atualizado);
      setSalvo(true);
      setErro(null);
      setTimeout(() => setSalvo(false), 2000);
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar no banco');
    }
  }

  async function atualizarCensoEscolar() {
    setAtualizandoCenso(true);
    setAvisoCenso(null);
    try {
      const dados = await buscarDadosEscolares(crm.codigoIbge);
      if (dados) {
        await salvar({ ...crm, escolasCount: dados.escolas, alunosCount: dados.alunos, censoEscolarAno: dados.ano });
      } else {
        setAvisoCenso('Sem dado do Censo Escolar publicado pra esse município.');
      }
    } catch (e: any) {
      setAvisoCenso(e.message || 'Falha ao consultar o Censo Escolar.');
    } finally {
      setAtualizandoCenso(false);
    }
  }

  async function gerarDiagnostico() {
    setGerandoDiagnostico(true);
    setErroDiagnostico(null);
    try {
      const resultado = await buscarDiagnostico(municipio.codigoIbge);
      setDiagnostico(resultado);
    } catch (e: any) {
      setErroDiagnostico(e.message || 'Falha ao gerar diagnóstico.');
    } finally {
      setGerandoDiagnostico(false);
    }
  }

  async function exportarDiagnostico() {
    if (!diagnostico) return;
    setExportandoDiagnostico(true);
    try {
      const doc = gerarPdfDiagnostico(municipio, diagnostico);
      await compartilharOuBaixarPdf(doc, `diagnostico-${municipio.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (e: any) {
      setErroDiagnostico(e.message || 'Falha ao gerar PDF.');
    } finally {
      setExportandoDiagnostico(false);
    }
  }

  function adicionarContato() {
    const novo: Contato = { id: crypto.randomUUID(), nome: 'Novo contato', cargo: '' };
    salvar({ ...crm, contatos: [...crm.contatos, novo] });
  }

  // Confirmado pelo vendedor a partir de um contato que a IA detectou numa
  // nota/gravação — nunca grava sozinho, sempre passa pela revisão humana
  // primeiro (ver RegistroRapidoIA).
  function adicionarContatoDetectado(dados: ContatoDetectado) {
    const novo: Contato = {
      id: crypto.randomUUID(),
      nome: dados.nome || 'Novo contato',
      cargo: dados.cargo || '',
      telefone: dados.telefone || undefined,
    };
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
          <CampoEditavel
            label="Rede Escolar"
            valor={crm.escolasCount}
            sufixo="escolas"
            onSalvar={(v) => salvar({ ...crm, escolasCount: v, censoEscolarAno: undefined })}
          />
          <CampoEditavel
            label="Matrículas Totais"
            valor={crm.alunosCount}
            sufixo="alunos"
            onSalvar={(v) => salvar({ ...crm, alunosCount: v, censoEscolarAno: undefined })}
          />
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-label-sm text-on-surface-variant">
            {crm.censoEscolarAno
              ? `Fonte: Censo Escolar INEP ${crm.censoEscolarAno} (rede municipal)`
              : 'Números digitados manualmente'}
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
          {!diagnostico && (
            <button
              disabled={gerandoDiagnostico}
              onClick={gerarDiagnostico}
              className="text-label-sm text-secondary font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              <Icon name={gerandoDiagnostico ? 'sync' : 'fact_check'} size={14} className={gerandoDiagnostico ? 'animate-spin' : ''} />
              {gerandoDiagnostico ? 'Analisando…' : 'Gerar'}
            </button>
          )}
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Relatório em PDF pra entregar pro município — dados oficiais do Censo Escolar, com pontos de atenção sobre o cadastro que podem afetar o repasse do Fundeb.
        </p>
        {erroDiagnostico && <p className="text-body-sm text-error">{erroDiagnostico}</p>}
        {diagnostico && (
          <>
            <div className="space-y-1.5">
              {diagnostico.achados.length === 0 ? (
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
              onClick={exportarDiagnostico}
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
        municipio={municipio}
        crm={crm}
        onEventoSalvo={() => setSalvo(true)}
        onContatoDetectado={adicionarContatoDetectado}
      />

      {salvo && <p className="text-label-sm text-green-600 text-center">Salvo.</p>}
    </div>
  );
}

function CampoEditavel({
  label,
  valor,
  sufixo,
  onSalvar,
}: {
  label: string;
  valor: number | undefined;
  sufixo: string;
  onSalvar: (v: number | undefined) => void;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          min={0}
          className="w-full bg-transparent text-headline-md text-primary font-bold focus:outline-none"
          value={valor ?? ''}
          onChange={(e) => onSalvar(e.target.value ? Number(e.target.value) : undefined)}
        />
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

function RegistroRapidoIA({
  municipio,
  crm,
  onEventoSalvo,
  onContatoDetectado,
}: {
  municipio: MunicipioIbge;
  crm: MunicipioCrm;
  onEventoSalvo: () => void;
  onContatoDetectado: (contato: ContatoDetectado) => void;
}) {
  const [nota, setNota] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ combinado: string; proximoPasso: string } | null>(null);
  const [contatoSugerido, setContatoSugerido] = useState<ContatoDetectado | null>(null);

  async function processar() {
    if (!nota.trim()) return;
    setProcessando(true);
    setErro(null);
    try {
      const sintese = await sintetizarNota(nota.trim());
      setResultado(sintese);
      if (sintese.contatoDetectado?.nome || sintese.contatoDetectado?.telefone) {
        setContatoSugerido(sintese.contatoDetectado);
      }
      await addEvento({
        id: crypto.randomUUID(),
        codigoIbge: municipio.codigoIbge,
        tipo: 'reuniao',
        data: new Date().toISOString().slice(0, 10),
        resumo: nota.trim(),
        sinteseIA: sintese.combinado,
        proximoPassoIA: sintese.proximoPasso,
        anexos: [],
        mandato: 'Atual',
        mandatoAtivo: true,
      });
      onEventoSalvo();
      setNota('');
    } catch (e: any) {
      setErro(e.message || 'Falha ao processar com IA');
    } finally {
      setProcessando(false);
    }
  }

  function confirmarContato() {
    if (!contatoSugerido) return;
    onContatoDetectado(contatoSugerido);
    setContatoSugerido(null);
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-primary">
          <Icon name="smart_toy" size={20} className="text-secondary" />
          <h3 className="text-label-lg">Registro Rápido de Campo</h3>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-label-sm text-on-surface-variant block">O que aconteceu na conversa?</label>
        <textarea
          className="w-full rounded-lg bg-surface-container-low p-3 text-body-md text-primary focus:outline-none resize-none"
          placeholder="Ex: Reunião com Secretário Herbert. Interessado no módulo do Censo, pediu demonstração na próxima terça..."
          rows={3}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>
      <button
        disabled={processando || !nota.trim()}
        onClick={processar}
        className="w-full h-12 rounded-lg bg-primary text-on-primary text-label-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Icon name={processando ? 'sync' : 'bolt'} size={18} className={processando ? 'animate-spin' : ''} />
        <span>{processando ? 'Sintetizando com IA...' : 'Salvar e Processar com IA'}</span>
      </button>
      {erro && <p className="text-body-sm text-error">{erro}</p>}
      {resultado && (
        <div className="rounded-xl bg-secondary-container/30 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="verified" size={16} />
            <span className="text-label-sm uppercase tracking-wider font-semibold">Síntese gerada pela IA</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-lowest space-y-1">
            <span className="text-label-sm uppercase font-bold text-primary">O que ficou combinado:</span>
            <p className="text-body-md text-on-surface">{resultado.combinado}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-lowest space-y-1">
            <span className="text-label-sm uppercase font-bold text-primary">Próximo passo sugerido:</span>
            <p className="text-body-md text-on-surface">{resultado.proximoPasso}</p>
          </div>
        </div>
      )}
      {contatoSugerido && (
        <div className="rounded-xl bg-primary-container/40 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Icon name="person_add" size={16} />
            <span className="text-label-sm uppercase tracking-wider font-semibold">Contato detectado na nota</span>
          </div>
          <p className="text-body-md text-on-surface">
            {contatoSugerido.nome || 'Sem nome identificado'}
            {contatoSugerido.cargo ? ` — ${contatoSugerido.cargo}` : ''}
            {contatoSugerido.telefone ? ` — ${contatoSugerido.telefone}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setContatoSugerido(null)} className="flex-1 h-10 rounded-lg bg-surface-container-lowest text-on-surface-variant text-label-sm font-semibold">
              Ignorar
            </button>
            <button onClick={confirmarContato} className="flex-1 h-10 rounded-lg bg-primary text-on-primary text-label-sm font-semibold">
              Salvar em Contatos-Chave
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
