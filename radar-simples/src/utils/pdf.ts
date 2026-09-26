import { jsPDF } from 'jspdf';
import { AchadoDiagnostico, Diagnostico, TipoAchado } from '../api/diagnostico';
import { CONDICOES_VAAR, type ComparativoEstadual } from '../types/diagnostico';
import { EventoTimeline, MunicipioCrm, MunicipioIbge } from '../types';
import { dataBr, dataHoraBr } from './data';

function cabecalho(doc: jsPDF, titulo: string, subtitulo: string): number {
  doc.setFontSize(18);
  doc.setTextColor(15, 41, 66);
  doc.text('GovTrack Brasil', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(subtitulo, 14, 25);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 29, 196, 29);
  doc.setFontSize(14);
  doc.setTextColor(15, 41, 66);
  doc.text(titulo, 14, 38);
  return 46;
}

function paragrafo(doc: jsPDF, texto: string, y: number, largura = 182): number {
  doc.setFontSize(10);
  const linhas: string[] = doc.splitTextToSize(texto, largura);
  doc.setTextColor(30, 30, 30);
  for (const linha of linhas) {
    if (y > 278) { doc.addPage(); y = 20; }
    doc.text(linha, 14, y);
    y += 5;
  }
  return y + 4;
}

export function gerarPdfBriefing(municipio: MunicipioIbge, crm: MunicipioCrm, eventos: EventoTimeline[]): jsPDF {
  const doc = new jsPDF();
  let y = cabecalho(doc, `Briefing — ${municipio.nome} / ${municipio.uf}`, 'Exportado da Memória da Conta');

  doc.setFontSize(11);
  doc.setTextColor(15, 41, 66);
  doc.text('Contatos-chave', 14, y);
  y += 6;
  if (crm.contatos.length === 0) {
    y = paragrafo(doc, 'Nenhum contato registrado.', y);
  } else {
    for (const c of crm.contatos) {
      y = paragrafo(doc, `• ${c.nome} — ${c.cargo}${c.telefone ? ` — ${c.telefone}` : ''}`, y);
    }
  }

  y += 4;
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 66);
  doc.text('Últimos eventos registrados', 14, y);
  y += 6;
  const recentes = eventos.slice(0, 5);
  if (recentes.length === 0) {
    y = paragrafo(doc, 'Nenhum evento registrado ainda.', y);
  } else {
    for (const ev of recentes) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      y = paragrafo(doc, `${dataBr(ev.data)} — ${ev.sinteseIA || ev.resumo}`, y);
    }
  }

  return doc;
}

export interface DadosRelatorioSemanal {
  periodoLabel: string;
  cidadesVisitadas: string[];
  reunioesRealizadas: number;
  despesasTotais: number;
  despesasPorCategoria: { categoria: string; valor: number }[];
  kmRodados: number;
  recomendacoesIA: { titulo: string; texto: string }[];
}

export function gerarPdfRelatorioSemanal(dados: DadosRelatorioSemanal): jsPDF {
  const doc = new jsPDF();
  let y = cabecalho(doc, 'Balanço de Campo & Rota', dados.periodoLabel);

  y = paragrafo(doc, `Cidades visitadas: ${dados.cidadesVisitadas.length} (${dados.cidadesVisitadas.join(', ') || '—'})`, y);
  y = paragrafo(doc, `Reuniões de gabinete realizadas: ${dados.reunioesRealizadas}`, y);
  y = paragrafo(doc, `Km rodados no período: ${dados.kmRodados.toFixed(0)} km`, y);
  y = paragrafo(doc, `Despesas totais: R$ ${dados.despesasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, y);

  y += 2;
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 66);
  doc.text('Composição das despesas', 14, y);
  y += 6;
  for (const item of dados.despesasPorCategoria) {
    y = paragrafo(doc, `• ${item.categoria}: R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, y);
  }

  if (dados.recomendacoesIA.length > 0) {
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(15, 41, 66);
    doc.text('Recomendações estratégicas (IA)', 14, y);
    y += 6;
    for (const r of dados.recomendacoesIA) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      y = paragrafo(doc, `${r.titulo}: ${r.texto}`, y);
    }
  }

  return doc;
}

const ORDEM_TIPOS_ACHADO: TipoAchado[] = ['escola_sem_matricula', 'escola_duplicada', 'variacao_matricula_atipica'];

