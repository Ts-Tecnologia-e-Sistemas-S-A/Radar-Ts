import { describe, it, expect } from 'bun:test';
import { apurarRepasses, buscarRepassesRecebidos } from './repassesOficiais';

const cidades = [{ id: 2103406, nome: 'Coelho Neto' }, { id: 2111300, nome: 'São Luís' }];
const csv = 'COD_MUN;Município;UF;Mês;2024;2026\n1;COELHO NETO;MA;1;999.000,00;0,10\n1;COELHO NETO;MA;2;999.000,00;0,20\n2;SAO LUIS;MA;1;1,00;1.000,55\n2;SAO LUIS;MA;2;1,00;20,00\n9;Outra UF;CE;1;1,00;999.999,00';
const recurso = { success: true, result: { last_modified: '2026-03-10T12:00:00', url: 'https://www.tesourotransparente.gov.br/ckan/dataset/test/download/fundeb-por-municipio.csv' } };
const leitor = async (u: string) => u.includes('resource_show') ? JSON.stringify(recurso) : u.includes('ibge.gov.br') ? JSON.stringify(cidades) : csv;

describe('repasses efetivamente recebidos', () => {
  it('soma centavos do ano corrente, sem misturar UF, ano anterior ou SIAFI com IBGE', () => {
    const r = apurarRepasses(2103406, csv, cidades, 2026);
    expect(r.ultimoMes).toBe(2);
    expect(r.notas.map((n) => [n.codigoIbge, n.nota])).toEqual([[2103406, 0.3], [2111300, 1020.55]]);
  });
  it('mostra a cidade selecionada e classifica o estado pelo recebido', async () => {
    const r = await buscarRepassesRecebidos(2103406, leitor, new Date('2026-03-22T12:00:00Z'));
    expect(r.cidade?.posicao).toBe(2);
    expect(r.destaques.map((n) => n.codigoIbge)).toEqual([2111300]);
    expect(r.formato).toBe('moeda');
    expect(r.periodo).toBe('Janeiro a fevereiro de 2026');
    expect(r.atualizadoEm).toBe('2026-03-10T12:00:00Z');
    expect(r.universo).toContain('não discrimina o VAAR');
  });
  it('não recua para 2024 quando não existe o ano atual', () => {
    expect(() => apurarRepasses(2103406, csv, cidades, 2027)).toThrow('ano anterior');
  });
  it('bloqueia meses duplicados, períodos incompletos e identificação ambígua', () => {
    expect(() => apurarRepasses(2103406, csv + '\n1;COELHO NETO;MA;1;1,00;1,00', cidades, 2026)).toThrow('duplicado');
    expect(() => apurarRepasses(2103406, csv.replace('1;COELHO NETO;MA;2;999.000,00;0,20', ''), cidades, 2026)).toThrow('incompletos');
    expect(() => apurarRepasses(2103406, csv.replace('SAO LUIS', 'Cidade desconhecida'), cidades, 2026)).toThrow('vincular');
    expect(() => apurarRepasses(2103406, csv, [...cidades, cidades[0]], 2026)).toThrow('ambígua');
  });
  it('mantém zero publicado distinto de informação ausente', () => {
    expect(apurarRepasses(2103406, csv.replace('0,20', '0,00'), cidades, 2026).notas[0].nota).toBe(0.1);
    expect(() => apurarRepasses(2103406, csv.replace('0,20', ''), cidades, 2026)).toThrow('incompletos');
  });
  it('rejeita meses futuros e valores não reconhecidos', async () => {
    await expect(buscarRepassesRecebidos(2103406, leitor, new Date('2026-01-22T12:00:00Z'))).rejects.toThrow('futuros');
    expect(() => apurarRepasses(2103406, csv.replace('0,20', 'estimado'), cidades, 2026)).toThrow('Valor');
  });
});
