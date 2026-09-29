import { CATEGORIAS_DESPESA, ESTAGIOS_FUNIL_B2G, type Despesa, type EventoTimeline, type MunicipioCrm, type MunicipioIbge } from '../types';
import { dataValida, proximaTarefa, TIPOS_TAREFA, type Tarefa } from './agenda';
import { dataBr } from './data';
import { oportunidadeComInteresse } from './pipeline';

export const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export { dataBr } from './data';

export interface FonteRelatorio {
  municipios: MunicipioIbge[];
  crm: Record<number, MunicipioCrm>;
  eventos: EventoTimeline[];
  despesas: Despesa[];
  tarefas: Tarefa[];
}

export function montarRelatorioGestao(fonte: FonteRelatorio, inicio: string, fim: string) {
  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) throw new Error('Informe um período válido: a data inicial deve ser anterior ou igual à final.');
  const noPeriodo = (item: { data: string }) => item.data >= inicio && item.data <= fim;
  const despesas = fonte.despesas.filter(noPeriodo).sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
  if (despesas.some((d) => !Number.isFinite(d.valor) || d.valor < 0)) throw new Error('Há uma despesa com valor inválido no período. Corrija o registro antes de exportar.');
  const centavos = (d: Despesa) => Math.round(d.valor * 100);
  const somar = (lista: Despesa[]) => lista.reduce((total, d) => total + centavos(d), 0) / 100;
  const eventos = fonte.eventos.filter((e) => noPeriodo(e) || (e.historicoImportado && !e.data));
  const semData = eventos.filter((e) => !e.data).length;
  const tarefas = fonte.tarefas.filter(noPeriodo);
  const visitas = [...tarefas.filter((t) => t.tipo === 'visitar' && t.status === 'concluida'), ...eventos.filter((e) => e.historicoImportado?.visitaRegistrada && noPeriodo(e))];
  const nomeCidade = (codigo?: number) => {
    if (!codigo) return 'Sem município vinculado';
    const m = fonte.municipios.find((item) => item.codigoIbge === codigo);
    return m ? `${m.nome} / ${m.uf}` : `Município IBGE ${codigo}`;
  };
  const codigos = new Set([
    ...Object.keys(fonte.crm).map(Number),
    ...[...eventos, ...despesas, ...tarefas].map((item) => item.codigoIbge).filter((c): c is number => Boolean(c)),
  ]);
  const cidades = [...codigos].map((codigo) => {
    const crm = fonte.crm[codigo];
    const tarefa = proximaTarefa(fonte.tarefas, codigo);
    const acao = tarefa || crm?.proximaAcao;
    const historico = [
      ...eventos.filter((e) => e.codigoIbge === codigo).map((e) => ({
        id: `evento-${e.id}`, data: e.data,
        texto: `${e.historicoImportado ? 'Histórico importado' : e.tipo === 'reuniao' ? 'Reunião / nota de campo' : e.tipo === 'documento' ? 'Documento' : 'Deslocamento'}: ${e.historicoImportado ? e.resumo : e.sinteseIA || e.relatorioPlanilha?.resumo || e.resumo}${e.desfecho ? ` | Desfecho: ${e.desfecho}` : ''}${e.proximoPassoIA ? ` | Próximo passo registrado: ${e.proximoPassoIA}` : ''}`,
      })),
      ...tarefas.filter((t) => t.codigoIbge === codigo).map((t) => ({ id: `tarefa-${t.id}`, data: t.data, texto: `${TIPOS_TAREFA[t.tipo]} (${t.status === 'concluida' ? 'concluída' : t.status}): ${t.descricao}${t.hora ? ` às ${t.hora}` : ''}` })),
    ].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
    return {
      codigo, nome: nomeCidade(codigo),
      visitada: Boolean(crm?.visitada || crm?.contatos.length || eventos.some((evento) => evento.codigoIbge === codigo)),
      status: ESTAGIOS_FUNIL_B2G.find((e) => e.value === crm?.estagioFunil)?.label || 'Sem status cadastrado',
      prioritario: Boolean(crm?.prioritario),
      visitas: visitas.filter((t) => t.codigoIbge === codigo),
      totalDespesas: somar(despesas.filter((d) => d.codigoIbge === codigo)),
      proximaAcao: acao ? `${dataBr(acao.data)}${acao.hora ? ` às ${acao.hora}` : ''} - ${acao.descricao}` : 'Sem próxima ação agendada',
      historico,
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const totalDespesas = somar(despesas);
  const cidadesVisitadas = cidades.filter((cidade) => cidade.visitada).length;
  const oportunidadesComInteresse = cidades.filter((cidade) => fonte.crm[cidade.codigo] && oportunidadeComInteresse(fonte.crm[cidade.codigo])).length;
  const reunioes = eventos.filter((e) => e.tipo === 'reuniao').length;
  return {
    inicio, fim, cidades, cidadesVisitadas, oportunidadesComInteresse, visitas: visitas.length, reunioes, totalDespesas, semData,
    semMunicipio: somar(despesas.filter((d) => !d.codigoIbge)),
    resumo: `No período de ${dataBr(inicio)} a ${dataBr(fim)}, foram registrados ${moeda(totalDespesas)} em ${despesas.length} despesas e ${reunioes} reuniões/notas de campo. O sistema reúne ${cidadesVisitadas} cidades visitadas e cadastradas; ${oportunidadesComInteresse} prefeituras têm interesse comercial indicado pelo avanço no funil. O valor de ${moeda(totalDespesas)} é a base para solicitação de reembolso, sujeita à conferência da gestão.`,
    despesas: despesas.map((d) => ({ ...d, valor: centavos(d) / 100, cidade: nomeCidade(d.codigoIbge), categoriaLabel: CATEGORIAS_DESPESA.find((c) => c.value === d.categoria)?.label || 'Outros', temComprovante: Boolean(d.comprovante?.base64) })),
    categorias: CATEGORIAS_DESPESA.map((c) => ({ nome: c.label, valor: somar(despesas.filter((d) => (CATEGORIAS_DESPESA.some((item) => item.value === d.categoria) ? d.categoria : 'outros') === c.value)) })),
  };
}

export type RelatorioGestao = ReturnType<typeof montarRelatorioGestao>;
