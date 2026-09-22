# Diagnóstico municipal: fontes e atualização

O botão consulta o código IBGE da cidade selecionada. O resultado salvo serve de histórico; abrir a ficha não o apresenta como consulta atual. Gerar, atualizar e exportar PDF fazem nova consulta. Endpoints, cliente HTTP e leituras oficiais não reutilizam cache; falhas não recuperam números anteriores.

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

Não preencher essas variáveis apenas para desbloquear a tela. **Este PR não executa nem atesta essa conciliação.** Mudança no arquivo oficial ou na tabela intermediária bloqueia novamente a consulta. A consulta usa somente o ano oficial; o ano anterior entra apenas na comparação de matrículas. Valores nulos não são convertidos em zero. Cadastros manuais e registros antigos do CRM continuam históricos e são identificados como não verificados.

## Verificação

`bun run test` inclui fixtures sintéticas para publicação mais recente, portaria/exercício divergentes, município ausente, duplicidade, condições desconhecidas, valores ausentes, CSV multilinha e Windows-1252, falta de atualização validada do Censo e diagnóstico parcial. `bun run lint` e `bun run build` completam a verificação.

Consultas públicas reais ao FNDE foram realizadas para Coelho Neto, Caxias e Timon durante o desenvolvimento. O INEP apresentou indisponibilidade de conexão neste ambiente; a revisão do Censo não foi atestada. Mudanças futuras no formato dos portais devem causar pendência explícita, nunca uso silencioso de uma publicação anterior.
