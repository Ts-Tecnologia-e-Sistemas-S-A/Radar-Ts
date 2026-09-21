import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, storage } from './lib/firebase';

const LIMITE_PROCESSAMENTO = 500 * 1024 * 1024;

export interface AudioEnviado {
  caminho: string;
  url: string;
  mimeType: string;
  tamanho: number;
  nome: string;
}

function nomeSeguro(nome: string) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'reuniao-audio';
}

export function validarAudioReuniao(arquivo: File): string | null {
  if (!arquivo.type.startsWith('audio/') && !/\.(aac|m4a|mp3|ogg|opus|wav|webm)$/i.test(arquivo.name)) {
    return 'Escolha um arquivo de áudio (M4A, MP3, WAV, OGG, AAC ou WebM).';
  }
  if (!arquivo.size) return 'O arquivo de áudio está vazio.';
  if (arquivo.size > LIMITE_PROCESSAMENTO) return 'Para transcrever agora, use um áudio de até 500 MB. O gravador do celular em qualidade padrão comporta várias horas nesse limite.';
  return null;
}

/** Envio retomável: o arquivo completo vai direto do dispositivo ao Storage. */
export function enviarAudioReuniao(
  arquivo: File,
  codigoIbge: number,
  idReuniao: string,
  aoProgredir: (percentual: number) => void,
): Promise<AudioEnviado> {
  const erro = validarAudioReuniao(arquivo);
  if (erro) return Promise.reject(new Error(erro));
  const user = auth.currentUser;
  if (!user) return Promise.reject(new Error('Entre novamente antes de anexar o áudio.'));
  const mimeType = arquivo.type || 'audio/mpeg';
  const caminho = `reunioes/${user.uid}/${codigoIbge}/${idReuniao}/${nomeSeguro(arquivo.name)}`;
  const tarefa = uploadBytesResumable(ref(storage, caminho), arquivo, {
    contentType: mimeType,
    customMetadata: { codigoIbge: String(codigoIbge), idReuniao },
  });
  return new Promise((resolve, reject) => {
    tarefa.on('state_changed', (snapshot) => {
      aoProgredir(snapshot.totalBytes ? Math.round(snapshot.bytesTransferred * 100 / snapshot.totalBytes) : 0);
    }, (e) => {
      const detalhe = e.code === 'storage/unknown'
        ? 'O armazenamento de áudio ainda não está ativado no projeto.'
        : e.message;
      reject(new Error(detalhe));
    }, async () => {
      try {
        resolve({ caminho, url: await getDownloadURL(tarefa.snapshot.ref), mimeType, tamanho: arquivo.size, nome: arquivo.name });
      } catch (e) { reject(e); }
    });
  });
}
