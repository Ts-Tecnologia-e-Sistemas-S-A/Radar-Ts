import { describe, it, expect } from 'bun:test';
import { montarRelatorioGestao, type FonteRelatorio } from './relatorioGestao';
import { validarPacoteHistorico } from './importarHistorico';
import type { Despesa, EventoTimeline } from '../types';
const fonte: FonteRelatorio = { municipios: [], crm: {}, despesas: [], eventos: [], tarefas: [] };
const despesa: Despesa = { id: '1', valor: 0.1, data: '2026-09-01', descricao: 'Teste', categoria: 'alimentacao', origemOcr: false, criadaEm: '' };
const evento: EventoTimeline = { id: 'e', codigoIbge: 2103000, tipo: 'documento', data: '', resumo: 'Texto integral', anexos: [], mandato: 'Histórico', mandatoAtivo: true, historicoImportado: { fonte: 'Teste', visitaRegistrada: true } };
describe('relatório gerencial', () => {
  it('soma centavos e mantém despesas sem município nos limites do período', () => {
    const r = montarRelatorioGestao({ ...fonte, despesas: [despesa, { ...despesa, id: '2', data: '2026-09-30', valor: 0.2 }, { ...despesa, id: '3', data: '2026-10-01', valor: 100 }] }, '2026-09-01', '2026-09-30');
    expect(r.totalDespesas).toBe(0.3); expect(r.semMunicipio).toBe(0.3); expect(r.despesas).toHaveLength(2);
  });
  it('inclui histórico sem data sem inventar visitas no período e preserva cidade não carregada', () => {
    const r = montarRelatorioGestao({ ...fonte, eventos: [evento, { ...evento, id: 'fora', data: '2026-07-30' }] }, '2026-09-01', '2026-09-30');
    expect(r.semData).toBe(1); expect(r.visitas).toBe(0); expect(r.cidades[0].nome).toBe('Município IBGE 2103000');
    expect(r.cidades[0].historico[0].texto).toContain('Texto integral');
  });
  it('não conta documentos comuns e tarefas pendentes como visitas', () => {
    const r = montarRelatorioGestao({ ...fonte, eventos: [{ ...evento, data: '2026-09-20' }, { ...evento, id: 'doc', codigoIbge: 2200400, data: '2026-09-20', historicoImportado: undefined }] }, '2026-09-01', '2026-09-30');
    expect(r.visitas).toBe(1); expect(r.cidadesVisitadas).toBe(1);
  });
  it('bloqueia períodos e valores inválidos', () => {
    expect(() => montarRelatorioGestao(fonte, '2026-02-30', '2026-09-01')).toThrow();
    expect(() => montarRelatorioGestao(fonte, '2026-09-30', '2026-09-01')).toThrow();
    expect(() => montarRelatorioGestao({ ...fonte, despesas: [{ ...despesa, valor: NaN }] }, '2026-09-01', '2026-09-30')).toThrow();
  });
  it('valida pacote antes de qualquer escrita', () => {
    expect(() => validarPacoteHistorico(JSON.stringify({ versao: 1, fonte: 'x', registros: [{ codigoIbge: 1 }] }))).toThrow();
    expect(() => validarPacoteHistorico('null')).toThrow();
  });
});
