import type { RelatorioPlanilha } from '../utils/relatorioPlanilha';

export default function RelatorioPlanilhaCard({ relatorio }: { relatorio: RelatorioPlanilha }) {
  return (
    <article className="rounded-xl bg-surface-container-low p-3.5 space-y-3 text-body-sm text-on-surface">
      <h4 className="text-label-lg text-primary">{relatorio.titulo}</h4>
      <p className="whitespace-pre-wrap">{relatorio.resumo}</p>
      {([
        ['Principais achados', relatorio.achados],
        ['Limitações dos dados', relatorio.limitacoes],
        ['Próximos passos sugeridos', relatorio.proximosPassos],
      ] as const).map(([titulo, itens]) => itens.length > 0 && (
        <div key={titulo}>
          <h5 className="font-semibold text-primary">{titulo}</h5>
          <ul className="list-disc pl-5 space-y-1">
            {itens.map((item, i) => <li key={i} className="whitespace-pre-wrap">{item}</li>)}
          </ul>
        </div>
      ))}
      <p className="text-label-sm text-on-surface-variant">Análise de IA baseada no trecho informado. Confira os valores com a planilha de origem.</p>
    </article>
  );
}
