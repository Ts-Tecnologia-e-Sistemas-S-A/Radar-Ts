import { useState } from 'react';
import { buscarTodosMunicipios } from '../api/ibge';
import { importarHistorico } from '../storage';
import { validarPacoteHistorico, type PacoteHistorico } from '../utils/importarHistorico';
import { dataBr } from '../utils/relatorioGestao';

export default function ImportarHistoricoView({ onFechar, onImportado }: { onFechar: () => void; onImportado: () => void }) {
  const [texto, setTexto] = useState('');
  const [pacote, setPacote] = useState<PacoteHistorico | null>(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState('');
  async function conferir() {
    setErro(''); setPacote(null); setResultado(''); setOcupado(true);
    try {
      const dados = validarPacoteHistorico(texto);
      const cidades = await buscarTodosMunicipios();
      for (const r of dados.registros) {
        const cidade = cidades.find((c) => c.codigoIbge === r.codigoIbge);
        if (!cidade || `${cidade.nome} / ${cidade.uf}` !== r.cidade) throw new Error(`Confira o município do registro: ${r.cidade}.`);
      }
      setPacote(dados);
    } catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  }
  async function gravar() {
    if (!pacote) return;
    setErro(''); setOcupado(true);
    try {
      const r = await importarHistorico(pacote);
      setResultado(`Importação concluída no banco: ${r.inseridos} registros inseridos; ${r.existentes} já existentes, preservados.`);
      onImportado();
    } catch (e) { setErro(`${(e as Error).message} Se parte dos registros já foi salva, pode tentar novamente: registros idênticos não serão duplicados.`); }
    finally { setOcupado(false); }
  }
  return <div className="fixed inset-0 z-50 bg-surface flex flex-col">
    <header className="p-4 flex justify-between items-center gap-3 border-b border-surface-container"><h2 className="text-headline-sm text-primary">Importar histórico de viagens</h2><button disabled={ocupado} onClick={onFechar} className="p-3">Voltar</button></header>
    <main className="flex-1 overflow-auto p-4 space-y-4">
      <p>Importe o arquivo de histórico preparado a partir da planilha. O texto completo é salvo na Memória da Conta; os dados atuais da ficha são preservados.</p>
      <fieldset disabled={ocupado || Boolean(resultado)} className="space-y-3">
        <label className="block">Arquivo de histórico (.json)<input type="file" accept=".json,application/json" className="block w-full py-3" onChange={async (e) => {
          const arquivo = e.target.files?.[0]; if (!arquivo) return;
          setPacote(null); setErro('');
          if (arquivo.size > 2000000) { setErro('Arquivo muito grande.'); return; }
          try { setTexto(await arquivo.text()); } catch { setErro('Não foi possível ler o arquivo.'); }
        }} /></label>
        <label className="block">Conteúdo do arquivo<textarea rows={5} value={texto} onChange={(e) => { setTexto(e.target.value); setPacote(null); }} className="w-full rounded-lg bg-surface-container-low p-3" /></label>
        <button onClick={conferir} disabled={!texto || ocupado} className="rounded-lg bg-primary text-on-primary p-3 disabled:opacity-50">Conferir registros</button>
      </fieldset>
      {erro && <p role="alert" className="text-error">{erro}</p>}
      {resultado && <p role="status" className="text-secondary font-semibold">{resultado}</p>}
      {pacote && <section className="space-y-3">
        <h3 className="text-headline-sm">{pacote.registros.length} registros · {new Set(pacote.registros.map((r) => r.codigoIbge)).size} cidades</h3>
        <p>Fonte: {pacote.fonte}. Sem data na origem permanece sem data; não serão criadas despesas ou alterados os estágios comerciais.</p>
        {pacote.registros.map((r, i) => <details key={i} className="rounded-xl bg-surface-container-lowest p-3"><summary>{r.cidade} · {r.data ? dataBr(r.data) : 'Data não informada'}</summary><p className="whitespace-pre-wrap break-words text-body-sm mt-3">{r.texto}</p></details>)}
        <button disabled={ocupado || Boolean(resultado)} onClick={gravar} className="w-full rounded-lg bg-primary text-on-primary p-3 disabled:opacity-50">{ocupado ? 'Gravando no banco…' : 'Importar histórico no banco'}</button>
      </section>}
    </main>
  </div>;
}