const TITULO_ACHADO: Record<TipoAchado, string> = {
  escola_sem_matricula: 'Escola sem matrícula registrada',
  escola_duplicada: 'Escola duplicada no cadastro',
  variacao_matricula_atipica: 'Variação atípica de matrícula',
};

interface SubsecaoExplicacao {
  titulo?: string;
  texto: string;
}

// escola_sem_matricula detalha causa-e-efeito por categoria (financeiro,
// fiscalização, pessoal, indicadores) em vez de só constatar o fato — é o
// achado com mais peso prático pro gestor, então merece explicar por que
// importa de verdade, não só "confira isso". Os outros dois ficam num
// parágrafo só, sem sub-título.
const EXPLICACAO_ACHADO: Record<TipoAchado, SubsecaoExplicacao[]> = {
  escola_sem_matricula: [
    {
      titulo: 'Impacto financeiro',
      texto:
        'O repasse do Fundeb é calculado sobre a matrícula declarada no Censo Escolar do ano anterior — escola com matrícula zero não gera cota de participação, reduzindo a receita educacional do município. Programas federais como PNAE (merenda escolar), PNATE (transporte escolar), PDDE (dinheiro direto na escola) e PNLD (livros didáticos) também usam matrícula ativa como critério de envio de verba e material. Além disso, manter o prédio cadastrado e operacional sem estudantes gera custo fixo ocioso: energia, água, segurança e manutenção predial.',
    },
    {
      titulo: 'Fiscalização e responsabilidade fiscal',
      texto:
        'Estrutura mantida sem atendimento a estudantes pode atrair apontamento do Tribunal de Contas por ineficiência na gestão do patrimônio público, e a atenção do Ministério Público sobre fechamento de fato de uma escola sem o processo formal de desativação — especialmente em unidades rurais ou periféricas.',
    },
    {
      titulo: 'Gestão de pessoal',
      texto:
        'Professores, diretor e demais servidores formalmente lotados numa escola sem aluno geram inconformidade de lotação, e distorcem o índice de aplicação dos 70% do Fundeb destinados à remuneração dos profissionais do magistério.',
    },
    {
      titulo: 'Indicadores e próximo passo',
      texto:
        'Também distorce as estatísticas do INEP/MEC (taxa de ocupação da rede, custo-aluno, capacidade). Se a unidade realmente não tem mais demanda, o caminho correto é formalizar a paralisação temporária ou a desativação definitiva junto ao Conselho Municipal de Educação, com o remanejamento da demanda pra unidades vizinhas garantindo transporte escolar.',
    },
  ],
  escola_duplicada: [
    { texto: 'Um mesmo código de escola aparecendo mais de uma vez no mesmo ano geralmente indica duplicidade de cadastro.' },
  ],
  variacao_matricula_atipica: [
    {
      texto:
        'Uma variação grande de matrícula de um ano pro outro vale conferir — pode ser real (abertura ou fechamento de turma) ou um erro de digitação que afeta o repasse.',
    },
  ],
};

/**
 * Diagnóstico gratuito entregue pro próprio município — tom neutro e
 * construtivo de propósito (não é munição de venda interna): explica de
 * onde vêm os números, mostra o resumo da rede, e trata os achados como
 * pontos que valem conferência, não acusação. Quando não há achado nenhum,
 * diz isso de forma positiva em vez de omitir a seção.
 */
