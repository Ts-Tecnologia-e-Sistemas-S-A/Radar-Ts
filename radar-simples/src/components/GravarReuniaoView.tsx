import { useRef, useState } from 'react';
import { ContatoDetectado, TranscricaoReuniao, transcreverAudioArquivo } from '../api/ia';
import { enviarAudioReuniao, validarAudioReuniao, type AudioEnviado } from '../audioStorage';
import { addEvento, getMunicipioCrm, saveMunicipioCrm } from '../storage';
import { Contato, MunicipioIbge, municipioCrmVazio } from '../types';
import Icon from './Icon';

type Estado = 'pronto' | 'enviando' | 'processando' | 'resultado' | 'erro';

interface GravarReuniaoViewProps { municipio: MunicipioIbge; onFechar: () => void; }

function tamanhoLegivel(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`; }

export default function GravarReuniaoView({ municipio, onFechar }: GravarReuniaoViewProps) {
  const [estado, setEstado] = useState<Estado>('pronto');
  const [erro, setErro] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [audioEnviado, setAudioEnviado] = useState<AudioEnviado | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<TranscricaoReuniao | null>(null);
  const [contatoSugerido, setContatoSugerido] = useState<ContatoDetectado | null>(null);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [contatoSalvo, setContatoSalvo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idReuniao = useRef(crypto.randomUUID());

  function escolherArquivo(novo: File | null) {
    setErro(null); setResultado(null); setAudioEnviado(null);
    if (!novo) { setArquivo(null); return; }
    const validacao = validarAudioReuniao(novo);
    if (validacao) { setArquivo(null); setErro(validacao); return; }
    setArquivo(novo);
  }

  async function registrarResultado(audio: AudioEnviado, dados?: TranscricaoReuniao, erroProcessamento?: string) {
    await addEvento({
      id: idReuniao.current, codigoIbge: municipio.codigoIbge, tipo: 'reuniao', data: new Date().toISOString().slice(0, 10),
      resumo: dados ? dados.transcricao.slice(0, 120) : `Áudio anexado: ${audio.nome}.`, transcricao: dados?.transcricao,
      criadaEm: new Date().toISOString(), sinteseIA: dados?.combinado, proximoPassoIA: dados?.proximoPasso,
      anexos: [{ tipo: 'audio', nome: audio.nome, caminho: audio.caminho, url: audio.url, mimeType: audio.mimeType, tamanho: audio.tamanho }],
      mandato: 'Atual', mandatoAtivo: true, processamentoAudio: dados ? 'concluido' : erroProcessamento ? 'erro' : 'pendente', erroProcessamentoAudio: erroProcessamento, analiseReuniao: dados?.analise, acoesReuniao: dados?.acoes,
    });
  }

  async function processar(audio: AudioEnviado) {
    setEstado('processando'); setErro(null);
    try {
      const dados = await transcreverAudioArquivo(audio.url, audio.mimeType, audio.nome);
      await registrarResultado(audio, dados);
      setResultado(dados);
      if (dados.contatoDetectado?.nome || dados.contatoDetectado?.telefone) setContatoSugerido(dados.contatoDetectado);
      setEstado('resultado');
    } catch (e: any) {
      const mensagem = e.message || 'Falha ao transcrever o áudio';
      await registrarResultado(audio, undefined, mensagem).catch(() => undefined);
      setErro(`${mensagem} O áudio original continua anexado à reunião.`); setEstado('erro');
    }
  }

  async function enviarEProcessar() {
    if (!arquivo) return;
    setErro(null);
    try {
      setEstado('enviando');
      const enviado = await enviarAudioReuniao(arquivo, municipio.codigoIbge, idReuniao.current, setProgresso);
      setAudioEnviado(enviado); await registrarResultado(enviado); await processar(enviado);
    } catch (e: any) { setErro(e.message || 'Não foi possível enviar o áudio.'); setEstado('erro'); }
  }

  async function confirmarContato() {
    if (!contatoSugerido) return;
    setSalvandoContato(true);
    try {
      const crmAtual = (await getMunicipioCrm(municipio.codigoIbge)) || municipioCrmVazio(municipio.codigoIbge);
      const novo: Contato = { id: crypto.randomUUID(), nome: contatoSugerido.nome || 'Novo contato', cargo: contatoSugerido.cargo || '', telefone: contatoSugerido.telefone || undefined };
      await saveMunicipioCrm({ ...crmAtual, contatos: [...crmAtual.contatos, novo] }); setContatoSugerido(null); setContatoSalvo(true);
    } catch (e: any) { setErro(e.message || 'Falha ao salvar o contato'); } finally { setSalvandoContato(false); }
  }

  return <div className="fixed inset-0 z-50 bg-surface flex flex-col">
    <div className="h-16 px-screen-margin-mobile flex items-center justify-between border-b border-surface-container"><div><div className="text-label-sm text-on-surface-variant">Reunião gravada no celular</div><h2 className="text-headline-sm text-primary">{municipio.nome} / {municipio.uf}</h2></div><button onClick={onFechar} aria-label="Fechar" className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center"><Icon name="close" size={20} /></button></div>
    <div className="flex-1 overflow-y-auto p-screen-margin-mobile flex flex-col gap-space-md items-center justify-center">
      {estado === 'pronto' && <><div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center"><Icon name="attach_file" size={44} className="text-secondary-fixed" /></div><p className="text-body-md text-on-surface-variant text-center max-w-md">Grave toda a reunião no gravador do celular. Ao anexar, o arquivo original fica guardado e a análise só começa depois que a gravação terminar.</p><input ref={inputRef} className="sr-only" type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.aac,.webm" onChange={(e) => escolherArquivo(e.target.files?.[0] || null)} />{arquivo ? <div className="w-full max-w-md rounded-xl bg-surface-container-low p-4"><p className="font-semibold text-primary break-words">{arquivo.name}</p><p className="text-body-sm text-on-surface-variant">{tamanhoLegivel(arquivo.size)}</p><div className="mt-3 flex gap-2"><button className="flex-1 h-11 rounded-lg bg-surface-container text-primary text-label-md" onClick={() => inputRef.current?.click()}>Trocar arquivo</button><button className="flex-1 h-11 rounded-lg bg-primary text-on-primary text-label-md" onClick={enviarEProcessar}>Anexar e analisar</button></div></div> : <button onClick={() => inputRef.current?.click()} className="h-12 px-6 rounded-xl bg-primary text-on-primary text-label-lg flex items-center gap-2"><Icon name="upload_file" size={18} />Selecionar áudio</button>}</>}
      {estado === 'enviando' && <div className="w-full max-w-md text-center space-y-4"><Icon name="cloud_upload" size={48} className="text-primary animate-pulse" /><p className="text-body-md text-on-surface-variant">Enviando o arquivo completo e preservando a gravação…</p><div className="h-2 rounded-full bg-surface-container overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} /></div><p className="text-label-md text-primary">{progresso}%</p></div>}
      {estado === 'processando' && <><Icon name="sync" size={48} className="text-primary animate-spin" /><p className="text-body-md text-on-surface-variant text-center">Áudio guardado. Transcrevendo e identificando decisões, pendências e próximo passo…</p></>}
      {estado === 'erro' && <><Icon name="error" size={48} className="text-error" /><p className="text-body-md text-error text-center max-w-md">{erro}</p>{audioEnviado ? <button onClick={() => processar(audioEnviado)} className="h-11 px-5 rounded-xl bg-primary text-on-primary text-label-md">Tentar transcrever novamente</button> : <button onClick={() => setEstado('pronto')} className="h-11 px-5 rounded-xl bg-surface-container text-primary text-label-md">Escolher outro arquivo</button>}</>}
      {estado === 'resultado' && resultado && <div className="w-full max-w-2xl flex flex-col gap-space-sm"><div className="flex items-center gap-1.5 text-secondary justify-center"><Icon name="verified" size={20} /><span className="text-label-md font-semibold">Áudio, transcrição e análise registrados</span></div><div className="p-3 rounded-lg bg-surface-container-low space-y-1"><span className="text-label-sm uppercase font-bold text-primary">Transcrição</span><p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{resultado.transcricao}</p></div><div className="p-3 rounded-lg bg-surface-container-low space-y-1"><span className="text-label-sm uppercase font-bold text-primary">Análise fiel da reunião</span><p className="text-body-md text-on-surface">{resultado.analise}</p></div><div className="p-3 rounded-lg bg-surface-container-low space-y-1"><span className="text-label-sm uppercase font-bold text-primary">Decisões e combinados</span><p className="text-body-md text-on-surface">{resultado.combinado}</p></div><div className="p-3 rounded-lg bg-surface-container-low space-y-1"><span className="text-label-sm uppercase font-bold text-primary">Plano de ação</span>{resultado.acoes.length ? <ul className="list-disc pl-5 text-body-md text-on-surface">{resultado.acoes.map((acao, i) => <li key={`${acao.acao}-${i}`}>{acao.acao}{acao.responsavel ? ` — ${acao.responsavel}` : ''}{acao.prazo ? ` — ${acao.prazo}` : ''} <span className="text-on-surface-variant">({acao.origem === 'combinada' ? 'combinada' : 'sugestão'})</span></li>)}</ul> : <p className="text-body-md text-on-surface">{resultado.proximoPasso}</p>}</div>{contatoSugerido && <div className="rounded-lg bg-primary-container/40 p-3 space-y-2"><p className="text-label-sm uppercase tracking-wider font-semibold text-primary">Contato identificado — confirme antes de salvar</p><p className="text-body-md text-on-surface">{contatoSugerido.nome || 'Sem nome identificado'}{contatoSugerido.cargo ? ` — ${contatoSugerido.cargo}` : ''}{contatoSugerido.telefone ? ` — ${contatoSugerido.telefone}` : ''}</p><div className="flex gap-2"><button onClick={() => setContatoSugerido(null)} className="flex-1 h-10 rounded-lg bg-surface-container-lowest text-on-surface-variant text-label-sm">Ignorar</button><button disabled={salvandoContato} onClick={confirmarContato} className="flex-1 h-10 rounded-lg bg-primary text-on-primary text-label-sm disabled:opacity-60">{salvandoContato ? 'Salvando…' : 'Salvar contato'}</button></div></div>}{contatoSalvo && <p className="text-label-sm text-secondary text-center">Contato salvo em Contatos-Chave.</p>}<button onClick={onFechar} className="h-12 rounded-xl bg-primary text-on-primary text-label-lg mt-2">Voltar à Memória</button></div>}
    </div>
  </div>;
}
