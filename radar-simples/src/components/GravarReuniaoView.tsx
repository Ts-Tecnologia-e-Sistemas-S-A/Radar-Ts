import { useRef, useState } from 'react';
import { ContatoDetectado, transcreverAudio } from '../api/ia';
import { addEvento, getMunicipioCrm, saveMunicipioCrm } from '../storage';
import { Contato, MunicipioIbge, municipioCrmVazio } from '../types';
import Icon from './Icon';

type Estado = 'pronto' | 'gravando' | 'processando' | 'resultado' | 'erro';

interface GravarReuniaoViewProps {
  municipio: MunicipioIbge;
  onFechar: () => void;
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result as string;
      resolve(resultado.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function GravarReuniaoView({ municipio, onFechar }: GravarReuniaoViewProps) {
  const [estado, setEstado] = useState<Estado>('pronto');
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ transcricao: string; combinado: string; proximoPasso: string } | null>(null);
  const [contatoSugerido, setContatoSugerido] = useState<ContatoDetectado | null>(null);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [contatoSalvo, setContatoSalvo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function iniciarGravacao() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        processarGravacao(new Blob(chunksRef.current, { type: mimeType }), mimeType);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setSegundos(0);
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
      setEstado('gravando');
    } catch (e: any) {
      setErro('Não foi possível acessar o microfone: ' + (e.message || 'permissão negada'));
      setEstado('erro');
    }
  }