export function gerarPdfDiagnostico(municipio: MunicipioIbge, diagnostico: Diagnostico): jsPDF {
  if (diagnostico.codigoIbge !== municipio.codigoIbge || !diagnostico.consultadoEm) {
    throw new Error('Consulte novamente o diagnóstico desta cidade antes de exportar.');
  }
  const doc = new jsPDF();
  let y = cabecalho(doc, `Diagnóstico Gratuito — ${municipio.nome} / ${municipio.uf}`, 'Rede Municipal de Ensino');

  y = paragrafo(
    doc,
    `Consulta das fontes oficiais realizada em ${dataHoraBr(diagnostico.consultadoEm)}. Cada base tem seu próprio período de referência. Informações cuja atualização não foi confirmada são apresentadas como pendentes.`,
    y
  );

  y += 2;
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 66);
  doc.text('Resumo da Rede Municipal', 14, y);
  y += 6;
  if (diagnostico.resumo) {
    y = paragrafo(doc, `Ano de referência: ${diagnostico.resumo.ano}`, y);
    y = paragrafo(doc, `Escolas na rede municipal: ${diagnostico.resumo.escolas}`, y);
    y = paragrafo(doc, `Matrículas totais: ${diagnostico.resumo.alunos}`, y);
  } else {
    y = paragrafo(doc, diagnostico.avisoCenso || 'Censo Escolar atual não confirmado para este município.', y);
  }

  y += 4;
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 66);
  doc.text('Pontos de Atenção', 14, y);
  y += 6;

  if (diagnostico.avisoCenso) {
    y = paragrafo(doc, 'Verificação do Censo pendente. A ausência de achados não significa ausência de inconsistências.', y);
  } else if (diagnostico.achados.length === 0) {
    y = paragrafo(doc, 'Nenhuma inconsistência encontrada nos critérios avaliados.', y);
  } else {
    for (const tipo of ORDEM_TIPOS_ACHADO) {
      const achadosDoTipo: AchadoDiagnostico[] = diagnostico.achados.filter((a) => a.tipo === tipo);
      if (achadosDoTipo.length === 0) continue;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setTextColor(15, 41, 66);
      doc.text(TITULO_ACHADO[tipo], 14, y);
      y += 5;
      for (const sub of EXPLICACAO_ACHADO[tipo]) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        if (sub.titulo) {
          doc.setFontSize(9);
          doc.setTextColor(70, 70, 70);
          doc.text(sub.titulo, 14, y);
          y += 4.5;
        }
        y = paragrafo(doc, sub.texto, y);
      }
      for (const achado of achadosDoTipo) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        y = paragrafo(doc, `• ${achado.detalhe}`, y);
      }
      y += 2;
    }
  }

  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  const linhasRodape = doc.splitTextToSize(
    'Censo Escolar: INEP, via Base dos Dados, condicionado à validação da edição e revisão. Este diagnóstico não substitui a conferência oficial.',
    182
  );
  doc.text(linhasRodape, 14, y);

  doc.addPage();
  y = cabecalho(doc, `VAAR — ${municipio.nome} / ${municipio.uf}`, 'Habilitação e previsão oficial de repasse');
  const vaar = diagnostico.vaar;
  if (!vaar) {
    paragrafo(doc, `Avaliação pendente: ${diagnostico.avisoVaar || 'Fonte oficial indisponível.'}`, y);
    adicionarComparativos(doc, diagnostico);
    return doc;
  }
  y = paragrafo(doc, `Exercício ${vaar.exercicio}. ${vaar.publicacao}`, y);
  y = paragrafo(doc, `${vaar.habilitado ? 'Habilitado' : 'Não habilitado'}; ${vaar.beneficiario ? 'beneficiário' : 'não beneficiário'}.`, y);
  for (const [i, condicao] of CONDICOES_VAAR.entries()) {
    y = paragrafo(doc, `${condicao}: ${vaar.condicoes[i] ? 'atendida' : 'não atendida'}.`, y);
  }
  y = paragrafo(doc, `Evoluiu atendimento: ${vaar.evoluiuAtendimento ? 'sim' : 'não'}. Elegível: ${vaar.habilitado && vaar.evoluiuAtendimento ? 'sim' : 'não'}.`, y);
  y = paragrafo(doc, `Evoluiu aprendizagem: ${vaar.evoluiuAprendizagem ? 'sim' : 'não'}. Elegível: ${vaar.habilitado && vaar.evoluiuAprendizagem ? 'sim' : 'não'}.`, y);
  y = paragrafo(doc, `Previsão oficial de repasse: ${vaar.repasseTotalPrevisto === null ? 'pendente de conferência' : vaar.repasseTotalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, y);
  if (vaar.pendencia) y = paragrafo(doc, `Pendência publicada: ${vaar.pendencia}`, y);
  for (const aviso of vaar.avisos) y = paragrafo(doc, aviso, y);
  y = paragrafo(doc, `Consulta ao FNDE: ${dataHoraBr(vaar.consultadoEm)}. Fontes oficiais (links):`, y);
  for (const fonte of vaar.fontes) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(30, 70, 140);
    doc.textWithLink(fonte.titulo, 14, y, { url: fonte.url });
    y += 7;
  }

  adicionarComparativos(doc, diagnostico);
  return doc;
}

function adicionarComparativos(doc: jsPDF, diagnostico: Diagnostico) {
  const comparativos: ComparativoEstadual[] = [
    ...(diagnostico.comparativoRepasses ? [diagnostico.comparativoRepasses] : []),
    ...(diagnostico.vaar?.comparativoAprendizagem ? [diagnostico.vaar.comparativoAprendizagem] : []),
    ...(diagnostico.comparativosIdeb || []),
  ];
  for (const c of comparativos) {
    doc.addPage();
    let y = cabecalho(doc, `${c.titulo} / ${c.uf} / ${c.anoReferencia}`, 'Cidade filtrada e maiores resultados do estado');
    y = paragrafo(doc, c.universo, y);
    if (c.periodo) y = paragrafo(doc, `Período: ${c.periodo}.`, y);
    if (c.atualizadoEm) y = paragrafo(doc, `Base oficial atualizada em ${dataHoraBr(c.atualizadoEm)}.`, y);
    y = paragrafo(doc, `Cinco primeiros do estado, incluindo empates. ${c.totalComNota} municípios com resultado no grupo comparado. A cidade filtrada aparece primeiro.`, y);
    if (!c.cidade) y = paragrafo(doc, 'Cidade filtrada: sem resultado publicado nesta base.', y);
    const linhas = [...(c.cidade ? [c.cidade] : []), ...c.destaques];
    const cabecalhoTabela = () => {
      doc.setFontSize(10);
      doc.setTextColor(15, 41, 66);
      doc.text('Posição', 14, y);
      doc.text('Município', 37, y);
      doc.text(c.formato === 'moeda' ? 'Valor recebido' : 'Nota / indicador', 196, y, { align: 'right' });
      y += 7;
    };
    cabecalhoTabela();
    for (const r of linhas) {
      const nome: string[] = doc.splitTextToSize(`${r.municipio}${r.codigoIbge === c.cidade?.codigoIbge ? ' (cidade filtrada)' : ''}`, c.formato === 'moeda' ? 100 : 109);
      const altura = Math.max(10, nome.length * 5 + 4);
      if (y + altura > 270) { doc.addPage(); y = 20; cabecalhoTabela(); }
      if (r.codigoIbge === c.cidade?.codigoIbge) { doc.setFillColor(238, 244, 249); doc.rect(12, y - 5, 186, altura, 'F'); }
      doc.setTextColor(30, 30, 30);
      doc.text(r.posicao === null ? '-' : `${r.posicao}º`, 14, y);
      doc.text(nome, 37, y);
      doc.text(r.nota === null ? 'Não divulgado' : r.nota.toLocaleString('pt-BR', { ...(c.formato === 'moeda' ? { style: 'currency', currency: 'BRL' } : {}), minimumFractionDigits: c.casasDecimais, maximumFractionDigits: c.casasDecimais }), 196, y, { align: 'right' });
      y += altura;
    }
    if (c.cidade?.posicao === null) y = paragrafo(doc, 'Sem posição: a cidade não tem nota divulgada ou não participa do grupo elegível desta comparação.', y + 3);
    y = paragrafo(doc, `Consulta: ${dataHoraBr(c.consultadoEm)}. Referência: ${c.anoReferencia}.`, y + 4);
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 70, 140);
    doc.textWithLink(c.fonte.titulo, 14, y, { url: c.fonte.url });
  }
  const avisos = [diagnostico.avisoRepasses, diagnostico.vaar?.avisoComparativo, diagnostico.avisoIdeb].filter(Boolean);
  if (avisos.length) {
    doc.addPage();
    let y = cabecalho(doc, 'Comparações pendentes', 'Disponibilidade das fontes oficiais');
    for (const aviso of avisos) y = paragrafo(doc, aviso!, y);
  }
}

/**
 * Compartilha o PDF via Web Share API (comum em navegadores mobile — abre o
 * seletor nativo, incluindo WhatsApp) quando disponível; senão, baixa o
 * arquivo direto.
 */
export async function compartilharOuBaixarPdf(doc: jsPDF, nomeArquivo: string): Promise<'compartilhado' | 'baixado'> {
  const blob = doc.output('blob');
  const file = new File([blob], nomeArquivo, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: nomeArquivo });
    return 'compartilhado';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
  return 'baixado';
}
