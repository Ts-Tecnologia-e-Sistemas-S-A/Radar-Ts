import { EstagioFunilB2G } from '../types';

/**
 * Peso de probabilidade de fechamento por etapa do funil, usado só pra
 * calcular a previsão ponderada do Pipeline. É uma estimativa simples e
 * assumida (não vem de nenhuma fonte externa) — ajuste livremente se o
 * time comercial tiver uma taxa de conversão histórica real por etapa.
 */
export const PESO_FORECAST: Record<EstagioFunilB2G, number> = {
  mapeamento: 0.1,
  qualificacao: 0.25,
  proposta: 0.45,
  juridico: 0.65,
  homologacao: 0.9,
};

export function forecastPonderado(valorAnual: number | undefined, estagio: EstagioFunilB2G): number {
  return (valorAnual || 0) * PESO_FORECAST[estagio];
}
