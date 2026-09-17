# GovTrack Brasil (radar-simples)

CRM de campo B2G mobile-first: 4 telas (**Radar**, **Pipeline**, **Ficha
Municipal**, **Memória da Conta**) pra um vendedor gerenciar a prospecção de
prefeituras — do primeiro contato até a homologação — com IA de campo real
(síntese de anotações, transcrição de áudio, leitura de recibos, briefing e
recomendações semanais), rota por GPS e exportação de PDF.

O layout segue o design system em [`DESIGN.md`](./DESIGN.md) (tokens Material
3, gerado com Google Stitch). O escopo original — 2 telas, sem IA — está em
[`PROMPT.md`](./PROMPT.md) como registro histórico; foi substituído por este
redesenho a pedido do usuário.

## Rodar localmente

```bash
bun install
GEMINI_API_KEY=... bun run dev     # http://localhost:3000
```

Sem `GEMINI_API_KEY`, o app funciona normalmente (Radar, Pipeline, Ficha,
Memória, Firestore) mas qualquer ação de IA (registro rápido, transcrição de
áudio, leitura de recibo, briefing, recomendações semanais) retorna erro
explícito em vez de resultado inventado — ver `lib/iaCampo.ts`.

## Validar

```bash
bun run lint    # tsc --noEmit
bun run test    # storage, urgência, rota, forecast
bun run build   # vite build (client) + esbuild (server.ts -> dist/server.cjs)
```

## Persistência: Firestore compartilhado

`src/storage.ts` grava no mesmo projeto Firebase do app principal
(`radar-ts`), em coleções próprias pra não colidir com dados de nenhum dos
outros dois apps do repositório: `radar_simples_municipios`,
`radar_simples_despesas`, `radar_simples_eventos`, `radar_simples_rota_pontos`
e `radar_simples_resultados`.
Config pública de cliente em `firebase-applet-config.json` (mesma usada em
`src/lib/firebase.ts` do app principal — não é segredo).

`radar_simples_resultados/{codigoIbge}` guarda o briefing e o diagnóstico;
`radar_simples_resultados/semana-{inicio}-{fim}` guarda as recomendações do
período. Esses resultados são recuperados ao reabrir as telas e não são
sobrescritos por edições do CRM. As regras do banco precisam permitir o
mesmo acesso a essa coleção (as regras versionadas já a abrangem).
Síntese, próximo passo e transcrição completa ficam nos eventos da conta.
Resultados que nunca chegaram ao banco antes desta correção precisam ser
gerados novamente; transcrições antigas só têm o trecho que foi salvo.

## O que é real e o que é mock

A aba **Agenda** permite criar, editar/reagendar, concluir, cancelar e reabrir
tarefas por município. Os registros ficam em `radar_simples_tarefas`.
Os filtros Hoje/Atrasadas usam a data e o horário locais do dispositivo;
tarefas sem horário vencem após o fim do dia. **Sugerir próxima ação com IA**
usa o contexto informado e os cinco últimos eventos da conta. A sugestão
preenche o formulário e só é gravada ao clicar em **Salvar tarefa**; data
é obrigatória, horário é opcional. Essa agenda registra tarefas dentro do
app, sem enviar mensagens nem criar notificações ou eventos externos.

No Registro Rápido de Campo, selecione **Dados de planilha — gerar relatório**
e cole cabeçalhos e linhas (até 60.000 caracteres). Colagens com tabulações
selecionam esse modo automaticamente. A IA gera resumo, achados, limitações
e próximos passos. O texto original e o relatório ficam em um evento do tipo
documento na Memória da Conta; não são contabilizados como reunião. Se houver
falha na IA ou na gravação, o texto permanece no campo para nova tentativa.

- **IBGE** (lista de municípios) é fonte real — `servicodados.ibge.gov.br`
  direto do navegador. Nenhum dado de município é inventado.
- **IA de campo** (`lib/iaCampo.ts`, modelo `gemini-3.6-flash` via
  `@google/genai`) é real: síntese de nota de campo, transcrição de áudio de
  reunião, extração de dados de recibo por imagem (OCR), briefing de conta e
  recomendações semanais. Cada prompt instrui explicitamente a IA a nunca
  inventar valor não presente na entrada; sem `GEMINI_API_KEY`, a chamada
  falha com erro claro em vez de devolver um resultado fabricado.
- **Rota por GPS** (`src/utils/rota.ts`) usa `navigator.geolocation` e a
  fórmula de Haversine sobre os pontos efetivamente capturados enquanto a
  aba ficou aberta — não é rastreamento contínuo em segundo plano (não é
  confiável num web app), então "km rodados" reflete só a sessão do
  navegador, não o trajeto completo do dia se o app foi fechado no meio.
- **PDF** (`src/utils/pdf.ts`, via `jsPDF`) é gerado a partir dos dados reais
  já carregados na tela (briefing de conta, balanço semanal) — texto, não
  captura de tela — e compartilhado via Web Share API quando disponível,
  com fallback pra download direto.
- **Rede Escolar / Matrículas Totais** (`lib/censoEscolarProxy.ts`) vêm do
  Censo Escolar do INEP, consultado via Base dos Dados (BigQuery) — tabela
  pública `basedosdados.br_inep_censo_escolar.escola`, filtrada por rede
  municipal e sempre o ano mais recente publicado pra aquele município. Só
  agrega contagens (nº de escolas, soma de matrículas); nunca lê dado de
  aluno individual. Busca automática ao vincular um município novo
  (silenciosa — se falhar ou não houver dado publicado, os campos ficam
  editáveis manualmente, sem bloquear nada) e um botão "Atualizar do Censo"
  na Ficha Municipal pra rebuscar depois. Exige `GOOGLE_CLOUD_CREDENTIALS_JSON`
  (service account com papel BigQuery Job User); sem ela, esses dois campos
  ficam só de preenchimento manual — mesmo comportamento de antes.
- Tudo em `MunicipioCrm` (contatos, estágio do funil, soluções ofertadas,
  valor anual estimado) é preenchido manualmente pelo vendedor e salvo no
  Firestore, exceto Rede Escolar/Matrículas quando vêm do Censo Escolar
  (acima) — mesmo assim, sempre editável por cima se o vendedor tiver
  informação mais atual.
