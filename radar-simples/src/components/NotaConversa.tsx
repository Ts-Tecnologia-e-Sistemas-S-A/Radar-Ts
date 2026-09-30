import { useEffect, useState, useSyncExternalStore } from 'react';
import { sintetizarNota } from '../api/ia';
import { auth } from '../lib/firebase';
import { addEvento, getEventos } from '../storage';
import type { MunicipioIbge } from '../types';
import { RegistroConversa, type ConversaSalva } from '../utils/registroConversa';
import { dataLocal } from '../utils/agenda';
import { dataHoraBr } from '../utils/data';
import { lerCopiasNotas, reunirNotas, type NotaReuniao } from '../utils/notasReuniao';
import Icon from './Icon';

export default function NotaConversa({ municipio }: { municipio: MunicipioIbge }) {
  const autorId = auth.currentUser?.uid || '';
  const chave = `radar_ts_conversa_${autorId}_${municipio.codigoIbge}`;
  const [notas, setNotas] = useState<NotaReuniao[]>([]);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function novaNota(texto = '', id: string = crypto.randomUUID()): NotaReuniao {
    const agora = new Date().toISOString();
    return { confirmado: false, evento: {
      id, codigoIbge: municipio.codigoIbge, tipo: 'reuniao', data: dataLocal(), criadaEm: agora,
      resumo: texto, textoOriginal: texto, anexos: [], mandato: 'Atual', mandatoAtivo: true,
      registroRapido: { autorId, atualizadoEm: agora, encerrado: false },
    } };
  }

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      let copias: NotaReuniao[] = [];
      let textoLegado = '';
      try {
        copias = lerCopiasNotas(localStorage.getItem(chave));
        const legado = JSON.parse(localStorage.getItem(`radar_ts_registro_rapido_${municipio.codigoIbge}`) || 'null');
        if (!copias.length && legado?.modo !== 'planilha' && typeof legado?.nota === 'string') textoLegado = legado.nota;
      } catch { if (!cancelado) setAviso('Não foi possível ler a cópia local. Buscando as notas salvas.'); }
      let carregadas = reunirNotas([], copias, municipio.codigoIbge, autorId);
      try {
        const eventos = await getEventos(municipio.codigoIbge);
        carregadas = reunirNotas(eventos, copias, municipio.codigoIbge, autorId);
      } catch {
        if (!cancelado) setAviso('Não foi possível carregar todas as notas do banco. As cópias deste aparelho foram preservadas.');
      }
      if (cancelado) return;
      if (textoLegado.trim() && !carregadas.some(n => n.evento.textoOriginal === textoLegado || n.evento.id === `nota-legada-${autorId}-${municipio.codigoIbge}`)) {
        carregadas.unshift(novaNota(textoLegado, `nota-legada-${autorId}-${municipio.codigoIbge}`));
      }
      setNotas(carregadas);
      setPronto(true);
    }
    if (autorId) void carregar();
    return () => { cancelado = true; };
  }, [autorId, chave, municipio.codigoIbge]);

  function adicionar() {
    const nota = novaNota();
    try {
      const copias = lerCopiasNotas(localStorage.getItem(chave));
      localStorage.setItem(chave, JSON.stringify({ notas: [...copias, nota] }));
    } catch { setAviso('Não foi possível criar a cópia local. Aguarde a confirmação de salvamento no banco.'); }
    setNotas(atuais => [nota, ...atuais]);
  }

  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-primary">
        <Icon name="edit_note" size={20} className="text-secondary" />
        <h3 className="text-label-lg">Notas da reunião</h3>
      </div>
      <button type="button" onClick={adicionar} disabled={!autorId || !pronto}
        className="flex items-center gap-1 text-label-sm text-secondary disabled:opacity-60">
        <Icon name="add" size={18} /> Adicionar
      </button>
    </div>
    {!pronto && <p role="status" className="text-label-sm text-on-surface-variant">Carregando notas…</p>}
    {aviso && <p role="alert" className="text-body-sm text-error">{aviso}</p>}
    {pronto && !notas.length && <p className="text-body-sm text-on-surface-variant">Nenhuma nota registrada. Toque em Adicionar para começar.</p>}
    {notas.map(nota => <CartaoNota key={nota.evento.id} nota={nota} chave={chave} />)}
  </div>;
}

function CartaoNota({ nota, chave }: { nota: NotaReuniao; chave: string }) {
  const [controle] = useState(() => new RegistroConversa({
    codigoIbge: nota.evento.codigoIbge, autorId: nota.evento.registroRapido.autorId, salvar: addEvento, gerar: sintetizarNota,
    backup: (evento, confirmado) => {
      if (!evento) return;
      const copias = lerCopiasNotas(localStorage.getItem(chave)).filter(n => n.evento.id !== evento.id);
      localStorage.setItem(chave, JSON.stringify({ notas: [...copias, { evento, confirmado: Boolean(confirmado) }] }));
    },
  }));
  const estado = useSyncExternalStore(controle.subscribe, controle.snapshot);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    controle.iniciar(nota.evento, !nota.confirmado);
    const conexao = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine && ['erro', 'pendente'].includes(controle.snapshot().status)) void controle.salvarAgora().catch(() => {});
    };
    const ocultar = () => { if (document.visibilityState === 'hidden') controle.aoSair(); };
    window.addEventListener('online', conexao);
    window.addEventListener('offline', conexao);
    window.addEventListener('pagehide', controle.aoSair);
    document.addEventListener('visibilitychange', ocultar);
    return () => {
      controle.aoSair();
      window.removeEventListener('online', conexao);
      window.removeEventListener('offline', conexao);
      window.removeEventListener('pagehide', controle.aoSair);
      document.removeEventListener('visibilitychange', ocultar);
    };
  }, [controle, nota]);
  const evento = estado.evento || nota.evento;
  const dataCriacao = evento.criadaEm;
  const mensagem = !online ? 'Sem conexão. A nota será sincronizada quando a conexão voltar.'
    : estado.status === 'salvo' ? 'Nota salva.'
    : estado.status === 'erro' ? 'Salvamento pendente.' : 'Salvando…';
  return <article className="rounded-lg bg-surface-container-low p-3 space-y-2">
    <label htmlFor={`nota-${evento.id}`} className="block text-label-sm font-semibold text-primary">
      {dataCriacao ? <time dateTime={dataCriacao}>{dataHoraBr(dataCriacao)}</time> : 'Data de criação não informada'}
    </label>
    {(!dataCriacao || evento.registroRapido.atualizadoEm !== dataCriacao) && (
      <p className="text-label-sm text-on-surface-variant">Atualizada em {dataHoraBr(evento.registroRapido.atualizadoEm)}</p>
    )}
    <textarea id={`nota-${evento.id}`} aria-label={`Nota da reunião de ${dataCriacao ? dataHoraBr(dataCriacao) : 'data não informada'}`}
      rows={4} maxLength={50000} disabled={!estado.pronto}
      className="w-full rounded-lg bg-surface-container-lowest p-3 text-body-md text-primary focus:outline-none resize-y disabled:opacity-60"
      placeholder="Escreva aqui as anotações da reunião…" value={estado.texto}
      onChange={e => controle.editar(e.target.value)} onBlur={controle.aoSair} />
    <p role="status" className="text-label-sm text-on-surface-variant">{mensagem}</p>
    {estado.erro && <p role="alert" className="text-body-sm text-error">{estado.erro}</p>}
    {estado.status === 'erro' && <button type="button" className="text-label-sm text-secondary" onClick={() => void controle.salvarAgora().catch(() => {})}>Tentar salvar novamente</button>}
  </article>;
}
