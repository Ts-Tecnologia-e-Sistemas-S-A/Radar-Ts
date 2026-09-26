import type { EventoTimeline } from '../types';
import type { SinteseNota } from '../api/ia';
import { dataLocal } from './agenda';

export type ConversaSalva = EventoTimeline & {
  textoOriginal: string;
  registroRapido: { autorId: string; atualizadoEm: string; encerrado: boolean };
};
export type EstadoConversa = {
  evento: ConversaSalva | null;
  texto: string;
  pronto: boolean;
  processando: boolean;
  status: 'vazio' | 'pendente' | 'salvando' | 'salvo' | 'erro';
  erro: string | null;
};
export function conversaDoAutor(evento: EventoTimeline, codigoIbge: number, autorId: string): evento is ConversaSalva {
  return evento.codigoIbge === codigoIbge && evento.tipo === 'reuniao' &&
    typeof evento.id === 'string' && !!evento.id && typeof evento.resumo === 'string' &&
    typeof evento.textoOriginal === 'string' && evento.registroRapido?.autorId === autorId &&
    typeof evento.registroRapido.atualizadoEm === 'string' && !evento.registroRapido.encerrado;
}

export function validarSinteseConversa(valor: unknown): SinteseNota {
  const s = valor as Partial<SinteseNota> | null;
  if (!s || typeof s.combinado !== 'string' || !s.combinado.trim() || s.combinado.length > 50000 ||
      typeof s.proximoPasso !== 'string' || s.proximoPasso.length > 10000) {
    throw new Error('A IA não retornou uma síntese válida. Seu relato original foi preservado.');
  }
  const c = s.contatoDetectado;
  const contato = c && ['nome', 'cargo', 'telefone'].every((k) => {
    const v = c[k as keyof typeof c]; return v === null || typeof v === 'string';
  }) ? c : null;
  return { combinado: s.combinado.trim(), proximoPasso: s.proximoPasso.trim(), contatoDetectado: contato };
}

/** Um ID por conversa. Escritas sequenciais impedem que respostas atrasadas restaurem texto antigo. */
export class RegistroConversa {
  private estado: EstadoConversa = { evento: null, texto: '', pronto: false, processando: false, status: 'vazio', erro: null };
  private ouvintes = new Set<() => void>();
  private revisao = 0;
  private geracaoIA = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private fila: Promise<void> = Promise.resolve();
  constructor(private deps: {
    codigoIbge: number; autorId: string;
    salvar: (evento: ConversaSalva) => Promise<void>;
    backup: (evento: ConversaSalva | null, confirmado?: boolean) => void;
    gerar: (texto: string) => Promise<unknown>;
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
    this.atualizar({ evento, texto: evento?.resumo || '', pronto: true, status: evento ? precisaSalvar ? 'pendente' : 'salvo' : 'vazio' });
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
  private gravar(evento: ConversaSalva) {
    const escrita = this.fila.catch(() => {}).then(() => this.deps.salvar(evento));
    this.fila = escrita;
    return escrita;
  }
  async salvarAgora() {
    clearTimeout(this.timer); this.timer = undefined;
    const evento = this.estado.evento;
    if (!evento) return;
    const revisao = this.revisao;
    this.atualizar({ status: 'salvando' });
    try {
      await this.gravar(evento);
      if (revisao === this.revisao) { this.atualizar({ status: 'salvo', erro: null }); this.backup(evento, true); }
    } catch {
      if (revisao === this.revisao) this.atualizar({ status: 'erro', erro: 'Não foi possível salvar no banco. O texto permanece no campo. Tente salvar novamente.' });
      throw new Error('Falha ao salvar o relato. A IA não substituiu seu texto.');
    }
  }
  async gerarIA(): Promise<SinteseNota | null> {
    if (this.estado.processando || !this.estado.evento?.resumo.trim()) return null;
    const anterior = this.estado.evento;
    const revisao = this.revisao;
    const geracao = ++this.geracaoIA;
    const vigente = () => revisao === this.revisao && geracao === this.geracaoIA;
    this.atualizar({ processando: true, erro: null });
    try {
      // O relato verdadeiro deve estar confirmado no banco antes de chamar a IA.
      await this.salvarAgora();
      if (!vigente()) return null;
      const sintese = validarSinteseConversa(await this.deps.gerar(anterior.textoOriginal));
      if (!vigente()) return null;
      const atualizado: ConversaSalva = {
        ...anterior, resumo: sintese.combinado, sinteseIA: sintese.combinado, proximoPassoIA: sintese.proximoPasso,
        registroRapido: { ...anterior.registroRapido, atualizadoEm: new Date().toISOString() },
      };
      await this.gravar(atualizado);
      if (!vigente()) return null;
      this.atualizar({ evento: atualizado, texto: atualizado.resumo, status: 'salvo', erro: null });
      this.backup(atualizado, true);
      return sintese;
    } catch (e) {
      if (vigente()) this.atualizar({ erro: `${e instanceof Error ? e.message : 'Falha ao gerar com IA.'} O relato original foi preservado.` });
      return null;
    } finally { if (geracao === this.geracaoIA) this.atualizar({ processando: false }); }
  }
  async novaConversa() {
    if (this.estado.processando) return;
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
    if (this.estado.status === 'pendente' || this.estado.status === 'erro') {
      void this.salvarAgora().catch(() => {});
    }
  };
  cancelarIA = () => {
    const estavaProcessando = this.estado.processando;
    this.geracaoIA++;
    this.atualizar({ processando: false });
    // Se a síntese já entrou na fila de escrita, regrava o relato exibido
    // depois dela. Cancelar também precisa preservar o original no banco.
    if (estavaProcessando) void this.salvarAgora().catch(() => {});
  };
}
