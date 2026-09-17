import { PontoRota } from '../storage';

/** Distância em km entre duas coordenadas (fórmula de Haversine). */
export function distanciaKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Soma a distância entre pontos de localização consecutivos registrados
 * entre duas datas (inclusive). Não é rastreamento contínuo em segundo
 * plano (o navegador não garante isso) — é a distância entre os pontos que
 * o app conseguiu registrar enquanto esteve aberto.
 */
export function calcularKmPeriodo(pontos: PontoRota[], inicioISO: string, fimISO: string): number {
  const doPeriodo = pontos
    .filter((p) => {
      const dia = p.timestamp.slice(0, 10);
      return dia >= inicioISO && dia <= fimISO;
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  let total = 0;
  for (let i = 1; i < doPeriodo.length; i++) {
    total += distanciaKm(doPeriodo[i - 1], doPeriodo[i]);
  }
  return total;
}

/** Km rodados hoje — ver calcularKmPeriodo. */
export function calcularKmHoje(pontos: PontoRota[], hoje: Date = new Date()): number {
  const hojeISO = hoje.toISOString().slice(0, 10);
  return calcularKmPeriodo(pontos, hojeISO, hojeISO);
}
