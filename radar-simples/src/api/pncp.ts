import { Oportunidade } from '../types';

const PALAVRAS_CHAVE_EDUCACAO = [
  'escola',
  'educação',
  'educacao',
  'software',
  'gestão escolar',
  'gestao escolar',
  'merenda',
  'transporte escolar',
  'fundeb',
  'semed',
  'diário eletrônico',
  'diario eletronico',
];

interface PncpItemBruto {
  numeroContratacao?: string;
  objetoContratacao?: string;
  descricao?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataPublicacaoPncp?: string;
  modalidadeNome?: string;
  linkSistemaOrigem?: string;
  orgaoEntidade?: { razaoSocial?: string };
  unidadeOrgao?: { ufSigla?: string };
}

function formatarDataYYYYMMDD(data: Date): string {
  return data.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Janela padrão de 90 dias — mesmo horizonte usado na regra de potencial. */
export function janelaPadrao90Dias(): { dataInicial: string; dataFinal: string } {
  const hoje = new Date();
  const passado = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { dataInicial: formatarDataYYYYMMDD(passado), dataFinal: formatarDataYYYYMMDD(hoje) };
}

function ehDaEducacao(item: PncpItemBruto): boolean {
  const texto = `${item.objetoContratacao || item.descricao || ''} ${item.orgaoEntidade?.razaoSocial || ''}`.toLowerCase();
  return PALAVRAS_CHAVE_EDUCACAO.some((palavra) => texto.includes(palavra));
}

/**
 * Busca licitações reais do PNCP (via proxy do nosso backend) e filtra só as
 * relacionadas a educação. Se a chamada falhar, propaga o erro — quem chamar
 * decide como mostrar isso na tela (nunca inventamos um resultado no lugar).
 */
export async function buscarOportunidadesEducacao(uf: string): Promise<Oportunidade[]> {
  const { dataInicial, dataFinal } = janelaPadrao90Dias();
  const url = `/api/pncp/licitacoes?uf=${encodeURIComponent(uf)}&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.erro || `Falha ao consultar o PNCP (status ${response.status})`);
  }

  const itens: PncpItemBruto[] = Array.isArray(json.data) ? json.data : [];

  return itens
    .filter(ehDaEducacao)
    .map((item, idx) => ({
      id: `pncp-${uf}-${idx}-${item.numeroContratacao || idx}`,
      municipioNome: item.orgaoEntidade?.razaoSocial || 'Órgão público (PNCP)',
      uf: item.unidadeOrgao?.ufSigla || uf,
      numeroContratacao: item.numeroContratacao || 'N/D',
      objeto: item.objetoContratacao || item.descricao || '',
      valorEstimado: item.valorTotalEstimado ?? item.valorTotalHomologado,
      dataPublicacao: item.dataPublicacaoPncp || '',
      modalidade: item.modalidadeNome || '',
      linkPncp: item.linkSistemaOrigem || 'https://pncp.gov.br',
    }));
}
