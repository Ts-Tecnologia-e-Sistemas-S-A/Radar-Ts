import { useEffect, useMemo, useState } from 'react';
import { getDespesas, getEventos, getMunicipiosCrm, getTarefas } from '../storage';
import type { MunicipioIbge } from '../types';
import { dataLocal } from '../utils/agenda';
import { dataBr, moeda, montarRelatorioGestao, type FonteRelatorio } from '../utils/relatorioGestao';
import { gerarPdfGestao } from '../utils/pdfGestao';
import { compartilharOuBaixarPdf } from '../utils/pdf';
import RelatoriosView from './RelatoriosView';
import Icon from './Icon';
import ImportarHistoricoView from './ImportarHistoricoView';

export default function RelatorioGestaoView({ municipios, onFechar, onImportado }: { municipios: MunicipioIbge[]; onFechar: () => void; onImportado: () => void }) {
  const [inicio, setInicio] = useState(() => `${dataLocal().slice(0, 7)}-01`);
  const [fim, setFim] = useState(dataLocal);
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fonte, setFonte] = useState<FonteRelatorio | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [erroExportacao, setErroExportacao] = useState('');
  const [exportando, setExportando] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const [balanco, setBalanco] = useState(false);
  const [importando, setImportando] = useState(false);
  useEffect(() => {
    let cancelado = false;
    setFonte(null); setErroCarga('');
    Promise.all([getDespesas(), getEventos(), getMunicipiosCrm(), getTarefas()])
      .then(([despesas, eventos, crm, tarefas]) => {
        if (!cancelado) setFonte({ municipios, despesas, eventos, crm, tarefas });
      }).catch((e: Error) => { if (!cancelado) setErroCarga(e.message || 'Não foi possível carregar os dados.'); });
    return () => { cancelado = true; };
  }, [municipios, revisao]);
  const { relatorio, erroPeriodo } = useMemo(() => {
    if (!fonte) return { relatorio: null, erroPeriodo: '' };
    try { return { relatorio: montarRelatorioGestao(fonte, inicio, fim), erroPeriodo: '' }; }
    catch (e) { return { relatorio: null, erroPeriodo: (e as Error).message }; }
  }, [fonte, inicio, fim]);
  async function exportar() {
    if (!relatorio) return;
    setExportando(true); setErroExportacao('');
    try {
      await compartilharOuBaixarPdf(gerarPdfGestao(relatorio, responsavel, observacoes), `relatorio-gestao-${inicio}-${fim}.pdf`);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setErroExportacao((e as Error).message || 'Falha ao exportar PDF.');
    } finally { setExportando(false); }
  }
  const campo = 'w-full min-w-0 rounded-lg bg-surface-container-low p-3 text-primary';
  if (balanco) return <RelatoriosView municipios={municipios} onFechar={() => setBalanco(false)} />;
  if (importando) return <ImportarHistoricoView onFechar={() => setImportando(false)} onImportado={() => { setRevisao((r) => r + 1); onImportado(); }} />;
  return <div className="fixed inset-0 z-50 bg-surface flex flex-col">
    <header className="min-h-16 px-screen-margin-mobile flex items-center justify-between gap-3 border-b border-surface-container">
      <h2 className="text-headline-sm text-primary">Relatório para a gestão</h2>
      <button aria-label="Fechar relatório" onClick={onFechar} className="w-11 h-11 shrink-0 rounded-full bg-surface-container-low flex items-center justify-center"><Icon name="close" size={20} /></button>
    </header>
    <main className="flex-1 overflow-y-auto p-screen-margin-mobile space-y-5">
      <button onClick={() => setImportando(true)} className="rounded-lg bg-primary text-on-primary p-3">Importar histórico de viagens</button>
      <section className="rounded-xl bg-surface-container-lowest p-4 space-y-3">
        <h3 className="text-label-lg text-primary">Período da prestação de contas</h3>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <label className="min-w-0">De<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} /></label>
          <label className="min-w-0">Até<input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={campo} /></label>
        </div>
        <label className="block">Responsável<input className={campo} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome de quem apresenta o relatório" /></label>
        <p className="text-body-sm text-on-surface-variant">Inclui os registros disponíveis no aplicativo para o período, de todos os usuários. O nome identifica quem apresenta o relatório e não filtra os gastos por pessoa.</p>
      </section>
      {!fonte && !erroCarga && <p role="status">Carregando registros…</p>}
      {erroCarga && <div role="alert" className="text-error"><p>{erroCarga}</p><button className="underline p-2" onClick={() => setRevisao((r) => r + 1)}>Tentar novamente</button></div>}
      {erroPeriodo && <p role="alert" className="text-error">{erroPeriodo}</p>}
      {erroExportacao && <p role="alert" className="text-error">{erroExportacao}</p>}
      {relatorio && <>
        <section className="rounded-xl bg-surface-container p-4 space-y-2">
          <h3 className="text-headline-sm text-primary">Resumo executivo</h3>
          <p className="text-body-md">{relatorio.resumo}</p>
          {relatorio.semData > 0 && <p className="text-body-sm">Incluídos também {relatorio.semData} relatos importados sem data. Eles confirmam o histórico das cidades visitadas, mas não recebem uma data no período.</p>}
        </section>
        <section className="space-y-3">
          <h3 className="text-headline-sm text-primary">Gastos para solicitação de reembolso</h3>
          <p className="text-headline-md text-primary">{moeda(relatorio.totalDespesas)}</p>
          <p className="text-body-sm text-on-surface-variant">Total sujeito à conferência. O aplicativo não registra aprovação, pagamento ou adiantamentos; este valor não é um saldo de reembolso aprovado.</p>
          <div className="grid grid-cols-2 gap-2">{relatorio.categorias.map((c) => <div key={c.nome} className="rounded-lg bg-surface-container-low p-3"><p>{c.nome}</p><strong>{moeda(c.valor)}</strong></div>)}</div>
          <p className="text-body-sm">Sem município vinculado: {moeda(relatorio.semMunicipio)}</p>
          {!relatorio.despesas.length && <p>Nenhuma despesa no período.</p>}
          {relatorio.despesas.map((d) => <article key={d.id} className="rounded-xl bg-surface-container-lowest p-4 space-y-1 break-words">
            <p className="font-semibold text-primary">{dataBr(d.data)} · {d.categoriaLabel} · {moeda(d.valor)}</p>
            <p>{d.cidade}</p><p>{d.descricao || 'Sem descrição'}</p>
            <p className="text-body-sm text-on-surface-variant">Comprovante: {d.temComprovante ? 'imagem registrada no aplicativo' : 'não anexado'}</p>
            {d.temComprovante && <details><summary className="cursor-pointer text-secondary py-2">Ver comprovante</summary><img loading="lazy" className="max-w-full max-h-96 object-contain" src={`data:image/jpeg;base64,${d.comprovante!.base64}`} alt={`Comprovante de ${d.descricao || d.categoriaLabel}`} /></details>}
          </article>)}
        </section>
        <section className="space-y-3">
          <h3 className="text-headline-sm text-primary">Cidades visitadas, interesse e histórico</h3>
          <p className="text-body-sm text-on-surface-variant">Toda cidade com ficha, contato, nota ou outro registro é considerada visitada. O interesse comercial é indicado quando a prefeitura avança no funil além de “Mapeamento &amp; Contato Político”.</p>
          {!relatorio.cidades.length && <p>Nenhuma cidade com registros no período.</p>}
          {relatorio.cidades.map((c) => <article key={c.codigo} className="rounded-xl bg-surface-container-lowest p-4 space-y-2 break-words">
            <h4 className="text-label-lg font-semibold text-primary">{c.nome}</h4>
            <p>Status atual: {c.status}{c.prioritario ? ' · Prioritária' : ''}</p>
            <p>Cidade visitada · {c.visitas.length} registros formais de visita com data · Gastos: {moeda(c.totalDespesas)}</p>
            <p className="text-body-sm">Próxima ação: {c.proximaAcao}</p>
            <details><summary className="cursor-pointer text-secondary py-2">Histórico do período ({c.historico.length})</summary>
              {!c.historico.length && <p>Sem atividades registradas; há despesas vinculadas.</p>}
              <ol className="space-y-3">{c.historico.map((item) => <li key={item.id} className="border-l-2 border-outline-variant pl-3"><time className="font-semibold">{dataBr(item.data)}</time><p className="text-body-sm whitespace-pre-wrap">{item.texto}</p></li>)}</ol>
            </details>
          </article>)}
        </section>
      </>}
      <label className="block">Observações para a gestão<textarea className={campo} rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Justificativas, resultados alcançados e pontos de atenção" /></label>
      <p className="text-body-sm text-on-surface-variant">Responsável e observações são incluídos neste PDF; não são salvos ao fechar a tela.</p>
      <button className="text-secondary underline py-3" onClick={() => setBalanco(true)}>Abrir balanço semanal e recomendações com IA</button>
    </main>
    <footer className="p-screen-margin-mobile pb-safe border-t border-surface-container">
      <button disabled={!relatorio || exportando} onClick={exportar} className="w-full min-h-12 rounded-xl bg-primary text-on-primary p-3 disabled:opacity-50">{exportando ? 'Gerando PDF…' : 'Exportar / Compartilhar relatório PDF'}</button>
    </footer>
  </div>;
}
