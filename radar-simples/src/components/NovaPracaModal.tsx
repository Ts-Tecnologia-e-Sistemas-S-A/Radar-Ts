import { useMemo, useState } from 'react';
import { buscarDadosEscolares } from '../api/censoEscolar';
import { buscarTodosMunicipios } from '../api/ibge';
import { saveMunicipioCrm } from '../storage';
import { MunicipioCrm, MunicipioIbge, municipioCrmVazio } from '../types';
import Icon from './Icon';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface NovaPracaModalProps {
  onFechar: () => void;
  onAdicionado: (municipio: MunicipioIbge) => void;
}

export default function NovaPracaModal({ onFechar, onAdicionado }: NovaPracaModalProps) {
  const [termo, setTermo] = useState('');
  const [todos, setTodos] = useState<MunicipioIbge[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<number | null>(null);

  async function carregarSeNecessario() {
    if (todos || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      setTodos(await buscarTodosMunicipios());
    } catch (e: any) {
      setErro(e.message || 'Falha ao consultar o IBGE');
    } finally {
      setCarregando(false);
    }
  }

  const resultados = useMemo(() => {
    if (!todos || !termo.trim()) return [];
    const alvo = normalizar(termo.trim());
    return todos
      .filter((m) => normalizar(m.nome).includes(alvo) || String(m.codigoIbge).includes(termo.trim()))
      .slice(0, 8);
  }, [todos, termo]);

  async function adicionar(municipio: MunicipioIbge) {
    setSalvando(municipio.codigoIbge);
    setErro(null);
    try {
      const crmVazio = municipioCrmVazio(municipio.codigoIbge);
      await saveMunicipioCrm(crmVazio);
      await tentarEnriquecerComCensoEscolar(crmVazio);
      onAdicionado(municipio);
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar no banco. Confira sua conexão e tente de novo.');
      setSalvando(null);
    }
  }

  // Busca real do Censo Escolar (INEP) como bônus — nunca impede vincular o
  // município se falhar ou demorar; o vendedor sempre pode atualizar depois
  // na Ficha Municipal.
  async function tentarEnriquecerComCensoEscolar(crm: MunicipioCrm) {
    try {
      const dados = await Promise.race([
        buscarDadosEscolares(crm.codigoIbge),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (dados) {
        await saveMunicipioCrm({ ...crm, escolasCount: dados.escolas, alunosCount: dados.alunos, censoEscolarAno: dados.ano });
      }
    } catch {
      // silencioso — enriquecimento é bônus, não crítico
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex flex-col justify-end p-screen-margin-mobile">
      <div className="bg-surface-container-lowest rounded-2xl p-card-padding shadow-xl flex flex-col gap-space-sm max-w-lg w-full mx-auto max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <Icon name="location_city" size={18} />
            </div>
            <h3 className="text-headline-sm text-primary">Vincular Nova Praça (IBGE)</h3>
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            onClick={onFechar}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Digite o nome da cidade ou o código IBGE. Os dados vêm direto da base oficial do IBGE.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-3.5 text-on-surface-variant">
            <Icon name="search" size={18} />
          </span>
          <input
            autoFocus
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container text-on-surface text-body-md focus:outline-none"
            placeholder="Ex: Maracanaú ou 2307650..."
            type="text"
            value={termo}
            onFocus={carregarSeNecessario}
            onChange={(e) => {
              setTermo(e.target.value);
              carregarSeNecessario();
            }}
          />
        </div>

        {carregando && <p className="text-body-sm text-on-surface-variant">Consultando IBGE…</p>}
        {erro && (
          <p className="text-body-sm text-error bg-error/10 rounded-lg p-2.5 font-medium">{erro}</p>
        )}

        {resultados.length > 0 && (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {resultados.map((m) => {
              const estaSalvandoEste = salvando === m.codigoIbge;
              return (
                <button
                  key={m.codigoIbge}
                  disabled={salvando !== null}
                  onClick={() => adicionar(m)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left disabled:opacity-50"
                >
                  <span className="text-label-md text-on-surface">
                    {m.nome} <span className="text-on-surface-variant">— {m.uf}</span>
                  </span>
                  <Icon
                    name={estaSalvandoEste ? 'sync' : 'add_circle'}
                    size={18}
                    className={`text-secondary ${estaSalvandoEste ? 'animate-spin' : ''}`}
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button className="flex-1 h-11 rounded-lg bg-surface-container-low text-primary text-label-md" onClick={onFechar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
