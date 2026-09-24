import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface FotoGoogle { id: string; url: string }

export async function salvarFotoGoogleFotos(base64: string): Promise<FotoGoogle> {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente na sua conta Google para enviar o comprovante.');
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/photoslibrary.appendonly');
  const credencial = await reauthenticateWithPopup(usuario, provider);
  const accessToken = GoogleAuthProvider.credentialFromResult(credencial)?.accessToken;
  if (!accessToken) throw new Error('O Google não concedeu acesso ao Google Fotos.');
  const resposta = await fetch('/api/fotos/comprovante', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, base64 }),
  });
  const resultado = await resposta.json().catch(() => null);
  if (!resposta.ok || !resultado?.sucesso || !resultado.foto?.id || !resultado.foto?.url) {
    throw new Error(resultado?.erro || 'Não foi possível salvar a foto no Google Fotos.');
  }
  return resultado.foto as FotoGoogle;
}
