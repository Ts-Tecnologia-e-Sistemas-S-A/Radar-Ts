import { CONDICOES_VAAR, type AvaliacaoVaar } from '../types/diagnostico';

export default function AvaliacaoVaarCard({ vaar }: { vaar: AvaliacaoVaar }) {
  return <section className="rounded-lg bg-surface-container-low p-3 space-y-2 text-body-sm">
    <h4 className="text-label-lg text-primary">VAAR {vaar.exercicio} — {vaar.municipio} / {vaar.uf}</h4>
    <p>{vaar.habilitado ? 'Habilitado' : 'Não habilitado'} · {vaar.beneficiario ? 'Beneficiário' : 'Não beneficiário'}</p>
    <ul className="space-y-1">
      {CONDICOES_VAAR.map((rotulo, i) => <li key={rotulo}>
        <strong>{vaar.condicoes[i] ? 'Atendida' : 'Não atendida'}</strong> — {rotulo}
      </li>)}
    </ul>
    <p>Evolução do atendimento: {vaar.evoluiuAtendimento ? 'Sim' : 'Não'} · Elegibilidade: {vaar.habilitado && vaar.evoluiuAtendimento ? 'Sim' : 'Não'}</p>
    <p>Evolução da aprendizagem: {vaar.evoluiuAprendizagem ? 'Sim' : 'Não'} · Elegibilidade: {vaar.habilitado && vaar.evoluiuAprendizagem ? 'Sim' : 'Não'}</p>
    <p className="text-label-lg text-primary">Previsão oficial de repasse: {vaar.repasseTotalPrevisto === null ? 'Pendente de conferência' : vaar.repasseTotalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
    {vaar.pendencia && <p>Pendência publicada: {vaar.pendencia}</p>}
    {vaar.avisos.map((aviso) => <p key={aviso} className="text-on-surface-variant">{aviso}</p>)}
    <p>{vaar.publicacao}</p>
    <p>Consultado em {new Date(vaar.consultadoEm).toLocaleString('pt-BR')}. Referência: exercício {vaar.exercicio}.</p>
    <ul>{vaar.fontes.map((fonte) => <li key={fonte.url}><a className="text-secondary underline" href={fonte.url} target="_blank" rel="noreferrer">{fonte.titulo}</a></li>)}</ul>
  </section>;
}
