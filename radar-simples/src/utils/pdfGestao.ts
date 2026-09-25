import { jsPDF } from 'jspdf';
import { dataBr, moeda, type RelatorioGestao } from './relatorioGestao';

export function gerarPdfGestao(relatorio: RelatorioGestao, responsavel: string, observacoes: string) {
  const doc = new jsPDF();
  let y = 38;
  const periodo = `${dataBr(relatorio.inicio)} a ${dataBr(relatorio.fim)}`;
  function cabecalho() {
    doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(15, 41, 66);
    doc.text('Radar TS | Relatório gerencial', 14, 18);
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90, 90, 90);
    doc.text(`Prestação de contas | ${periodo}`, 14, 25);
    doc.setDrawColor(210, 215, 220).line(14, 30, 196, 30);
  }
  function texto(valor: string, titulo = false) {
    doc.setFont('helvetica', titulo ? 'bold' : 'normal').setFontSize(titulo ? 12 : 10);
    const linhas: string[] = doc.splitTextToSize(valor, 182);
    for (const linha of linhas) {
      if (y > 274) { doc.addPage(); cabecalho(); y = 38; }
      doc.setFont('helvetica', titulo ? 'bold' : 'normal').setFontSize(titulo ? 12 : 10).setTextColor(30, 40, 50);
      doc.text(linha, 14, y);
      y += titulo ? 6 : 5;
    }
    y += 3;
  }
  cabecalho();
  texto(`Responsável: ${responsavel.trim() || 'Não informado'}`);
  texto(`Emitido em: ${new Date().toLocaleString('pt-BR')}`);
  texto('Escopo: registros disponíveis no aplicativo, sem filtro por usuário. O responsável identifica quem apresenta o relatório.');
  texto('1. Resumo executivo', true);
  texto(relatorio.resumo);
  if (relatorio.semData) texto(`${relatorio.semData} relatos importados sem data confirmam o histórico das cidades visitadas, mas não recebem uma data no período.`);
  texto('2. Gastos e solicitação de reembolso', true);
  texto(`Total de despesas para conferência: ${moeda(relatorio.totalDespesas)}`);
  texto('O sistema não registra aprovação, pagamento ou adiantamentos. Este total não representa saldo de reembolso já aprovado.');
  for (const categoria of relatorio.categorias) texto(`${categoria.nome}: ${moeda(categoria.valor)}`);
  texto(`Despesas sem município vinculado: ${moeda(relatorio.semMunicipio)}`);
  if (!relatorio.despesas.length) texto('Nenhuma despesa no período.');
  for (const [index, d] of relatorio.despesas.entries()) {
    texto(`${index + 1}. ${dataBr(d.data)} | ${d.cidade} | ${d.categoriaLabel} | ${moeda(d.valor)}`, true);
    texto(`${d.descricao || 'Sem descrição'} | Comprovante: ${d.temComprovante ? 'imagem registrada no aplicativo' : 'não anexado'}. Referência: ${d.id}`);
  }
  texto('3. Cidades visitadas, interesse, status e histórico', true);
  texto('Toda cidade com ficha, contato, nota ou outro registro é considerada visitada. Interesse comercial significa avanço no funil além de Mapeamento & Contato Político.');
  if (!relatorio.cidades.length) texto('Nenhuma cidade com registros no período.');
  for (const cidade of relatorio.cidades) {
    texto(cidade.nome, true);
    texto(`Status atual: ${cidade.status}${cidade.prioritario ? ' | Prioritária' : ''}`);
    texto(`Cidade visitada | Registros formais de visita com data: ${cidade.visitas.length} | Gastos: ${moeda(cidade.totalDespesas)}`);
    texto(`Próxima ação atual: ${cidade.proximaAcao}`);
    if (!cidade.historico.length) texto('Sem histórico de atividades no período; há despesas vinculadas.');
    for (const item of cidade.historico) texto(`${dataBr(item.data)} - ${item.texto}`);
  }
  if (observacoes.trim()) { texto('4. Observações do responsável', true); texto(observacoes.trim()); }
  texto('Conferência da gestão: _____________________    Data: ____/____/________');
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina).setFont('helvetica', 'normal').setFontSize(8).setTextColor(110, 110, 110);
    doc.text('Radar TS - Dados registrados no aplicativo', 14, 289);
    doc.text(`${pagina} / ${paginas}`, 196, 289, { align: 'right' });
  }
  return doc;
}
