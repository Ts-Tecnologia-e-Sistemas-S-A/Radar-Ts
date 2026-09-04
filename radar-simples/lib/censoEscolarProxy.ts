/**
 * Busca a rede escolar municipal (nº de escolas + matrículas totais) de um
 * município no Censo Escolar do INEP, via a tabela pública
 * `basedosdados.br_inep_censo_escolar.escola` (Base dos Dados). Usa sempre o
 * ano mais recente disponível pra aquele município. Só agrega contagens —
 * nunca lê dado de aluno individual (a própria Base dos Dados descontinuou
 * a tabela de matrícula por aluno em 2020, por LGPD).
 *
 * Lógica compartilhada entre server.ts (dev local) e api/censo-escolar.ts
 * (Vercel), mesmo padrão de lib/pncpProxy.ts.
 */
import { runBigQuery } from './bigQueryClient.js';

export interface DadosEscolares {
  ano: number;
  escolas: number;
  alunos: number;
}

export interface ResultadoCensoEscolar {
  status: number;
  body: { sucesso: true; dados: DadosEscolares | null } | { sucesso: false; erro: string };
}

interface AgregadoRow {
  ano: number;
  escolas: number;
  alunos: number | null;
}

export async function buscarDadosEscolares(codigoIbge: number | undefined): Promise<ResultadoCensoEscolar> {
  if (!codigoIbge || !Number.isInteger(codigoIbge)) {
    return { status: 400, body: { sucesso: false, erro: 'Parâmetro codigoIbge é obrigatório.' } };
  }

  try {
    const idMunicipio = String(codigoIbge);
    // rede = código de dependência administrativa do INEP (TP_DEPENDENCIA),
    // não texto: 1=Federal, 2=Estadual, 3=Municipal, 4=Privada — confirmado
    // rodando SELECT DISTINCT direto no BigQuery (não é 'municipal' string).
    const rows = await runBigQuery<AgregadoRow>(
      `SELECT
         dados.ano,
         COUNT(*) AS escolas,
         SUM(dados.quantidade_matricula_educacao_basica) AS alunos
       FROM \`basedosdados.br_inep_censo_escolar.escola\` AS dados
       WHERE dados.id_municipio = @idMunicipio
         AND dados.rede = '3'
         AND dados.ano = (
           SELECT MAX(ano) FROM \`basedosdados.br_inep_censo_escolar.escola\`
           WHERE id_municipio = @idMunicipio AND rede = '3'
         )
       GROUP BY dados.ano`,
      { idMunicipio }
    );

    const row = rows[0];
    if (!row) {
      return { status: 200, body: { sucesso: true, dados: null } };
    }
    return {
      status: 200,
      body: { sucesso: true, dados: { ano: row.ano, escolas: row.escolas, alunos: row.alunos ?? 0 } },
    };
  } catch (err: any) {
    return { status: 502, body: { sucesso: false, erro: err.message || 'Falha ao consultar o Censo Escolar' } };
  }
}
