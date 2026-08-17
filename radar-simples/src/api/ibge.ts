import { MunicipioIbge } from '../types';

interface IbgeMunicipioResponse {
  id: number;
  nome: string;
}

/**
 * Lista oficial de municípios de uma UF, direto da API do IBGE.
 * Chamada direto do navegador — a API do IBGE libera CORS, não precisa de proxy.
 */
export async function buscarMunicipiosPorUf(uf: string): Promise<MunicipioIbge[]> {
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`IBGE respondeu ${response.status} ao buscar municípios de ${uf}`);
  }
  const dados: IbgeMunicipioResponse[] = await response.json();
  return dados.map((m) => ({ codigoIbge: m.id, nome: m.nome, uf: uf.toUpperCase() }));
}
