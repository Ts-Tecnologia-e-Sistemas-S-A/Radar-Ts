import { jsPDF } from 'jspdf';
import { EventoTimeline, MunicipioCrm, MunicipioIbge } from '../types';

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
  const linhas = doc.splitTextToSize(texto, largura);
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(linhas, 14, y);
  return y + linhas.length * 5 + 4;
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
      y = paragrafo(doc, `${ev.data.split('-').reverse().join('/')} — ${ev.sinteseIA || ev.resumo}`, y);
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
