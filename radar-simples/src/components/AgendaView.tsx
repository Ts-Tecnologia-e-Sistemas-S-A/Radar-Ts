import { useEffect, useState, type FormEvent } from 'react';
import { sugerirTarefa } from '../api/ia';
import { getEventos, getTarefas, saveTarefa, setStatusTarefa } from '../storage';
import type { MunicipioIbge } from '../types';
import { dataLocal, tarefaAtrasada, TIPOS_TAREFA, type Tarefa, type TipoTarefa } from '../utils/agenda';

function novaTarefa(codigoIbge: number): Tarefa {
  return { id: crypto.randomUUID(), codigoIbge, tipo: 'ligar', descricao: '', data: dataLocal(), hora: '', status: 'pendente', origem: 'manual', criadaEm: new Date().toISOString() };
}

export default function AgendaView({ municipios, municipioAtivo }: { municipios: MunicipioIbge[]; municipioAtivo: MunicipioIbge | null }) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [form, setForm] = useState(() => novaTarefa(municipioAtivo?.codigoIbge || municipios[0]?.codigoIbge || 0));
  const [contexto, setContexto] = useState('');
  const [filtro, setFiltro] = useState('pendentes');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const [agora, setAgora] = useState(() => new Date());
  const campo = 'w-full rounded-lg bg-surface-container-low p-3 text-primary';
  const botao = 'rounded-lg bg-primary text-on-primary px-3 py-2 disabled:opacity-50';

  useEffect(() => {
    if (!form.codigoIbge && municipios[0]) setForm((v) => ({ ...v, codigoIbge: municipios[0].codigoIbge }));
  }, [municipios, form.codigoIbge]);
  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    getTarefas().then((dados) => { if (!cancelado) setTarefas(dados); })
      .catch((e) => { if (!cancelado) setErro(e.message || 'Falha ao carregar a agenda.'); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [revisao]);
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true); setErro(null); setAviso('');
    try {
      const tarefa = { ...form, descricao: form.descricao.trim() };
      await saveTarefa(tarefa);
      setTarefas((lista) => [...lista.filter((t) => t.id !== tarefa.id), tarefa]);
      setForm(novaTarefa(tarefa.codigoIbge)); setContexto(''); setAviso('Tarefa salva na agenda.');
    } catch (e: any) { setErro(e.message || 'Não foi possível salvar a tarefa.'); }
    finally { setOcupado(false); }
  }

  async function sugerir() {
    setGerando(true); setErro(null); setAviso('');
    try {
      const municipio = municipios.find((m) => m.codigoIbge === form.codigoIbge);
      const eventos = (await getEventos(form.codigoIbge)).sort((a, b) => (b.criadaEm || b.data).localeCompare(a.criadaEm || a.data)).slice(0, 5);
      const historico = eventos.map((e) => `${e.data}: ${e.sinteseIA || e.relatorioPlanilha?.resumo || e.resumo}. Próximo passo: ${e.proximoPassoIA || e.relatorioPlanilha?.proximosPassos.join('; ') || ''}`).join('\n');
      if (!contexto.trim() && !form.descricao.trim() && !historico) throw new Error('Conte o que precisa fazer ou registre uma conversa na Ficha Municipal primeiro.');
      const sugestao = await sugerirTarefa(`Município: ${municipio?.nome || form.codigoIbge}.\nPedido: ${contexto}\nTarefa em edição: ${form.descricao}\nHistórico recente:\n${historico}`);
      setForm((v) => ({ ...v, ...sugestao, data: sugestao.data || '', hora: sugestao.hora || '', origem: 'ia' }));
      setAviso('Sugestão preenchida. Revise a ação, a data e o horário e clique em Salvar tarefa.');
    } catch (e: any) { setErro(e.message || 'Falha ao sugerir tarefa.'); }
    finally { setGerando(false); }
  }

  async function mudarStatus(t: Tarefa, status: Tarefa['status']) {
    setOcupado(true); setErro(null); setAviso('');
    try {
      await setStatusTarefa(t.id, status);
      setTarefas((lista) => lista.map((v) => v.id === t.id ? { ...v, status } : v));
      if (form.id === t.id) setForm((v) => ({ ...v, status }));
      setAviso('Status atualizado.');
    } catch (e: any) { setErro(e.message || 'Falha ao atualizar a tarefa.'); }
    finally { setOcupado(false); }
  }

  const visiveis = tarefas.filter((t) => filtro === 'todas' ||
    (filtro === 'pendentes' && t.status === 'pendente') ||
    (filtro === 'hoje' && t.status === 'pendente' && t.data === dataLocal(agora)) ||
    (filtro === 'atrasadas' && tarefaAtrasada(t, agora)) ||
    (filtro === 'concluidas' && t.status === 'concluida'))
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
  const reativacoesPendentes = tarefas.filter((t) => t.status === 'pendente' && t.id.startsWith('reativacao-standby-') && t.data <= dataLocal(agora));

  return <div className="space-y-4 pt-space-xs pb-28">
    <h2 className="text-headline-md text-primary">Agenda de tarefas</h2>
    {reativacoesPendentes.length > 0 && <div role="status" className="rounded-xl bg-secondary-container p-4 text-on-secondary-container"><strong>{reativacoesPendentes.length} oportunidade(s) para reativar.</strong><p className="text-body-sm">Os cartões voltaram ao Foco em Campo e aguardam contato.</p></div>}
    {erro && <p role="alert" className="text-error">{erro}</p>}
    {aviso && <p role="status" className="text-secondary">{aviso}</p>}
    <form onSubmit={salvar} className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <fieldset disabled={carregando || ocupado || gerando || municipios.length === 0} className="space-y-3">
        <legend className="text-label-lg text-primary">{tarefas.some((t) => t.id === form.id) ? 'Editar tarefa' : 'Nova tarefa'}</legend>
        <label className="block">Município<select required className={campo} value={form.codigoIbge} onChange={(e) => { setForm((v) => ({ ...v, codigoIbge: Number(e.target.value) })); setContexto(''); }}>
          {!municipios.length && <option value={0}>Adicione uma praça primeiro</option>}
          {municipios.map((m) => <option key={m.codigoIbge} value={m.codigoIbge}>{m.nome} / {m.uf}</option>)}
        </select></label>
        <label className="block">Contexto para a IA<textarea className={campo} value={contexto} onChange={(e) => setContexto(e.target.value)} placeholder="Ex.: amanhã às 10h ligar para confirmar a visita de sexta-feira." /></label>
        <button type="button" className={botao} onClick={sugerir}>{gerando ? 'Sugerindo…' : 'Sugerir próxima ação com IA'}</button>
        <label className="block">Ação<select className={campo} value={form.tipo} onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value as TipoTarefa }))}>
          {Object.entries(TIPOS_TAREFA).map(([tipo, label]) => <option key={tipo} value={tipo}>{label}</option>)}
        </select></label>
        <label className="block">Descrição<input required className={campo} value={form.descricao} onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label>Data<input required type="date" className={campo} value={form.data} onChange={(e) => setForm((v) => ({ ...v, data: e.target.value }))} /></label>
          <label>Horário (opcional)<input type="time" className={campo} value={form.hora} onChange={(e) => setForm((v) => ({ ...v, hora: e.target.value }))} /></label>
        </div>
        <div className="flex gap-2"><button type="submit" className={botao}>Salvar tarefa</button>
          <button type="button" className="text-primary px-3" onClick={() => { setForm(novaTarefa(form.codigoIbge)); setContexto(''); setAviso(''); }}>Limpar / nova</button></div>
      </fieldset>
    </form>
    <div className="flex items-center gap-3">
      <label className="flex-1">Mostrar<select className={campo} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
        <option value="pendentes">Pendentes</option><option value="hoje">Hoje</option><option value="atrasadas">Atrasadas</option><option value="concluidas">Concluídas</option><option value="todas">Todas</option>
      </select></label>
      <button disabled={ocupado || gerando || carregando} onClick={() => { setErro(null); setRevisao((v) => v + 1); }} className="text-primary">Atualizar</button>
    </div>
    {carregando ? <p>Carregando agenda…</p> : visiveis.length === 0 && <p>Nenhuma tarefa neste filtro.</p>}
    {visiveis.map((t) => <article key={t.id} className="rounded-xl bg-surface-container-lowest p-4 shadow-sm space-y-2">
      <p className="text-label-sm text-on-surface-variant">{municipios.find((m) => m.codigoIbge === t.codigoIbge)?.nome || `Município ${t.codigoIbge}`}</p>
      <h3 className="text-label-lg text-primary">{TIPOS_TAREFA[t.tipo]} — {t.descricao}</h3>
      <p>{t.data.split('-').reverse().join('/')} {t.hora || '• Sem horário definido'}</p>
      <p className={tarefaAtrasada(t, agora) ? 'text-error' : 'text-secondary'}>{tarefaAtrasada(t, agora) ? 'Atrasada' : t.status === 'pendente' ? 'Pendente' : t.status === 'concluida' ? 'Concluída' : 'Cancelada'}</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={ocupado || gerando || carregando} className="text-primary" onClick={() => { setForm({ ...t }); setContexto(''); setAviso('Tarefa carregada no formulário acima.'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar / reagendar</button>
        <button disabled={ocupado || gerando || carregando} className="text-primary" onClick={() => mudarStatus(t, t.status === 'pendente' ? 'concluida' : 'pendente')}>{t.status === 'pendente' ? 'Concluir' : 'Reabrir'}</button>
        {t.status === 'pendente' && <button disabled={ocupado || gerando || carregando} className="text-on-surface-variant" onClick={() => mudarStatus(t, 'cancelada')}>Cancelar</button>}
      </div>
    </article>)}
  </div>;
}
