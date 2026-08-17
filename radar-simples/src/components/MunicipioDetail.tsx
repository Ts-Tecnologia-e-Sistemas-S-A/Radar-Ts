import { useEffect, useState } from 'react';
import { addInteracao, getInteracoes, getMunicipiosCrm, saveMunicipioCrm } from '../storage';
import {
  ESTAGIOS_FUNIL,
  Interacao,
  MunicipioCrm,
  MunicipioIbge,
  TIPOS_INTERACAO,
  TipoInteracao,
  municipioCrmVazio,
} from '../types';

interface MunicipioDetailProps {
  municipio: MunicipioIbge;
}

export default function MunicipioDetail({ municipio }: MunicipioDetailProps) {
  const [crm, setCrm] = useState<MunicipioCrm>(municipioCrmVazio(municipio.codigoIbge));
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const existente = getMunicipiosCrm()[municipio.codigoIbge];
    setCrm(existente || municipioCrmVazio(municipio.codigoIbge));
    setInteracoes(getInteracoes(municipio.codigoIbge));
    setSalvo(false);
  }, [municipio.codigoIbge]);

  function salvar() {
    saveMunicipioCrm(crm);
    setSalvo(true);
  }

  function registrarInteracao(nova: Omit<Interacao, 'id' | 'codigoIbge'>) {
    const interacao: Interacao = { ...nova, id: crypto.randomUUID(), codigoIbge: municipio.codigoIbge };
    addInteracao(interacao);
    setInteracoes(getInteracoes(municipio.codigoIbge));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{municipio.nome}</h2>
        <p className="text-sm text-gray-500">
          {municipio.uf} · código IBGE {municipio.codigoIbge}
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="font-medium text-gray-700">Dados do CRM</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Estágio do funil</label>
          <select
            className="w-full rounded border border-gray-300 p-2"
            value={crm.estagioFunil}
            onChange={(e) => setCrm({ ...crm, estagioFunil: e.target.value as MunicipioCrm['estagioFunil'] })}
          >
            {ESTAGIOS_FUNIL.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Sistema atual</label>
          <select
            className="w-full rounded border border-gray-300 p-2"
            value={crm.sistemaAtual}
            onChange={(e) => setCrm({ ...crm, sistemaAtual: e.target.value as MunicipioCrm['sistemaAtual'] })}
          >
            <option value="nenhum">Nenhum</option>
            <option value="concorrente">Concorrente</option>
            <option value="nosso_sistema">Nosso sistema (já é cliente)</option>
          </select>
        </div>

        {crm.sistemaAtual === 'concorrente' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nome do sistema concorrente</label>
            <input
              className="w-full rounded border border-gray-300 p-2"
              value={crm.nomeSistemaAtual || ''}
              onChange={(e) => setCrm({ ...crm, nomeSistemaAtual: e.target.value })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vencimento do contrato atual</label>
            <input
              type="date"
              className="w-full rounded border border-gray-300 p-2"
              value={crm.contratoVencimento || ''}
              onChange={(e) => setCrm({ ...crm, contratoVencimento: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Alunos na rede municipal</label>
            <input
              type="number"
              min={0}
              className="w-full rounded border border-gray-300 p-2"
              value={crm.alunosRede ?? ''}
              onChange={(e) => setCrm({ ...crm, alunosRede: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Responsável</label>
            <input
              className="w-full rounded border border-gray-300 p-2"
              value={crm.responsavelNome || ''}
              onChange={(e) => setCrm({ ...crm, responsavelNome: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Telefone</label>
            <input
              className="w-full rounded border border-gray-300 p-2"
              value={crm.responsavelTelefone || ''}
              onChange={(e) => setCrm({ ...crm, responsavelTelefone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">E-mail</label>
            <input
              className="w-full rounded border border-gray-300 p-2"
              value={crm.responsavelEmail || ''}
              onChange={(e) => setCrm({ ...crm, responsavelEmail: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Observações</label>
          <textarea
            className="w-full rounded border border-gray-300 p-2"
            rows={3}
            value={crm.observacoes || ''}
            onChange={(e) => setCrm({ ...crm, observacoes: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={salvar}
          >
            Salvar alterações
          </button>
          {salvo && <span className="text-sm text-green-600">Salvo.</span>}
        </div>
      </section>

      <InteracoesSection interacoes={interacoes} onRegistrar={registrarInteracao} />
    </div>
  );
}

interface InteracoesSectionProps {
  interacoes: Interacao[];
  onRegistrar: (nova: Omit<Interacao, 'id' | 'codigoIbge'>) => void;
}

function InteracoesSection({ interacoes, onRegistrar }: InteracoesSectionProps) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<TipoInteracao>('ligacao');
  const [resumo, setResumo] = useState('');
  const [proximoPasso, setProximoPasso] = useState('');

  function enviar() {
    if (!resumo.trim()) return;
    onRegistrar({ data, tipo, resumo: resumo.trim(), proximoPasso: proximoPasso.trim() || undefined });
    setResumo('');
    setProximoPasso('');
  }

  return (
    <section className="rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-medium text-gray-700">Interações</h3>

      <div className="space-y-2">
        {interacoes.length === 0 && <p className="text-sm text-gray-500">Nenhuma interação registrada ainda.</p>}
        {[...interacoes]
          .sort((a, b) => b.data.localeCompare(a.data))
          .map((i) => (
            <div key={i.id} className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
              <div className="font-medium">
                {i.data} · {TIPOS_INTERACAO.find((t) => t.value === i.tipo)?.label}
              </div>
              <div>{i.resumo}</div>
              {i.proximoPasso && <div className="text-gray-500">Próximo passo: {i.proximoPasso}</div>}
            </div>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Data</label>
          <input
            type="date"
            className="w-full rounded border border-gray-300 p-2"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo</label>
          <select
            className="w-full rounded border border-gray-300 p-2"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoInteracao)}
          >
            {TIPOS_INTERACAO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Resumo</label>
        <textarea
          className="w-full rounded border border-gray-300 p-2"
          rows={2}
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Próximo passo (opcional)</label>
        <input
          className="w-full rounded border border-gray-300 p-2"
          value={proximoPasso}
          onChange={(e) => setProximoPasso(e.target.value)}
        />
      </div>

      <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={enviar}>
        Registrar interação
      </button>
    </section>
  );
}
