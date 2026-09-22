import type { ComparativoEstadual } from '../types/diagnostico';

export default function ComparativoEstadualCard({ comparativo: c }: { comparativo: ComparativoEstadual }) {
  const nota = (valor: number | null) => valor === null ? 'Não divulgado' : valor.toLocaleString('pt-BR', { ...(c.formato === 'moeda' ? { style: 'currency', currency: 'BRL' } : {}), minimumFractionDigits: c.casasDecimais, maximumFractionDigits: c.casasDecimais });
  const linhas = [...(c.cidade ? [c.cidade] : []), ...c.destaques];
  return <section className="rounded-lg bg-surface-container-low p-3 space-y-2 text-body-sm">
    <h4 className="text-label-lg text-primary">{c.titulo} · {c.uf} · {c.anoReferencia}</h4>
    <p>{c.universo}</p>
    {c.periodo && <p className="font-semibold">Período: {c.periodo}</p>}
    {c.atualizadoEm && <p>Base oficial atualizada em {new Date(c.atualizadoEm).toLocaleString('pt-BR')}.</p>}
    <p className="text-on-surface-variant">Cidade filtrada e cinco primeiros do estado, incluindo empates. {c.totalComNota} municípios com resultado no grupo comparado.</p>
    {!c.cidade && <p>Cidade filtrada: sem resultado publicado nesta base.</p>}
    <table className="w-full text-left">
      <thead><tr><th scope="col" className="py-2 pr-2">Posição</th><th scope="col" className="pr-2">Município</th><th scope="col" className="text-right">{c.formato === 'moeda' ? 'Valor recebido' : 'Nota / indicador'}</th></tr></thead>
      <tbody>{linhas.map((r) => <tr key={r.codigoIbge} className={r.codigoIbge === c.cidade?.codigoIbge ? 'font-semibold text-primary bg-primary/5' : ''}>
        <td className="py-2 pr-2">{r.posicao === null ? '—' : `${r.posicao}º`}</td>
        <td className="pr-2">{r.municipio}{r.codigoIbge === c.cidade?.codigoIbge && <span className="block text-label-sm">Cidade filtrada</span>}</td>
        <td className="text-right tabular-nums">{nota(r.nota)}</td>
      </tr>)}</tbody>
    </table>
    {c.cidade?.posicao === null && <p className="text-on-surface-variant">Sem posição: a cidade não tem nota divulgada ou não participa do grupo elegível desta comparação.</p>}
    <p className="text-label-sm">Consultado em {new Date(c.consultadoEm).toLocaleString('pt-BR')}. <a href={c.fonte.url} target="_blank" rel="noreferrer" className="text-secondary underline">{c.fonte.titulo}</a></p>
  </section>;
}
