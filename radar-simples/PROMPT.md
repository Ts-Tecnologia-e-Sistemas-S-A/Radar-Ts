# Prompt para reconstrução: Radar Comercial de Municípios (versão simples)

> Este é o prompt original que guiou a implementação em `radar-simples/`.
> Duas diferenças conscientes do que está escrito abaixo:
> 1. A Tela 2 (CRM) só é aberta a partir da Tela 1 (Rota) — não existe uma
>    lista solta "Meus municípios" fora dela, pra não precisar duplicar
>    nome/UF do IBGE em outro lugar só pra exibição.
> 2. **Persistência não é mais localStorage.** O prompt original pedia "zero
>    infraestrutura de nuvem"; isso foi revisto a pedido do usuário porque
>    localStorage não compartilha dados entre vendedores/dispositivos — cada
>    navegador via sua própria cópia isolada. Agora é Firestore (mesmo
>    projeto do app principal, coleções próprias). Detalhes em README.md.
> O resto foi implementado como descrito.

Crie um aplicativo web chamado **"Radar Comercial de Municípios"**. É uma
ferramenta interna para o time comercial de uma empresa que vende um sistema
de gestão educacional para prefeituras do Nordeste (Piauí, Maranhão, Ceará).

Objetivo em uma frase: cruzar a lista oficial de municípios com licitações
públicas reais de tecnologia educacional para apontar onde vale a pena vender,
e registrar o acompanhamento de cada município num funil de vendas simples.

Isto é um MVP. **Priorize simplicidade radical sobre completude.** Só 2 telas,
dados reais (nunca inventados) e zero infraestrutura de nuvem. As regras de
"o que não fazer" no final não são sugestões — existem porque uma versão
anterior deste app cresceu para 11 telas, integrações fake disfarçadas de
reais, e um fallback de IA que inventava dados de município quando falhava.
Não repita isso.

---

## Stack (não fuja disso)

- **Frontend:** React + TypeScript + Vite + Tailwind CSS. Um único `App.tsx`
  com 2 abas ("Rota" e "CRM") trocadas via `useState`. Sem react-router, sem
  Redux/Zustand — `useState`/`useContext` bastam para 2 telas.
- **Backend:** Node + Express, com uma única função: fazer proxy da API do
  PNCP (evitar CORS). Nada mais no backend.
- **Persistência:** `localStorage` no navegador. Sem Firebase, sem fila de
  sincronização, sem backup/restore. Se um dia precisar de multiusuário/nuvem,
  é uma decisão consciente de v2 — comece sem isso.
- **Sem autenticação** nesta versão (ferramenta interna, uso local).

---

## Fontes de dados públicos (reais, testadas, sem proxy desnecessário)

### 1. IBGE — lista oficial de municípios (chamar direto do navegador, CORS liberado)

```
GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios
```

Retorna `[{ id: <código IBGE>, nome: "..." , ... }]`. Use `id` e `nome` — é a
fonte de verdade de "quais municípios existem", sem precisar digitar nada.

### 2. PNCP — licitações reais (precisa de proxy no seu backend por causa de CORS)

```
GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
    ?dataInicial=YYYYMMDD&dataFinal=YYYYMMDD&uf={UF}&pagina=1&tamanhoPagina=15
```

Essa é a API pública real do Portal Nacional de Contratações Públicas (Lei
14.133/2021) — já testada e funcionando em produção. Filtre o resultado no seu
código por palavras-chave relacionadas a educação (`"escola"`, `"educação"`,
`"software"`, `"gestão escolar"`, `"merenda"`, `"transporte escolar"`,
`"fundeb"`, `"semed"` etc.) no campo do objeto da contratação.

Crie no seu backend Express **um único endpoint**:
`GET /api/pncp/licitacoes?uf=PI&dataInicial=...&dataFinal=...` que chama a URL
acima e devolve o JSON adiante. Sem fallback com dado inventado — se a chamada
falhar, devolva lista vazia e um campo `erro`, e mostre isso na tela como
"não foi possível consultar o PNCP agora", nunca como se fosse resultado real.

Não implemente Comprasnet nem Portal da Transparência nesta versão — não são
necessários para o MVP e é fácil fazer "proxy fake" por pressa (foi
exatamente o que teve que ser cortado da versão anterior). Se algum dia forem
adicionados, só com chamada real à API pública correspondente.

---

## Modelo de dados

