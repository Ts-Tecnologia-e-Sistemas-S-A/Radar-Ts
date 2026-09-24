import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enviarComprovanteGoogleFotos } from './googleFotos';

const base64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');

test('envia JPEG e salva apenas a referência devolvida pelo Google Fotos', async () => {
  const chamadas: Array<{ url: string; init: RequestInit }> = [];
  const request = (async (url: string, init: RequestInit) => {
    chamadas.push({ url, init });
    return chamadas.length === 1
      ? new Response('upload-token')
      : Response.json({ newMediaItemResults: [{ status: { code: 0 }, mediaItem: { id: 'foto-1', productUrl: 'https://photos.google.com/lr/photo/1' } }] });
  }) as unknown as typeof fetch;
  const resultado = await enviarComprovanteGoogleFotos({ accessToken: 'token', base64 }, request);
  assert.deepEqual(resultado, { status: 200, body: { sucesso: true, foto: { id: 'foto-1', url: 'https://photos.google.com/lr/photo/1' } } });
  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[0].url, 'https://photoslibrary.googleapis.com/v1/uploads');
  assert.equal(chamadas[1].url, 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate');
  assert.deepEqual(chamadas[0].init.body, Buffer.from(base64, 'base64'));
  assert.equal(JSON.parse(chamadas[1].init.body as string).newMediaItems[0].simpleMediaItem.uploadToken, 'upload-token');
});

test('não aceita foto inválida e não confirma item com erro parcial', async () => {
  const request = (async () => Response.json({ newMediaItemResults: [{ status: { code: 7 } }] }, { status: 207 })) as unknown as typeof fetch;
  assert.equal((await enviarComprovanteGoogleFotos({ accessToken: 'token', base64: 'abc' }, request)).status, 400);
  const resultado = await enviarComprovanteGoogleFotos({ accessToken: 'token', base64 }, request);
  assert.equal(resultado.status, 502);
  assert.equal(resultado.body.sucesso, false);
});
