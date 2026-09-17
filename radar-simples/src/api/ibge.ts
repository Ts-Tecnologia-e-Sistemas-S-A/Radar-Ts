import { MunicipioIbge } from '../types';

interface IbgeMunicipioResponse {
  id: number;
  nome: string;
}

interface IbgeMunicipioComUfResponse {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
  'regiao-imediata'?: { 'regiao-intermediaria'?: { UF?: { sigla?: string } } };
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

let cacheTodosMunicipios: MunicipioIbge[] | null = null;

/**
 * Todos os ~5.570 municípios do Brasil, pra busca livre por nome/código IBGE
 * (tela "Nova Praça") sem precisar escolher a UF antes. Resultado fica em
 * cache no módulo — a lista não muda durante a sessão.
 */
export async function buscarTodosMunicipios(): Promise<MunicipioIbge[]> {
  if (cacheTodosMunicipios) return cacheTodosMunicipios;

  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  if (!response.ok) {
    throw new Error(`IBGE respondeu ${response.status} ao buscar a lista de municípios`);
  }
  const dados: IbgeMunicipioComUfResponse[] = await response.json();
  cacheTodosMunicipios = dados.map((m) => ({
    codigoIbge: m.id,
    nome: m.nome,
    uf: m.microrregiao?.mesorregiao?.UF?.sigla || m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || '',
  }));
  return cacheTodosMunicipios;
}
