/**
 * Diagnóstico gratuito da rede municipal de ensino — pensado pra ser
 * entregue pro próprio município (não só usado como munição de venda
 * interna). Roda os mesmos achados validados manualmente no console do
 * BigQuery com o usuário antes de virar código: escola sem matrícula,
 * duplicidade de cadastro, e variação atípica de matrícula ano a ano —
 * sempre olhando só a rede municipal (rede = '3', ver nota em
 * censoEscolarProxy.ts). Reusa buscarDadosEscolares pro resumo (nº de
 * escolas/matrículas/ano) em vez de duplicar essa consulta.
 */
import { runBigQuery } from './bigQueryClient.js';
import { buscarDadosEscolares, DadosEscolares } from './censoEscolarProxy.js';

export type TipoAchado = 'escola_sem_matricula' | 'escola_duplicada' | 'variacao_matricula_atipica';

export interface AchadoDiagnostico {
  tipo: TipoAchado;
  ano: number;
  detalhe: string;
}

export interface Diagnostico {
  resumo: DadosEscolares | null;
  achados: AchadoDiagnostico[];
}

export interface ResultadoDiagnostico {
  status: number;
  body: { sucesso: true; dados: Diagnostico } | { sucesso: false; erro: string };
}

interface AchadoRow {
  tipo_alerta: TipoAchado;
  ano: number;
  detalhe: string;
}

const SQL_ACHADOS = `
  WITH base AS (
    SELECT *
    FROM \`basedosdados.br_inep_censo_escolar.escola\`
    WHERE id_municipio = @idMunicipio AND rede = '3'
  ),
  por_ano AS (
    SELECT ano, SUM(quantidade_matricula_educacao_basica) AS matriculas
    FROM base
    GROUP BY ano
  ),
  comparado AS (
    SELECT ano, matriculas,
      LAG(matriculas) OVER (ORDER BY ano) AS matriculas_ano_anterior
    FROM por_ano
  )

  SELECT 'escola_sem_matricula' AS tipo_alerta, ano,
    CONCAT('Escola ', id_escola, ' sem matrícula registrada em ', CAST(ano AS STRING)) AS detalhe
  FROM base
  WHERE ano = (SELECT MAX(ano) FROM base)
    AND (quantidade_matricula_educacao_basica IS NULL OR quantidade_matricula_educacao_basica = 0)

  UNION ALL

  SELECT 'escola_duplicada' AS tipo_alerta, ano,
    CONCAT('Escola ', id_escola, ' aparece ', CAST(COUNT(*) AS STRING), ' vezes no ano ', CAST(ano AS STRING)) AS detalhe
  FROM base
  GROUP BY id_escola, ano
  HAVING COUNT(*) > 1

  UNION ALL

  SELECT 'variacao_matricula_atipica' AS tipo_alerta, ano,
    CONCAT('Matrícula foi de ', CAST(matriculas_ano_anterior AS STRING), ' pra ', CAST(matriculas AS STRING),
      ' (variação de ', CAST(ROUND(SAFE_DIVIDE(matriculas - matriculas_ano_anterior, matriculas_ano_anterior) * 100, 1) AS STRING), '%)') AS detalhe
  FROM comparado
  WHERE matriculas_ano_anterior IS NOT NULL
    AND ABS(SAFE_DIVIDE(matriculas - matriculas_ano_anterior, matriculas_ano_anterior)) > 0.3

  ORDER BY tipo_alerta, ano
`;

export async function gerarDiagnostico(codigoIbge: number | undefined): Promise<ResultadoDiagnostico> {
  if (!codigoIbge || !Number.isInteger(codigoIbge)) {
    return { status: 400, body: { sucesso: false, erro: 'Parâmetro codigoIbge é obrigatório.' } };
  }

  try {
    const idMunicipio = String(codigoIbge);
    const [resumoResultado, achadosRows] = await Promise.all([
      buscarDadosEscolares(codigoIbge),
      runBigQuery<AchadoRow>(SQL_ACHADOS, { idMunicipio }),
    ]);

    if (!resumoResultado.body.sucesso) {
      return { status: resumoResultado.status, body: resumoResultado.body };
    }

    return {
      status: 200,
      body: {
        sucesso: true,
        dados: {
          resumo: resumoResultado.body.dados,
          achados: achadosRows.map((r) => ({ tipo: r.tipo_alerta, ano: r.ano, detalhe: r.detalhe })),
        },
      },
    };
  } catch (err: any) {
    return { status: 502, body: { sucesso: false, erro: err.message || 'Falha ao gerar diagnóstico' } };
  }
}
