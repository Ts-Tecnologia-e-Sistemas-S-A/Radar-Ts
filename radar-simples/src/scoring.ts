import { MunicipioCrm } from './types';

export type Classificacao = 'Alta' | 'Média' | 'Baixa';

export interface Potencial {
  pontos: number;
  classificacao: Classificacao;
}

function diasAte(dataIso: string, hoje: Date): number {
  const alvo = new Date(`${dataIso}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula o potencial comercial de um município. Retorna `null` quando o
 * município já é cliente (sistemaAtual === 'nosso_sistema') — nesse caso ele
 * deve ser ocultado da lista de oportunidades, não pontuado.
 */
export function calcularPotencial(
  municipio: MunicipioCrm,
  temOportunidadeRecente: boolean,
  hoje: Date = new Date()
): Potencial | null {
  if (municipio.sistemaAtual === 'nosso_sistema') {
    return null;
  }

  let pontos = 0;

  if (temOportunidadeRecente) pontos += 50;
  if (municipio.sistemaAtual === 'nenhum') pontos += 25;
  if (municipio.contratoVencimento && diasAte(municipio.contratoVencimento, hoje) <= 180) pontos += 15;
  if (municipio.alunosRede !== undefined && municipio.alunosRede > 20000) pontos += 10;

  const classificacao: Classificacao = pontos >= 50 ? 'Alta' : pontos >= 20 ? 'Média' : 'Baixa';

  return { pontos, classificacao };
}
