# Auditoria Firestore — Radar TS — 17/09/2026

**Estado: vulnerabilidade de leitura e escrita anônimas confirmada pelas regras publicadas; correção preparada localmente e ainda não publicada.** Este documento não atesta que a produção está protegida. Nenhuma regra ou documento de produção foi alterado. O trabalho offline foi interrompido e seus servidores locais encerrados, preservando seus arquivos.

## Ambiente efetivamente publicado

| Ambiente | Evidência do bundle público | Projeto | Banco utilizado |
|---|---|---|---|
| `https://radar-ts-u9jq.vercel.app` — GovTrack Brasil | `/assets/index-BUuvVhWq.js`, configuração e ID de banco presentes | `sicap-radar` | `ai-studio-sicapradardeopor-149d8755-5f86-427a-a9a1-d0cb69519e35` |
| `https://radar-ts.vercel.app` — Radar legado | `/assets/index-BiTd0BiT.js`, configuração sem firestoreDatabaseId e fallback para getFirestore(app) | `sicap-radar` | `(default)` |

O banco `(default)` retornou HTTP 404 com mensagem explícita de que não existe nesse projeto. Isso é uma divergência de configuração do legado, não evidência de segurança. Não apontar o legado automaticamente para o banco nomeado: seu código inicializa coleções vazias com mocks e possui autosave de cache local, podendo gravar dados indevidos.

O GitHub identifica o deployment Production – radar-ts-u9jq de 17/09/2026 como bem-sucedido, commit `07141eb9dd954d20bdf7eb018c3d7281ac977398`, deployment `6507571444`. A URL imutável desse deployment exige login Vercel; os identificadores acima foram verificados diretamente nos bundles dos domínios públicos, não inferidos só do repositório.

## Regra publicada versus arquivo local

O arquivo **local** `firestore.rules` contém:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

O usuário abriu a aba Segurança do banco nomeado no console Firebase e forneceu captura do editor e do alerta de regras públicas. A regra **efetivamente publicada** exibida é igual ao texto acima. O próprio console informa que qualquer pessoa pode acessar, modificar ou excluir informações. A API administrativa de Rules permanece inacessível neste ambiente, portanto o identificador e horário da release ainda não foram coletados.

Com acesso administrativo, consultar a release `projects/sicap-radar/releases/cloud.firestore/ai-studio-sicapradardeopor-149d8755-5f86-427a-a9a1-d0cb69519e35`, registrar rulesetName/updateTime e obter o conteúdo desse ruleset. Conferir também IAM, App Check, provedores de Authentication e demais bancos. Uma API key pública não concede acesso administrativo a essa consulta.

## Testes sem autenticação, sem alterar dados

Foram utilizadas requisições REST sem Authorization, cookie de sessão ou ID token Firebase. As consultas usaram limite de um documento e projeção de um campo inexistente, para comprovar acesso sem retornar os campos de negócio. Nenhum ID de documento ou conteúdo pessoal foi publicado no relatório.

| Coleção referenciada no código | runQuery anônimo | Presença de documento confirmada |
|---|---|---|
| municipalities | HTTP 200 | Sim |
| crm_interactions | HTTP 200 | Sim |
| field_visits | HTTP 200, vazio | Não |
| radar_simples_municipios | HTTP 200 | Sim |
| radar_simples_despesas | HTTP 200 | Sim |
| radar_simples_eventos | HTTP 200 | Sim |
| radar_simples_rota_pontos | HTTP 200, vazio | Não |
| radar_simples_resultados | HTTP 200 | Sim |
| radar_simples_tarefas | HTTP 200, vazio | Não |
| radar_simples_conexao_teste | HTTP 200, vazio | Não |

**Conclusão: leitura anônima confirmada em seis coleções com documentos.** A consulta também foi aceita nas quatro coleções sem documentos retornados. Isso não prova que estas quatro coleções estejam materializadas, nem exclui subcoleções existentes sob documentos ausentes.

As primeiras tentativas com listDocuments retornaram PERMISSION_DENIED, inclusive com a chave pública do app. Uma tentativa inicial de máscara com nome reservado foi inválida e desconsiderada. A consulta runQuery equivalente ao fluxo do cliente retornou documentos. Portanto, **a negativa de listDocuments não deve ser usada para afirmar que leituras estão protegidas**. Consultas get em dois caminhos conhecidos pelo código retornaram NOT_FOUND; não são prova de bloqueio de leitura.

O inventário administrativo listCollectionIds retornou HTTP 403. A lista acima é o inventário do código, com existência confirmada quando houve retorno; **a enumeração completa de todas as coleções e subcoleções permanece pendente**.

| Operação | Resultado da auditoria |
|---|---|
| Leitura anônima | Permitida, comprovada por runQuery |
| Criação anônima | Permitida pela regra publicada; não executada para preservar produção |
| Atualização anônima | Permitida pela regra publicada; não executada para preservar produção |
| Exclusão anônima | Permitida pela regra publicada; não executada para preservar produção |

