import type { IncomingMessage, ServerResponse } from 'http';
import { buscarLicitacoesPncp } from '../../lib/pncpProxy.js';

/**
 * Função serverless do Vercel — equivalente ao endpoint Express de
 * server.ts (usado no dev local), só que no formato que o Vercel reconhece
 * automaticamente para qualquer arquivo dentro de api/.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '', 'http://localhost');
  const { status, body } = await buscarLicitacoesPncp(
    url.searchParams.get('uf') || undefined,
    url.searchParams.get('dataInicial') || undefined,
    url.searchParams.get('dataFinal') || undefined
  );
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
