import { useEffect, useState, useSyncExternalStore } from 'react';
import { sintetizarNota, type ContatoDetectado } from '../api/ia';
import { auth } from '../lib/firebase';
import { addEvento, getEventos } from '../storage';
import type { MunicipioIbge } from '../types';
import { conversaDoAutor, RegistroConversa, type ConversaSalva } from '../utils/registroConversa';
import Icon from './Icon';

export default function NotaConversa({ municipio, onContatoDetectado }: {
  municipio: MunicipioIbge;
  onContatoDetectado: (contato: ContatoDetectado) => Promise<boolean>;
}) {
  const autorId = auth.currentUser?.uid || '';
  const chave = `radar_ts_conversa_${autorId}_${municipio.codigoIbge}`;
  const [controle] = useState(() => new RegistroConversa({
    codigoIbge: municipio.codigoIbge, autorId, salvar: addEvento, gerar: sintetizarNota,
    backup: (evento, confirmado) => localStorage.setItem(chave, JSON.stringify({ evento, confirmado })),
  }));
  const estado = useSyncExternalStore(controle.subscribe, controle.snapshot);
  const [online, setOnline] = useState(navigator.onLine);
  const [avisoCarga, setAvisoCarga] = useState<string | null>(null);
  const [contato, setContato] = useState<ContatoDetectado | null>(null);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [nova, setNova] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      let evento: ConversaSalva | null = null;
      let copiaConfirmada: ConversaSalva | null = null;
      let textoLegado = '';
      try {
        const local = localStorage.getItem(chave);
        if (local) {
          const dados = JSON.parse(local);
          if (dados.evento === null) { controle.iniciar(null); return; }
          if (dados.evento && conversaDoAutor(dados.evento, municipio.codigoIbge, autorId)) {
            if (!dados.confirmado) { controle.iniciar(dados.evento); return; }
            copiaConfirmada = dados.evento;
            if (!navigator.onLine) { controle.iniciar(copiaConfirmada, false); return; }
          }
        }
        const legado = JSON.parse(localStorage.getItem(`radar_ts_registro_rapido_${municipio.codigoIbge}`) || 'null');
        if (!copiaConfirmada && legado?.modo !== 'planilha' && typeof legado?.nota === 'string') textoLegado = legado.nota;
      } catch { setAvisoCarga('Não foi possível recuperar a cópia local. Buscando o histórico salvo.'); }
      try {
        if (!textoLegado) {
          const eventos = await getEventos(municipio.codigoIbge);
          evento = eventos.filter((e): e is ConversaSalva => conversaDoAutor(e, municipio.codigoIbge, autorId))
            .sort((a, b) => b.registroRapido.atualizadoEm.localeCompare(a.registroRapido.atualizadoEm))[0] || null;
        }
      } catch {
        evento = copiaConfirmada;
        if (!cancelado) setAvisoCarga('Não foi possível recuperar a conversa do banco. A cópia disponível neste aparelho foi preservada.');
      }
      if (cancelado) return;
      controle.iniciar(evento, false);
      if (textoLegado) controle.editar(textoLegado);
    }
    if (autorId) void carregar();
    const conexao = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine && controle.snapshot().status === 'erro') void controle.salvarAgora().catch(() => {});
    };
    const ocultar = () => { if (document.visibilityState === 'hidden') controle.aoSair(); };
    window.addEventListener('online', conexao);
    window.addEventListener('offline', conexao);
    window.addEventListener('pagehide', controle.aoSair);
    document.addEventListener('visibilitychange', ocultar);
    return () => {
      cancelado = true;
      controle.aoSair();
      controle.cancelarIA();
      window.removeEventListener('online', conexao);
      window.removeEventListener('offline', conexao);
      window.removeEventListener('pagehide', controle.aoSair);
      document.removeEventListener('visibilitychange', ocultar);
    };
  }, [autorId, chave, controle, municipio.codigoIbge]);

  async function gerar() {
    setContato(null);
    const sintese = await controle.gerarIA();
    if (sintese?.contatoDetectado?.nome || sintese?.contatoDetectado?.telefone) setContato(sintese.contatoDetectado);
  }
  async function iniciarOutra() {
    setNova(true);
    try { await controle.novaConversa(); setContato(null); }
    catch { setAvisoCarga('Não foi possível concluir o salvamento. A conversa atual continua no campo.'); }
    finally { setNova(false); }
  }
  async function confirmarContato() {
    if (!contato) return;
    setSalvandoContato(true);
    try { if (await onContatoDetectado(contato)) setContato(null); }
    finally { setSalvandoContato(false); }
  }
  const mensagem = !estado.pronto ? 'Recuperando conversa…'
    : !online && estado.evento ? 'Sem conexão. O texto fica neste aparelho; a sincronização ocorrerá quando a conexão voltar.'
    : estado.status === 'salvo' ? 'Salvo automaticamente no histórico.'
    : estado.status === 'salvando' ? 'Salvando no histórico…'
    : estado.status === 'pendente' ? 'Alterações aguardando salvamento…'
    : estado.status === 'erro' ? 'Salvamento no banco pendente.'
    : 'O texto será salvo automaticamente enquanto você digita.';
  return <div className="space-y-3">
    <label htmlFor="nota-conversa" className="text-label-sm text-on-surface-variant block">O que aconteceu na conversa?</label>
    <textarea id="nota-conversa" rows={5} maxLength={50000}
      disabled={!autorId || !estado.pronto || estado.processando || nova}
      className="w-full rounded-lg bg-surface-container-low p-3 text-body-md text-primary focus:outline-none resize-y disabled:opacity-60"
      placeholder="Ex: Reunião com o secretário. Pediu demonstração na próxima terça…"
      value={estado.texto} onChange={(e) => { setAvisoCarga(null); setContato(null); controle.editar(e.target.value); }}
      onBlur={() => controle.aoSair()} />
    <p role="status" aria-live="polite" className="text-label-sm text-on-surface-variant">{mensagem}</p>
    <p className="text-label-sm text-on-surface-variant">A IA gera uma síntese separada sem apagar o relato original digitado neste campo.</p>
    <div className="flex flex-wrap gap-2">
      <button disabled={!online || !estado.pronto || estado.processando || nova || !estado.texto.trim()} onClick={gerar}
        className="flex-1 h-12 rounded-lg bg-primary text-on-primary text-label-lg flex items-center justify-center gap-2 disabled:opacity-50">
        <Icon name={estado.processando ? 'sync' : 'bolt'} size={18} className={estado.processando ? 'animate-spin' : ''} />
        {estado.processando ? 'Gerando e salvando…' : 'Gerar com IA'}
      </button>
      <button disabled={!online || !estado.pronto || estado.processando || nova || !estado.evento} onClick={iniciarOutra}
        className="px-3 h-12 rounded-lg bg-surface-container text-primary text-label-md disabled:opacity-50">{nova ? 'Salvando…' : 'Nova conversa'}</button>
    </div>
    {estado.processando && <button onClick={controle.cancelarIA} className="text-label-sm text-primary underline">Cancelar IA e manter relato</button>}
    {estado.status === 'erro' && <button onClick={() => void controle.salvarAgora().catch(() => {})} className="text-label-sm text-primary underline">Tentar salvar novamente</button>}
    {(estado.erro || avisoCarga) && <p role="alert" className="text-body-sm text-error">{estado.erro || avisoCarga}</p>}
    {estado.evento?.sinteseIA && <div className="rounded-lg bg-secondary-container/30 p-3 space-y-2 text-body-sm">
      <p className="font-semibold text-primary">Síntese da IA gerada e salva sem alterar seu relato original.</p>
      {estado.evento.proximoPassoIA && <p><strong>Próximo passo sugerido:</strong> {estado.evento.proximoPassoIA}</p>}
      <details><summary className="cursor-pointer text-primary">Ver relato original digitado</summary><p className="whitespace-pre-wrap break-words pt-2">{estado.evento.textoOriginal}</p></details>
    </div>}
    {contato && <div className="rounded-lg bg-primary-container/40 p-3 space-y-2 text-body-sm">
      <p>Contato sugerido: {contato.nome || 'Sem nome'}{contato.cargo ? ` — ${contato.cargo}` : ''}{contato.telefone ? ` — ${contato.telefone}` : ''}</p>
      <button disabled={salvandoContato} onClick={confirmarContato} className="text-primary underline disabled:opacity-50">{salvandoContato ? 'Salvando…' : 'Salvar em Contatos-Chave'}</button>
      <button onClick={() => setContato(null)} className="ml-3 text-on-surface-variant">Ignorar</button>
    </div>}
  </div>;
}