Não se extrapolou a permissão de leitura para concluir que escrita ou exclusão estão liberadas. Não foram criados documentos de teste em produção e nenhuma chamada de escrita ou exclusão foi enviada. Após exportar o ruleset publicado, reproduzir create/update/delete no simulador/emulador, incluindo documentos com os formatos atuais.

## Telas, operações e classificação

| Coleção | Leitores | Escritores | Classificação pelo modelo de dados |
|---|---|---|---|
| municipalities | App principal, dashboard, inteligência municipal, funil, CRM, visitas e exportação por props/estado compartilhado | Edição municipal, enriquecimento/IA, importação/restauração, autosave e seed automático no App/firebaseService | Mistura dados municipais públicos com contatos, telefone/email, notas, responsáveis e estratégia comercial; tratar documento inteiro como interno/pessoal |
| crm_interactions | App, CRM, memória/visitas, dashboard e exportação por estado compartilhado | CRM/visitas via callbacks, importação/restauração, autosave; exclusão de interação implementada | Operacional e pessoal: interações, participantes, histórico comercial |
| field_visits | Nenhum acesso encontrado; constante declarada sem uso | Nenhuma chamada encontrada | Nome sugere visitas, mas conteúdo e existência não confirmados |
| radar_simples_municipios | App, Radar, Pipeline, Ficha Municipal, Memória da Conta, Relatórios; reunião e Nova Praça consultam registro | Ficha, Nova Praça, Gravar Reunião ao incorporar contato | Dados públicos de município e censo misturados com contatos/telefone/WhatsApp, valores de proposta, funil, próxima ação e observações internas |
| radar_simples_despesas | Radar e Relatórios | Captura Despesa | Valores, datas, descrição e localização: financeiro/operacional e potencial dado pessoal |
| radar_simples_eventos | App/exportação, Memória, histórico da Ficha, Relatórios e Agenda para contexto da IA | Gravar Reunião; Ficha ao registrar nota ou relatório de planilha | Participantes, transcrição, notas, planilhas e próximos passos: interno e potencialmente pessoal/confidencial |
| radar_simples_rota_pontos | Radar e Relatórios | addPontoRota exposta no storage; nenhum chamador encontrado no frontend atual | Latitude, longitude e horário: localização precisa, dado pessoal/operacional |
| radar_simples_resultados | Memória, Ficha, Relatórios | Briefing da Memória, diagnóstico da Ficha, recomendações dos Relatórios | Sínteses IA de informações internas; herdam sensibilidade da origem |
| radar_simples_tarefas | Agenda e Radar | Agenda: criar/editar/concluir/reabrir | Planejamento comercial, contatos e compromissos internos |
| radar_simples_conexao_teste | Página pública de diagnóstico db-test.html | A mesma página faz setDoc automático em um ID fixo ao ser aberta | Diagnóstico operacional, origem e user-agent; remover da distribuição pública após revisão |

O arquivo de diagnóstico foi lido como código e **não aberto no navegador**, para evitar a escrita automática que contém. Os dados governamentais de IBGE/PNCP podem ser públicos em sua fonte; isso não torna públicos os documentos de CRM que os combinam com dados internos. A classificação foi feita pelos modelos e fluxos, sem extrair o conteúdo das coleções.

## Identidade e autenticação

Não há getAuth, signIn ou onAuthStateChanged no código cliente das duas aplicações. Os serviços inicializam Firebase App e Firestore diretamente; não há vínculo de documentos a UID/tenant nem filtro de autorização por usuário. Login no GitHub/Vercel/Google Console não autentica automaticamente o usuário no Firestore. Acesso protegido ao preview Vercel também não protege a API pública do banco.

O mecanismo atual observado para acesso de dados do aplicativo é anônimo, não uma sessão Firebase Authentication. Os provedores habilitados e contas existentes no projeto ainda precisam de consulta administrativa. Não criar acesso com signInAnonymously nem apenas request.auth != null: uma conta autenticada também pode não ser autorizada.

## Segredos

Foram examinados arquivos versionados e 298 blobs únicos do histórico alcançável pelas refs locais, além dos dois bundles públicos principais. A busca por padrões de chave privada, tokens GitHub, tokens de provedores e access keys AWS não encontrou correspondências sensíveis. A busca é uma verificação por padrões, não garantia absoluta nem auditoria de todos os artefatos remotos ou variáveis do Vercel.

Encontradas configurações públicas Firebase em dois JSONs e no diagnóstico HTML, incluindo variantes históricas. Os valores não são reproduzidos. Chaves Firebase de cliente são públicas por design quando restritas às APIs adequadas; não autorizam acesso aos dados por si. Ainda é necessário verificar suas restrições no Google Cloud e garantir que não habilitem APIs como Gemini. `GEMINI_API_KEY` e `GOOGLE_CLOUD_CREDENTIALS_JSON` são referenciadas por variáveis de ambiente no backend; nenhum valor privado correspondente foi encontrado nos arquivos versionados examinados. As configurações reais do provedor não foram acessadas.

Achado relacionado: os handlers internos de IA/BigQuery não mostram uma verificação geral de identidade Firebase do solicitante. Avaliar proteção dessas rotas na implantação do login; não presumir que proteger Firestore protege automaticamente os endpoints do servidor.

