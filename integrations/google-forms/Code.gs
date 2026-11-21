/**
 * PPGMCS — Google Forms -> Sheets -> GitHub Issues.
 * Vincule este script à PLANILHA de respostas (não ao Form).
 * Configuração detalhada: README.md nesta pasta.
 */
const CFG = Object.freeze({
  repo: 'maiandreh/ppgmcs-governance',
  api: 'https://api.github.com',
  markerPrefix: 'ppgmcs-form-id:',
  maxAttempts: 5,
  retryAfterMinutes: 15,
  maxIssuePages: 50,
  headers: Object.freeze({
    id: 'Integracao ID',
    status: 'Integracao Status',
    issue: 'Integracao Issue URL',
    attempts: 'Integracao Tentativas',
    error: 'Integracao Erro',
    updated: 'Integracao Atualizado em'
  }),
  questions: Object.freeze({
    title: 'Titulo da demanda',
    category: 'Categoria',
    problem: 'Qual problema foi identificado?',
    audience: 'Quem e afetado?',
    suggestion: 'Qual melhoria voce sugere?',
    reference: 'Referencia ou link complementar'
  }),
  categories: Object.freeze({
    'Conteudo e documentacao': 'conteúdo e documentação',
    'Processo ou servico': 'processo ou serviço',
    'Tecnologia': 'tecnologia',
    'Autoavaliacao e dados': 'autoavaliação e dados',
    'Outros': 'outros'
  })
});

