import { useRef, useState } from 'react';
import { extrairDespesa } from '../api/ia';
import { addDespesa } from '../storage';
import { CATEGORIAS_DESPESA, CategoriaDespesa, MunicipioIbge } from '../types';
import Icon from './Icon';

interface CapturaDespesaViewProps {
  municipioSugerido: MunicipioIbge | null;
  onFechar: () => void;
}

function fileParaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CapturaDespesaView({ municipioSugerido, onFechar }: CapturaDespesaViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previaUrl, setPreviaUrl] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);

  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState<CategoriaDespesa>('combustivel');
  const [descricao, setDescricao] = useState('');

  navigator.geolocation?.getCurrentPosition(
    (pos) => setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => {},
    { timeout: 5000 }
  );

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviaUrl(URL.createObjectURL(file));
    setProcessando(true);
    setErro(null);
    try {
      const base64 = await fileParaBase64(file);
      const extraido = await extrairDespesa(base64, file.type);
      if (extraido.valor !== null) setValor(String(extraido.valor));
      if (extraido.data) setData(extraido.data);
      if (extraido.categoria) setCategoria(extraido.categoria);
      setDescricao(extraido.descricaoSugerida || (extraido.estabelecimento ? `Despesa em ${extraido.estabelecimento}` : ''));
    } catch (e: any) {
      setErro(e.message || 'Falha ao ler o cupom com IA — preencha os campos manualmente.');
    } finally {
      setProcessando(false);
    }
  }

  async function salvar() {
    const valorNumerico = Number(valor.replace(',', '.'));
    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Informe um valor válido.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await addDespesa({
        id: crypto.randomUUID(),
        codigoIbge: municipioSugerido?.codigoIbge,
        valor: valorNumerico,
        data,
        categoria,
        descricao,
        origemOcr: Boolean(previaUrl),
        latitude: localizacao?.latitude,
        longitude: localizacao?.longitude,
        criadaEm: new Date().toISOString(),
      });
      setSalvo(true);
      setTimeout(onFechar, 900);
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar no banco');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      <div className="h-16 px-screen-margin-mobile flex items-center justify-between border-b border-surface-container">
        <div>
          <div className="text-label-sm text-secondary font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Leitura automática por IA em campo
          </div>
          <h2 className="text-headline-sm text-primary">Digitalizar Cupom / Despesa</h2>
        </div>
        <button onClick={onFechar} className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-screen-margin-mobile flex flex-col gap-space-md">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoSelecionarArquivo} />

        {!previaUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-56 rounded-xl bg-primary flex flex-col items-center justify-center gap-2 text-on-primary shadow-xl"
          >
            <Icon name="document_scanner" size={40} className="text-secondary-fixed" />
            <span className="text-label-lg">Tirar Foto do Cupom</span>
          </button>
        ) : (
          <div className="w-full rounded-xl overflow-hidden shadow-xl relative">
            <img src={previaUrl} alt="Cupom capturado" className="w-full h-56 object-cover" />
            {processando && (
              <div className="absolute inset-0 bg-primary/60 flex items-center justify-center gap-2 text-on-primary">
                <Icon name="sync" size={28} className="animate-spin" />
                <span className="text-label-md">Analisando documento via IA...</span>
              </div>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary text-label-sm font-semibold shadow-sm flex items-center gap-1"
            >
              <Icon name="photo_camera" size={14} />
              Tirar outra
            </button>
          </div>
        )}

        {erro && <p className="text-body-sm text-error">{erro}</p>}

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-card-padding flex flex-col gap-space-md">
          <div className="grid grid-cols-2 gap-space-xs">
            <div className="flex flex-col bg-surface-container-low p-3 rounded-xl">
              <label className="text-label-sm text-on-surface-variant mb-1">Valor Total (R$)</label>
              <input
                className="w-full bg-transparent text-headline-md text-primary font-bold focus:outline-none"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col bg-surface-container-low p-3 rounded-xl">
              <label className="text-label-sm text-on-surface-variant mb-1">Data</label>
              <input
                type="date"
                className="w-full bg-transparent text-label-md text-on-surface font-semibold focus:outline-none"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-label-sm text-on-surface-variant">Categoria da Despesa</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS_DESPESA.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategoria(c.value)}
                  className={`px-3 py-1.5 rounded-full text-label-md flex items-center gap-1 ${
                    categoria === c.value ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <Icon name={c.icone} size={16} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {municipioSugerido && (
            <div className="flex flex-col gap-1.5 bg-surface-container-low p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">Município Vinculado</span>
                {localizacao && (
                  <span className="text-label-sm text-secondary font-semibold flex items-center gap-1">
                    <Icon name="pin_drop" size={14} />
                    Localização registrada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                  <Icon name="account_balance" size={16} />
                </div>
                <span className="text-label-lg text-on-surface">
                  {municipioSugerido.nome} / {municipioSugerido.uf}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-label-sm text-on-surface-variant">Descrição</label>
            <input
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-body-md text-on-surface focus:outline-none"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-screen-margin-mobile pb-safe">
        <button
          disabled={salvando || !previaUrl && !valor}
          onClick={salvar}
          className="w-full h-12 bg-secondary text-on-secondary rounded-xl text-label-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
        >
          <Icon name={salvo ? 'verified' : 'check_circle'} size={20} />
          <span>{salvo ? 'Despesa Salva!' : salvando ? 'Registrando...' : `Salvar${valor ? ` (R$ ${valor})` : ''}`}</span>
        </button>
      </div>
    </div>
  );
}
