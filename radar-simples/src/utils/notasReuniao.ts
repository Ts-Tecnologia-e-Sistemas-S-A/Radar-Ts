import type { EventoTimeline } from '../types';
import { conversaDoAutor, type ConversaSalva } from './registroConversa';

export interface NotaReuniao {
  evento: ConversaSalva;
  confirmado: boolean;
}

export function reunirNotas(eventos: EventoTimeline[], copias: NotaReuniao[], codigo: number, autor: string): NotaReuniao[] {
  const notas = new Map<string, NotaReuniao>();
  for (const evento of eventos) {
    if (conversaDoAutor(evento, codigo, autor)) notas.set(evento.id, { evento, confirmado: true });
  }
  for (const copia of copias) {
    if (!copia?.evento || !conversaDoAutor(copia.evento, codigo, autor)) continue;
    const remoto = notas.get(copia.evento.id);
    if (!remoto || !copia.confirmado || copia.evento.registroRapido.atualizadoEm > remoto.evento.registroRapido.atualizadoEm) {
      notas.set(copia.evento.id, copia);
    }
  }
  return [...notas.values()].sort((a, b) =>
    (b.evento.criadaEm || b.evento.registroRapido.atualizadoEm).localeCompare(a.evento.criadaEm || a.evento.registroRapido.atualizadoEm)
    || a.evento.id.localeCompare(b.evento.id));
}

export function lerCopiasNotas(valor: string | null): NotaReuniao[] {
  if (!valor) return [];
  const dados = JSON.parse(valor);
  if (Array.isArray(dados?.notas)) return dados.notas;
  return dados?.evento ? [{ evento: dados.evento, confirmado: Boolean(dados.confirmado) }] : [];
}
