import { describe, it, expect } from 'bun:test';
import { distanciaKm, calcularKmHoje } from './rota';
import { PontoRota } from '../storage';

describe('distanciaKm', () => {
  it('retorna 0 para o mesmo ponto', () => {
    expect(distanciaKm({ latitude: -3.72, longitude: -38.54 }, { latitude: -3.72, longitude: -38.54 })).toBe(0);
  });

  it('calcula a distância aproximada entre Fortaleza e Sobral (linha reta, ~190-230km)', () => {
    const fortaleza = { latitude: -3.7172, longitude: -38.5433 };
    const sobral = { latitude: -3.6883, longitude: -40.3497 };
    const km = distanciaKm(fortaleza, sobral);
    expect(km).toBeGreaterThan(150);
    expect(km).toBeLessThan(300);
  });
});

describe('calcularKmHoje', () => {
  const HOJE = new Date('2026-08-17T18:00:00Z');

  function ponto(id: string, lat: number, lon: number, horaISO: string): PontoRota {
    return { id, latitude: lat, longitude: lon, timestamp: `2026-08-17T${horaISO}Z` };
  }

  it('retorna 0 com menos de 2 pontos hoje', () => {
    expect(calcularKmHoje([], HOJE)).toBe(0);
    expect(calcularKmHoje([ponto('p1', -3.72, -38.54, '08:00:00')], HOJE)).toBe(0);
  });

  it('soma a distância entre pontos consecutivos de hoje, ignorando pontos de outros dias', () => {
    const pontos: PontoRota[] = [
      ponto('p1', -3.7172, -38.5433, '08:00:00'),
      ponto('p2', -3.6883, -40.3497, '12:00:00'),
      { id: 'ontem', latitude: 0, longitude: 0, timestamp: '2026-08-16T08:00:00Z' },
    ];
    const km = calcularKmHoje(pontos, HOJE);
    expect(km).toBeGreaterThan(150);
    expect(km).toBeLessThan(300);
  });

  it('soma múltiplos trechos em sequência, não só extremos', () => {
    const pontos: PontoRota[] = [
      ponto('p1', -3.7, -38.5, '08:00:00'),
      ponto('p2', -3.7, -38.6, '09:00:00'),
      ponto('p3', -3.7, -38.7, '10:00:00'),
    ];
    const somaTrechos = distanciaKm({ latitude: -3.7, longitude: -38.5 }, { latitude: -3.7, longitude: -38.6 }) +
      distanciaKm({ latitude: -3.7, longitude: -38.6 }, { latitude: -3.7, longitude: -38.7 });
    expect(calcularKmHoje(pontos, HOJE)).toBeCloseTo(somaTrechos, 5);
  });
});
