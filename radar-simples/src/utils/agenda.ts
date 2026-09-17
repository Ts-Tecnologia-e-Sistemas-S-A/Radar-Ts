export const TIPOS_TAREFA = { ligar: 'Ligar', visitar: 'Visitar', mensagem: 'Mandar mensagem', proposta: 'Enviar proposta', outra: 'Outra ação' } as const;
export type TipoTarefa = keyof typeof TIPOS_TAREFA;
export interface SugestaoTarefa { tipo: TipoTarefa; descricao: string; data: string | null; hora: string | null; }
export interface Tarefa extends Omit<SugestaoTarefa, 'data' | 'hora'> {
  id: string;
  codigoIbge: number;
  data: string;
  hora: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  origem: 'manual' | 'ia';
  criadaEm: string;
}
export function dataLocal(agora = new Date()): string {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}
export function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(`${data}T12:00:00`);
  return !Number.isNaN(d.getTime()) && dataLocal(d) === data;
}
export function validarSugestaoTarefa(valor: unknown): SugestaoTarefa {
  const s = valor as SugestaoTarefa | null;
  if (!s || !Object.hasOwn(TIPOS_TAREFA, s.tipo) || typeof s.descricao !== 'string' || !s.descricao.trim() ||
      !(s.data === null || (typeof s.data === 'string' && dataValida(s.data))) ||
      !(s.hora === null || (typeof s.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.hora)))) {
    throw new Error('A sugestão de tarefa veio incompleta ou com data inválida. Tente novamente.');
  }
  return { tipo: s.tipo, descricao: s.descricao.trim(), data: s.data, hora: s.hora };
}
export function tarefaAtrasada(t: Tarefa, agora = new Date()): boolean {
  if (t.status !== 'pendente') return false;
  const hoje = dataLocal(agora);
  return t.data < hoje || (t.data === hoje && Boolean(t.hora) && t.hora < `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`);
}
