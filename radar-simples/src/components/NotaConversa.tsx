import { useEffect, useState, useSyncExternalStore } from 'react';
import { auth } from '../lib/firebase';
import { addEvento, getEventos } from '../storage';
import type { MunicipioIbge } from '../types';
import { conversaDoAutor, RegistroConversa, type ConversaSalva } from '../utils/registroConversa';

export default function NotaConversa({ municipio }: { municipio: MunicipioIbge }) {
  const autorId = auth.currentUser?.uid || '';
  const chave = `radar_ts_conversa_${autorId}_${municipio.codigoIbge}`;
  const [controle] = useState(() => new RegistroConversa({
    codigoIbge: municipio.codigoIbge, autorId, salvar: addEvento, conectado: () => navigator.onLine,
    backup: (evento, confirmado) => localStorage.setItem(chave, JSON.stringify({ evento, confirmado })),
  }));
  const estado = useSyncExternalStore(controle.subscribe, controle.snapshot);
  const [online, setOnline] = useState(navigator.onLine);
  const [avisoCarga, setAvisoCarga] = useState<string | null>(null);
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
      if (navigator.onLine && ['local', 'erro', 'pendente'].includes(controle.snapshot().status)) void controle.salvarAgora().catch(() => {});
      if (!navigator.onLine) controle.semConexao();
    };
    const ocultar = () => { if (document.visibilityState === 'hidden') controle.aoSair(); };
    window.addEventListener('online', conexao);
    window.addEventListener('offline', conexao);
    window.addEventListener('pagehide', controle.aoSair);
    document.addEventListener('visibilitychange', ocultar);
    return () => {
      cancelado = true;
      controle.aoSair();
      window.removeEventListener('online', conexao);
      window.removeEventListener('offline', conexao);
      window.removeEventListener('pagehide', controle.aoSair);
      document.removeEventListener('visibilitychange', ocultar);
    };
  }, [autorId, chave, controle, municipio.codigoIbge]);

  async function iniciarOutra() {
    setNova(true);
    try { await controle.novaConversa(); }
    catch { setAvisoCarga('Não foi possível concluir o salvamento. A conversa atual continua no campo.'); }
    finally { setNova(false); }
  }
  const mensagem = !estado.pronto ? 'Recuperando conversa…'
    : !online && estado.evento ? 'Salvo neste aparelho. Aguardando internet para confirmar no banco.'
    : estado.status === 'salvo' ? 'Salvo automaticamente no histórico.'
    : estado.status === 'local' ? 'Salvo neste aparelho. Aguardando confirmação do banco.'
    : estado.status === 'salvando' ? 'Salvando no histórico…'
    : estado.status === 'pendente' ? 'Alterações aguardando salvamento…'
    : estado.status === 'erro' ? 'Salvamento no banco pendente.'
    : 'O texto será salvo automaticamente enquanto você digita.';
  return <div className="space-y-3">
    <label htmlFor="nota-conversa" className="text-label-sm text-on-surface-variant block">O que aconteceu na conversa?</label>
    <textarea id="nota-conversa" rows={5} maxLength={50000}
      disabled={!autorId || !estado.pronto || nova}
      className="w-full rounded-lg bg-surface-container-low p-3 text-body-md text-primary focus:outline-none resize-y disabled:opacity-60"
      placeholder="Ex: Reunião com o secretário. Pediu demonstração na próxima terça…"
      value={estado.texto} onChange={(e) => { setAvisoCarga(null); controle.editar(e.target.value); }}
      onBlur={() => controle.aoSair()} />
    <p role="status" aria-live="polite" className="text-label-sm text-on-surface-variant">{mensagem}</p>
    <p className="text-label-sm text-on-surface-variant">O texto digitado é guardado sem análise por IA. Sem internet, permanece neste aparelho até a sincronização.</p>
    <div className="flex flex-wrap gap-2">
      <button disabled={!online || !estado.pronto || nova || !estado.evento} onClick={iniciarOutra}
        className="w-full h-12 rounded-lg bg-surface-container text-primary text-label-md disabled:opacity-50">{nova ? 'Salvando…' : 'Nova conversa'}</button>
    </div>
    {estado.status === 'erro' && <button onClick={() => void controle.salvarAgora().catch(() => {})} className="text-label-sm text-primary underline">Tentar salvar novamente</button>}
    {(estado.erro || avisoCarga) && <p role="alert" className="text-body-sm text-error">{estado.erro || avisoCarga}</p>}
  </div>;
}
