# Diagnóstico municipal: fontes e atualização

O botão consulta o código IBGE da cidade selecionada. O resultado salvo serve de histórico; abrir a ficha não o apresenta como consulta atual. Gerar, atualizar e exportar PDF fazem nova consulta. Endpoints, cliente HTTP e leituras oficiais não reutilizam cache; falhas não recuperam números anteriores.

## Comparações do mesmo estado

A cidade filtrada aparece primeiro e não é repetida nos destaques. Cada tabela mostra os cinco primeiros lugares da mesma UF, incluindo empates no quinto lugar. A posição considera todos os municípios elegíveis da UF, e não apenas as linhas exibidas. Não há um ranking que misture escalas diferentes.

- **Repasses recebidos (principal):** catálogo atualizado do [Tesouro Nacional](https://www.tesourotransparente.gov.br/ckan/dataset/transferencias-obrigatorias-da-uniao-por-municipio/resource/18d5b0ae-8037-461e-8685-3f0d7752a287), recurso Fundeb por município. Soma o exercício corrente até o último mês publicado, no mesmo período para todas as cidades. A base contém valores distribuídos do Fundeb e **não discrimina VAAR**; não substitui a previsão do FNDE nem é apresentada como pagamento de VAAR. O código SIAFI do arquivo não é confundido com IBGE: os municípios são conciliados por UF e nome exato normalizado com a API oficial de localidades do IBGE. Duplicidades, meses ausentes, nome não conciliado e período futuro bloqueiam a comparação. Valores são somados em centavos. A tela e o PDF mostram período, atualização do catálogo e horário da consulta.
- **Aprendizagem VAAR:** indicador da planilha oficial do exercício, limitado aos municípios habilitados, beneficiários e com evolução em aprendizagem. A cidade selecionada continua visível mesmo fora desse grupo, sem posição. Não se aplica a escala 0–10 do IDEB ao indicador VAAR.
- **IDEB:** descobre a edição mais recente na [página de resultados do INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados), inclusive as abas `data-url`. Lê os ZIPs de municípios e a coluna observada dessa edição, exclusivamente da rede municipal, separando anos iniciais e finais. Ausência de nota não vira zero nem recupera a coluna de uma edição anterior.

As fontes falham independentemente: uma consulta pendente não elimina os resultados confirmados das demais. O servidor usa Node 24. O cliente HTTPS exclusivo de `download.inep.gov.br` completa a cadeia omitida pela origem com a intermediária pública RNP ICPEdu GR46 OV TLS CA 2025, obtida de `https://secure.globalsign.com/cacert/rnpicpedugr46ovtlsca2025.crt` e com assinatura conferida pela GlobalSign Root R46 incluída no Node. Mantém a validação TLS e do hostname, não altera a confiança global e não aceita redirecionamentos. Metadados do Censo são lidos com GET parcial e encerramento imediato do corpo, pois a origem pode rejeitar HEAD. A função de diagnóstico tem limite de 180 segundos; os ZIPs do IDEB são lidos sequencialmente para limitar memória, com limites de tamanho comprimido e descomprimido.

## VAAR

Em cada requisição, o servidor lê a página do exercício financeiro corrente no [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026), identifica a maior revisão numerada e descobre os CSVs publicados. A rota anual é construída com o ano de Brasília; não há fallback para exercício anterior.

- Condições I–V, habilitação, evolução e beneficiário vêm da lista oficial do exercício.
- O repasse vem da tabela de redes beneficiadas da última publicação; exercício e número da portaria são conferidos dentro do CSV.
- A divisão por indicador e o percentual do Saeb não são calculados a partir de exemplos. A tabela de divisão encontrada em setembro de 2026 era de portaria anterior; seus números não são combinados com o total atual.
- Ausência do município, coluna desconhecida, arquivo ambíguo ou erro de rede resultam em pendência. Zero exige não beneficiário explícito na lista e ausência confirmada na tabela de repasses.
- O valor é uma previsão oficial, não comprovação de pagamento. Consulta e exercício são exibidos separadamente, com links para as fontes.

## Censo Escolar: conciliação necessária

A consulta existente usa o espelho `basedosdados.br_inep_censo_escolar.escola`. Ter o mesmo ano do INEP não comprova que esse espelho incorporou retificações. Por isso, a consulta fica bloqueada até conciliação comprovada. O VAAR continua disponível independentemente dessa pendência.

O servidor descobre a edição mais recente na página de microdados do INEP e identifica a revisão por URL, texto oficial, ETag e Last-Modified do arquivo. Para liberar o Censo, a operação deve primeiro comparar a edição integral oficial com a tabela intermediária (inclusive cobertura municipal e matrículas) e registrar a validação. Somente depois configurar:

- `CENSO_ESCOLAR_REVISAO_VALIDADA`: assinatura SHA-256 retornada por `consultarEdicaoCenso()` para o arquivo efetivamente conciliado.
- `CENSO_ESCOLAR_TABELA_VALIDADA_EM`: `last_modified_time` da tabela `escola`, em milissegundos, como string, no momento da conciliação.
- `GOOGLE_CLOUD_CREDENTIALS_JSON`: credencial BigQuery já exigida pelo sistema.

Não preencher essas variáveis apenas para desbloquear a tela. **Este PR não executa nem atesta essa conciliação.** Mudança no arquivo oficial ou na tabela intermediária bloqueia novamente a consulta. A consulta usa somente o ano oficial; o ano anterior entra apenas na comparação de matrículas. Valores nulos não são convertidos em zero. Cadastros manuais e registros antigos do CRM continuam armazenados como históricos, mas não abastecem os campos de escolas e matrículas atuais. Abrir ou trocar a cidade consulta novamente a edição oficial; até a confirmação, os campos exibem um traço e a pendência. Respostas atrasadas de outra cidade são descartadas.

## Verificação

`bun run test` inclui fixtures sintéticas para publicação mais recente, portaria/exercício divergentes, município ausente, duplicidade, condições desconhecidas, valores ausentes, CSV multilinha e Windows-1252, falta de atualização validada do Censo e diagnóstico parcial. `bun run lint` e `bun run build` completam a verificação.

Consultas públicas reais ao FNDE, ao IDEB/INEP, ao IBGE e ao Tesouro foram realizadas durante o desenvolvimento. Em setembro de 2026, o Tesouro publicou os recebimentos até agosto de 2026 e a edição mais recente do IDEB era 2025. Estes anos não estão fixados no código. A conciliação do espelho do Censo continua pendente. Mudanças futuras no formato dos portais devem causar pendência explícita, nunca uso silencioso de uma publicação anterior.
