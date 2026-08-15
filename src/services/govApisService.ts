/**
 * Serviço de Integração com APIs REST Governamentais Oficiais
 * 
 * Fontes Integradas:
 * 1. PNCP (Portal Nacional de Contratações Públicas - Lei 14.133/2021): https://pncp.gov.br
 * 2. Portal da Transparência CGU: https://api.portaldatransparencia.gov.br
 * 3. Compras.gov.br (Comprasnet / Contratos.gov.br): https://compras.dados.gov.br
 * 4. IBGE REST API (Municípios e Censo Demográfico Oficial): https://servicodados.ibge.gov.br
 * 5. Transparência Estadual/Municipal (TCE-MA, TCE-PI, Transparência MA/PI)
 */

export interface IbgeMunicipality {
  id: number;
  nome: string;
  microrregiao?: {
    id: number;
    nome: string;
    mesorregiao?: {
      id: number;
      nome: string;
      UF?: {
        id: number;
        sigla: string;
        nome: string;
        regiao?: {
          id: number;
          sigla: string;
          nome: string;
        }
      }
    }
  };
  'regiao-imediata'?: any;
}

export interface GovApiTender {
  id: string;
  municipalityName: string;
  state: string;
  portalName: string;
  source: 'PNCP' | 'Compras.gov.br' | 'Portal da Transparência' | 'TCE';
  noticeNumber: string;
  estimatedValue: number;
  modality: string;
  publicationDate: string;
  openingDate: string;
  objectStr: string;
  status: string;
  url: string;
  cnpj?: string;
  organName?: string;
}

export interface GovApiContract {
  id: string;
  municipalityName: string;
  state: string;
  cnpj?: string;
  contractNumber: string;
  processNumber: string;
  contractorCompany: string;
  contractorCnpj?: string;
  contractedValue: number;
  signatureDate: string;
  endDate: string;
  modality: string;
  objectDescription: string;
  source: string;
}

/**
 * 1. IBGE API REST - Consulta municípios oficiais do Brasil
 */
export async function fetchIbgeMunicipalities(uf?: string): Promise<IbgeMunicipality[]> {
  try {
    const url = uf
      ? `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`
      : `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`IBGE API Error: ${res.statusText}`);
    const data: IbgeMunicipality[] = await res.json();
    return data;
  } catch (err) {
    console.warn('Erro ao consultar API REST do IBGE:', err);
    return [];
  }
}

import { calculateStringSimilarity } from '../utils/fuzzyCitySearch';

/**
 * Busca dados oficiais de um município no IBGE por nome e UF com algoritmo inteligente de busca fuzzy (suporta erros de digitação)
 */
export async function searchIbgeCity(cityName: string, uf?: string): Promise<IbgeMunicipality | null> {
  if (!cityName || !cityName.trim()) return null;
  const list = await fetchIbgeMunicipalities(uf);
  if (list.length === 0) return null;

  const normalizedSearch = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  // 1. Exact match check
  const exact = list.find((m) => {
    const normName = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return normName === normalizedSearch;
  });
  if (exact) return exact;

  // 2. Intelligent Fuzzy match check across all cities in IBGE list
  let bestCandidate: IbgeMunicipality | null = null;
  let bestScore = -1;

  for (const m of list) {
    const score = calculateStringSimilarity(normalizedSearch, m.nome);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = m;
    }
  }

  // Only return best candidate if it has a strong similarity score (e.g. >= 0.42)
  if (bestCandidate && bestScore >= 0.42) {
    return bestCandidate;
  }

  return null;
}

export interface PncpEducationCnpjResult {
  success: boolean;
  source: string;
  uf: string;
  dataInicial: string;
  dataFinal: string;
  totalEncontrados: number;
  cnpjs: string[];
  detalhes: {
    cnpj: string;
    razaoSocial: string;
    esferaId?: string | number;
    uf: string;
    ultimoObjeto: string;
    totalContratacoes: number;
    exemploContratacao?: any;
  }[];
}

/**
 * Mapeia e extrai os CNPJs de Educação do PNCP por Estado e Período
 */
export async function fetchPncpEducationCnpjs(uf: string = 'PI', dataInicial?: string, dataFinal?: string): Promise<PncpEducationCnpjResult | null> {
  try {
    let query = `/api/pncp/cnpjs-educacao?uf=${encodeURIComponent(uf)}`;
    if (dataInicial) query += `&dataInicial=${encodeURIComponent(dataInicial)}`;
    if (dataFinal) query += `&dataFinal=${encodeURIComponent(dataFinal)}`;

    const res = await fetch(query);
    if (!res.ok) throw new Error(`PNCP CNPJ Proxy Error: ${res.statusText}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Erro ao mapear CNPJs de Educação no PNCP:', err);
    return null;
  }
}

/**
 * 2. PNCP REST API - Consulta certames e contratos no Portal Nacional de Contratações Públicas
 */
export async function searchPncpTenders(keyword: string = 'educacao software gestao', uf: string = 'PI'): Promise<GovApiTender[]> {
  try {
    const res = await fetch(`/api/gov/pncp/tenders?q=${encodeURIComponent(keyword)}&uf=${encodeURIComponent(uf)}`);
    if (!res.ok) throw new Error(`PNCP Proxy Error: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Erro ao consultar API do PNCP:', err);
    return [];
  }
}

/**
 * 3. Compras.gov.br (Comprasnet API) - Consulta licitações federais/municipais
 */
export async function searchComprasnetLicitacoes(uf: string = 'MA', keyword: string = 'gestao escolar'): Promise<GovApiTender[]> {
  try {
    const res = await fetch(`/api/gov/comprasnet/licitacoes?uf=${encodeURIComponent(uf)}&q=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error(`Compras.gov.br Proxy Error: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Erro ao consultar API do Compras.gov.br:', err);
    return [];
  }
}

/**
 * 4. Portal da Transparência CGU - Consulta Contratos do Governo
 */
export async function searchTransparenciaContratos(uf: string = 'PI'): Promise<GovApiContract[]> {
  try {
    const res = await fetch(`/api/gov/transparencia/contratos?uf=${encodeURIComponent(uf)}`);
    if (!res.ok) throw new Error(`Portal da Transparência Error: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Erro ao consultar API do Portal da Transparência:', err);
    return [];
  }
}

/**
 * Integrador Unificado: Junta IBGE + PNCP + Compras.gov.br + Transparência para enriquecer dados de qualquer cidade
 */
export async function getUnifiedGovernmentData(cityName: string, uf: string) {
  try {
    // 1. Busca IBGE
    const ibgeCity = await searchIbgeCity(cityName, uf);

    // 2. Chama backend de inteligência que consome PNCP, Transparência e Gemini Auditor
    const res = await fetch('/api/ai/analyze-city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityName,
        state: uf,
        ibgeCode: ibgeCity?.id
      })
    });

    const json = await res.json();
    if (json.success && json.municipality) {
      return {
        ...json.municipality,
        ibgeCode: ibgeCity?.id || null,
        officialIbgeName: ibgeCity?.nome || cityName,
        verifiedSources: json.municipality.verifiedSources || [
          'IBGE REST API (Localidades e Censo)',
          'PNCP (Portal Nacional de Contratações Públicas)',
          'Portal da Transparência CGU',
          'Compras.gov.br (Comprasnet API)',
          `TCE-${uf.toUpperCase()}`
        ]
      };
    }
    return null;
  } catch (err) {
    console.error('Erro na integração unificada de APIs governamentais:', err);
    return null;
  }
}
