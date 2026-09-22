import { describe, expect, it } from 'bun:test';
import { compararEstado, numeroPublicado, type NotaDaFonte } from './comparativoEstadual';
import { buscarComparativosIdeb, descobrirEdicaoIdeb, extrairNotasIdeb, lerNotasIdeb, PAGINA_IDEB } from './idebOficial';
import { compararAprendizagemVaar } from './vaarComparativo';
import { gerarDiagnostico } from './diagnosticoProxy';
import { zipSync, strToU8 } from 'fflate';

const metadados = { titulo: 'Teste', anoReferencia: 2025, universo: 'Municipal', fonte: { titulo: 'INEP', url: 'https://www.gov.br/inep/' }, consultadoEm: '2026-09-22T12:00:00Z', casasDecimais: 1 };
const notas: NotaDaFonte[] = [9, 8, 7, 6, 5, 5, 4, 3].map((nota, i) => ({ codigoIbge: 2100000 + i, municipio: `Cidade ${i}`, uf: 'MA', nota, participa: true }));

describe('cidade filtrada e líderes do mesmo estado', () => {
  it('retorna somente a cidade e os cinco primeiros, mantendo empate no corte', () => {
    const r = compararEstado(2100007, [...notas, { ...notas[0], uf: 'CE', codigoIbge: 2300000, nota: 10 }], metadados);
    expect(r.cidade?.codigoIbge).toBe(2100007);
    expect(r.cidade?.posicao).toBe(8);
    expect(r.destaques.map((n) => n.nota)).toEqual([9, 8, 7, 6, 5, 5]);
    expect(r.destaques.map((n) => n.posicao)).toEqual([1, 2, 3, 4, 5, 5]);
    expect(r.totalComNota).toBe(8);
    expect(r.destaques.some((n) => n.codigoIbge === 2300000 || n.codigoIbge === 2100006)).toBe(false);
  });
  it('não duplica a cidade quando ela própria está entre os líderes', () => {
    const r = compararEstado(2100000, notas, metadados);
    expect(r.cidade?.posicao).toBe(1);
    expect(r.destaques.some((n) => n.codigoIbge === 2100000)).toBe(false);
  });
  it('preserva nota da cidade inelegível, mas não lhe atribui posição', () => {
    const r = compararEstado(2100000, notas.map((n, i) => ({ ...n, participa: i !== 0 })), metadados);
    expect(r.cidade?.nota).toBe(9);
    expect(r.cidade?.posicao).toBeNull();
    expect(r.destaques[0].nota).toBe(8);
  });
  it('distingue nota ausente, cidade ausente e zero real', () => {
    const r = compararEstado(2100000, [{ ...notas[0], nota: null }, { ...notas[1], nota: 0 }], metadados);
    expect(r.cidade?.nota).toBeNull();
    expect(r.totalComNota).toBe(1);
    expect(r.destaques[0].nota).toBe(0);
    expect(compararEstado(2100999, notas, metadados).cidade).toBeNull();
    for (const n of ['', null, '-', '**']) expect(numeroPublicado(n)).toBeNull();
    expect(() => numeroPublicado('inválida')).toThrow();
  });
  it('rejeita duplicação, UF incompatível e nota fora da escala', () => {
    expect(() => compararEstado(2100000, [...notas, notas[0]], metadados)).toThrow('duplicado');
    expect(() => compararEstado(2100000, [{ ...notas[0], codigoIbge: 2300000 }], metadados)).toThrow('UF');
    expect(() => numeroPublicado(10.1, 10)).toThrow('escala');
  });
});