/** Execute uma vez, depois de vincular o Google Form à planilha. */
function instalarGatilhos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra o Apps Script pela planilha de respostas.');
  if (!PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN')) {
    throw new Error('Configure GITHUB_TOKEN nas propriedades do script antes de instalar.');
  }
  const handlers = ['aoEnviarFormulario', 'reprocessarPendencias'];
  ScriptApp.getProjectTriggers().forEach(t => {
    if (handlers.includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('aoEnviarFormulario').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('reprocessarPendencias').timeBased().everyMinutes(15).create();
  Logger.log('Gatilhos instalados para: ' + ss.getUrl());
}

/** Gatilho instalável do Google Sheets (e.range, não e.response). */
function aoEnviarFormulario(e) {
  if (!e || !e.range) throw new Error('Use o gatilho de envio DA PLANILHA.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    processarLinha_(e.range.getSheet(), e.range.getRow());
  } finally {
    lock.releaseLock();
  }
}

/** Reprocessa falhas transitórias e execuções interrompidas; limite de tentativas. */
function reprocessarPendencias() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = Date.now();
    ss.getSheets().forEach(sheet => {
      if (!ehAbaRespostas_(sheet)) return;
      const columns = garantirColunas_(sheet);
      for (let row = 2; row <= sheet.getLastRow(); row++) {
        const status = String(sheet.getRange(row, columns.status).getValue() || '');
        if (!['RETRY', 'PROCESSING'].includes(status)) continue;
        const attempts = Number(sheet.getRange(row, columns.attempts).getValue() || 0);
        if (attempts >= CFG.maxAttempts) continue;
        const last = sheet.getRange(row, columns.updated).getValue();
        if (last instanceof Date && now - last.getTime() < CFG.retryAfterMinutes * 60000) continue;
        processarLinha_(sheet, row);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function processarLinha_(sheet, row) {
  if (row < 2 || !ehAbaRespostas_(sheet)) return;
  const c = garantirColunas_(sheet);
  const statusCell = sheet.getRange(row, c.status);
  const issueCell = sheet.getRange(row, c.issue);
  if (String(statusCell.getValue()) === 'CREATED' || issueCell.getValue()) return;

  const idCell = sheet.getRange(row, c.id);
  let id = String(idCell.getValue() || '').trim();
  if (!id) {
    id = Utilities.getUuid();
    idCell.setValue(id);
    SpreadsheetApp.flush(); // Persistir antes de qualquer POST externo.
  }
  const attemptsCell = sheet.getRange(row, c.attempts);
  const attempts = Number(attemptsCell.getValue() || 0);
  if (attempts >= CFG.maxAttempts) return;
  attemptsCell.setValue(attempts + 1);
  marcar_(sheet, row, c, 'PROCESSING', '');
  SpreadsheetApp.flush();

  try {
    const data = extrairResposta_(sheet, row);
    const issueAnterior = procurarIssuePorId_(id);
    const issue = issueAnterior || criarIssue_(data, id);
    issueCell.setValue(issue.html_url);
    marcar_(sheet, row, c, 'CREATED', '');
  } catch (err) {
    const temporary = !!err.retryable;
    marcar_(sheet, row, c, temporary ? 'RETRY' : 'ERROR', String(err.message || err).slice(0, 500));
    // Sem relançar: a falha fica auditável na planilha.
  }
}

function ehAbaRespostas_(sheet) {
  if (sheet.getLastRow() < 1) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const q = CFG.questions;
  return headers.includes(q.title) && headers.includes(q.problem) && headers.includes(q.category);
}

function garantirColunas_(sheet) {
  const wanted = Object.values(CFG.headers);
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  wanted.forEach(name => {
    if (!headers.includes(name)) {
      const col = headers.length + 1;
      if (col > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), col - sheet.getMaxColumns());
      sheet.getRange(1, col).setValue(name);
      headers.push(name);
    }
  });
  const columns = {};
  Object.entries(CFG.headers).forEach(([key, name]) => columns[key] = headers.indexOf(name) + 1);
  return columns;
}

function extrairResposta_(sheet, row) {
  const values = sheet.getRange(1, 1, row, sheet.getLastColumn()).getDisplayValues();
  const headers = values[0];
  const current = values[row - 1];
  const field = key => {
    const index = headers.indexOf(CFG.questions[key]);
    return index < 0 ? '' : String(current[index] || '').trim();
  };
  const data = {
    title: field('title'), category: field('category'), problem: field('problem'),
    audience: field('audience'), suggestion: field('suggestion'), reference: field('reference')
  };
  if (!data.title || !data.problem || !CFG.categories[data.category]) {
    throw new Error('Resposta incompleta ou categoria não reconhecida. Revise o formulário e a linha.');
  }
  if (data.title.length > 180 || data.problem.length > 10000) {
    throw new Error('Título ou descrição acima do limite permitido.');
  }
  return data;
}

function montarIssue_(data, id) {
  const clean = s => String(s || '').replace(/\r/g, '').replace(/<!--/g, '&lt;!--').replace(/-->/g, '--&gt;');
  const title = '[Demanda] ' + data.title.trim();
  const body = [
    '<!-- ' + CFG.markerPrefix + id + ' -->',
    '> **Origem:** Google Forms · **Situação inicial:** aguardando triagem.',
    '',
    '## Categoria', clean(CFG.categories[data.category]),
    '',
    '## Problema identificado', clean(data.problem),
    '',
    '## Público afetado', clean(data.audience || 'Não informado'),
    '',
    '## Melhoria sugerida', clean(data.suggestion || 'Não informada'),
    '',
    '## Referência', clean(data.reference || 'Não informada'),
    '',
    '---',
    '_Demanda recebida automaticamente. Regras institucionais, escopo e critérios de aceite devem ser refinados pela equipe._'
  ].join('\n');
  return { title, body };
}

function procurarIssuePorId_(id) {
  const marker = '<!-- ' + CFG.markerPrefix + id + ' -->';
  // Paginar sem depender de indexação assíncrona de busca.
  // Falhar de modo seguro se o histórico ultrapassar o limite configurado.
  for (let page = 1; page <= CFG.maxIssuePages; page++) {
    const url = CFG.api + '/repos/' + CFG.repo + '/issues?state=all&per_page=100&sort=created&direction=desc&page=' + page;
    const result = apiGitHub_('get', url);
    if (!Array.isArray(result)) throw new Error('Resposta inesperada ao consultar Issues.');
    const match = result.find(issue => !issue.pull_request && String(issue.body || '').includes(marker));
    if (match) return match;
    if (result.length < 100) return null;
  }
  const err = new Error('Limite de consulta atingido; revisão manual necessária antes de criar outra Issue.');
  err.retryable = false;
  throw err;
}

function criarIssue_(data, id) {
  const payload = montarIssue_(data, id);
  return apiGitHub_('post', CFG.api + '/repos/' + CFG.repo + '/issues', payload);
}

function apiGitHub_(method, url, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN não configurado.');
  const opts = {
    method: method,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  };
  if (payload) opts.payload = JSON.stringify(payload);
  let response;
  try {
    response = UrlFetchApp.fetch(url, opts);
  } catch (_) {
    const err = new Error('Falha de rede ao consultar GitHub; será tentado novamente.');
    err.retryable = true;
    throw err;
  }
  const status = response.getResponseCode();
  if (status >= 200 && status < 300) return JSON.parse(response.getContentText());
  const err = new Error('GitHub API HTTP ' + status + ' (verifique integração e permissões).');
  err.retryable = status === 408 || status === 409 || status === 429 || status >= 500;
  throw err;
}

function marcar_(sheet, row, c, status, error) {
  sheet.getRange(row, c.status).setValue(status);
  sheet.getRange(row, c.error).setValue(error);
  sheet.getRange(row, c.updated).setValue(new Date());
}

/** Teste sem criar Issue: cole no editor e execute apos configurar os gatilhos. */
function testarConfiguracao() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Falta GITHUB_TOKEN nas propriedades.');
  const repo = apiGitHub_('get', CFG.api + '/repos/' + CFG.repo);
  Logger.log('Acesso ao repositorio confirmado: ' + repo.full_name);
}

/** Permite reprocessar manualmente uma resposta em ERROR após corrigi-la. */
function reprocessarLinhaSelecionada() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  if (row < 2) throw new Error('Selecione uma linha de resposta.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const c = garantirColunas_(sheet);
    if (sheet.getRange(row, c.issue).getValue()) throw new Error('Esta linha ja tem Issue registrada.');
    sheet.getRange(row, c.attempts).setValue(0);
    marcar_(sheet, row, c, 'RETRY', '');
    processarLinha_(sheet, row);
  } finally {
    lock.releaseLock();
  }
}