## Correção mínima proposta e impactos

1. Obter regras publicadas, inventário completo e lista de usuários autorizados. Preservar cópia do ruleset e evidências de configuração, sem exportar dados pessoais desnecessariamente.
2. Habilitar/usar um provedor Firebase Auth adequado às contas autorizadas. Incluir uma barreira de sessão nas duas entradas de frontend, antes de montar componentes, listeners, GPS, importações e autosave. Usuário sem autorização vê acesso negado e não monta o aplicativo.
3. Autorizar uma lista explícita de UIDs ou claims atribuídas exclusivamente por administrador (por exemplo radarAccess), incluindo revogação e separação de papéis se necessária. Não conceder acesso automaticamente a qualquer conta Google ou conta anônima.
4. Publicar regras por coleção para as operações necessárias ao fluxo atual, exigindo identidade e autorização; negar coleções desconhecidas e mudanças de privilégios pelo próprio cliente. Manter documentos e IDs atuais, evitando migração destrutiva. Nenhuma coleção de CRM deve receber leitura pública só por conter alguns campos públicos.
5. Desabilitar o seed automático de mocks e remover a página de escrita de diagnóstico da distribuição antes de apontar qualquer frontend ao banco nomeado. Não apagar a coleção de diagnóstico nem outros dados existentes.
6. Validar regras no emulador/simulador com usuário autorizado, autenticado não autorizado e sem autenticação. Verificar separadamente get/list/create/update/delete e chamadas pelo caminho usado pelo app. Dados de teste permanecem exclusivamente no emulador.
7. Preparar o frontend autenticado e verificar login de uma conta autorizada antes de coordenar a publicação das regras. Confirmar compatibilidade com a release que estará servindo usuários. Não publicar um bloqueio total nem trocar o banco do legado sem esse controle.
8. Após publicação controlada, verificar leitura autorizada real sem expor dados; validar gravação por um fluxo legítimo e autorizado, sem inserir fixtures ou substituir registros reais. Repetir a consulta anônima atualmente vulnerável e confirmar negação. Validar funcionamento de Ficha, Memória, Agenda, Radar, despesas e relatórios.

Impactos: usuários precisarão entrar e estar autorizados; abas antigas sem sessão passarão a receber erro de permissão; filas e caches antigos não podem ser enviados automaticamente sob uma identidade nova. É necessário isolar/limpar cache por conta com preservação prévia de trabalho pendente. O legado possui ainda a configuração de banco inexistente, cuja correção pode disparar gravações antigas se feita sem proteção.

## Estado dos testes obrigatórios e correções realizadas

| Requisito | Estado |
|---|---|
| Autorizado lê | Pendente: identidade autorizada não fornecida |
| Autorizado grava | Pendente: sem sessão autorizada; nenhum dado de produção alterado |
| Não autorizado não lê | **Falhou: acesso anônimo comprovado** |
| Não autorizado não grava | Pendente: ruleset ativo/simulador administrativo indisponível |
| Aplicação funciona após correção | Pendente: nenhuma correção implantada |

**Correções de produção realizadas: nenhuma.** Na branch `security/firestore-audit` foram preparados login Google, bloqueio de montagem do aplicativo antes da autorização, administração da coleção `usuarios_autorizados`, regra de e-mail confirmado com lista ativa, proteção do administrador inicial e remoção da página pública de diagnóstico que escrevia automaticamente. A publicação depende de habilitar o provedor Google e autorizar o domínio antes da troca coordenada das regras. Dados e configurações de produção foram preservados. Não houve push, merge ou deploy.

O usuário definiu `jbadotti@gmail.com` como administrador inicial e solicitou autorização por cadastro de e-mails. Essa definição foi registrada no plano; nenhuma conta ou permissão foi criada em produção. A proposta passa a prever a coleção `usuarios_autorizados`, com e-mail, perfil e estado ativo, protegida contra cadastro ou promoção pelo próprio usuário. O login deverá fornecer identidade e e-mail verificado pelo Firebase; a autorização será imposta nas regras, não apenas na interface. O cadastro inicial deve ser feito por um canal administrativo confiável, sem habilitar escrita pública temporária.

Para continuar é necessária uma sessão administrativa no console do projeto `sicap-radar` ou o fornecimento do texto das regras publicadas para concluir sua análise. A implantação e a validação administrativa ainda exigirão acesso ao projeto. Não enviar senhas, tokens ou chaves privadas pela conversa.

## Referências

- [Regras publicadas e releases](https://firebase.google.com/docs/rules/manage-deploy)
- [Chaves públicas Firebase e suas restrições](https://firebase.google.com/docs/projects/api-keys)
- [Testes de regras no emulador](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

## Restrição para a futura camada offline

SQLite ou qualquer outro armazenamento local deverá sincronizar somente por mecanismo autenticado e autorizado, com namespace por usuário/organização e tratamento de revogação e conflitos. Nunca depender de Firestore público. A escolha do armazenamento e a implementação offline seguem suspensas até revisão desta auditoria.
