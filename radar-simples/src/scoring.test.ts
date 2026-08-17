import { describe, it, expect } from 'bun:test';
import { calcularPotencial } from './scoring';
import { municipioCrmVazio, MunicipioCrm } from './types';

const HOJE = new Date('2026-08-17T12:00:00');

function base(overrides: Partial<MunicipioCrm> = {}): MunicipioCrm {
  return { ...municipioCrmVazio(1234567), ...overrides };
}

describe('calcularPotencial', () => {
  it('retorna null (oculta da lista) quando já é cliente do nosso sistema', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'nosso_sistema' }), true, HOJE);
    expect(resultado).toBeNull();
  });

  it('soma oportunidade recente + nenhum sistema e classifica como Alta', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'nenhum' }), true, HOJE);
    expect(resultado).toEqual({ pontos: 75, classificacao: 'Alta' });
  });

  it('sistema concorrente sem nenhum outro sinal fica em Baixa', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'concorrente' }), false, HOJE);
    expect(resultado).toEqual({ pontos: 0, classificacao: 'Baixa' });
  });

  it('soma pontos de contrato vencendo em até 180 dias', () => {
    const resultado = calcularPotencial(
      base({ sistemaAtual: 'concorrente', contratoVencimento: '2027-01-01' }),
      false,
      HOJE
    );
    expect(resultado).toEqual({ pontos: 15, classificacao: 'Baixa' });
  });

  it('não soma pontos de contrato vencendo em mais de 180 dias', () => {
    const resultado = calcularPotencial(
      base({ sistemaAtual: 'concorrente', contratoVencimento: '2028-01-01' }),
      false,
      HOJE
    );
    expect(resultado).toEqual({ pontos: 0, classificacao: 'Baixa' });
  });

  it('soma pontos quando a rede tem mais de 20.000 alunos', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'concorrente', alunosRede: 25000 }), false, HOJE);
    expect(resultado).toEqual({ pontos: 10, classificacao: 'Baixa' });
  });

  it('não soma pontos quando a rede tem 20.000 alunos ou menos', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'concorrente', alunosRede: 20000 }), false, HOJE);
    expect(resultado).toEqual({ pontos: 0, classificacao: 'Baixa' });
  });

  it('nenhum sistema sozinho soma 25 pontos e cai em Média', () => {
    const resultado = calcularPotencial(base({ sistemaAtual: 'nenhum' }), false, HOJE);
    expect(resultado).toEqual({ pontos: 25, classificacao: 'Média' });
  });

  it('50 pontos exatos já classifica como Alta', () => {
    const resultado = calcularPotencial(
      base({ sistemaAtual: 'nenhum', alunosRede: 25000, contratoVencimento: '2027-01-01' }),
      false,
      HOJE
    );
    expect(resultado).toEqual({ pontos: 50, classificacao: 'Alta' });
  });
});
