import { afterEach, describe, expect, it } from 'bun:test';
import { buscarVaarOficial, descobrirPublicacao, moedaOficial } from './vaarOficial';
import { lerCsv, lerFonteOficial } from './fontesOficiais';
import { consultarEdicaoCenso, validarEspelhoCenso } from './censoAtualidade';
import { gerarDiagnostico } from './diagnosticoProxy';
import { gerarPdfDiagnostico } from '../src/utils/pdf';
import { buscarDiagnostico } from '../src/api/diagnostico';

// Fixtures sintéticas: não representam municípios nem valores reais.
const base = 'https://www.gov.br/fnde/';
const pagina = `<p><strong>3ª publicação – Portaria MEC/MF nº 11, de 28 de agosto de 2026</strong></p>
  <a href="${base}redes-beneficiadas-vaar-nova.csv">CSV</a>
  <p>2ª publicação – Portaria MEC/MF nº 6, de 29 de abril de 2026</p>
  <a href="${base}redes-beneficiadas-vaar-antiga.csv">CSV</a>
  <a href="${base}ListaentesbeneficiariosenaobeneficiariosVAAR.csv">CSV</a>`;
const cabecalho = 'UF;Código IBGE;Entidade;Cond. I;Cond. II;Cond. III;Cond. IV;Cond. V;Habilitados?;Evoluiu Indicador de Atendimento?;Evoluiu Indicador de Aprendizagem?;Beneficiário?;Pendência Identificada';
const lista = `Lista de Entes Beneficiários/Não Beneficiários VAAR 2026\n${cabecalho}\nMA;2103406;Município A;Sim;Sim;Não;Sim;Sim;Não Habilitado;Sim;Não;Não Beneficiário;Condição III\nMA;2103000;Município B;Sim;Sim;Sim;Sim;Sim;Habilitado;Sim;Sim;Beneficiário;-`;
const repasses = 'Portaria Interministerial nº 11, de 28 de Agosto de 2026\nRedes Ano de 2026\nUF;Ente Federado;Código IBGE;Complementação da União-VAAR (R$)\nMA;Município B;2103000;1.234,56';
const agora = new Date('2026-09-21T12:00:00Z');
function leitor(html = pagina, habilitacao = lista, valores = repasses) {
  return async (url: string) => url.endsWith('/2026') ? html : url.includes('Listaentes') ? habilitacao : valores;
}
const fetchOriginal = globalThis.fetch;
afterEach(() => { globalThis.fetch = fetchOriginal; });

