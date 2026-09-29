import { Agent, get } from 'node:https';
import { rootCertificates } from 'node:tls';
import type { IncomingHttpHeaders } from 'node:http';
import { INTERMEDIARIO_INEP } from './inepCertificado.js';

// Completa a cadeia omitida pelo INEP apenas neste cliente, sem mudar a
// confiança global nem desabilitar a validação do certificado ou do hostname.
const agenteInep = new Agent({ ca: [...rootCertificates, INTERMEDIARIO_INEP], rejectUnauthorized: true });

export async function lerArquivoInep(url: string, somenteMetadados = false): Promise<{ bytes: Buffer; headers: IncomingHttpHeaders }> {
  const endereco = new URL(url);
  if (endereco.protocol !== 'https:' || endereco.hostname !== 'download.inep.gov.br' || endereco.port || endereco.username || endereco.password) {
    throw new Error('Endereço fora do servidor oficial de arquivos do INEP.');
  }

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      return await baixarArquivoInep(endereco, somenteMetadados);
    } catch (error: any) {
      const transitorio = error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.name === 'TimeoutError';
      if (!transitorio || tentativa === 3) throw error;
    }
  }
  throw new Error('Não foi possível consultar o arquivo oficial do INEP.');
}

function baixarArquivoInep(endereco: URL, somenteMetadados: boolean): Promise<{ bytes: Buffer; headers: IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    // A origem pode recusar HEAD e Range. Encerra o GET ao receber os
    // cabeçalhos quando só precisamos dos metadados, sem baixar os microdados.
    const req = get(endereco, {
      agent: agenteInep, signal: AbortSignal.timeout(somenteMetadados ? 15000 : 45000),
      headers: {
        'User-Agent': 'Radar-TS/1.0 (+https://radar-ts-u9jq.vercel.app)',
        Accept: 'application/zip,*/*',
        'Cache-Control': 'no-cache',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        res.destroy(); reject(new Error(`INEP indisponível (HTTP ${res.statusCode}). Redirecionamentos não são aceitos.`)); return;
      }
      if (somenteMetadados) { resolve({ bytes: Buffer.alloc(0), headers: res.headers }); res.destroy(); return; }
      const limite = 40_000_000;
      if (Number(res.headers['content-length'] || 0) > limite) { res.destroy(); reject(new Error('Arquivo oficial excede o limite.')); return; }
      const partes: Buffer[] = [];
      let total = 0;
      res.on('data', (parte: Buffer) => {
        total += parte.length;
        if (total > limite) { res.destroy(); reject(new Error('Arquivo oficial excede o limite.')); return; }
        partes.push(parte);
      });
      res.on('end', () => resolve({ bytes: Buffer.concat(partes), headers: res.headers }));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}
