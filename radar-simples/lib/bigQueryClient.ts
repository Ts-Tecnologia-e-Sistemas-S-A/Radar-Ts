/**
 * Cliente somente-leitura pra Base dos Dados (basedosdados.org), o data lake
 * público em BigQuery que espelha o Censo Escolar do INEP e outras bases
 * governamentais. Mesmo padrão já comprovado em produção no painel_educacional
 * (server/bigquery.ts): a chave de autenticação é uma service account (papel
 * BigQuery Job User no projeto de billing — o dataset público em si não
 * exige permissão especial pra ler).
 */
import { BigQuery } from '@google-cloud/bigquery';

let client: BigQuery | null = null;

function getClient(): BigQuery {
  if (client) return client;

  const raw = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (!raw) {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS_JSON não configurada — busca de dados do Censo Escolar desligada.');
  }

  let credentials: { project_id?: string };
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS_JSON não é um JSON válido.');
  }
  if (!credentials.project_id) {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS_JSON sem project_id.');
  }

  client = new BigQuery({ projectId: credentials.project_id, credentials });
  return client;
}

export async function runBigQuery<T = Record<string, unknown>>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const [rows] = await getClient().query({ query, params });
  return rows as T[];
}