describe('FNDE atual por município', () => {
  it('seleciona a revisão mais recente e o código IBGE exato', async () => {
    const urls: string[] = [];
    const ler = leitor();
    const r = await buscarVaarOficial(2103000, async (url) => { urls.push(url); return ler(url); }, agora);
    expect(r.repasseTotalPrevisto).toBe(1234.56);
    expect(r.codigoIbge).toBe(2103000);
    expect(r.condicoes).toEqual([true, true, true, true, true]);
    expect(urls.some((u) => u.includes('antiga'))).toBe(false);
    expect(r.fontes.length).toBe(3);
  });
  it('usa zero somente com não beneficiário explícito e ausência confirmada na tabela de repasses', async () => {
    const r = await buscarVaarOficial(2103406, leitor(), agora);
    expect(r.habilitado).toBe(false);
    expect(r.condicoes[2]).toBe(false);
    expect(r.evoluiuAtendimento).toBe(true);
    expect(r.repasseTotalPrevisto).toBe(0);
  });
  it('ausência de município não vira zero', async () => {
    await expect(buscarVaarOficial(2112209, leitor(), agora)).rejects.toThrow('ausente');
  });
  it('bloqueia valor quando beneficiário não consta nos repasses', async () => {
    const r = await buscarVaarOficial(2103000, leitor(pagina, lista, repasses.replace('2103000', '2112209')), agora);
    expect(r.repasseTotalPrevisto).toBeNull();
    expect(r.avisos.join(' ')).toContain('divergem');
  });
  it('não recua à revisão anterior se faltar arquivo na revisão nova', () => {
    expect(() => descobrirPublicacao(pagina.replace(/<a href="[^"]*nova.csv">CSV<\/a>/, ''), base)).toThrow('última publicação');
  });
  it('não aceita arquivo da portaria anterior sob o título atual', async () => {
    await expect(buscarVaarOficial(2103000, leitor(pagina, lista, repasses.replace('nº 11', 'nº 6')), agora)).rejects.toThrow('portaria');
  });
  it('não aceita exercício anterior', async () => {
    await expect(buscarVaarOficial(2103000, leitor(pagina, lista.replace('VAAR 2026', 'VAAR 2025')), agora)).rejects.toThrow('exercício');
  });
  it('não aceita condições desconhecidas, duplicidade ou CSV com esquema alterado', async () => {
    await expect(buscarVaarOficial(2103000, leitor(pagina, lista.replaceAll(';Sim;', ';Talvez;')), agora)).rejects.toThrow();
    await expect(buscarVaarOficial(2103000, leitor(pagina, lista + '\n' + lista.split('\n').at(-1)), agora)).rejects.toThrow('duplicado');
    await expect(buscarVaarOficial(2103000, leitor(pagina, lista.replace('Cond. I;', 'Outra;')), agora)).rejects.toThrow('Formato');
  });
  it('consulta novamente a cada chamada e propaga indisponibilidade sem cache antigo', async () => {
    await buscarVaarOficial(2103000, leitor(), agora);
    await expect(buscarVaarOficial(2103000, async () => { throw new Error('Fonte indisponível'); }, agora)).rejects.toThrow('indisponível');
    const atualizado = await buscarVaarOficial(2103000, leitor(pagina, lista, repasses.replace('1.234,56', '2.345,67')), agora);
    expect(atualizado.repasseTotalPrevisto).toBe(2345.67);
  });
});

describe('leitura e atualização', () => {
  it('entende aspas, delimitadores e linhas dentro do CSV', () => {
    expect(lerCsv('A;B\r\n"duas\nlinhas";"a; ""b"""')).toEqual([['A', 'B'], ['duas\nlinhas', 'a; "b"']]);
    expect(() => lerCsv('"incompleto')).toThrow();
  });
  it('não converte vazio ou traço em valor zero', () => {
    for (const v of ['', '-', 'NaN', '123.45']) expect(() => moedaOficial(v)).toThrow();
    expect(moedaOficial('0,00')).toBe(0);
  });
  it('decodifica Windows-1252 e pede resposta sem cache', async () => {
    globalThis.fetch = (async (_url, opcoes) => {
      expect(opcoes?.cache).toBe('no-store');
      expect(opcoes?.redirect).toBe('error');
      return new Response(new Uint8Array([78, 227, 111]));
    }) as typeof fetch;
    expect(await lerFonteOficial(`${base}arquivo.csv`)).toBe('Não');
    await expect(lerFonteOficial('https://example.com/arquivo')).rejects.toThrow('fora');
  });
  it('bloqueia espelho sem revisão conciliada ou com revisão antiga', () => {
    expect(() => validarEspelhoCenso({ ano: 2025, revisao: 'nova' }, undefined)).toThrow('bloqueados');
    expect(() => validarEspelhoCenso({ ano: 2025, revisao: 'nova' }, 'antiga')).toThrow();
    expect(() => validarEspelhoCenso({ ano: 2025, revisao: 'nova' }, 'nova')).not.toThrow();
  });
  it('seleciona a edição oficial mais recente e invalida retificações do mesmo ano', async () => {
    const html = '<a href="https://download.inep.gov.br/2024.zip">Microdados Censo Escolar 2024</a><a href="https://download.inep.gov.br/2025.zip">Microdados Censo Escolar 2025</a>';
    let etag = 'v1';
    const metadados = async (url: string) => {
      expect(String(url)).toEndWith('/2025.zip');
      return { bytes: Buffer.alloc(0), headers: { etag, 'last-modified': 'Mon, 20 Jul 2026 12:00:00 GMT' } };
    };
    const primeira = await consultarEdicaoCenso(async () => html, metadados);
    etag = 'v2';
    const segunda = await consultarEdicaoCenso(async () => html, metadados);
    expect(primeira.ano).toBe(2025);
    expect(primeira.revisao).not.toBe(segunda.revisao);
    expect(() => validarEspelhoCenso(segunda, primeira.revisao)).toThrow();
  });
  it('cliente rejeita resultado legado ou de outra cidade', async () => {
    globalThis.fetch = (async () => Response.json({ sucesso: true, dados: { codigoIbge: 2112209, consultadoEm: agora.toISOString() } })) as unknown as typeof fetch;
    await expect(buscarDiagnostico(2103000)).rejects.toThrow('cidade');
  });
  it('mantém VAAR disponível quando o Censo está pendente, sem fabricar achados', async () => {
    const vaar = await buscarVaarOficial(2103000, leitor(), agora);
    const r = await gerarDiagnostico(2103000, {
      censo: async () => ({ status: 502, body: { sucesso: false, erro: 'Revisão não validada' } }),
      vaar: async () => vaar,
      ideb: async () => ({ comparativos: [], aviso: 'IDEB indisponível' }),
      repasses: async () => { throw new Error('Repasses indisponíveis'); },
      query: async () => { throw new Error('Não deve consultar achados sem Censo atual'); },
    });
    expect(r.body.sucesso).toBe(true);
    if (!r.body.sucesso) throw new Error('Diagnóstico falhou');
    expect(r.body.dados.vaar).toEqual(vaar);
    expect(r.body.dados.resumo).toBeNull();
    expect(r.body.dados.avisoCenso).toBe('Revisão não validada');
    const municipio = { codigoIbge: 2103000, nome: 'Município B', uf: 'MA' };
    const pdf = gerarPdfDiagnostico(municipio, r.body.dados);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(pdf.output()).toContain('https://www.gov.br/fnde/');
    expect(() => gerarPdfDiagnostico(municipio, { resumo: null, achados: [] })).toThrow('novamente');
  });
});
