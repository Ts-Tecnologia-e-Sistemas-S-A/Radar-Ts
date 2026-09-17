import { afterEach, describe, expect, it, mock } from 'bun:test';
import { prepararTextoPlanilha, validarRelatorioPlanilha } from '../src/utils/relatorioPlanilha';

const relatorio = { titulo: 'Matrículas por escola', resumo: 'Duas escolas informadas.', achados: ['Escola A: 120 matrículas.'], limitacoes: ['Ano não informado.'], proximosPassos: ['Informar o ano.'] };
const gerar = mock(async (_req: unknown) => ({ text: JSON.stringify(relatorio) }));
mock.module('@google/genai', () => ({ GoogleGenAI: class { models = { generateContent: gerar }; } }));
const { processarRequisicaoIA } = await import('./iaProxy');
const chaveAnterior = process.env.GEMINI_API_KEY;
afterEach(() => {
  if (chaveAnterior === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = chaveAnterior;
  gerar.mockClear();
  gerar.mockImplementation(async () => ({ text: JSON.stringify(relatorio) }));
});

describe('análise de texto de planilha', () => {
  it('sugere tarefa com data de referência e valida retorno', async () => {
    process.env.GEMINI_API_KEY = 'chave-ficticia-teste';
    const sugestao = { tipo: 'ligar', descricao: 'Confirmar a visita', data: '2026-09-18', hora: '10:00' };
    gerar.mockImplementation(async () => ({ text: JSON.stringify(sugestao) }));
    const resposta = await processarRequisicaoIA('sugerir_tarefa', { contexto: 'Amanhã às 10h ligar', hoje: '2026-09-17' });
    expect(resposta).toEqual({ status: 200, body: { sucesso: true, dados: sugestao } });
    expect((gerar.mock.calls[0][0] as any).contents[0].parts[0].text).toContain('2026-09-17');
    expect((await processarRequisicaoIA('sugerir_tarefa', { contexto: '', hoje: '2026-02-30' })).status).toBe(400);
  });
  it('preserva células vazias, acentos e valores brasileiros', () => {
    expect(prepararTextoPlanilha('\tEscola\tValor\r\n\tSão José\t1.234,56\t')).toBe('\tEscola\tValor\n\tSão José\t1.234,56\t');
  });
  it('encaminha tabela inteira ao modo de relatório e devolve estrutura validada', async () => {
    process.env.GEMINI_API_KEY = 'chave-ficticia-teste';
    const texto = 'Escola\tMatrículas\r\nEscola A\t120\r\nEscola B\t85';
    const resposta = await processarRequisicaoIA('analisar_planilha', { texto });
    expect(resposta).toEqual({ status: 200, body: { sucesso: true, dados: relatorio } });
    const pedido = gerar.mock.calls[0][0] as any;
    expect(pedido.contents[0].parts[1].text).toBe(texto.replace(/\r\n/g, '\n'));
  });
  it('rejeita entrada vazia, tipo inválido e excesso antes de chamar IA', async () => {
    for (const texto of ['', ' \t\n', 42, 'a'.repeat(60001)]) {
      expect((await processarRequisicaoIA('analisar_planilha', { texto })).status).toBe(400);
    }
    expect(gerar).not.toHaveBeenCalled();
  });
  it('não aceita síntese de reunião como relatório', () => {
    expect(() => validarRelatorioPlanilha({ combinado: 'Reunião', proximoPasso: 'Agendar' })).toThrow('incompleto');
    expect(() => validarRelatorioPlanilha({ ...relatorio, achados: [null] })).toThrow('incompleto');
  });
  it('propaga resposta incompleta da IA como falha', async () => {
    process.env.GEMINI_API_KEY = 'chave-ficticia-teste';
    gerar.mockImplementation(async () => ({ text: '{"titulo":"Incompleto"}' }));
    const resposta = await processarRequisicaoIA('analisar_planilha', { texto: 'Escola\tAlunos\nA\t10' });
    expect(resposta.status).toBe(502);
    expect(resposta.body.sucesso).toBe(false);
  });
});
