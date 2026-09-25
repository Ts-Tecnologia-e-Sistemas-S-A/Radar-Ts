import { describe, expect, it } from 'bun:test';
import type { MunicipioIbge } from '../types';
import { correspondeBuscaMunicipio, ordenarMunicipiosPorBusca } from './municipioSearch';

const municipios: MunicipioIbge[] = [
  { codigoIbge: 1, nome: 'São Paulo', uf: 'SP' },
  { codigoIbge: 2, nome: 'São José dos Campos', uf: 'SP' },
  { codigoIbge: 3, nome: 'Campina Grande', uf: 'PB' },
  { codigoIbge: 4, nome: 'Campinas', uf: 'SP' },
];

describe('municipioSearch', () => {
  it('encontra correspondência exata sem acento', () => {
    expect(correspondeBuscaMunicipio('Sao Paulo', municipios[0])).toBe(true);
  });

  it('aceita consulta com acento para município sem acento e vice-versa', () => {
    expect(correspondeBuscaMunicipio('São José dos Campos', municipios[1])).toBe(true);
    expect(correspondeBuscaMunicipio('sao jose dos campos', municipios[1])).toBe(true);
  });

  it('tolera erros leves de digitação', () => {
    expect(correspondeBuscaMunicipio('campnas', municipios[3])).toBe(true); // omitida
    expect(correspondeBuscaMunicipio('campibnas', municipios[3])).toBe(true); // extra
    expect(correspondeBuscaMunicipio('camoinas', municipios[3])).toBe(true); // trocada
    expect(correspondeBuscaMunicipio('cmpainas', municipios[3])).toBe(true); // transposta
  });

  it('permite busca por UF', () => {
    expect(correspondeBuscaMunicipio('sp', municipios[0])).toBe(true);
    expect(correspondeBuscaMunicipio('SP', municipios[2])).toBe(false);
  });

  it('lida com nomes compostos e diferenças de pontuação/espaços', () => {
    expect(correspondeBuscaMunicipio('sao-jose dos   campos', municipios[1])).toBe(true);
    expect(correspondeBuscaMunicipio('saojosedoscampos', municipios[1])).toBe(true);
  });

  it('rejeita consultas muito diferentes', () => {
    expect(correspondeBuscaMunicipio('xablau', municipios[0])).toBe(false);
    expect(correspondeBuscaMunicipio('berlim', municipios[1])).toBe(false);
  });

  it('ordena com ranking determinístico: exato, prefixo e depois aproximação', () => {
    const ordenados = ordenarMunicipiosPorBusca('campinas', municipios);
    expect(ordenados.map((m) => m.nome)).toEqual(['Campinas', 'Campina Grande']);
  });
});
