import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Único endpoint do backend: proxy da API pública do PNCP (Portal Nacional de
// Contratações Públicas, Lei 14.133/2021) para evitar CORS no navegador.
// Não inventa dado nenhum: se a chamada falhar, devolve erro explícito.
app.get('/api/pncp/licitacoes', async (req, res) => {
  const uf = ((req.query.uf as string) || '').toUpperCase();
  const dataInicial = req.query.dataInicial as string;
  const dataFinal = req.query.dataFinal as string;

  if (!uf || !dataInicial || !dataFinal) {
    return res.status(400).json({ erro: 'Parâmetros uf, dataInicial e dataFinal são obrigatórios.' });
  }

  const url =
    `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao` +
    `?dataInicial=${dataInicial}&dataFinal=${dataFinal}&uf=${uf}&pagina=1&tamanhoPagina=50`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ erro: `PNCP respondeu ${response.status}` });
    }

    const dados = await response.json();
    return res.json({ data: Array.isArray(dados.data) ? dados.data : [] });
  } catch (err: any) {
    return res.status(502).json({ erro: err.message || 'Falha ao consultar o PNCP' });
  }
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
