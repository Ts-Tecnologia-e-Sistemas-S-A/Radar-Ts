import { runBigQuery } from './bigQueryClient.js';
import { buscarDadosEscolares } from './censoEscolarProxy.js';
import { buscarVaarOficial } from './vaarOficial.js';
import { buscarComparativosIdeb } from './idebOficial.js';
import { buscarRepassesRecebidos } from './repassesOficiais.js';
import type { AchadoDiagnostico, Diagnostico } from '../src/types/diagnostico.js';
export type { AchadoDiagnostico, Diagnostico, TipoAchado } from '../src/types/diagnostico.js';

export interface ResultadoDiagnostico {
  status: number;
  body: { sucesso: true; dados: Diagnostico } | { sucesso: false; erro: string };
}

// O ano anterior só serve à comparação; os achados são do último ano verificado.
export const SQL_ACHADOS = `
  WITH base AS (
    SELECT * FROM \`basedosdados.br_inep_censo_escolar.escola\`
    WHERE id_municipio = @idMunicipio AND rede = '3' AND ano IN (@ano, @ano - 1)
  ), por_ano AS (
    SELECT ano, SUM(quantidade_matricula_educacao_basica) AS matriculas FROM base GROUP BY ano
  )
  SELECT 'escola_sem_matricula' AS tipo, ano,
    CONCAT('Escola ', id_escola, ' sem matrícula registrada em ', CAST(ano AS STRING)) AS detalhe
  FROM base WHERE ano = @ano AND quantidade_matricula_educacao_basica = 0
  UNION ALL
  SELECT 'escola_duplicada' AS tipo, ano,
    CONCAT('Escola ', id_escola, ' aparece ', CAST(COUNT(*) AS STRING), ' vezes em ', CAST(ano AS STRING)) AS detalhe
  FROM base WHERE ano = @ano GROUP BY id_escola, ano HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'variacao_matricula_atipica' AS tipo, atual.ano,
    CONCAT('Matrículas: ', CAST(anterior.matriculas AS STRING), ' em ', CAST(anterior.ano AS STRING),
      ' e ', CAST(atual.matriculas AS STRING), ' em ', CAST(atual.ano AS STRING), ' (variação superior a 30%).') AS detalhe
  FROM por_ano atual JOIN por_ano anterior ON anterior.ano = atual.ano - 1
  WHERE atual.ano = @ano AND ABS(SAFE_DIVIDE(atual.matriculas - anterior.matriculas, anterior.matriculas)) > 0.3
  ORDER BY tipo, ano
`;

export async function gerarDiagnostico(codigoIbge: number | undefined, dependencias = {
  censo: buscarDadosEscolares, vaar: buscarVaarOficial, query: runBigQuery, ideb: buscarComparativosIdeb, repasses: buscarRepassesRecebidos,
}): Promise<ResultadoDiagnostico> {
  if (!codigoIbge || !/^[1-9]\d{6}$/.test(String(codigoIbge))) {
    return { status: 400, body: { sucesso: false, erro: 'Informe um código IBGE de sete dígitos.' } };
  }
  const [censo, vaar, ideb, repasses] = await Promise.allSettled([dependencias.censo(codigoIbge), dependencias.vaar(codigoIbge), dependencias.ideb(codigoIbge), dependencias.repasses(codigoIbge)]);
  const dados: Diagnostico = {
    codigoIbge, consultadoEm: new Date().toISOString(), resumo: null, achados: [], vaar: null,
    avisoCenso: null, avisoVaar: null, comparativosIdeb: [], avisoIdeb: null, comparativoRepasses: null, avisoRepasses: null,
  };
  if (repasses.status === 'fulfilled') dados.comparativoRepasses = repasses.value;
  else dados.avisoRepasses = repasses.reason instanceof Error ? repasses.reason.message : 'Consulta de repasses recebidos pendente.';
  if (ideb.status === 'fulfilled') {
    dados.comparativosIdeb = ideb.value.comparativos;
    dados.avisoIdeb = ideb.value.aviso;
  } else dados.avisoIdeb = ideb.reason instanceof Error ? ideb.reason.message : 'Comparação IDEB pendente.';
  if (vaar.status === 'fulfilled') dados.vaar = vaar.value;
  else dados.avisoVaar = vaar.reason instanceof Error ? vaar.reason.message : 'FNDE indisponível; consulta VAAR pendente.';
  if (censo.status === 'fulfilled' && censo.value.body.sucesso && censo.value.body.dados) {
    dados.resumo = censo.value.body.dados;
    try {
      dados.achados = await dependencias.query<AchadoDiagnostico>(SQL_ACHADOS, { idMunicipio: String(codigoIbge), ano: dados.resumo.ano });
    } catch { dados.avisoCenso = 'Não foi possível verificar os pontos de atenção do Censo Escolar.'; }
  } else {
    dados.avisoCenso = censo.status === 'fulfilled' && !censo.value.body.sucesso
      ? censo.value.body.erro : 'Censo Escolar atual não validado; avaliação pendente.';
  }
  return { status: 200, body: { sucesso: true, dados } };
}
