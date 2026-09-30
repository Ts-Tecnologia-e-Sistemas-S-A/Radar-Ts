import { describe, expect, it } from 'bun:test';
import { lerCopiasNotas, reunirNotas, type NotaReuniao } from './notasReuniao';
import { RegistroConversa } from './registroConversa';

function nota(id: string, texto = id, confirmado = true): NotaReuniao {
  return { confirmado, evento: { id, codigoIbge: 1, tipo: 'reuniao', data: '2026-09-30', criadaEm: '2026-09-30T12:00:00.000Z',
    resumo: texto, textoOriginal: texto, anexos: [], mandato: 'Atual', mandatoAtivo: true,
    registroRapido: { autorId: 'autor', atualizadoEm: '2026-09-30T12:00:00.000Z', encerrado: false } } };
}

describe('lista de notas da reunião', () => {
  it('preserva todas as notas e remove apenas IDs duplicados', () => {
    const a = nota('a'), b = nota('b');
    expect(reunirNotas([a.evento, b.evento], [a], 1, 'autor').map(n => n.evento.id)).toEqual(['a', 'b']);
  });
  it('recupera o formato antigo e não usa o rascunho vazio para esconder notas remotas', () => {
    const a = nota('a');
    expect(lerCopiasNotas(JSON.stringify(a))).toEqual([a]);
    expect(reunirNotas([a.evento], lerCopiasNotas('{"evento":null}'), 1, 'autor')).toEqual([a]);
  });
  it('preserva edições locais ainda não sincronizadas', () => {
    const remoto = nota('a', 'Banco'), local = nota('a', 'Texto offline', false);
    expect(reunirNotas([remoto.evento], [local], 1, 'autor')[0]).toEqual(local);
  });
  it('prefere a versão mais recente do banco quando a cópia local já foi confirmada', () => {
    const remoto = nota('a', 'Texto atualizado'), local = nota('a', 'Texto antigo');
    remoto.evento.registroRapido.atualizadoEm = '2026-09-30T15:00:00.000Z';
    expect(reunirNotas([remoto.evento], [local], 1, 'autor')[0].evento.resumo).toBe('Texto atualizado');
  });
  it('isola as notas por autor e município', () => {
    const outroAutor = nota('a'), outroMunicipio = nota('b');
    outroAutor.evento.registroRapido.autorId = 'outro';
    outroMunicipio.evento.codigoIbge = 2;
    expect(reunirNotas([outroAutor.evento], [outroMunicipio], 1, 'autor')).toEqual([]);
  });
  it('ordena pela criação sem mover uma nota antiga quando editada', () => {
    const antiga = nota('a'), nova = nota('b');
    nova.evento.criadaEm = '2026-09-30T14:00:00.000Z';
    antiga.evento.registroRapido.atualizadoEm = '2026-09-30T16:00:00.000Z';
    expect(reunirNotas([antiga.evento, nova.evento], [], 1, 'autor').map(n => n.evento.id)).toEqual(['b', 'a']);
  });
  it('salva textos independentes e mantém a data/hora de criação ao editar', async () => {
    const banco = new Map();
    const controles = ['a', 'b'].map(id => {
      const controle = new RegistroConversa({ codigoIbge: 1, autorId: 'autor', espera: 10000,
        salvar: async e => { banco.set(e.id, structuredClone(e)); }, backup: () => {}, gerar: async () => ({}) });
      controle.iniciar(nota(id).evento, false);
      return controle;
    });
    controles[0].editar('Primeira nota'); controles[1].editar('Segunda nota');
    await Promise.all(controles.map(c => c.salvarAgora()));
    controles[0].editar('Primeira nota editada'); await controles[0].salvarAgora();
    expect(banco.size).toBe(2);
    expect(banco.get('a').resumo).toBe('Primeira nota editada');
    expect(banco.get('b').resumo).toBe('Segunda nota');
    expect(banco.get('a').criadaEm).toBe('2026-09-30T12:00:00.000Z');
  });
});
