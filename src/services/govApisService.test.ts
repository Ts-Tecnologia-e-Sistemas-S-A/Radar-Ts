import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  fetchIbgeMunicipalities,
  searchIbgeCity,
  fetchPncpEducationCnpjs,
  searchPncpTenders,
  searchComprasnetLicitacoes,
  searchTransparenciaContratos,
  getUnifiedGovernmentData,
  type GovApiTender,
  type GovApiContract,
} from './govApisService';

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, ok = true, statusText = 'OK') {
  return { ok, statusText, json: async () => body } as Response;
}

let fetchMock: ReturnType<typeof mock>;

beforeEach(() => {
  fetchMock = mock(async () => jsonResponse([]));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchIbgeMunicipalities', () => {
  it('busca todos os municípios quando UF não é informado', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([{ id: 1, nome: 'Codó' }]));
    const result = await fetchIbgeMunicipalities();
    expect(result).toEqual([{ id: 1, nome: 'Codó' }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  });

  it('filtra por UF e normaliza para maiúsculas', async () => {
    await fetchIbgeMunicipalities('pi');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/PI/municipios'
    );
  });

  it('retorna lista vazia quando a API responde com erro', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(null, false, 'Internal Server Error'));
    const result = await fetchIbgeMunicipalities();
    expect(result).toEqual([]);
  });

  it('retorna lista vazia quando a chamada de rede falha', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('network down');
    });
    const result = await fetchIbgeMunicipalities();
    expect(result).toEqual([]);
  });
});

describe('searchIbgeCity', () => {
  const mockList = [
    { id: 1, nome: 'Codó' },
    { id: 2, nome: 'Teresina' },
    { id: 3, nome: 'Imperatriz' },
  ];

  it('retorna null sem chamar a API quando o nome da cidade está vazio', async () => {
    const result = await searchIbgeCity('   ');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encontra por nome exato ignorando acento e caixa', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(mockList));
    const result = await searchIbgeCity('codo');
    expect(result).toEqual({ id: 1, nome: 'Codó' });
  });

  it('tolera erro de digitação via busca fuzzy', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(mockList));
    const result = await searchIbgeCity('coddo');
    expect(result?.nome).toBe('Codó');
  });

  it('retorna null quando nenhuma cidade é suficientemente parecida', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(mockList));
    const result = await searchIbgeCity('xyzabc999');
    expect(result).toBeNull();
  });

  it('retorna null quando a lista do IBGE vem vazia', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([]));
    const result = await searchIbgeCity('Codó');
    expect(result).toBeNull();
  });
});

describe('fetchPncpEducationCnpjs', () => {
  it('usa UF padrão (PI) e monta a query só com os parâmetros informados', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ success: true }));
    await fetchPncpEducationCnpjs();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pncp/cnpjs-educacao?uf=PI');
  });

  it('inclui dataInicial e dataFinal quando informados', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ success: true }));
    await fetchPncpEducationCnpjs('MA', '2026-01-01', '2026-06-30');
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/pncp/cnpjs-educacao?uf=MA&dataInicial=2026-01-01&dataFinal=2026-06-30'
    );
  });

  it('retorna null quando o proxy responde com erro', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(null, false, 'Bad Gateway'));
    const result = await fetchPncpEducationCnpjs();
    expect(result).toBeNull();
  });
});

describe('searchPncpTenders', () => {
  it('usa os valores padrão de keyword e uf', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ data: [] }));
    await searchPncpTenders();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gov/pncp/tenders?q=educacao%20software%20gestao&uf=PI');
  });

  it('retorna a lista de tenders da resposta', async () => {
    const tenders = [{ id: 't1' }] as GovApiTender[];
    fetchMock.mockImplementation(async () => jsonResponse({ data: tenders }));
    const result = await searchPncpTenders('merenda', 'MA');
    expect(result).toEqual(tenders);
  });

  it('retorna lista vazia quando a resposta não tem "data"', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}));
    const result = await searchPncpTenders();
    expect(result).toEqual([]);
  });

  it('retorna lista vazia quando a chamada falha', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(null, false, 'Not Found'));
    const result = await searchPncpTenders();
    expect(result).toEqual([]);
  });
});

describe('searchComprasnetLicitacoes', () => {
  it('monta a query com uf e keyword informados', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ data: [] }));
    await searchComprasnetLicitacoes('PI', 'merenda escolar');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gov/comprasnet/licitacoes?uf=PI&q=merenda%20escolar');
  });

  it('retorna lista vazia quando a chamada falha', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('timeout');
    });
    const result = await searchComprasnetLicitacoes();
    expect(result).toEqual([]);
  });
});

describe('searchTransparenciaContratos', () => {
  it('monta a query com a UF informada', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ data: [] }));
    await searchTransparenciaContratos('CE');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gov/transparencia/contratos?uf=CE');
  });

  it('retorna os contratos da resposta', async () => {
    const contratos = [{ id: 'c1' }] as GovApiContract[];
    fetchMock.mockImplementation(async () => jsonResponse({ data: contratos }));
    const result = await searchTransparenciaContratos();
    expect(result).toEqual(contratos);
  });
});

describe('getUnifiedGovernmentData', () => {
  it('combina o código IBGE com os dados retornados pelo backend de IA', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('ibge')) {
        return jsonResponse([{ id: 2111300, nome: 'Teresina' }]);
      }
      if (url.includes('/api/ai/analyze-city')) {
        return jsonResponse({ success: true, municipality: { name: 'Teresina', population: 900000 } });
      }
      throw new Error(`URL inesperada: ${url}`);
    });

    const result = await getUnifiedGovernmentData('Teresina', 'PI');

    expect(result).toMatchObject({
      name: 'Teresina',
      population: 900000,
      ibgeCode: 2111300,
      officialIbgeName: 'Teresina',
    });
    expect(result.verifiedSources).toContain('IBGE REST API (Localidades e Censo)');

    const analyzeCall = fetchMock.mock.calls.find((c: any[]) => String(c[0]).includes('/api/ai/analyze-city'));
    expect(analyzeCall?.[1]?.method).toBe('POST');
    expect(JSON.parse(analyzeCall![1].body)).toEqual({
      cityName: 'Teresina',
      state: 'PI',
      ibgeCode: 2111300,
    });
  });

  it('retorna null quando o backend não confirma sucesso', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('ibge')) return jsonResponse([]);
      return jsonResponse({ success: false });
    });
    const result = await getUnifiedGovernmentData('Cidade Desconhecida', 'PI');
    expect(result).toBeNull();
  });

  it('retorna null quando a chamada falha', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('offline');
    });
    const result = await getUnifiedGovernmentData('Teresina', 'PI');
    expect(result).toBeNull();
  });
});
