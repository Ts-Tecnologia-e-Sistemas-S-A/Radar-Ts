import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { buscarLicitacoesPncp } from './lib/pncpProxy';
import { processarRequisicaoIA } from './lib/iaProxy';

const app = express();
const PORT = 3000;

// limit maior: payloads de áudio/imagem em base64 (transcrição, OCR de despesa)
app.use(express.json({ limit: '10mb' }));

// Proxy da API pública do PNCP (Portal Nacional de Contratações Públicas,
// Lei 14.133/2021) para evitar CORS no navegador. Não inventa dado nenhum:
// se a chamada falhar, devolve erro explícito.
app.get('/api/pncp/licitacoes', async (req, res) => {
  const { status, body } = await buscarLicitacoesPncp(
    req.query.uf as string | undefined,
    req.query.dataInicial as string | undefined,
    req.query.dataFinal as string | undefined
  );
  res.status(status).json(body);
});

// Único endpoint de IA de campo (síntese de nota, transcrição de áudio, OCR
// de despesa, briefing, recomendações da semana) — ramificado por `modo`.
// Exige GEMINI_API_KEY; sem a chave, devolve erro explícito em vez de
// fabricar uma resposta.
app.post('/api/ia/processar', async (req, res) => {
  const { modo, ...payload } = req.body || {};
  const { status, body } = await processarRequisicaoIA(modo, payload);
  res.status(status).json(body);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radar Comercial de Municípios rodando em http://localhost:${PORT}`);
  });
}

startServer();
