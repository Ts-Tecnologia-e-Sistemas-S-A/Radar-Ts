# Publicação coordenada da proteção do Firestore

Não publicar somente o frontend ou somente as regras. Até a conclusão deste roteiro, a produção continua vulnerável.

## Pré-requisitos no console Firebase

1. Em **Segurança → Authentication**, habilitar o provedor **Google**.
2. Em **Authentication → Settings → Authorized domains**, confirmar `radar-ts-u9jq.vercel.app`. Adicionar o domínio exato se estiver ausente. Para um preview, adicionar também o domínio exato do preview usado no teste e removê-lo depois.
3. Manter `jbadotti@gmail.com` como conta Google verificada e administrador inicial.
4. Não criar uma regra pública temporária para cadastrar o administrador. A regra proposta reconhece o administrador inicial e permite que o próprio app crie seu registro depois do primeiro login.

## Testar as regras antes de publicar

No **Laboratório de testes de regras**, substituir apenas no ambiente de simulação pelo conteúdo de `firestore.rules` e executar:

| Identidade simulada | Operação/caminho | Esperado |
|---|---|---|
| sem autenticação | get/list/create/update/delete em `/municipalities/...` e `/radar_simples_municipios/...` | negar |
| `jbadotti@gmail.com`, email_verified=true | get/list/create/update em coleções do Radar | permitir |
| `jbadotti@gmail.com`, email_verified=false | qualquer acesso | negar |
| outro e-mail verificado sem cadastro | get/list/create/update/delete | negar |
| usuário verificado com documento ativo em `/usuarios_autorizados/{email}` | get/list/create/update em coleções do Radar | permitir |
| usuário cadastrado com ativo=false | qualquer coleção do Radar | negar |
| usuário comum | criar/alterar/listar `/usuarios_autorizados` | negar |
| administrador | criar usuário válido e listar `/usuarios_autorizados` | permitir |
| administrador | desativar ou rebaixar `jbadotti@gmail.com` | negar |

O teste de usuário cadastrado requer um documento simulado com `email`, `perfil` (`usuario` ou `admin`) e `ativo: true`. Não usar documentos de produção para o teste.

## Ordem segura de implantação

1. Criar preview do frontend protegido.
2. Verificar que sem login só aparece “Entrar com Google” e que nenhuma tela de dados é montada.
3. Confirmar que o login Google abre no domínio autorizado. As regras públicas atuais ainda tornam este preview inadequado para teste de negação; não compartilhar o preview.
4. Em uma janela coordenada, publicar as novas regras e imediatamente entrar no preview como `jbadotti@gmail.com`.
5. Confirmar que o registro `/usuarios_autorizados/jbadotti@gmail.com` foi criado com perfil admin e ativo.
6. Validar leitura e uma atualização legítima, reversível e conhecida. Não inserir fixtures nem substituir coleções.
7. Validar usuário não autorizado e navegador anônimo: ambos devem receber negação de leitura e escrita.
8. Só então promover o frontend protegido para produção.
9. Testar Ficha, Memória, Agenda, despesas, Radar, relatórios e botão Usuários.
10. Repetir a consulta anônima da auditoria e confirmar PERMISSION_DENIED.

Se o login autorizado falhar após publicar as regras, restaurar a release anterior das regras pelo histórico do console apenas pelo tempo necessário para diagnosticar, mantendo o acesso ao sistema restrito operacionalmente. Não usar `allow read, write: if true` como estado permanente.

## Limites desta correção

As regras protegem o Firestore usado pelo cliente. Endpoints HTTP de IA e BigQuery precisam de uma auditoria própria de autenticação e quota. App Check pode reduzir abuso automatizado, mas não substitui Authentication nem as regras de autorização. A futura sincronização offline deverá usar a mesma identidade e separar dados locais por usuário.
