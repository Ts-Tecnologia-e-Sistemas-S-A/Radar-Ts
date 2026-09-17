import { MunicipioCrm } from '../types';
import { dataLocal } from './agenda';

/**
 * Um município é urgente quando a próxima ação registrada já passou da data
 * e ainda não foi marcada como concluída (isso é feito trocando/limpando
 * `proximaAcao` ao registrar o evento correspondente). Não é um score
 * calculado — é literal: passou do prazo que o próprio vendedor definiu.
 */
export function isUrgente(municipio: MunicipioCrm, hoje: Date = new Date()): boolean {
  if (!municipio.proximaAcao) return false;
  const hojeISO = dataLocal(hoje);
  const hora = `${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}`;
  return municipio.proximaAcao.data < hojeISO ||
    (municipio.proximaAcao.data === hojeISO && Boolean(municipio.proximaAcao.hora) && municipio.proximaAcao.hora! < hora);
}
