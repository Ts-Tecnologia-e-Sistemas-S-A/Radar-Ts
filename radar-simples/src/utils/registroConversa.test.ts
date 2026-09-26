import { describe, expect, it } from 'bun:test';
import { conversaDoAutor, RegistroConversa, type ConversaSalva } from './registroConversa';

const resposta = { combinado: 'Secretário solicitou demonstração.', proximoPasso: 'Agendar a demonstração.', contatoDetectado: null };
function preparar(opcoes: { gerar?: (t: string) => Promise<unknown>; salvar?: (e: ConversaSalva) => Promise<void>; espera?: number } = {}) {
  const banco = new Map<string, ConversaSalva>();
  const escritas: ConversaSalva[] = [];
  let backup: ConversaSalva | null = null;
  const controle = new RegistroConversa({ codigoIbge: 2103406, autorId: 'usuario-1', espera: opcoes.espera ?? 10000,
    salvar: async (e) => { if (opcoes.salvar) await opcoes.salvar(e); escritas.push(structuredClone(e)); banco.set(e.id, structuredClone(e)); },
    backup: (e) => { backup = structuredClone(e); }, gerar: opcoes.gerar || (async () => resposta),
  });
  controle.iniciar(null);
  return { controle, banco, escritas, backup: () => backup };
}
const adiar = <T,>() => {
  let resolve!: (valor: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
};

describe('relato da conversa com salvamento automático', () => {
  it('salva ao digitar sem chamar IA, preservando texto exato e um único ID', async () => {
    let chamadasIA = 0;
    const r = preparar({ espera: 5, gerar: async () => { chamadasIA++; return resposta; } });
    r.controle.editar('Primeiro trecho');
    const id = r.controle.snapshot().evento!.id;
    r.controle.editar('  Relato completo\nTelefone: 9999  ');
    await new Promise((r) => setTimeout(r, 30));
    expect(r.banco.size).toBe(1);
    expect(r.banco.get(id)?.resumo).toBe('  Relato completo\nTelefone: 9999  ');
    expect(r.banco.get(id)?.textoOriginal).toBe(r.controle.snapshot().texto);
    expect(chamadasIA).toBe(0);
    expect(r.controle.snapshot().status).toBe('salvo');
  });
  it('a saída da tela envia a edição pendente, sem esperar o temporizador', async () => {
    const r = preparar(); r.controle.editar('Relato antes de sair'); r.controle.aoSair();
    await new Promise((r) => setTimeout(r, 0));
    expect([...r.banco.values()][0].resumo).toBe('Relato antes de sair');
    expect(r.backup()?.resumo).toBe('Relato antes de sair');
  });
  it('a saída do campo tenta novamente após uma falha no banco', async () => {
    let tentativas = 0;
    const r = preparar({ salvar: async () => { if (++tentativas === 1) throw new Error('offline'); } });
    r.controle.editar('Nota preservada no celular');
    expect(r.backup()?.resumo).toBe('Nota preservada no celular');
    await r.controle.salvarAgora().catch(() => {});
    expect(r.controle.snapshot().status).toBe('erro');
    r.controle.aoSair();
    await new Promise((r) => setTimeout(r, 0));
    expect(tentativas).toBe(2);
    expect([...r.banco.values()][0].resumo).toBe('Nota preservada no celular');
    expect(r.controle.snapshot().status).toBe('salvo');
  });
  it('IA indisponível mantém o relato no campo, no backup e no banco', async () => {
    const r = preparar({ gerar: async () => { throw new Error('Serviço indisponível'); } });
    r.controle.editar('Reunião original, sem promessa de compra.');
    expect(await r.controle.gerarIA()).toBeNull();
    expect(r.controle.snapshot().texto).toBe('Reunião original, sem promessa de compra.');
    expect([...r.banco.values()][0].resumo).toBe(r.controle.snapshot().texto);
    expect(r.backup()?.resumo).toBe(r.controle.snapshot().texto);
    expect(r.controle.snapshot().erro).toContain('preservado');
  });
  it('resposta vazia ou incompleta não substitui o histórico', async () => {
    for (const retorno of [null, {}, { combinado: '', proximoPasso: '' }, { combinado: 42, proximoPasso: 'ação' }]) {
      const r = preparar({ gerar: async () => retorno }); r.controle.editar('Relato verdadeiro');
      await r.controle.gerarIA();
      expect([...r.banco.values()][0].resumo).toBe('Relato verdadeiro');
      expect(r.controle.snapshot().texto).toBe('Relato verdadeiro');
    }
  });
  it('sucesso atualiza o mesmo evento e o campo, conservando o original integral', async () => {
    const r = preparar(); r.controle.editar('Anotação completa\nSecretário pediu demonstração.');
    const id = r.controle.snapshot().evento!.id;
    await r.controle.gerarIA();
    expect(r.banco.size).toBe(1);
    expect(r.banco.get(id)?.resumo).toBe(resposta.combinado);
    expect(r.banco.get(id)?.textoOriginal).toBe('Anotação completa\nSecretário pediu demonstração.');
    expect(r.controle.snapshot().texto).toBe(resposta.combinado);
    expect(r.backup()?.resumo).toBe(resposta.combinado);
  });
  it('não chama IA se o relato original não foi confirmado no banco', async () => {
    let chamadas = 0;
    const r = preparar({ salvar: async () => { throw new Error('permission-denied'); }, gerar: async () => { chamadas++; return resposta; } });
    r.controle.editar('Não pode perder'); await r.controle.gerarIA();
    expect(chamadas).toBe(0); expect(r.controle.snapshot().texto).toBe('Não pode perder');
    expect(r.backup()?.resumo).toBe('Não pode perder');
  });
  it('falha ao salvar a síntese mantém o original confirmado e o campo intacto', async () => {
    const r = preparar({ salvar: async (e) => { if (e.sinteseIA) throw new Error('Falha de gravação'); } });
    r.controle.editar('Original confirmado'); await r.controle.gerarIA();
    expect(r.controle.snapshot().texto).toBe('Original confirmado');
    expect([...r.banco.values()][0].resumo).toBe('Original confirmado');
    expect(r.backup()?.resumo).toBe('Original confirmado');
  });
  it('uma resposta atrasada da IA não sobrescreve uma edição mais recente', async () => {
    const inicio = adiar<void>(); const ia = adiar<unknown>();
    const r = preparar({ gerar: async () => { inicio.resolve(); return ia.promise; } });
    r.controle.editar('Antes'); const tarefa = r.controle.gerarIA(); await inicio.promise;
    r.controle.editar('Correção feita pelo usuário'); ia.resolve(resposta); await tarefa; await r.controle.salvarAgora();
    expect(r.controle.snapshot().texto).toBe('Correção feita pelo usuário');
    expect([...r.banco.values()][0].resumo).toBe('Correção feita pelo usuário');
    expect(r.escritas.some((e) => e.sinteseIA)).toBe(false);
  });
  it('trocar de tela cancela a aplicação de uma IA ainda em andamento', async () => {
    const inicio = adiar<void>(); const ia = adiar<unknown>();
    const r = preparar({ gerar: async () => { inicio.resolve(); return ia.promise; } });
    r.controle.editar('Relato salvo antes de sair'); const tarefa = r.controle.gerarIA(); await inicio.promise;
    r.controle.cancelarIA(); ia.resolve(resposta); await tarefa;
    expect(r.controle.snapshot().texto).toBe('Relato salvo antes de sair');
    expect(r.escritas.some((e) => e.sinteseIA)).toBe(false);
  });
  it('serializa gravações e não anuncia salvo quando ainda existe texto mais novo', async () => {
    const primeira = adiar<void>(); let chamadas = 0;
    const r = preparar({ salvar: async () => { if (++chamadas === 1) await primeira.promise; } });
    r.controle.editar('Versão 1'); const v1 = r.controle.salvarAgora();
    r.controle.editar('Versão 2'); const v2 = r.controle.salvarAgora();
    primeira.resolve(); await Promise.all([v1, v2]);
    expect(r.escritas.map((e) => e.resumo)).toEqual(['Versão 1', 'Versão 2']);
    expect([...r.banco.values()][0].resumo).toBe('Versão 2');
  });
  it('cancelar durante a gravação da IA restaura o relato também no banco', async () => {
    const gravandoIA = adiar<void>(); const liberar = adiar<void>();
    const r = preparar({ salvar: async (e) => { if (e.sinteseIA) { gravandoIA.resolve(); await liberar.promise; } } });
    r.controle.editar('Relato que deve permanecer'); const tarefa = r.controle.gerarIA();
    await gravandoIA.promise; r.controle.cancelarIA(); liberar.resolve();
    await tarefa; await r.controle.salvarAgora();
    expect(r.controle.snapshot().texto).toBe('Relato que deve permanecer');
    expect([...r.banco.values()][0].resumo).toBe('Relato que deve permanecer');
    expect(r.backup()?.resumo).toBe('Relato que deve permanecer');
  });
  it('carregar registro confirmado não regrava um snapshot antigo no banco', async () => {
    const r = preparar(); r.controle.editar('Salvo'); await r.controle.salvarAgora();
    let escritas = 0;
    const outro = new RegistroConversa({ codigoIbge: 2103406, autorId: 'usuario-1', salvar: async () => { escritas++; }, backup: () => {}, gerar: async () => resposta });
    outro.iniciar(r.backup(), false); outro.aoSair();
    await new Promise((r) => setTimeout(r, 0));
    expect(escritas).toBe(0); expect(outro.snapshot().status).toBe('salvo');
  });
  it('nova conversa preserva a anterior e usa outro ID', async () => {
    const r = preparar(); r.controle.editar('Conversa anterior'); const anterior = r.controle.snapshot().evento!.id;
    await r.controle.novaConversa(); r.controle.editar('Nova reunião'); await r.controle.salvarAgora();
    expect(r.banco.size).toBe(2); expect(r.controle.snapshot().evento!.id).not.toBe(anterior);
    expect(r.banco.get(anterior)?.resumo).toBe('Conversa anterior');
    expect(conversaDoAutor(r.banco.get(anterior)!, 2103406, 'usuario-1')).toBe(false);
  });
  it('recuperação respeita usuário e município e reutiliza o ID salvo', async () => {
    const r = preparar(); r.controle.editar('Recuperar após fechar'); await r.controle.salvarAgora();
    const backup = r.backup()!;
    expect(conversaDoAutor(backup, 2112209, 'usuario-1')).toBe(false);
    expect(conversaDoAutor(backup, 2103406, 'outro-usuario')).toBe(false);
    expect(conversaDoAutor(backup, 2103406, 'usuario-1')).toBe(true);
    const restaurado = new RegistroConversa({ codigoIbge: 2103406, autorId: 'usuario-1', salvar: async (e) => { r.banco.set(e.id, e); }, backup: () => {}, gerar: async () => resposta });
    restaurado.iniciar(backup); await restaurado.salvarAgora();
    expect(restaurado.snapshot().texto).toBe('Recuperar após fechar'); expect(r.banco.size).toBe(1);
  });
});
