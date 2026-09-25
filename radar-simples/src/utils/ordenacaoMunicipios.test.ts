import { describe, expect, it } from 'bun:test';
import type { MunicipioCrm, MunicipioIbge } from '../types';
import { atualizarUltimaAtividadeMunicipio, ordenarMunicipiosPorUltimaAtividade, ultimaAtividadeDoEvento } from './ordenacaoMunicipios';

function municipio(codigoIbge: number, nome: string, uf: string): MunicipioIbge {
  return { codigoIbge, nome, uf };
}

function crm(codigoIbge: number, ultimaAtividadeEm?: string): MunicipioCrm {
  return {
    codigoIbge,
    prioritario: false,
    contatos: [],
    solucoes: [],
    estagioFunil: 'mapeamento',
    ultimaAtividadeEm,
  };
}

describe('ordenacaoMunicipiosPorUltimaAtividade', () => {
  it('coloca a cidade mais recente primeiro', () => {
    const linhas = [
      { municipio: municipio(1, 'Aparecida', 'SP'), crm: crm(1, '2026-01-01T08:00:00.000Z') },
      { municipio: municipio(2, 'Bauru', 'SP'), crm: crm(2, '2026-01-10T08:00:00.000Z') },
      { municipio: municipio(3, 'Campinas', 'SP'), crm: crm(3, '2026-01-03T08:00:00.000Z') },
    ];

    expect(ordenarMunicipiosPorUltimaAtividade(linhas).map((item) => item.municipio.nome)).toEqual(['Bauru', 'Campinas', 'Aparecida']);
  });

  it('faz fallback determinístico quando não há ultimaAtividadeEm', () => {
    const linhas = [
      { municipio: municipio(2, 'Zé Doca', 'MA'), crm: crm(2) },
      { municipio: municipio(1, 'Açailândia', 'MA'), crm: crm(1) },
      { municipio: municipio(3, 'Balsas', 'PI'), crm: crm(3) },
    ];

    expect(ordenarMunicipiosPorUltimaAtividade(linhas).map((item) => item.municipio.nome)).toEqual(['Açailândia', 'Zé Doca', 'Balsas']);
  });

  it('mantém a ordenação estável por nome e UF quando o tempo é igual', () => {
    const linhas = [
      { municipio: municipio(30, 'São José', 'SP'), crm: crm(30, '2026-01-01T00:00:00.000Z') },
      { municipio: municipio(10, 'Aparecida', 'SP'), crm: crm(10, '2026-01-01T00:00:00.000Z') },
      { municipio: municipio(20, 'Belo Horizonte', 'MG'), crm: crm(20, '2026-01-01T00:00:00.000Z') },
    ];

    expect(ordenarMunicipiosPorUltimaAtividade(linhas).map((item) => `${item.municipio.uf}-${item.municipio.nome}`))
      .toEqual(['MG-Belo Horizonte', 'SP-Aparecida', 'SP-São José']);
  });

  it('desempata homônimos por UF e código quando falta atividade', () => {
    const linhas = [
      { municipio: municipio(2, 'Santa Luzia', 'PB'), crm: crm(2) },
      { municipio: municipio(1, 'Santa Luzia', 'MG'), crm: crm(1) },
      { municipio: municipio(3, 'Santa Luzia', 'MG'), crm: crm(3) },
    ];

    expect(ordenarMunicipiosPorUltimaAtividade(linhas).map((item) => `${item.municipio.uf}-${item.municipio.codigoIbge}`))
      .toEqual(['MG-1', 'MG-3', 'PB-2']);
  });
});

describe('atualizarUltimaAtividadeMunicipio', () => {
  it('atualiza a atividade quando há edição real do CRM', () => {
    const anterior = crm(1, '2026-01-01T08:00:00.000Z');
    const atualizado = atualizarUltimaAtividadeMunicipio(anterior, { ...anterior, observacoes: 'Visitado' }, '2026-01-10T08:00:00.000Z');
    expect(atualizado.ultimaAtividadeEm).toBe('2026-01-10T08:00:00.000Z');
  });

  it('não altera a atividade quando nada mudou além do próprio timestamp', () => {
    const anterior = crm(1, '2026-01-01T08:00:00.000Z');
    const atualizado = atualizarUltimaAtividadeMunicipio(anterior, { ...anterior }, '2026-01-10T08:00:00.000Z');
    expect(atualizado.ultimaAtividadeEm).toBe('2026-01-01T08:00:00.000Z');
  });
});

describe('ultimaAtividadeDoEvento', () => {
  it('prefere o horário efetivo do registro rápido quando existe', () => {
    expect(ultimaAtividadeDoEvento({
      id: 'e1',
      codigoIbge: 1,
      tipo: 'reuniao',
      data: '2026-01-10',
      resumo: 'Registro',
      anexos: [],
      mandato: 'Atual',
      mandatoAtivo: true,
      criadaEm: '2026-01-10T08:00:00.000Z',
      registroRapido: { autorId: 'u1', atualizadoEm: '2026-01-10T09:00:00.000Z', encerrado: false },
    })).toBe('2026-01-10T09:00:00.000Z');
  });
});
