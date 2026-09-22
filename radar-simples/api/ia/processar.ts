import type { IncomingMessage, ServerResponse } from 'http';
import { processarRequisicaoIA } from '../../lib/iaProxy.js';

// Arquivos grandes são enviados direto ao Firebase Storage; esta função só
// recebe a referência do arquivo e pode aguardar a preparação pela IA.
export const maxDuration = 300;

/**
 * Função serverless do Vercel — equivalente ao endpoint Express de
 * server.ts (usado no dev local).
 */
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end(JSON.stringify({ sucesso: false, erro: 'Use POST para processar com IA.' }));
    return;
  }
  let body: any = req.body;
  try {
    // Vercel pode entregar o corpo já interpretado e o stream consumido.
    if (body === undefined) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks).toString('utf-8');
    }
    if (Buffer.isBuffer(body)) body = body.toString('utf-8');
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid body');
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ sucesso: false, erro: 'Corpo da requisição não é um JSON válido.' }));
    return;
  }

  const { modo, ...payload } = body;
  const { status, body: responseBody } = await processarRequisicaoIA(modo, payload);
  res.statusCode = status;
  res.end(JSON.stringify(responseBody));
}
