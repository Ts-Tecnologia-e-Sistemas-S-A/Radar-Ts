import { describe, expect, it } from 'bun:test';
import { dataLocal, dataValida, proximaTarefa, tarefaAtrasada, validarSugestaoTarefa, type Tarefa } from './agenda';
const tarefa: Tarefa = { id: 't1', codigoIbge: 10, tipo: 'ligar', descricao: 'Confirmar visita', data: '2026-09-17', hora: '', status: 'pendente', origem: 'ia', criadaEm: '2026-09-16T12:00:00Z' };

describe('agenda', () => {
  it('Radar seleciona a primeira pendência do município, ignorando concluídas', () => {
    const tarefas: Tarefa[] = [
      { ...tarefa, id: 'outro', codigoIbge: 20, data: '2026-09-01' },
      { ...tarefa, id: 'feita', status: 'concluida', data: '2026-09-01' },
      { ...tarefa, id: 'sem-hora' },
      { ...tarefa, id: 'com-hora', hora: '10:00' },
    ];
    expect(proximaTarefa(tarefas, 10)?.id).toBe('com-hora');
    expect(proximaTarefa(tarefas, 99)).toBeUndefined();
    expect(tarefas[0].id).toBe('outro');
  });
  it('valida dias reais e anos bissextos', () => {
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('2026-02-29')).toBe(false);
    expect(dataValida('2028-02-29')).toBe(true);
    expect(dataValida('17/09/2026')).toBe(false);
  });
  it('usa a data local e não marca o dia de hoje sem horário como atrasado', () => {
    const agora = new Date(2026, 8, 17, 23, 59);
    expect(dataLocal(agora)).toBe('2026-09-17');
    expect(tarefaAtrasada(tarefa, agora)).toBe(false);
    expect(tarefaAtrasada({ ...tarefa, hora: '10:00' }, agora)).toBe(true);
    expect(tarefaAtrasada({ ...tarefa, data: '2026-09-16' }, agora)).toBe(true);
    expect(tarefaAtrasada({ ...tarefa, data: '2026-09-18' }, agora)).toBe(false);
    expect(tarefaAtrasada({ ...tarefa, hora: '10:00', status: 'concluida' }, agora)).toBe(false);
  });
  it('permite IA sugerir ação sem inventar data ou hora', () => {
    expect(validarSugestaoTarefa({ tipo: 'mensagem', descricao: 'Enviar apresentação', data: null, hora: null }).data).toBeNull();
    expect(() => validarSugestaoTarefa({ tipo: 'mensagem', descricao: 'Enviar apresentação', data: '2026-09-17', hora: '25:00' })).toThrow();
    expect(() => validarSugestaoTarefa({ tipo: 'toString', descricao: 'Ação', data: null, hora: null })).toThrow();
  });
});
