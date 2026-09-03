import type { IncomingMessage, ServerResponse } from 'http';
import { processarRequisicaoIA } from '../../lib/iaProxy';

/**
 * Função serverless do Vercel — equivalente ao endpoint Express de
 * server.ts (usado no dev local).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const bodyRaw = Buffer.concat(chunks).toString('utf-8');

  let body: any = {};
  try {
    body = bodyRaw ? JSON.parse(bodyRaw) : {};
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ sucesso: false, erro: 'Corpo da requisição não é um JSON válido.' }));
    return;
  }

  const { modo, ...payload } = body;
  const { status, body: responseBody } = await processarRequisicaoIA(modo, payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(responseBody));
}