```ts
interface Municipio {
  codigoIbge: number;   // vem do IBGE — identidade oficial, nunca editável
  nome: string;          // vem do IBGE
  uf: string;            // vem do IBGE

  // Preenchido manualmente pelo vendedor — é para isso que o CRM existe.
  // Nada aqui vem de IA nem é adivinhado.
  sistemaAtual: 'nenhum' | 'concorrente' | 'nosso_sistema';
  nomeSistemaAtual?: string;      // preenchido se sistemaAtual === 'concorrente'
  contratoVencimento?: string;    // YYYY-MM-DD, opcional
  alunosRede?: number;            // opcional
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  observacoes?: string;

  estagioFunil: 'prospeccao' | 'contato' | 'proposta' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido';
}

interface Oportunidade {  // uma licitação real vinda do PNCP
  id: string;
  municipioNome: string;
  uf: string;
  numeroContratacao: string;
  objeto: string;
  valorEstimado?: number;
  dataPublicacao: string;
  modalidade: string;
  linkPncp: string;
}

interface Interacao {
  id: string;
  codigoIbge: number;
  data: string;         // YYYY-MM-DD
  tipo: 'ligacao' | 'visita' | 'email' | 'reuniao';
  resumo: string;
  proximoPasso?: string;
}
```

---

## Tela 1 — Rota (lista priorizada, não é mapa/GPS)

> Nota de escopo: "rota" aqui é uma **lista ordenada por potencial**, não
> roteamento geográfico com mapa. Otimização de trajeto é complexidade de v2.

- Seletor de UF (PI, MA, CE, ou combinação) → carrega municípios reais via
  IBGE.
- Busca no PNCP (pelo endpoint do backend) licitações dos últimos 90 dias com
  as palavras-chave de educação, e cruza pelo nome do município/UF.
- Lista os municípios ordenada por potencial (regra abaixo), mostrando: nome,
  UF, badge "🔥 Edital aberto" quando há oportunidade PNCP correspondente,
  estágio atual do funil, sistema atual (se já preenchido no CRM).
- Filtros simples: por UF, "só com oportunidade ativa", por estágio do funil.
- Clicar num município abre o mesmo painel de detalhe usado na tela de CRM.

### Regra de potencial (função pura, dá pra testar isoladamente)

```
pontos = 0
se sistemaAtual === 'nosso_sistema'          → ocultar da lista (já é cliente)
se há oportunidade PNCP recente (≤ 90 dias)  → +50
se sistemaAtual === 'nenhum'                 → +25
se contratoVencimento ≤ 180 dias a partir de hoje → +15
se alunosRede preenchido e > 20000           → +10

classificação: ≥50 Alta · 20–49 Média · <20 Baixa
```

---

## Tela 2 — CRM

Ao selecionar um município (a partir da Rota):

- Dados do IBGE (nome, UF, código) — somente leitura.
- Formulário editável: sistema atual, nome do concorrente, vencimento do
  contrato, alunos, responsável (nome/telefone/email), observações.
- Seletor de estágio do funil — 6 estados simples (dropdown ou botões).
  **Sem Kanban arrastável na v1**, isso é UI desnecessária para o MVP.
- Histórico de interações + formulário para adicionar uma nova (data, tipo,
  resumo, próximo passo).
- Se houver oportunidade PNCP vinculada a este município, mostrar o link e o
  resumo do edital.

---

## O que NÃO fazer (motivos reais, não regras arbitrárias)

- **Não fabricar dados.** Se uma fonte pública não tiver a informação, deixe
  o campo vazio ou mostre "não encontrado" — nunca gere um número ou nome
  plausível pra preencher a lacuna. (Isso já aconteceu: duas integrações que
  só devolviam um registro fixo fingindo ser API real, e um fallback de erro
  que inventava população, contrato e nota de avaliação de um município e
  marcava a resposta como sucesso.)
- **Não use IA generativa para "pesquisar e preencher" o perfil inteiro do
  município num JSON grande.** População, contato do secretário, valor de
  contrato — isso é trabalho do vendedor, registrado manualmente no CRM. Um
  modelo de linguagem pedido para "auditar dados oficiais" de uma cidade
  pequena vai alucinar números com aparência plausível.
- **Não crie telas além das 2 descritas.** Sem backup/restore, sem
  formatador de cartão de visita, sem sincronização de calendário, sem radar
  de concorrentes separado, sem chat de estratégia com IA. Se fizer sentido
  depois, é outra iteração.
- **Sem autenticação, multiusuário ou sincronização em nuvem** nesta
  primeira versão.
- **Não crie uma segunda implementação de uma tela "por via das dúvidas".**
  Se for refatorar, apague a versão antiga — não deixe as duas convivendo.
- **Sem gerenciador de estado externo.** `useState`/`useContext` resolvem
  para 2 telas.

---

## Pronto quando

- Escolher um estado (PI, MA ou CE) mostra a lista real de municípios desse
  estado, batendo com o IBGE.
- A lista aponta quais desses municípios têm edital/licitação de tecnologia
  educacional publicada recentemente no PNCP, com link pro PNCP real.
- Dá para abrir um município, preencher os campos manuais, mudar o estágio
  do funil e registrar uma interação — e isso persiste ao recarregar a
  página (localStorage).
- Nenhum dado exibido como "oficial" foi inventado: tudo que não vem do
  IBGE/PNCP foi digitado por uma pessoa.
