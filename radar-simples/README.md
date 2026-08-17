# Radar Comercial de Municípios (versão simples)

App de 2 telas: **Rota** (lista de municípios priorizada por potencial, cruzando
o IBGE com licitações reais do PNCP) e **CRM** (funil de vendas + registro de
interações). Sem Firebase, sem fila de sincronização, sem autenticação —
tudo em `localStorage`. Detalhes e decisões de escopo em
[`PROMPT.md`](./PROMPT.md) (o prompt original).

## Rodar localmente

```bash
bun install
bun run dev     # http://localhost:3000
```

## Validar

```bash
bun run lint    # tsc --noEmit
bun run test    # bun test src/scoring.test.ts
bun run build   # gera dist/
```

## O que é real e o que é mock

- **IBGE** (lista de municípios) e **PNCP** (licitações) são fontes reais —
  chamadas diretas a `servicodados.ibge.gov.br` e, via proxy do backend
  (`/api/pncp/licitacoes`), a `pncp.gov.br`. Nenhum dado é inventado; se a
  fonte falhar, a tela mostra o erro em vez de um resultado fabricado.
- O casamento entre uma licitação do PNCP e um município (`src/components/RotaView.tsx`,
  `encontrarOportunidade`) é uma aproximação por nome (substring, sem acento)
  — suficiente para sinalizar "tem edital", não uma correspondência garantida.
- Tudo em `MunicipioCrm` (sistema atual, contrato, contatos, estágio do
  funil) é preenchido manualmente pelo vendedor — de novo, nada de IA
  "adivinhando" esses dados.