describe('IDEB oficial', () => {
  const header = ['SG_UF', 'CO_MUNICIPIO', 'NO_MUNICIPIO', 'REDE', 'VL_OBSERVADO_2023', 'VL_OBSERVADO_2025'];
  it('descobre a maior edição em links e nas abas oficiais, sem fixar um ano', () => {
    expect(descobrirEdicaoIdeb(`<a href="${PAGINA_IDEB}/2005-2023">2023</a><div data-url="${PAGINA_IDEB}/2005-2025"></div>`).ano).toBe(2025);
    expect(() => descobrirEdicaoIdeb('<a href="https://outro.example/2005-2027">2027</a>')).toThrow();
  });
  it('usa a coluna observada atual, somente rede municipal e mesma UF', () => {
    const r = extrairNotasIdeb([['Título'], header,
      ['MA', 2103406, 'Cidade A', 'Municipal', 9.9, 6.1],
      ['MA', 2103406, 'Cidade A', 'Pública', 9.9, 10],
      ['CE', 2300000, 'Cidade B', 'Municipal', 9, 10],
      ['MA', 2103000, 'Cidade C', 'Municipal', 8, '-'],
    ], 2025, 2103406);
    expect(r.map((n) => n.nota)).toEqual([6.1, null]);
    expect(() => extrairNotasIdeb([header], 2027, 2103406)).toThrow('anos anteriores');
  });
  it('lê o XLSX dentro do ZIP, sem confundir a outra planilha ODS ou a nota histórica', async () => {
    const s = (texto: string, ref: string) => `<c r="${ref}" t="inlineStr"><is><t>${texto}</t></is></c>`;
    const xlsx = zipSync({
      '[Content_Types].xml': strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>'),
      'xl/workbook.xml': strToU8('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Notas" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      'xl/_rels/workbook.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
      'xl/worksheets/sheet1.xml': strToU8(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${header.map((h, i) => s(h, `${String.fromCharCode(65 + i)}1`)).join('')}</row><row r="2">${s('MA', 'A2')}<c r="B2"><v>2103406</v></c>${s('Cidade A', 'C2')}${s('Municipal', 'D2')}<c r="E2"><v>9</v></c><c r="F2"><v>6.1</v></c></row></sheetData></worksheet>`),
    });
    const r = await lerNotasIdeb(zipSync({ 'notas.xlsx': xlsx, 'notas.ods': strToU8('Ignorar') }), 2025, 2103406);
    expect(r[0].nota).toBe(6.1);
  });
  it('mantém etapas separadas e permite uma pendente sem usar edição anterior', async () => {
    const urls: string[] = [];
    const r = await buscarComparativosIdeb(2100007, {
      ler: async (u) => u === PAGINA_IDEB ? `<div data-url="${PAGINA_IDEB}/2005-2025"></div>` : '<a href="https://download.inep.gov.br/ideb/divulgacao_anos_iniciais_municipios_2025.zip">Iniciais</a><a href="https://download.inep.gov.br/ideb/divulgacao_anos_finais_municipios_2023.zip">Finais antiga</a>',
      baixar: async (u) => { urls.push(u); return new Uint8Array(); },
      notas: async () => notas,
    });
    expect(r.comparativos.map((c) => c.titulo)).toEqual(['IDEB — Anos iniciais']);
    expect(r.aviso).toContain('Anos finais');
    expect(urls.some((u) => u.includes('2023'))).toBe(false);
  });
});

describe('VAAR e independência entre fontes', () => {
  const indicadores = 'Indicadores VAAR para o Fundeb 2026\nUF;Ente Federado;Código IBGE;Indicador Aprendizagem\nMA;Cidade A;2103406;0,781071\nMA;Cidade B;2103000;2,52\nCE;Outra UF;2300000;9,5';
  const habilitacao = 'UF;Código IBGE;Habilitados?;Beneficiário?;Evoluiu Indicador de Aprendizagem?\nMA;2103406;Não Habilitado;Não Beneficiário;Não\nMA;2103000;Habilitado;Beneficiário;Sim';
  it('seleciona beneficiários elegíveis sem esconder a cidade não habilitada', () => {
    const r = compararAprendizagemVaar(2103406, indicadores, habilitacao, 2026, 'https://www.gov.br/fnde/', metadados.consultadoEm);
    expect(r.cidade?.nota).toBe(0.781071);
    expect(r.cidade?.posicao).toBeNull();
    expect(r.destaques.map((n) => n.codigoIbge)).toEqual([2103000]);
    expect(() => compararAprendizagemVaar(2103406, indicadores, habilitacao, 2027, '', '')).toThrow('exercício');
  });
  it('retorna IDEB mesmo se VAAR e Censo estiverem indisponíveis', async () => {
    const comparativo = compararEstado(2100007, notas, metadados);
    const r = await gerarDiagnostico(2100007, {
      censo: async () => ({ status: 502, body: { sucesso: false, erro: 'Censo pendente' } }),
      vaar: async () => { throw new Error('FNDE indisponível'); },
      ideb: async () => ({ comparativos: [comparativo], aviso: null }),
      repasses: async () => { throw new Error('Repasses indisponíveis'); },
      query: async () => [],
    });
    if (!r.body.sucesso) throw new Error('Falha no diagnóstico');
    expect(r.body.dados.comparativosIdeb).toEqual([comparativo]);
    expect(r.body.dados.avisoVaar).toBe('FNDE indisponível');
  });
});
