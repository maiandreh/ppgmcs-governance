# Integração Google Forms → Sheets → Apps Script → GitHub Issues

**Status:** código publicado; ativação na conta Google e autorização do token GitHub ainda são necessárias. **Repositório de destino:** `maiandreh/ppgmcs-governance` (público).

## O que faz

1. Uma resposta do Form é gravada na planilha vinculada.
2. Um **gatilho instalável da planilha** chama `aoEnviarFormulario(e)`.
3. O script gera e persiste um UUID na linha, verifica se já existe Issue com esse identificador e cria a Issue quando necessário.
4. A planilha registra URL, status, tentativas, data e erro da integração.
5. `reprocessarPendencias()` tenta novamente erros transitórios em intervalos de 15 minutos, respeitando limite de cinco tentativas.
6. Para falhas definitivas (`ERROR`), é possível revisar a linha e executar `reprocessarLinhaSelecionada()` manualmente.

**Não cria automaticamente um GitHub Project.** As Issues entram no repositório; sua entrada em um Project pode ser configurada por automação nativa do GitHub Projects depois.

## Pré-requisitos

- Conta Google autorizada para criar Google Form, Sheets e Apps Script.
- Repositório GitHub com Issues habilitadas.
- **Fine-grained personal access token** do GitHub, limitado ao repositório `ppgmcs-governance` com **Issues: Read and write** e **Metadata: Read** (automático).
- Uma pessoa responsável por manter token, formulário e gatilhos. Gatilhos são executados com as permissões da conta que os instalou.

**Não publique o token em arquivo, código, Issue ou README.** Armazene somente em **Apps Script → Configurações do projeto → Propriedades do script** com chave `GITHUB_TOKEN`.

## Configuração passo a passo (sem linha de comando)

1. Crie uma planilha Google exclusiva para as respostas, preferencialmente em conta institucional.
2. Abra **Extensões → Apps Script** na planilha.
3. Substitua o conteúdo inicial pelo arquivo [Code.gs](Code.gs). Adicione um segundo arquivo de script com o conteúdo de [SetupForm.gs](SetupForm.gs). Salve.
4. No GitHub, acesse **Settings → Developer settings → Personal access tokens → Fine-grained tokens**; crie token para **somente** `maiandreh/ppgmcs-governance` com permissão de repositório **Issues → Read and write**. Defina vencimento e plano de rotação.
5. No Apps Script, abra **Configurações do projeto → Propriedades do script**, adicione `GITHUB_TOKEN`. Não coloque o token no editor nem em logs.
6. Execute `criarFormularioPPGMCS()` **uma única vez**. Autorize os escopos solicitados pelo Google. Copie a URL de resposta e a URL de edição exibidas no log. O Form será vinculado à planilha, criando a aba de respostas.
7. Execute `testarConfiguracao()` para verificar acesso ao repositório (não cria Issues).
8. Execute `instalarGatilhos()` para instalar gatilhos de **envio pela planilha** e recuperação periódica (não instale um segundo gatilho manual).
9. Envie uma resposta de teste pelo link do Form, com dados fictícios, e confira a Issue, os campos `Integracao ...` na planilha e os registros de execução do Apps Script.
10. Após teste, divulgue o formulário conforme política de participação decidida pelo grupo.

**Atenção:** alterar os títulos das perguntas quebra o mapeamento. Edite `CFG.questions` no código antes de renomear perguntas. Não instale o gatilho no Google Forms: o evento de Forms usa outra estrutura, e este código espera `e.range` da planilha.

## Modelo do formulário

| Pergunta (texto exato) | Tipo | Obrigatório |
| --- | --- | --- |
| Titulo da demanda | Texto curto | Sim |
| Categoria | Lista | Sim |
| Qual problema foi identificado? | Parágrafo | Sim |
| Quem e afetado? | Lista | Sim |
| Qual melhoria voce sugere? | Parágrafo | Não |
| Referencia ou link complementar | Texto curto | Não |

A função `criarFormularioPPGMCS` cria essas perguntas automaticamente. O texto nos títulos é propositalmente sem acentos para facilitar correspondência exata entre Apps Script e Sheets.

## Status registrados na planilha

- `PROCESSING`: tentativa em andamento; também pode indicar execução interrompida.
- `CREATED`: Issue criada ou reconciliada, com URL registrada.
- `RETRY`: erro temporário (rede, 408, 409, 429, 5xx); a rotina periódica tenta novamente.
- `ERROR`: erro de validação/permissão; exige inspeção e eventual reprocessamento manual.

## Como prevenimos duplicidade

- O UUID persistido por linha é inserido no corpo da Issue em comentário HTML (`ppgmcs-form-id`).
- Um `LockService` impede que duas execuções do mesmo projeto processem a mesma linha simultaneamente.
- Antes de cada POST, o script consulta as Issues existentes, inclusive fechadas, e procura o UUID.
- Se uma requisição POST criar uma Issue, mas a gravação da URL na planilha falhar, a tentativa posterior reconcilia pela marca.
- Se a varredura ultrapassar o limite de páginas configurado, o processo **falha de forma segura** em vez de criar uma Issue sem conferir.

Isso fornece **idempotência por submissão** (não detecção semântica de duas respostas parecidas). Renomear/reordenar linhas ou copiar respostas manualmente pode exigir inspeção, e não há garantia absoluta de exatamente uma entrega em caso de falhas externas raras; monitore as colunas de integração.

## Segurança e governança

- O repositório é **público**. Toda resposta aceita será publicada como texto em Issue pública. **Nunca** colete e-mail, matrícula, telefone, dados de saúde ou outros dados pessoais/sensíveis sem avaliação institucional.
- O formulário avisa desse destino antes do envio. Considere restringir o acesso, moderação ou fazer triagem humana se houver risco de conteúdo pessoal ou spam.
- Apenas informações do formulário e UUID são enviados à API. A planilha permanece sob a conta Google controladora.
- O token deve ter escopo mínimo, expiração e rotação periódica.
- O GitHub Issues é o backlog; o formulário é entrada, **não aprovação de escopo**.

## Operação e diagnóstico

- Se falhar `testarConfiguracao`, confira o token e o acesso ao repositório.
- Se não aparecer Issue: verifique a aba de respostas, a execução `aoEnviarFormulario`, coluna `Integracao Status`, e eventuais falhas de gatilho.
- Em `ERROR`, corrija configuração/resposta, selecione a linha da planilha e execute `reprocessarLinhaSelecionada` no editor. Antes, confirme que não existe Issue para aquela submissão.
- Em `RETRY`, aguarde a execução agendada ou execute `reprocessarPendencias`.
- Se os gatilhos não estiverem instalados, execute `instalarGatilhos` depois de configurar o token.

## Referências oficiais

- [Eventos de submissão para Google Sheets](https://developers.google.com/apps-script/guides/triggers/events)
- [Gatilhos instaláveis](https://developers.google.com/apps-script/guides/triggers/installable)
- [GitHub REST API — Issues](https://docs.github.com/en/rest/issues/issues)
