import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { buscarLicitacoesPncp } from './lib/pncpProxy';

const app = express();
const PORT = 3000;

app.use(express.json());

// Único endpoint do backend: proxy da API pública do PNCP (Portal Nacional de
// Contratações Públicas, Lei 14.133/2021) para evitar CORS no navegador.
// Não inventa dado nenhum: se a chamada falhar, devolve erro explícito.
app.get('/api/pncp/licitacoes', async (req, res) => {
  const { status, body } = await buscarLicitacoesPncp(
    req.query.uf as string | undefined,
    req.query.dataInicial as string | undefined,
    req.query.dataFinal as string | undefined
  );
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
