import { describe, expect, it } from 'bun:test';
import type { MunicipioCrm, MunicipioIbge } from '../types';
import { compareMunicipiosPorUltimaAtividade, municipioCrmMudouSemUltimaAtividade, ordenarMunicipiosPorUltimaAtividade } from './atividadeMunicipio';

function linha(codigoIbge: number, nome: string, uf: string, ultimaAtividadeEm?: string) {
  const municipio: MunicipioIbge = { codigoIbge, nome, uf };
  const crm: MunicipioCrm = { codigoIbge, prioritario: false, contatos: [], solucoes: [], estagioFunil: 'mapeamento', ultimaAtividadeEm };
  return { municipio, crm };
}

describe('atividadeMunicipio', () => {
  it('ordena a cidade recém-editada primeiro', () => {
    const ordenadas = ordenarMunicipiosPorUltimaAtividade([
      linha(1, 'Bacabal', 'MA', '2026-09-25T10:00:00.000Z'),
      linha(2, 'Açailândia', 'MA', '2026-09-25T12:00:00.000Z'),
    ]);
    expect(ordenadas.map((item) => item.municipio.codigoIbge)).toEqual([2, 1]);
  });

  it('usa fallback determinístico por nome, uf e código quando não há timestamp', () => {
    const ordenadas = ordenarMunicipiosPorUltimaAtividade([
      linha(30, 'Bom Jardim', 'PI'),
      linha(20, 'Bom Jardim', 'MA'),
      linha(10, 'Altos', 'PI'),
      linha(21, 'Bom Jardim', 'MA'),
    ]);
    expect(ordenadas.map((item) => item.municipio.codigoIbge)).toEqual([10, 20, 21, 30]);
  });

  it('aceita dados antigos sem última atividade e mantém o município mais recente na frente', () => {
    const ordenadas = ordenarMunicipiosPorUltimaAtividade([
      linha(1, 'Caxias', 'MA'),
      linha(2, 'Teresina', 'PI', '2026-09-25T14:30:00.000Z'),
    ]);
    expect(ordenadas.map((item) => item.municipio.codigoIbge)).toEqual([2, 1]);
  });

  it('ignora timestamps inválidos e compara diretamente o CRM, sem depender de rota ou despesa', () => {
    const linhas = [
      linha(1, 'Currais', 'PI', 'data-invalida'),
      linha(2, 'Barras', 'PI'),
    ];
    const pontosGps = [{ id: 'p1', latitude: -5.0, longitude: -42.0, timestamp: '2099-01-01T00:00:00.000Z' }];
    const despesas = [{ id: 'd1', codigoIbge: 1, valor: 999 }];
    expect(compareMunicipiosPorUltimaAtividade(linhas[0], linhas[1])).toBeGreaterThan(0);
    expect(pontosGps).toHaveLength(1);
    expect(despesas[0].codigoIbge).toBe(1);
  });

  it('detecta edição real sem considerar apenas o carimbo de atividade', () => {
    const base: MunicipioCrm = { codigoIbge: 1, prioritario: false, contatos: [], solucoes: [], estagioFunil: 'mapeamento', ultimaAtividadeEm: '2026-09-25T10:00:00.000Z' };
    expect(municipioCrmMudouSemUltimaAtividade(base, { ...base, ultimaAtividadeEm: '2026-09-25T11:00:00.000Z' })).toBe(false);
    expect(municipioCrmMudouSemUltimaAtividade(base, { ...base, observacoes: 'Novo registro' })).toBe(true);
  });
});
