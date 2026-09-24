import type { IncomingMessage, ServerResponse } from 'http';
import { enviarComprovanteGoogleFotos } from '../../lib/googleFotos.js';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end(JSON.stringify({ sucesso: false, erro: 'Use POST.' }));
    return;
  }
  let body = req.body;
  try {
    if (body === undefined) {
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of req) {
        total += chunk.length;
        if (total > 850_000) throw new Error('too large');
        chunks.push(Buffer.from(chunk));
      }
      body = Buffer.concat(chunks).toString('utf-8');
    }
    if (Buffer.isBuffer(body)) body = body.toString('utf-8');
    if (typeof body === 'string') body = JSON.parse(body);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ sucesso: false, erro: 'Corpo da requisição inválido.' }));
    return;
  }
  const resultado = await enviarComprovanteGoogleFotos(body);
  res.statusCode = resultado.status;
  res.end(JSON.stringify(resultado.body));
}
