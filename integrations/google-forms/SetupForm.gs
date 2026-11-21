/**
 * Opcional: execute esta função uma ÚNICA vez no Apps Script vinculado à planilha.
 * Cria o Google Forms com os campos exatos esperados por Code.gs e o vincula à planilha.
 * NÃO execute novamente para evitar formulários duplicados.
 */
function criarFormularioPPGMCS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Execute a partir do Apps Script vinculado a uma planilha.');
  const q = CFG.questions;
  const form = FormApp.create('PPGMCS — Registro de demandas');
  form.setDescription(
    'Canal de sugestões e problemas relacionados aos processos, documentos, serviços e portal do PPGMCS. ' +
    'As respostas válidas poderão gerar Issues em um repositório PÚBLICO no GitHub. ' +
    'Não informe nome completo, e-mail, matrícula, telefone, dados sensíveis, credenciais ou documentos sigilosos. ' +
    'O envio não significa aprovação ou compromisso de execução.'
  );
  form.setConfirmationMessage('Demanda recebida para triagem. Obrigado pela contribuição.');
  form.setCollectEmail(false);

  form.addTextItem().setTitle(q.title).setRequired(true)
    .setHelpText('Resuma o problema em uma frase, sem dados pessoais.');
  form.addListItem().setTitle(q.category).setRequired(true)
    .setChoiceValues(Object.keys(CFG.categories));
  form.addParagraphTextItem().setTitle(q.problem).setRequired(true)
    .setHelpText('Descreva a dificuldade observada e em qual contexto ocorre.');
  form.addListItem().setTitle(q.audience).setRequired(true)
    .setChoiceValues(['Estudantes', 'Docentes', 'Secretaria', 'Egressos', 'Comunidade externa', 'Mais de um público', 'Outros']);
  form.addParagraphTextItem().setTitle(q.suggestion).setRequired(false);
  form.addTextItem().setTitle(q.reference).setRequired(false)
    .setHelpText('Informe apenas links públicos, se houver.');

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('Formulário para respostas: ' + form.getPublishedUrl());
  Logger.log('Formulário para edição: ' + form.getEditUrl());
  Logger.log('Planilha: ' + ss.getUrl());
  return form.getEditUrl();
}
