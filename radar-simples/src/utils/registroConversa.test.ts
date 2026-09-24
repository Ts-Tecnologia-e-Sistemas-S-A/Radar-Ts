import { describe, expect, it } from 'bun:test';
import { conversaDoAutor, RegistroConversa, type ConversaSalva } from './registroConversa';

function preparar(online = true) {
  const banco = new Map<string, ConversaSalva>();
  let backup: ConversaSalva | null = null;
  let confirmado = false;
  let conectado = online;
  const controle = new RegistroConversa({
    codigoIbge: 2103406, autorId: 'usuario-1', espera: 10000,
    conectado: () => conectado,
    salvar: async (evento) => {
      banco.set(evento.id, structuredClone(evento));
      if (!conectado) await new Promise<void>(() => {}); // setDoc aguarda o servidor sem rede
    },
    backup: (evento, ok) => { backup = structuredClone(evento); confirmado = !!ok; },
  });
  controle.iniciar(null);
  return { controle, banco, backup: () => backup, confirmado: () => confirmado, conectar: () => { conectado = true; } };
}

describe('notas digitadas sem IA', () => {
  it('guarda o texto exato com um ID estável', async () => {
    const r = preparar();
    r.controle.editar('Primeiro trecho');
    const id = r.controle.snapshot().evento!.id;
    r.controle.editar('  Relato completo\nTelefone: 9999  ');
    await r.controle.salvarAgora();
    expect(r.banco.size).toBe(1);
    expect(r.banco.get(id)?.resumo).toBe('  Relato completo\nTelefone: 9999  ');
    expect(r.banco.get(id)?.textoOriginal).toBe(r.controle.snapshot().texto);
    expect(r.banco.get(id)?.sinteseIA).toBeUndefined();
    expect(r.controle.snapshot().status).toBe('salvo');
  });

  it('preserva a nota local quando a escrita aguarda a internet e confirma após reconectar', async () => {
    const r = preparar(false);
    r.controle.editar('Anotação offline');
    await r.controle.salvarAgora();
    expect(r.controle.snapshot().status).toBe('local');
    expect(r.backup()?.textoOriginal).toBe('Anotação offline');
    expect(r.confirmado()).toBe(false);
    const id = r.backup()!.id;
    r.conectar();
    await r.controle.salvarAgora();
    expect(r.banco.get(id)?.resumo).toBe('Anotação offline');
    expect(r.controle.snapshot().status).toBe('salvo');
    expect(r.confirmado()).toBe(true);
  });

  it('recupera rascunho não confirmado e sincroniza com o mesmo ID', async () => {
    const r = preparar(false);
    r.controle.editar('Recuperar após fechar');
    const copia = r.backup()!;
    expect(conversaDoAutor(copia, 2103406, 'usuario-1')).toBe(true);
    expect(conversaDoAutor(copia, 2103406, 'outro-usuario')).toBe(false);
    const outro = new RegistroConversa({
      codigoIbge: 2103406, autorId: 'usuario-1', salvar: async (evento) => { r.banco.set(evento.id, evento); }, backup: () => {},
    });
    outro.iniciar(copia);
    await outro.salvarAgora();
    expect(outro.snapshot().texto).toBe('Recuperar após fechar');
    expect(r.banco.get(copia.id)?.resumo).toBe('Recuperar após fechar');
  });

  it('conclui uma conversa antes de criar outra', async () => {
    const r = preparar();
    r.controle.editar('Conversa anterior');
    const anterior = r.controle.snapshot().evento!.id;
    await r.controle.novaConversa();
    r.controle.editar('Nova conversa');
    await r.controle.salvarAgora();
    expect(r.banco.size).toBe(2);
    expect(r.banco.get(anterior)?.registroRapido.encerrado).toBe(true);
    expect(r.controle.snapshot().evento!.id).not.toBe(anterior);
  });

  it('não apaga o rascunho offline ao tentar iniciar outra conversa', async () => {
    const r = preparar(false);
    r.controle.editar('Texto sem conexão');
    await expect(r.controle.novaConversa()).rejects.toThrow('Conecte-se');
    expect(r.controle.snapshot().texto).toBe('Texto sem conexão');
    expect(r.backup()?.resumo).toBe('Texto sem conexão');
  });
});
