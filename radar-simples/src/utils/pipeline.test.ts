import { describe, expect, it } from 'bun:test';
import { municipioCrmVazio } from '../types';
import { entrarEmStandby, garantirDataInclusao, marcarComoVisitada, oportunidadeComInteresse, reativarOportunidade, visivelNoFoco } from './pipeline';

describe('pipeline B2G e standby', () => {
  it('exige data e motivo para entrar em standby', () => {
    expect(() => entrarEmStandby(municipioCrmVazio(2103000), 'Caxias')).toThrow('Data de Reativação');
    expect(() => entrarEmStandby({ ...municipioCrmVazio(2103000), dataReativacao: '2027-01-10' }, 'Caxias')).toThrow('Motivo');
  });

  it('preserva a etapa anterior e cria uma única tarefa identificável', () => {
    const atual = { ...municipioCrmVazio(2103000), estagioFunil: 'proposta' as const, dataReativacao: '2027-01-10', motivoEspera: 'loa_ppa' as const };
    const resultado = entrarEmStandby(atual, 'Caxias', new Date('2026-09-25T12:00:00Z'));
    expect(resultado.crm.estagioFunil).toBe('standby');
    expect(resultado.crm.estagioAntesStandby).toBe('proposta');
    expect(resultado.tarefa.id).toBe('reativacao-standby-2103000');
    expect(resultado.tarefa.data).toBe('2027-01-10');
    expect(reativarOportunidade(resultado.crm).estagioFunil).toBe('proposta');
  });

  it('oculta standby futuro e reapresenta no dia ou depois', () => {
    const crm = { ...municipioCrmVazio(1), estagioFunil: 'standby' as const, dataReativacao: '2027-01-10' };
    expect(visivelNoFoco(crm, '2027-01-09')).toBeFalse();
    expect(visivelNoFoco(crm, '2027-01-10')).toBeTrue();
    expect(visivelNoFoco(crm, '2027-01-11')).toBeTrue();
  });

  it('separa visita de interesse comercial', () => {
    const visitada = marcarComoVisitada(municipioCrmVazio(1), '2026-09-20');
    expect(visitada.visitada).toBeTrue();
    expect(visitada.dataPrimeiraVisita).toBe('2026-09-20');
    expect(oportunidadeComInteresse(visitada)).toBeFalse();
    expect(oportunidadeComInteresse({ ...visitada, estagioFunil: 'qualificacao' })).toBeTrue();
  });

  it('usa a inclusão como primeira visita e permite alterar essa data', () => {
    const incluida = garantirDataInclusao(municipioCrmVazio(1), '2026-09-26');
    const novaVisita = marcarComoVisitada(incluida, '2026-10-03');
    const corrigida = marcarComoVisitada({ ...novaVisita, dataPrimeiraVisita: '2026-09-24' });
    expect(novaVisita.dataInclusao).toBe('2026-09-26');
    expect(novaVisita.dataPrimeiraVisita).toBe('2026-09-26');
    expect(novaVisita.dataUltimaVisita).toBe('2026-10-03');
    expect(corrigida.dataInclusao).toBe('2026-09-26');
    expect(corrigida.dataPrimeiraVisita).toBe('2026-09-24');
  });
});