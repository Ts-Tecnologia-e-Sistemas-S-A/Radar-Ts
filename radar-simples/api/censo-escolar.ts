import type { IncomingMessage, ServerResponse } from 'http';
import { buscarDadosEscolares } from '../lib/censoEscolarProxy';

/**
 * Função serverless do Vercel — equivalente ao endpoint Express de
 * server.ts (usado no dev local).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '', 'http://localhost');
  const codigoIbge = url.searchParams.get('codigoIbge');
  const { status, body } = await buscarDadosEscolares(codigoIbge ? Number(codigoIbge) : undefined);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
