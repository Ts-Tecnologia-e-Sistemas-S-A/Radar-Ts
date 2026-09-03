# Radar Comercial de Municípios (versão simples)

App de 2 telas: **Rota** (lista de municípios priorizada por potencial, cruzando
o IBGE com licitações reais do PNCP) e **CRM** (funil de vendas + registro de
interações). Sem fila de sincronização, sem autenticação, sem backup/restore.
Detalhes e decisões de escopo em [`PROMPT.md`](./PROMPT.md) (o prompt
original) — a única mudança em relação ao que está lá é a persistência
(ver abaixo).

## Rodar localmente

```bash
bun install
bun run dev     # http://localhost:3000
```

## Validar

```bash
bun run lint    # tsc --noEmit
bun run test    # bun test src/scoring.test.ts src/storage.test.ts
bun run build   # gera dist/
```

## Persistência: Firestore compartilhado, não localStorage

O `PROMPT.md` original pedia `localStorage` (zero infraestrutura). Isso
mudou a pedido do usuário: dados só no navegador significam que cada
vendedor via uma cópia isolada, sem compartilhar nada com o time. `src/storage.ts`
agora grava em duas coleções do **mesmo projeto Firebase já usado pelo app
principal** (`radar-ts`), só que em coleções próprias
(`radar_simples_municipios`, `radar_simples_interacoes`) pra não misturar
dados com o app anterior. Config em `firebase-applet-config.json` (é
configuração pública de cliente, não segredo — a mesma já usada em
`src/lib/firebase.ts` do app principal).

Deliberadamente **sem** o que o app anterior tinha em cima do Firebase: sem
fila de auto-save/retry, sem listeners em tempo real, sem modal de
backup/restore. Só leitura e escrita direta — `getDoc`/`getDocs`/`setDoc`.

## O que é real e o que é mock

- **IBGE** (lista de municípios) e **PNCP** (licitações) são fontes reais —
  chamadas diretas a `servicodados.ibge.gov.br` e, via proxy do backend
  (`/api/pncp/licitacoes`), a `pncp.gov.br`. Nenhum dado é inventado; se a
  fonte falhar, a tela mostra o erro em vez de um resultado fabricado.
- O casamento entre uma licitação do PNCP e um município (`src/components/RotaView.tsx`,
  `encontrarOportunidade`) é uma aproximação por nome (substring, sem acento)
  — suficiente para sinalizar "tem edital", não uma correspondência garantida.
- Tudo em `MunicipioCrm` (sistema atual, contrato, contatos, estágio do
  funil) é preenchido manualmente pelo vendedor e salvo no Firestore — de
  novo, nada de IA "adivinhando" esses dados.
