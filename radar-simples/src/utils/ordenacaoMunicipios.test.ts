import { describe, expect, it } from 'bun:test';
import { municipioCrmVazio } from '../types';
import { compararMunicipios, type LinhaMunicipio } from './ordenacaoMunicipios';

function linha(codigoIbge: number, nome: string, uf = 'MA'): LinhaMunicipio {
  return { municipio: { codigoIbge, nome, uf }, crm: municipioCrmVazio(codigoIbge) };
}

describe('ordenação do Radar', () => {
  it('ordena visitas mais antigas primeiro, independentemente da próxima tarefa', () => {
    const a = linha(1, 'Alfa'), z = linha(2, 'Zeta');
    a.crm.proximaAcao = { data: '2026-01-01', descricao: 'Ligar', presencial: false };
    z.crm.proximaAcao = { data: '2026-12-01', descricao: 'Visitar', presencial: true };
    const visitas = { 1: { data: '2026-09-25' }, 2: { data: '2026-09-10' } };
    expect([a, z].sort((x, y) => compararMunicipios(x, y, 'visita', visitas)).map(l => l.municipio.nome)).toEqual(['Zeta', 'Alfa']);
  });

  it('mantém cidades sem data ao final, sem usar a próxima ação como visita', () => {
    const a = linha(1, 'Alfa'), z = linha(2, 'Zeta'), b = linha(3, 'Beta');
    a.crm.proximaAcao = { data: '2026-01-01', descricao: 'Visitar', presencial: true };
    const visitas = { 2: { data: '2026-09-10' } };
    expect([b, a, z].sort((x, y) => compararMunicipios(x, y, 'visita', visitas)).map(l => l.municipio.nome)).toEqual(['Zeta', 'Alfa', 'Beta']);
  });

  it('ordena por nome mesmo quando as datas indicam outra ordem', () => {
    const a = linha(1, 'Açailândia'), z = linha(2, 'Zé Doca');
    const visitas = { 1: { data: '2026-09-25' }, 2: { data: '2026-09-10' } };
    expect([z, a].sort((x, y) => compararMunicipios(x, y, 'nome', visitas)).map(l => l.municipio.nome)).toEqual(['Açailândia', 'Zé Doca']);
  });

  it('desempata visitas de mesma data por nome e UF', () => {
    const a = linha(1, 'São José', 'SP'), b = linha(2, 'São José', 'MA'), c = linha(3, 'Açailândia');
    const visitas = { 1: { data: '2026-09-10' }, 2: { data: '2026-09-10' }, 3: { data: '2026-09-10' } };
    expect([a, b, c].sort((x, y) => compararMunicipios(x, y, 'visita', visitas)).map(l => l.municipio.codigoIbge)).toEqual([3, 2, 1]);
  });

  it('ordena tarefas por data e hora, colocando tarefas sem horário por último no dia', () => {
    const linhas = [linha(1, 'Alfa'), linha(2, 'Beta'), linha(3, 'Gama'), linha(4, 'Delta')];
    linhas[0].crm.proximaAcao = { data: '2026-09-11', hora: '08:00', descricao: 'Ligar', presencial: false };
    linhas[1].crm.proximaAcao = { data: '2026-09-10', descricao: 'Ligar', presencial: false };
    linhas[2].crm.proximaAcao = { data: '2026-09-10', hora: '09:00', descricao: 'Ligar', presencial: false };
    expect(linhas.sort((x, y) => compararMunicipios(x, y, 'tarefa', {})).map(l => l.municipio.codigoIbge)).toEqual([3, 2, 1, 4]);
  });
});
