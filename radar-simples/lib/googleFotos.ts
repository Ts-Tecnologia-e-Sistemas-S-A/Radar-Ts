/** Upload em duas etapas exigido pela Google Photos Library API. */
export async function enviarComprovanteGoogleFotos(payload: unknown, request: typeof fetch = fetch) {
  const dados = payload as { accessToken?: unknown; base64?: unknown } | null;
  if (!dados || typeof dados.accessToken !== 'string' || !dados.accessToken || dados.accessToken.length > 4096 ||
      typeof dados.base64 !== 'string' || dados.base64.length > 600_000 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(dados.base64)) {
    return { status: 400, body: { sucesso: false, erro: 'Foto ou autorização inválida.' } };
  }
  const imagem = Buffer.from(dados.base64, 'base64');
  if (imagem.length < 4 || imagem[0] !== 0xff || imagem[1] !== 0xd8 || imagem[imagem.length - 2] !== 0xff || imagem[imagem.length - 1] !== 0xd9) {
    return { status: 400, body: { sucesso: false, erro: 'O comprovante deve ser uma imagem JPEG válida.' } };
  }
  try {
    const upload = await request('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dados.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-Content-Type': 'image/jpeg',
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: imagem,
    });
    if (!upload.ok) return falhaGoogle(upload.status);
    const uploadToken = await upload.text();
    if (!uploadToken || uploadToken.length > 2048) return falhaGoogle(502);

    const criado = await request('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${dados.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ newMediaItems: [{ simpleMediaItem: {
        fileName: `comprovante-${crypto.randomUUID()}.jpg`, uploadToken,
      } }] }),
    });
    if (!criado.ok && criado.status !== 207) return falhaGoogle(criado.status);
    const resultado = await criado.json() as { newMediaItemResults?: Array<{ status?: { code?: number }; mediaItem?: { id?: string; productUrl?: string } }> };
    const item = resultado.newMediaItemResults?.[0];
    const id = item?.mediaItem?.id;
    const url = item?.mediaItem?.productUrl;
    if (item?.status?.code || !id || !url || !url.startsWith('https://photos.google.com/')) return falhaGoogle(502);
    return { status: 200, body: { sucesso: true, foto: { id, url } } };
  } catch {
    return { status: 502, body: { sucesso: false, erro: 'Não foi possível enviar a foto ao Google Fotos. Tente novamente.' } };
  }
}

function falhaGoogle(status: number) {
  const erro = status === 401 || status === 403
    ? 'O Google Fotos não autorizou o envio. Confirme a permissão e a ativação da Google Photos Library API.'
    : 'Não foi possível enviar a foto ao Google Fotos. Tente novamente.';
  return { status: status === 401 || status === 403 ? 403 : 502, body: { sucesso: false, erro } };
}
