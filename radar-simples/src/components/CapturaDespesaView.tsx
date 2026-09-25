import { useEffect, useRef, useState } from 'react';
import { salvarFotoGoogleFotos, type FotoGoogle } from '../api/googleFotos';
import { addDespesa } from '../storage';
import { CATEGORIAS_DESPESA, CategoriaDespesa, MunicipioIbge } from '../types';
import { dataValida } from '../utils/agenda';
import Icon from './Icon';

interface CapturaDespesaViewProps {
  municipioSugerido: MunicipioIbge | null;
  onFechar: () => void;
}

// Foto direta da câmera do celular costuma vir grande (vários MB) — em base64
// isso passa fácil do limite de ~4.5MB que o corpo de uma função serverless
// do Vercel aceita, e a requisição é rejeitada antes de chegar no nosso
// código (erro "Request Entity Too Large", que o navegador tenta ler como
// JSON e quebra). Reduz pra no máximo 1400px no lado maior e reexporta como
// JPEG comprimido para enviar ao Google Fotos sem exceder o limite da função.
const MAX_DIMENSAO_PX = 1400;
const QUALIDADE_JPEG = 0.68;
const MAX_BASE64_CHARS = 600_000;

function comprimirImagem(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, MAX_DIMENSAO_PX / Math.max(img.width, img.height));
      const largura = Math.max(1, Math.round(img.width * escala));
      const altura = Math.max(1, Math.round(img.height * escala));
      const canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem capturada.'));
        return;
      }
      ctx.drawImage(img, 0, 0, largura, altura);
      let qualidade = QUALIDADE_JPEG;
      let dataUrl = canvas.toDataURL('image/jpeg', qualidade);
      while ((dataUrl.split(',')[1]?.length || 0) > MAX_BASE64_CHARS && qualidade > 0.32) {
        qualidade -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', qualidade);
      }
      const base64 = dataUrl.split(',')[1] || '';
      if (base64.length > MAX_BASE64_CHARS) {
        reject(new Error('A imagem do comprovante ficou muito grande. Tire outra foto mais próxima do recibo.'));
        return;
      }
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar a imagem capturada.'));
    };
    img.src = url;
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
  const [comprovante, setComprovante] = useState<{ base64: string; mimeType: 'image/jpeg' } | null>(null);
  const [fotoGoogle, setFotoGoogle] = useState<FotoGoogle | null>(null);
  const idDespesa = useRef(crypto.randomUUID());

  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDespesa | null>(null);
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    let cancelado = false;
    navigator.geolocation?.getCurrentPosition(
      (pos) => { if (!cancelado) setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => {},
      { timeout: 5000 }
    );
    return () => { cancelado = true; };
  }, []);

  useEffect(() => () => { if (previaUrl) URL.revokeObjectURL(previaUrl); }, [previaUrl]);

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setComprovante(null);
    setFotoGoogle(null);
    setPreviaUrl(URL.createObjectURL(file));
    setProcessando(true);
    setErro(null);
    try {
      const { base64 } = await comprimirImagem(file);
      setComprovante({ base64, mimeType: 'image/jpeg' });
    } catch (e: any) {
      setErro(e.message || 'Falha ao preparar a foto. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  async function salvar() {
    const valorNumerico = Number(valor.replace(',', '.'));
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido.');
      return;
    }
    if (!dataValida(data)) { setErro('Informe uma data válida para a despesa.'); return; }
    if (!categoria) { setErro('Escolha a categoria da despesa.'); return; }
    if (!descricao.trim()) { setErro('Preencha a descrição da despesa.'); return; }
    if (previaUrl && !comprovante) { setErro('A foto ainda não está pronta. Tente novamente.'); return; }
    setSalvando(true);
    setErro(null);
    try {
      let foto = fotoGoogle;
      if (comprovante && !foto) {
        foto = await salvarFotoGoogleFotos(comprovante.base64);
        setFotoGoogle(foto);
      }
      await addDespesa({
        id: idDespesa.current,
        codigoIbge: municipioSugerido?.codigoIbge,
        valor: valorNumerico,
        data,
        categoria,
        descricao: descricao.trim(),
        origemOcr: false,
        latitude: localizacao?.latitude,
        longitude: localizacao?.longitude,
        criadaEm: new Date().toISOString(),
        fotoGoogle: foto || undefined,
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
            Preenchimento manual
          </div>
          <h2 className="text-headline-sm text-primary">Registrar despesa</h2>
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
            <span className="text-label-lg">Fotografar comprovante (opcional)</span>
          </button>
        ) : (
          <div className="w-full rounded-xl overflow-hidden shadow-xl relative">
            <img src={previaUrl} alt="Cupom capturado" className="w-full h-56 object-cover" />
            {processando && (
              <div className="absolute inset-0 bg-primary/60 flex items-center justify-center gap-2 text-on-primary">
                <Icon name="sync" size={28} className="animate-spin" />
                <span className="text-label-md">Preparando foto...</span>
              </div>
            )}
            <button
              disabled={salvando}
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary text-label-sm font-semibold shadow-sm flex items-center gap-1"
            >
              <Icon name="photo_camera" size={14} />
              Tirar outra
            </button>
          </div>
        )}

        {erro && <p className="text-body-sm text-error">{erro}</p>}
        <p className="text-body-sm text-on-surface-variant">Preencha os campos abaixo. A foto será salva no Google Fotos da conta conectada; o banco guardará o link.</p>

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
          disabled={salvando || processando || salvo}
          onClick={salvar}
          className="w-full h-12 bg-secondary text-on-secondary rounded-xl text-label-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
        >
          <Icon name={salvo ? 'verified' : 'check_circle'} size={20} />
          <span>{salvo ? 'Despesa salva!' : salvando ? 'Salvando despesa...' : `Salvar${valor ? ` (R$ ${valor})` : ''}`}</span>
        </button>
      </div>
    </div>
  );
}
