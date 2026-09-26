import { ESTAGIOS_FUNIL_B2G, MOTIVOS_ESPERA, type EstagioFunilB2G, type MunicipioCrm } from '../types';
import { dataValida, type Tarefa } from './agenda';

export function validarEntradaStandby(crm: MunicipioCrm): void {
  if (!crm.dataReativacao || !dataValida(crm.dataReativacao)) {
    throw new Error('Informe uma Data de Reativação válida antes de colocar a oportunidade em espera.');
  }
  if (!crm.motivoEspera) {
    throw new Error('Selecione o Motivo da Espera antes de colocar a oportunidade em espera.');
  }
}

export function entrarEmStandby(crm: MunicipioCrm, nomeMunicipio: string, agora = new Date()): { crm: MunicipioCrm; tarefa: Tarefa } {
  validarEntradaStandby(crm);
  const etapaAnterior = crm.estagioFunil === 'standby'
    ? crm.estagioAntesStandby || 'qualificacao'
    : crm.estagioFunil;
  const motivo = MOTIVOS_ESPERA.find((item) => item.value === crm.motivoEspera)?.label || 'Retomar oportunidade';
  return {
    crm: { ...crm, estagioFunil: 'standby', estagioAntesStandby: etapaAnterior },
    tarefa: {
      id: `reativacao-standby-${crm.codigoIbge}`,
      codigoIbge: crm.codigoIbge,
      tipo: 'ligar',
      descricao: `Reativar contato com Prefeitura de ${nomeMunicipio} - Pauta: ${motivo}`,
      data: crm.dataReativacao!,
      hora: '',
      status: 'pendente',
      origem: 'manual',
      criadaEm: agora.toISOString(),
    },
  };
}

export function reativarOportunidade(crm: MunicipioCrm): MunicipioCrm {
  return {
    ...crm,
    estagioFunil: crm.estagioAntesStandby || 'qualificacao',
    dataReativacao: undefined,
    motivoEspera: undefined,
    detalhesEspera: undefined,
    estagioAntesStandby: undefined,
  };
}

export function visivelNoFoco(crm: MunicipioCrm, hoje: string): boolean {
  return crm.estagioFunil !== 'standby' || !crm.dataReativacao || crm.dataReativacao <= hoje;
}

export function oportunidadeComInteresse(crm: MunicipioCrm): boolean {
  const etapa = crm.estagioFunil === 'standby' ? crm.estagioAntesStandby : crm.estagioFunil;
  const ordem = ESTAGIOS_FUNIL_B2G.findIndex((item) => item.value === etapa);
  return ordem >= ESTAGIOS_FUNIL_B2G.findIndex((item) => item.value === 'qualificacao');
}

export function marcarComoVisitada(crm: MunicipioCrm, data?: string): MunicipioCrm {
  const dataValidaInformada = data && dataValida(data) ? data : undefined;
  return {
    ...crm,
    visitada: true,
    dataPrimeiraVisita: crm.dataPrimeiraVisita || dataValidaInformada,
    dataUltimaVisita: dataValidaInformada && (!crm.dataUltimaVisita || dataValidaInformada > crm.dataUltimaVisita)
      ? dataValidaInformada
      : crm.dataUltimaVisita,
  };
}

export function normalizarEstagioLegado(estagio: string | undefined): EstagioFunilB2G {
  return ESTAGIOS_FUNIL_B2G.some((item) => item.value === estagio) ? estagio as EstagioFunilB2G : 'mapeamento';
}