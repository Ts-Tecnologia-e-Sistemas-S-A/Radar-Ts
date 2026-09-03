import { useEffect, useMemo, useState } from 'react';
import { buscarMunicipiosPorUf } from '../api/ibge';
import { buscarOportunidadesEducacao } from '../api/pncp';
import { Classificacao, calcularPotencial } from '../scoring';
import { getMunicipiosCrm } from '../storage';
import { ESTAGIOS_FUNIL, MunicipioCrm, MunicipioIbge, Oportunidade, municipioCrmVazio } from '../types';

const UFS_DISPONIVEIS = ['PI', 'MA', 'CE'];

const CORES_CLASSIFICACAO: Record<Classificacao, string> = {
  Alta: 'bg-green-100 text-green-800',
  Média: 'bg-yellow-100 text-yellow-800',
  Baixa: 'bg-gray-100 text-gray-600',
};

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(MARCAS_DIACRITICAS, '');
}

/**
 * Casamento por nome entre a razão social do órgão (PNCP) e o município do
 * IBGE. É uma aproximação por substring — suficiente para sinalizar "tem
 * edital", não uma correspondência garantida.
 */
function encontrarOportunidade(nomeMunicipio: string, oportunidades: Oportunidade[]): Oportunidade | undefined {
  const alvo = normalizar(nomeMunicipio);
  return oportunidades.find((o) => normalizar(o.municipioNome).includes(alvo));
}

interface RotaViewProps {
  onAbrirMunicipio: (municipio: MunicipioIbge) => void;
}

export default function RotaView({ onAbrirMunicipio }: RotaViewProps) {
  const [ufs, setUfs] = useState<string[]>(['PI']);
  const [municipios, setMunicipios] = useState<MunicipioIbge[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [crmPorCodigo, setCrmPorCodigo] = useState<Record<number, MunicipioCrm>>({});
  const [carregando, setCarregando] = useState(false);
  const [erroIbge, setErroIbge] = useState<string | null>(null);
  const [erroPncp, setErroPncp] = useState<string | null>(null);
  const [erroCrm, setErroCrm] = useState<string | null>(null);
  const [soComOportunidade, setSoComOportunidade] = useState(false);

  function alternarUf(uf: string) {
    setUfs((atual) => (atual.includes(uf) ? atual.filter((x) => x !== uf) : [...atual, uf]));
  }

  useEffect(() => {
    if (ufs.length === 0) {
      setMunicipios([]);
      setOportunidades([]);
      return;
    }
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErroIbge(null);
      setErroPncp(null);
      setErroCrm(null);

      try {
        const listas = await Promise.all(ufs.map((uf) => buscarMunicipiosPorUf(uf)));
        if (!cancelado) setMunicipios(listas.flat());
      } catch (e: any) {
        if (!cancelado) setErroIbge(e.message || 'Falha ao buscar municípios no IBGE');
      }

      try {
        const listas = await Promise.all(ufs.map((uf) => buscarOportunidadesEducacao(uf)));
        if (!cancelado) setOportunidades(listas.flat());
      } catch (e: any) {
        if (!cancelado) setErroPncp(e.message || 'Falha ao buscar licitações no PNCP');
      }

      try {
        const crm = await getMunicipiosCrm();
        if (!cancelado) setCrmPorCodigo(crm);
      } catch (e: any) {
        if (!cancelado) setErroCrm(e.message || 'Falha ao carregar dados do CRM');
      }

      if (!cancelado) setCarregando(false);
    }

    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ufs.join(',')]);

  const linhas = useMemo(() => {
    return municipios
      .map((municipio) => {
        const crm = crmPorCodigo[municipio.codigoIbge] || municipioCrmVazio(municipio.codigoIbge);
        const oportunidade = encontrarOportunidade(municipio.nome, oportunidades);
        const potencial = calcularPotencial(crm, Boolean(oportunidade));
        return { municipio, crm, oportunidade, potencial };
      })
      .filter((linha): linha is typeof linha & { potencial: NonNullable<typeof linha.potencial> } =>
        linha.potencial !== null
      )
      .filter((linha) => !soComOportunidade || linha.oportunidade)
      .sort((a, b) => b.potencial.pontos - a.potencial.pontos);
  }, [municipios, oportunidades, crmPorCodigo, soComOportunidade]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">Estados:</span>
        {UFS_DISPONIVEIS.map((uf) => (
          <label key={uf} className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={ufs.includes(uf)} onChange={() => alternarUf(uf)} />
            {uf}
          </label>
        ))}

        <label className="ml-auto flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={soComOportunidade}
            onChange={(e) => setSoComOportunidade(e.target.checked)}
          />
          Só com edital aberto
        </label>
      </div>

      {carregando && <p className="text-sm text-gray-500">Carregando municípios e licitações…</p>}
      {erroIbge && <p className="text-sm text-red-600">IBGE: {erroIbge}</p>}
      {erroPncp && <p className="text-sm text-red-600">PNCP: {erroPncp}</p>}
      {erroCrm && <p className="text-sm text-red-600">CRM: {erroCrm}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">Município</th>
              <th className="p-3">UF</th>
              <th className="p-3">Potencial</th>
              <th className="p-3">Edital</th>
              <th className="p-3">Estágio no funil</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ municipio, crm, oportunidade, potencial }) => (
              <tr key={municipio.codigoIbge} className="border-t border-gray-100">
                <td className="p-3 font-medium">{municipio.nome}</td>
                <td className="p-3">{municipio.uf}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${CORES_CLASSIFICACAO[potencial.classificacao]}`}>
                    {potencial.classificacao} ({potencial.pontos})
                  </span>
                </td>
                <td className="p-3">
                  {oportunidade ? (
                    <a
                      href={oportunidade.linkPncp}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                      title={oportunidade.objeto}
                    >
                      🔥 Edital aberto
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-3 text-gray-600">
                  {ESTAGIOS_FUNIL.find((e) => e.value === crm.estagioFunil)?.label}
                </td>
                <td className="p-3">
                  <button
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    onClick={() => onAbrirMunicipio(municipio)}
                  >
                    Abrir no CRM
                  </button>
                </td>
              </tr>
            ))}
            {!carregando && linhas.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  Nenhum município para mostrar. Selecione ao menos um estado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
