import type { EventoTimeline } from '../types';
import { dataLocal } from './agenda';

export type ConversaSalva = EventoTimeline & {
  textoOriginal: string;
  registroRapido: { autorId: string; atualizadoEm: string; encerrado: boolean };
};
export type EstadoConversa = {
  evento: ConversaSalva | null;
  texto: string;
  pronto: boolean;
  status: 'vazio' | 'pendente' | 'salvando' | 'local' | 'salvo' | 'erro';
  erro: string | null;
};
export function conversaDoAutor(evento: EventoTimeline, codigoIbge: number, autorId: string): evento is ConversaSalva {
  return evento.codigoIbge === codigoIbge && evento.tipo === 'reuniao' &&
    typeof evento.id === 'string' && !!evento.id && typeof evento.resumo === 'string' &&
    typeof evento.textoOriginal === 'string' && evento.registroRapido?.autorId === autorId &&
    typeof evento.registroRapido.atualizadoEm === 'string' && !evento.registroRapido.encerrado;
}

/** Um ID por conversa. O Firestore mantém as escritas na ordem em que são feitas. */
export class RegistroConversa {
  private estado: EstadoConversa = { evento: null, texto: '', pronto: false, status: 'vazio', erro: null };
  private ouvintes = new Set<() => void>();
  private revisao = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private deps: {
    codigoIbge: number; autorId: string;
    salvar: (evento: ConversaSalva) => Promise<void>;
    backup: (evento: ConversaSalva | null, confirmado?: boolean) => void;
    conectado?: () => boolean;
    espera?: number;
  }) {}
  snapshot = () => this.estado;
  subscribe = (fn: () => void) => { this.ouvintes.add(fn); return () => { this.ouvintes.delete(fn); }; };
  private atualizar(campos: Partial<EstadoConversa>) {
    this.estado = { ...this.estado, ...campos };
    this.ouvintes.forEach((fn) => fn());
  }
  private backup(evento: ConversaSalva | null, confirmado = false) {
    try { this.deps.backup(evento, confirmado); }
    catch { this.atualizar({ erro: 'Não foi possível guardar a cópia neste aparelho. Aguarde a confirmação de salvamento no banco antes de sair.' }); }
  }
  iniciar(evento: ConversaSalva | null, precisaSalvar = true) {
    if (this.estado.pronto) return;
    this.atualizar({ evento, texto: evento?.textoOriginal ?? evento?.resumo ?? '', pronto: true, status: evento ? precisaSalvar ? 'pendente' : 'salvo' : 'vazio' });
    // Reenvio idempotente também recupera texto digitado antes de fechar a aba.
    if (evento && precisaSalvar) this.agendar();
    if (evento && !precisaSalvar) this.backup(evento, true);
  }
  editar(texto: string) {
    if (!this.estado.pronto) return;
    this.revisao++;
    const anterior = this.estado.evento;
    if (!anterior && !texto.trim()) { this.atualizar({ texto }); return; }
    const agora = new Date().toISOString();
    const evento: ConversaSalva = {
      ...(anterior || { id: crypto.randomUUID(), codigoIbge: this.deps.codigoIbge, tipo: 'reuniao', data: dataLocal(), criadaEm: agora, anexos: [], mandato: 'Atual', mandatoAtivo: true }),
      resumo: texto, textoOriginal: texto, sinteseIA: undefined, proximoPassoIA: undefined,
      registroRapido: { autorId: this.deps.autorId, atualizadoEm: agora, encerrado: false },
    };
    this.atualizar({ texto, evento, status: 'pendente', erro: null });
    this.backup(evento);
    this.agendar();
  }
  private agendar() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = undefined; void this.salvarAgora().catch(() => {}); }, this.deps.espera ?? 700);
  }
  private gravar(evento: ConversaSalva): Promise<void> {
    const envio = this.deps.salvar(evento);
    // A escrita entra na fila persistente do Firestore sem rede. A Promise
    // só termina após confirmação remota, então o rascunho local fica pendente.
    if (this.deps.conectado?.() === false) { void envio.catch(() => {}); return Promise.resolve(); }
    return envio;
  }
  async salvarAgora() {
    clearTimeout(this.timer); this.timer = undefined;
    const evento = this.estado.evento;
    if (!evento) return;
    const revisao = this.revisao;
    const local = this.deps.conectado?.() === false;
    this.atualizar({ status: local ? 'local' : 'salvando' });
    try {
      await this.gravar(evento);
      if (revisao === this.revisao) {
        this.atualizar({ status: local ? 'local' : 'salvo', erro: null });
        this.backup(evento, !local);
      }
    } catch {
      if (revisao === this.revisao) this.atualizar({ status: 'erro', erro: 'Não foi possível salvar no banco. O texto permanece no campo. Tente salvar novamente.' });
      throw new Error('Falha ao salvar o relato. O texto permanece neste aparelho.');
    }
  }
  async novaConversa() {
    if (this.deps.conectado?.() === false) throw new Error('Conecte-se para concluir esta conversa antes de iniciar outra.');
    const evento = this.estado.evento;
    if (evento) {
      await this.salvarAgora();
      await this.gravar({ ...evento, registroRapido: { ...evento.registroRapido, encerrado: true } });
    }
    this.revisao++;
    this.atualizar({ evento: null, texto: '', status: 'vazio', erro: null });
    this.backup(null, true);
  }
  aoSair = () => {
    if (this.timer) void this.salvarAgora().catch(() => {});
  };
  semConexao = () => {
    if (this.estado.evento && this.estado.status !== 'salvo') {
      this.atualizar({ status: 'local' });
      this.backup(this.estado.evento);
    }
  };
}