  function pararGravacao() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setEstado('processando');
  }

  async function processarGravacao(blob: Blob, mimeType: string) {
    try {
      const base64 = await blobParaBase64(blob);
      const dados = await transcreverAudio(base64, mimeType);
      setResultado(dados);
      if (dados.contatoDetectado?.nome || dados.contatoDetectado?.telefone) {
        setContatoSugerido(dados.contatoDetectado);
      }
      await addEvento({
        id: crypto.randomUUID(),
        codigoIbge: municipio.codigoIbge,
        tipo: 'reuniao',
        data: new Date().toISOString().slice(0, 10),
        resumo: dados.transcricao.slice(0, 120),
        sinteseIA: dados.combinado,
        proximoPassoIA: dados.proximoPasso,
        anexos: [{ tipo: 'audio', nome: `Gravação ${new Date().toLocaleString('pt-BR')}` }],
        mandato: 'Atual',
        mandatoAtivo: true,
      });
      setEstado('resultado');
    } catch (e: any) {
      setErro(e.message || 'Falha ao transcrever com IA');
      setEstado('erro');
    }
  }

  // GravarReuniaoView não recebe o CRM do município (App.tsx não carrega
  // isso globalmente — cada tela lê o que precisa direto do Firestore), por
  // isso lê e grava aqui mesmo, só quando o vendedor confirma o contato.
  async function confirmarContato() {
    if (!contatoSugerido) return;
    setSalvandoContato(true);
    try {
      const crmAtual = (await getMunicipioCrm(municipio.codigoIbge)) || municipioCrmVazio(municipio.codigoIbge);
      const novo: Contato = {
        id: crypto.randomUUID(),
        nome: contatoSugerido.nome || 'Novo contato',
        cargo: contatoSugerido.cargo || '',
        telefone: contatoSugerido.telefone || undefined,
      };
      await saveMunicipioCrm({ ...crmAtual, contatos: [...crmAtual.contatos, novo] });
      setContatoSugerido(null);
      setContatoSalvo(true);
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar o contato');
    } finally {
      setSalvandoContato(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      <div className="h-16 px-screen-margin-mobile flex items-center justify-between border-b border-surface-container">
        <div>
          <div className="text-label-sm text-on-surface-variant">Gravar Reunião</div>
          <h2 className="text-headline-sm text-primary">
            {municipio.nome} / {municipio.uf}
          </h2>
        </div>
        <button onClick={onFechar} className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-screen-margin-mobile flex flex-col gap-space-md items-center justify-center">
        {estado === 'pronto' && (
          <>
            <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center">
              <Icon name="mic" size={48} className="text-secondary-fixed" />
            </div>
            <p className="text-body-md text-on-surface-variant text-center">Toque para gravar a reunião. A IA transcreve e sintetiza automaticamente.</p>
            <button onClick={iniciarGravacao} className="h-12 px-6 rounded-xl bg-primary text-on-primary text-label-lg flex items-center gap-2">
              <Icon name="fiber_manual_record" size={18} className="text-error" />
              Iniciar Gravação
            </button>
          </>
        )}

        {estado === 'gravando' && (
          <>
            <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center animate-pulse">
              <Icon name="radio_button_checked" size={48} className="text-error" />
            </div>
            <p className="text-headline-md text-primary">
              {Math.floor(segundos / 60)}:{(segundos % 60).toString().padStart(2, '0')}
            </p>
            <button onClick={pararGravacao} className="h-12 px-6 rounded-xl bg-error text-on-error text-label-lg flex items-center gap-2">
              <Icon name="stop" size={18} />
              Parar e Processar
            </button>
          </>
        )}

        {estado === 'processando' && (
          <>
            <Icon name="sync" size={48} className="text-primary animate-spin" />
            <p className="text-body-md text-on-surface-variant">Transcrevendo e sintetizando com IA...</p>
          </>
        )}

        {estado === 'erro' && (
          <>
            <Icon name="error" size={48} className="text-error" />
            <p className="text-body-md text-error text-center">{erro}</p>
            <button onClick={() => setEstado('pronto')} className="h-11 px-5 rounded-xl bg-surface-container text-primary text-label-md">
              Tentar de novo
            </button>
          </>
        )}

        {estado === 'resultado' && resultado && (
          <div className="w-full flex flex-col gap-space-sm">
            <div className="flex items-center gap-1.5 text-secondary justify-center">
              <Icon name="verified" size={20} />
              <span className="text-label-md font-semibold">Reunião registrada na Memória da Conta</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
              <span className="text-label-sm uppercase font-bold text-primary">Transcrição</span>
              <p className="text-body-sm text-on-surface-variant">{resultado.transcricao}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
              <span className="text-label-sm uppercase font-bold text-primary">O que ficou combinado</span>
              <p className="text-body-md text-on-surface">{resultado.combinado}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low space-y-1">
              <span className="text-label-sm uppercase font-bold text-primary">Próximo passo</span>
              <p className="text-body-md text-on-surface">{resultado.proximoPasso}</p>
            </div>
            {contatoSugerido && (
              <div className="rounded-lg bg-primary-container/40 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Icon name="person_add" size={16} />
                  <span className="text-label-sm uppercase tracking-wider font-semibold">Contato detectado na gravação</span>
                </div>
                <p className="text-body-md text-on-surface">
                  {contatoSugerido.nome || 'Sem nome identificado'}
                  {contatoSugerido.cargo ? ` — ${contatoSugerido.cargo}` : ''}
                  {contatoSugerido.telefone ? ` — ${contatoSugerido.telefone}` : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setContatoSugerido(null)} className="flex-1 h-10 rounded-lg bg-surface-container-lowest text-on-surface-variant text-label-sm font-semibold">
                    Ignorar
                  </button>
                  <button
                    disabled={salvandoContato}
                    onClick={confirmarContato}
                    className="flex-1 h-10 rounded-lg bg-primary text-on-primary text-label-sm font-semibold disabled:opacity-60"
                  >
                    {salvandoContato ? 'Salvando…' : 'Salvar em Contatos-Chave'}
                  </button>
                </div>
              </div>
            )}
            {contatoSalvo && (
              <p className="text-label-sm text-secondary text-center flex items-center justify-center gap-1">
                <Icon name="check_circle" size={16} />
                Contato salvo em Contatos-Chave da Praça.
              </p>
            )}
            <button onClick={onFechar} className="h-12 rounded-xl bg-primary text-on-primary text-label-lg mt-2">
              Voltar à Memória
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
