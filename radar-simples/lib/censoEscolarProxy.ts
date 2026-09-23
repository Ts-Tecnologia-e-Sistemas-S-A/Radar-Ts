/** Censo municipal: só consulta o ano e a revisão oficial previamente conciliados com o espelho. */
import { runBigQuery } from './bigQueryClient.js';
import { consultarEdicaoCenso, validarEspelhoCenso } from './censoAtualidade.js';

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
  if (!codigoIbge || !/^[1-9]\d{6}$/.test(String(codigoIbge))) {
    return { status: 400, body: { sucesso: false, erro: 'Parâmetro codigoIbge é obrigatório.' } };
  }

  try {
    const edicao = await consultarEdicaoCenso();
    validarEspelhoCenso(edicao, process.env.CENSO_ESCOLAR_REVISAO_VALIDADA);
    // A conciliação também perde validade se a tabela intermediária mudar.
    const tabela = await runBigQuery<{ alterado: string }>(
      `SELECT CAST(last_modified_time AS STRING) AS alterado
       FROM \`basedosdados.br_inep_censo_escolar.__TABLES__\` WHERE table_id = 'escola'`
    );
    if (!tabela[0]?.alterado || tabela[0].alterado !== process.env.CENSO_ESCOLAR_TABELA_VALIDADA_EM) {
      throw new Error('A base intermediária do Censo precisa ser conciliada com a revisão atual do INEP. Consulta bloqueada.');
    }
    const idMunicipio = String(codigoIbge);
    // rede = código de dependência administrativa do INEP (TP_DEPENDENCIA),
    // não texto: 1=Federal, 2=Estadual, 3=Municipal, 4=Privada — confirmado
    // rodando SELECT DISTINCT direto no BigQuery (não é 'municipal' string).
    const rows = await runBigQuery<AgregadoRow>(
      `SELECT
         dados.ano,
         COUNT(*) AS escolas,
         IF(COUNTIF(dados.quantidade_matricula_educacao_basica IS NULL) > 0,
            NULL, SUM(dados.quantidade_matricula_educacao_basica)) AS alunos
       FROM \`basedosdados.br_inep_censo_escolar.escola\` AS dados
       WHERE dados.id_municipio = @idMunicipio
         AND dados.rede = '3'
         AND dados.ano = @ano
       GROUP BY dados.ano`,
      { idMunicipio, ano: edicao.ano }
    );

    const row = rows[0];
    if (!row || row.ano !== edicao.ano || row.alunos === null) throw new Error(`Censo ${edicao.ano} sem dados completos para este município. Não serão usados anos anteriores.`);
    return {
      status: 200,
      body: { sucesso: true, dados: { ano: row.ano, escolas: row.escolas, alunos: row.alunos } },
    };
  } catch (err: any) {
    const erro = err.message === 'fetch failed' || ['TimeoutError', 'AbortError'].includes(err.name) || ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(err.code)
      ? 'Não foi possível consultar a revisão atual do INEP. Censo pendente; números anteriores não serão utilizados.'
      : err.message || 'Falha ao consultar o Censo Escolar';
    return { status: 502, body: { sucesso: false, erro } };
  }
}
