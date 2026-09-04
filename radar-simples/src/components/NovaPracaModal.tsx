import { useMemo, useState } from 'react';
import { buscarDadosEscolares } from '../api/censoEscolar';
import { buscarTodosMunicipios } from '../api/ibge';
import { getMunicipioCrm, saveMunicipioCrm } from '../storage';
import { MunicipioCrm, MunicipioIbge, municipioCrmVazio } from '../types';
import Icon from './Icon';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

function distanciaLevenshtein(a: string, b: string): number {
  const linhas: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) linhas[i][0] = i;
  for (let j = 0; j <= b.length; j++) linhas[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      linhas[i][j] = Math.min(linhas[i - 1][j] + 1, linhas[i][j - 1] + 1, linhas[i - 1][j - 1] + custo);
    }
  }
  return linhas[a.length][b.length];
}

/** Separa um eventual sufixo de UF (ex: "Duque Bacelar MA" → nome + "MA"). */
function separarUf(linha: string): { nome: string; uf: string | null } {
  const partes = linha.trim().split(/\s+/);
  const ultima = partes[partes.length - 1]?.toUpperCase();
  if (partes.length > 1 && UFS.includes(ultima)) {
    return { nome: partes.slice(0, -1).join(' '), uf: ultima };
  }
  return { nome: linha.trim(), uf: null };
}

type StatusItemLista = 'resolvido' | 'ambiguo' | 'nao_encontrado';

interface ItemLista {
  textoOriginal: string;
  status: StatusItemLista;
  candidatos: MunicipioIbge[];
  escolhido: MunicipioIbge | null;
}

/** Resolve uma linha digitada (com ou sem UF) contra a lista oficial do IBGE — match exato primeiro, depois aproximado (Levenshtein) só pra pegar erro de digitação óbvio, nunca advinha entre opções muito diferentes. */
function resolverLinha(linha: string, todos: MunicipioIbge[]): ItemLista {
  const { nome, uf } = separarUf(linha);
  const base: Pick<ItemLista, 'textoOriginal'> = { textoOriginal: linha };
  if (!nome) return { ...base, status: 'nao_encontrado', candidatos: [], escolhido: null };

  const alvo = normalizar(nome);
  const pool = uf ? todos.filter((m) => m.uf === uf) : todos;

  const exatos = pool.filter((m) => normalizar(m.nome) === alvo);
  // Um nome digitado pode ser o nome completo E CERTO de um município, mas
  // também bater exatamente com o começo do nome de outro (ex: "Morro do
  // Chapéu" é município na Bahia, mas também é prefixo de "Morro do Chapéu
  // do Piauí") — nesse caso as duas opções são candidatas reais, não dá pra
  // advinhar qual o vendedor quis dizer, então trata como ambíguo em vez de
  // confiar cegamente no match exato.
  const prefixosMaisLongos = pool.filter((m) => normalizar(m.nome).startsWith(`${alvo} `));
  if (exatos.length + prefixosMaisLongos.length > 1) {
    return { ...base, status: 'ambiguo', candidatos: [...exatos, ...prefixosMaisLongos], escolhido: null };
  }
  if (exatos.length === 1) return { ...base, status: 'resolvido', candidatos: exatos, escolhido: exatos[0] };

  const comDistancia = pool
    .map((m) => ({ municipio: m, distancia: distanciaLevenshtein(alvo, normalizar(m.nome)) }))
    .filter((x) => x.distancia <= 2)
    .sort((a, b) => a.distancia - b.distancia);

  if (comDistancia.length === 0) return { ...base, status: 'nao_encontrado', candidatos: [], escolhido: null };
  const melhorEDestacado = comDistancia[0].distancia <= 1 && (comDistancia.length === 1 || comDistancia[1].distancia > comDistancia[0].distancia);
  if (melhorEDestacado) {
    return { ...base, status: 'resolvido', candidatos: [comDistancia[0].municipio], escolhido: comDistancia[0].municipio };
  }
  return { ...base, status: 'ambiguo', candidatos: comDistancia.slice(0, 5).map((x) => x.municipio), escolhido: null };
}

