import { Agent, get } from 'node:https';
import { rootCertificates } from 'node:tls';
import type { IncomingHttpHeaders } from 'node:http';
import { INTERMEDIARIO_INEP } from './inepCertificado.js';

// Completa a cadeia omitida pelo INEP apenas neste cliente, sem mudar a
// confiança global nem desabilitar a validação do certificado ou do hostname.
const agenteInep = new Agent({ ca: [...rootCertificates, INTERMEDIARIO_INEP], rejectUnauthorized: true });

export function lerArquivoInep(url: string, somenteMetadados = false): Promise<{ bytes: Buffer; headers: IncomingHttpHeaders }> {
  const endereco = new URL(url);
  if (endereco.protocol !== 'https:' || endereco.hostname !== 'download.inep.gov.br' || endereco.port || endereco.username || endereco.password) {
    return Promise.reject(new Error('Endereço fora do servidor oficial de arquivos do INEP.'));
  }
  return new Promise((resolve, reject) => {
    // GET parcial funciona mesmo quando a origem rejeita HEAD. O corpo é
    // encerrado ao receber os metadados, inclusive se a origem ignorar Range.
    const req = get(endereco, {
      agent: agenteInep, signal: AbortSignal.timeout(somenteMetadados ? 15000 : 45000),
      headers: { 'Cache-Control': 'no-cache', ...(somenteMetadados ? { Range: 'bytes=0-0' } : {}) },
    }, (res) => {
      if (res.statusCode !== 200 && !(somenteMetadados && res.statusCode === 206)) {
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