interface NovaPracaModalProps {
  municipiosExistentes: MunicipioIbge[];
  onFechar: () => void;
  onAdicionado: (municipio: MunicipioIbge) => void;
  onAdicionadosEmLote: () => void;
}

export default function NovaPracaModal({ municipiosExistentes, onFechar, onAdicionado, onAdicionadosEmLote }: NovaPracaModalProps) {
  const [modo, setModo] = useState<'busca' | 'lista'>('busca');
  const [termo, setTermo] = useState('');
  const [todos, setTodos] = useState<MunicipioIbge[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<number | null>(null);

  const [textoLista, setTextoLista] = useState('');
  const [itensLista, setItensLista] = useState<ItemLista[] | null>(null);
  const [adicionandoLote, setAdicionandoLote] = useState(false);

  const codigosExistentes = useMemo(() => new Set(municipiosExistentes.map((m) => m.codigoIbge)), [municipiosExistentes]);

  async function carregarSeNecessario() {
    if (todos || carregando) return todos;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await buscarTodosMunicipios();
      setTodos(lista);
      return lista;
    } catch (e: any) {
      setErro(e.message || 'Falha ao consultar o IBGE');
      return null;
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

  // Grava o CRM só se o município ainda não tiver um — reaproveitar um já
  // existente aqui apagaria funil/contatos/notas reais com um registro em
  // branco (bug encontrado ao preparar a importação em lote).
  async function salvarSeNovo(municipio: MunicipioIbge): Promise<boolean> {
    const existente = await getMunicipioCrm(municipio.codigoIbge);
    if (existente) return false;
    const crmVazio = municipioCrmVazio(municipio.codigoIbge);
    await saveMunicipioCrm(crmVazio);
    await tentarEnriquecerComCensoEscolar(crmVazio);
    return true;
  }

  async function adicionar(municipio: MunicipioIbge) {
    setSalvando(municipio.codigoIbge);
    setErro(null);
    try {
      await salvarSeNovo(municipio);
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

  async function resolverLista() {
    setErro(null);
    const lista = await carregarSeNecessario();
    if (!lista) return;
    const linhas = textoLista.split('\n').map((l) => l.trim()).filter(Boolean);
    setItensLista(linhas.map((linha) => resolverLinha(linha, lista)));
  }

  function escolherCandidato(idx: number, candidato: MunicipioIbge) {
    setItensLista((atual) =>
      atual ? atual.map((item, i) => (i === idx ? { ...item, status: 'resolvido', escolhido: candidato } : item)) : atual
    );
  }

  async function adicionarLote() {
    if (!itensLista) return;
    setAdicionandoLote(true);
    setErro(null);
    try {
      for (const item of itensLista) {
        if (item.status !== 'resolvido' || !item.escolhido || codigosExistentes.has(item.escolhido.codigoIbge)) continue;
        await salvarSeNovo(item.escolhido);
      }
      onAdicionadosEmLote();
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar o lote. Confira sua conexão e tente de novo.');
    } finally {
      setAdicionandoLote(false);
    }
  }

  const pendentesParaAdicionar = (itensLista || []).filter(
    (i) => i.status === 'resolvido' && i.escolhido && !codigosExistentes.has(i.escolhido.codigoIbge)
  ).length;

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

        <div className="flex gap-1.5 bg-surface-container rounded-lg p-1">
          <button
            onClick={() => setModo('busca')}
            className={`flex-1 h-8 rounded-md text-label-sm font-semibold ${modo === 'busca' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            Buscar uma
          </button>
          <button
            onClick={() => setModo('lista')}
            className={`flex-1 h-8 rounded-md text-label-sm font-semibold ${modo === 'lista' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            Colar lista
          </button>
        </div>

        {erro && <p className="text-body-sm text-error bg-error/10 rounded-lg p-2.5 font-medium">{erro}</p>}

        {modo === 'busca' && (
          <>
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

            {resultados.length > 0 && (
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {resultados.map((m) => {
                  const estaSalvandoEste = salvando === m.codigoIbge;
                  const jaExiste = codigosExistentes.has(m.codigoIbge);
                  return (
                    <button
                      key={m.codigoIbge}
                      disabled={salvando !== null || jaExiste}
                      onClick={() => adicionar(m)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-left disabled:opacity-50"
                    >
                      <span className="text-label-md text-on-surface">
                        {m.nome} <span className="text-on-surface-variant">— {m.uf}</span>
                        {jaExiste && <span className="text-label-sm text-on-surface-variant"> (já cadastrado)</span>}
                      </span>
                      {!jaExiste && (
                        <Icon
                          name={estaSalvandoEste ? 'sync' : 'add_circle'}
                          size={18}
                          className={`text-secondary ${estaSalvandoEste ? 'animate-spin' : ''}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {modo === 'lista' && (
          <>
            <p className="text-body-sm text-on-surface-variant">
              Cola uma cidade por linha (com ou sem UF, ex: "Duque Bacelar MA"). A gente resolve contra a base do IBGE — quando o nome bate com mais de uma cidade, você escolhe qual.
            </p>
            {!itensLista && (
              <>
                <textarea
                  className="w-full h-32 p-3 rounded-lg bg-surface-container text-on-surface text-body-md focus:outline-none resize-none"
                  placeholder={'Timon\nCaxias\nDuque Bacelar MA\n...'}
                  value={textoLista}
                  onChange={(e) => setTextoLista(e.target.value)}
                />
                <button
                  disabled={!textoLista.trim() || carregando}
                  onClick={resolverLista}
                  className="w-full h-11 rounded-lg bg-primary text-on-primary text-label-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Icon name={carregando ? 'sync' : 'find_in_page'} size={18} className={carregando ? 'animate-spin' : ''} />
                  {carregando ? 'Consultando IBGE…' : 'Resolver lista'}
                </button>
              </>
            )}

            {itensLista && (
              <>
                <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                  {itensLista.map((item, idx) => {
                    const jaExiste = item.escolhido && codigosExistentes.has(item.escolhido.codigoIbge);
                    return (
                      <div key={idx} className="p-2.5 rounded-lg bg-surface-container-low">
                        <p className="text-label-sm text-on-surface-variant">"{item.textoOriginal}"</p>
                        {item.status === 'resolvido' && item.escolhido && (
                          <p className="text-label-md text-on-surface flex items-center gap-1.5 mt-0.5">
                            <Icon name={jaExiste ? 'check_circle' : 'task_alt'} size={16} className="text-secondary" />
                            {item.escolhido.nome} — {item.escolhido.uf}
                            {jaExiste && <span className="text-label-sm text-on-surface-variant">(já cadastrado, vou pular)</span>}
                          </p>
                        )}
                        {item.status === 'nao_encontrado' && (
                          <p className="text-label-md text-error flex items-center gap-1.5 mt-0.5">
                            <Icon name="error" size={16} />
                            Não encontrei essa cidade — confere a grafia.
                          </p>
                        )}
                        {item.status === 'ambiguo' && (
                          <div className="mt-1 flex flex-col gap-1">
                            <p className="text-label-sm text-on-surface-variant">Mais de uma cidade parecida — qual é?</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.candidatos.map((c) => (
                                <button
                                  key={c.codigoIbge}
                                  onClick={() => escolherCandidato(idx, c)}
                                  className="px-2.5 py-1 rounded-full bg-surface-container text-label-sm text-primary font-semibold"
                                >
                                  {c.nome} — {c.uf}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="h-11 px-4 rounded-lg bg-surface-container-low text-primary text-label-md"
                    onClick={() => setItensLista(null)}
                  >
                    Editar lista
                  </button>
                  <button
                    disabled={pendentesParaAdicionar === 0 || adicionandoLote}
                    onClick={adicionarLote}
                    className="flex-1 h-11 rounded-lg bg-primary text-on-primary text-label-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Icon name={adicionandoLote ? 'sync' : 'playlist_add_check'} size={18} className={adicionandoLote ? 'animate-spin' : ''} />
                    {adicionandoLote ? 'Adicionando…' : `Adicionar ${pendentesParaAdicionar} município${pendentesParaAdicionar === 1 ? '' : 's'}`}
                  </button>
                </div>
              </>
            )}
          </>
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
