const ACE = Object.freeze({
  sheets: {
    site: '01 Site Translations',
    games: '02 Games',
    gameText: '03 Game Translations',
    settings: '04 Settings',
    log: '05 Publish Log',
  },
  registryUrl: 'https://raw.githubusercontent.com/Monteg/ace_web/main/content/sheets/seed.json',
  locales: ['en', 'it', 'pt', 'es'],
  types: ['plain', 'rich', 'button', 'aria', 'seo_title', 'seo_description', 'alt'],
  gameTypes: ['slot', 'instant', 'table'],
  gameStatuses: ['live', 'coming_soon'],
  volatility: ['low', 'medium', 'high', 'very_high'],
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ace Games')
    .addItem('Sync Content from Site', 'syncContentFromSite')
    .addSeparator()
    .addItem('Validate Translations', 'validateTranslations')
    .addItem('Validate Games', 'validateGames')
    .addSeparator()
    .addItem('Publish Changes', 'publishChanges')
    .addItem('Show Publish Log', 'showPublishLog')
    .addToUi();
}

function onEdit(event) {
  const range = event && event.range;
  if (!range || range.getRow() < 2) return;
  const name = range.getSheet().getName();
  if (![ACE.sheets.site, ACE.sheets.games, ACE.sheets.gameText].includes(name)) return;
  for (let row = range.getRow(); row < range.getRow() + range.getNumRows(); row += 1) refreshRowStatus_(range.getSheet(), row);
}

function syncContentFromSite() {
  const seed = registrySeed_(true);
  mergeTranslationRows_(ACE.sheets.site, seed.siteTranslations, 'key');
  mergeGameRows_(seed.games);
  mergeTranslationRows_(ACE.sheets.gameText, seed.gameTranslations, 'slug', 'fieldKey');
  formatWorkbook_();
  SpreadsheetApp.getActive().toast('Content registry synchronized. Local translations were preserved.', 'Ace Games', 6);
}

function validateTranslations() {
  const errors = [];
  const registry = registrySeed_();
  validateTranslationSheet_(ACE.sheets.site, ['key'], errors, new Set(registry.siteTranslations.map(row => row.key)));
  validateTranslationSheet_(ACE.sheets.gameText, ['slug', 'fieldKey'], errors, new Set(registry.gameTranslations.map(row => `${row.slug}::${row.fieldKey}`)));
  toastValidation_(errors, 'translations');
  return errors;
}

function validateGames() {
  const errors = [];
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.games);
  const rows = objects_(sheet);
  const knownSlugs = new Set(registrySeed_().games.map(row => row.slug));
  const seen = new Set();
  rows.forEach((row, index) => {
    if (text_(row['Validation Status']) === 'Inactive') return;
    const place = `Games row ${index + 2}`;
    const slug = text_(row.Slug);
    if (!slug) errors.push(`${place}: empty Slug`);
    else if (seen.has(slug)) errors.push(`${place}: duplicate Slug ${slug}`);
    else if (!knownSlugs.has(slug)) errors.push(`${place}: unknown Slug ${slug}; add games through the code registry and Sync Content from Site`);
    seen.add(slug);
    if (!ACE.gameStatuses.includes(text_(row.Status))) errors.push(`${place}: invalid Status`);
    if (!ACE.gameTypes.includes(text_(row.Type))) errors.push(`${place}: invalid Type`);
    const rtp = row.RTP;
    if (rtp !== 'configurable' && !(Number(rtp) >= 0.8 && Number(rtp) <= 0.995)) errors.push(`${place}: invalid RTP`);
    const volatility = text_(row.Volatility).split(',').map(value => value.trim()).filter(Boolean);
    if (!volatility.length || volatility.some(value => !ACE.volatility.includes(value))) errors.push(`${place}: invalid Volatility`);
    if ((text_(row['Max Win Value']) && !text_(row['Max Win Unit'])) || (!text_(row['Max Win Value']) && text_(row['Max Win Unit']))) errors.push(`${place}: incomplete Max Win pair`);
    if ((text_(row['Bet Min']) && !text_(row['Bet Max'])) || (!text_(row['Bet Min']) && text_(row['Bet Max'])) || Number(row['Bet Min']) > Number(row['Bet Max'])) errors.push(`${place}: invalid Bet pair`);
    if (truthy_(row['Demo Enabled'])) {
      if (row['Demo Mode'] === 'adapter' && !text_(row['Adapter Game ID'])) errors.push(`${place}: adapter Game ID required`);
      if (row['Demo Mode'] === 'direct' && (!text_(row['Direct Build']) || !text_(row['Direct Version']))) errors.push(`${place}: direct Build and Version required`);
    }
    if (row.Status === 'live' && (!text_(row['Card Background']) || !text_(row['Hero Image']))) errors.push(`${place}: live game requires Card Background and Hero Image`);
  });
  paintErrors_(sheet, errors);
  toastValidation_(errors, 'games');
  return errors;
}

function publishChanges() {
  assertPublisher_();
  const errors = [...validateTranslations(), ...validateGames()];
  if (errors.length) throw new Error(`Publish blocked by ${errors.length} validation error(s).`);
  const settings = settings_();
  const properties = PropertiesService.getScriptProperties();
  const githubToken = properties.getProperty('GITHUB_TOKEN');
  const owner = properties.getProperty('GITHUB_OWNER') || 'Monteg';
  const repo = properties.getProperty('GITHUB_REPO') || 'ace_web';
  const branch = properties.getProperty('GITHUB_BRANCH') || 'main';
  if (!githubToken) throw new Error('Set GITHUB_TOKEN in Apps Script Settings > Script properties. Never put it in a cell.');

  const publishId = Utilities.getUuid();
  const snapshot = buildSnapshot_(publishId);
  const folder = snapshotFolder_();
  const file = folder.createFile(`ace-content-${publishId}.json`, JSON.stringify(snapshot), MimeType.PLAIN_TEXT);
  const serviceAccount = properties.getProperty('SERVICE_ACCOUNT_EMAIL');
  if (serviceAccount) file.addViewer(serviceAccount);

  appendLog_([new Date(), currentUser_(), snapshot.counts.site, snapshot.counts.gameText, snapshot.counts.games, snapshot.counts.images, publishId, 'Queued', '', '']);
  const payload = {
    event_type: 'ace-content-publish',
    client_payload: { spreadsheet_id: SpreadsheetApp.getActive().getId(), snapshot_file_id: file.getId(), publish_id: publishId, branch },
  };
  const response = UrlFetchApp.fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: 'post',
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    payload: JSON.stringify(payload),
  });
  if (response.getResponseCode() !== 204) {
    appendLog_([new Date(), currentUser_(), 0, 0, 0, 0, publishId, 'Failed', '', `GitHub dispatch ${response.getResponseCode()}: ${response.getContentText()}`]);
    throw new Error(`GitHub publish trigger failed: ${response.getResponseCode()}`);
  }
  SpreadsheetApp.getActive().toast('Publish queued. Normal deployment time is about 1–3 minutes.', 'Ace Games', 8);
}

function showPublishLog() {
  SpreadsheetApp.getActive().setActiveSheet(SpreadsheetApp.getActive().getSheetByName(ACE.sheets.log));
}

function buildSnapshot_(publishId) {
  const site = objects_(SpreadsheetApp.getActive().getSheetByName(ACE.sheets.site)).filter(row => text_(row.Key) && text_(row.Status) !== 'Inactive');
  const games = objects_(SpreadsheetApp.getActive().getSheetByName(ACE.sheets.games)).filter(row => text_(row.Slug) && text_(row['Validation Status']) !== 'Inactive');
  const activeSlugs = new Set(games.map(row => text_(row.Slug)));
  const gameText = objects_(SpreadsheetApp.getActive().getSheetByName(ACE.sheets.gameText)).filter(row => activeSlugs.has(text_(row.Slug)) && text_(row['Field Key']) && text_(row.Status) !== 'Inactive');
  const normalizedSite = site.map(row => ({ key: row.Key, page: row.Page, section: row.Section, context: row.Context, type: row.Type, en: row.EN, it: row.IT, pt: row.PT, es: row.ES }));
  const normalizedGames = games.map(row => ({
    id: row['Game ID'], name: row['Internal Name'], slug: row.Slug, status: row.Status, order: Number(row.Order), type: row.Type,
    rtp: row.RTP === 'configurable' ? 'configurable' : Number(row.RTP), volatility: row.Volatility,
    maxWinValue: row['Max Win Value'], maxWinUnit: row['Max Win Unit'], maxWinApprox: truthy_(row['Max Win Approx']),
    betMin: row['Bet Min'], betMax: row['Bet Max'], demoEnabled: truthy_(row['Demo Enabled']), demoMode: row['Demo Mode'],
    demoGameId: row['Adapter Game ID'], demoBuild: row['Direct Build'], demoVersion: row['Direct Version'], demoApiHost: row['API Host'],
    cardLogo: row['Card Logo'], cardBackground: row['Card Background'], heroImage: row['Hero Image'],
  }));
  const normalizedGameText = gameText.map(row => ({ game: row.Game, slug: row.Slug, fieldKey: row['Field Key'], group: row.Group, context: row.Context, type: row.Type, en: row.EN, it: row.IT, pt: row.PT, es: row.ES }));
  return {
    schemaVersion: 1, publishId, publishedAt: new Date().toISOString(),
    siteTranslations: normalizedSite, games: normalizedGames, gameTranslations: normalizedGameText,
    counts: {
      site: site.filter(row => /CHANGED/i.test(text_(row.Status))).length,
      gameText: gameText.filter(row => /CHANGED/i.test(text_(row.Status))).length,
      games: games.filter(row => truthy_(row.Changed)).length,
      images: games.filter(row => truthy_(row.Changed) && (text_(row['Card Logo']) || text_(row['Card Background']) || text_(row['Hero Image']))).length,
    },
  };
}

function mergeTranslationRows_(sheetName, incoming, ...identityFields) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const headers = headers_(sheet);
  const rows = objects_(sheet);
  const identity = row => identityFields.map(field => text_(row[field === 'fieldKey' ? 'Field Key' : field[0].toUpperCase() + field.slice(1)])).join('::');
  const existing = new Map(rows.map((row, index) => [identity(row), { row, index: index + 2 }]));
  const active = new Set();
  incoming.forEach(source => {
    const sourceObject = sheetName === ACE.sheets.site
      ? { Key: source.key, Page: source.page, Section: source.section, Context: source.context, Type: source.type, EN: source.en }
      : { Game: source.game, Slug: source.slug, 'Field Key': source.fieldKey, Group: source.group, Context: source.context, Type: source.type, EN: source.en };
    const key = sheetName === ACE.sheets.site ? source.key : `${source.slug}::${source.fieldKey}`;
    active.add(key);
    const found = existing.get(key);
    if (!found) {
      sheet.appendRow(headers.map(header => header === 'Last Synced' ? new Date() : header === 'Source Hash' ? hash_(source.en) : sourceObject[header] ?? ''));
      setStatus_(sheet, sheet.getLastRow(), 'Missing');
    } else {
      const oldEnglish = text_(found.row.EN);
      const previousSourceHash = text_(found.row['Source Hash']);
      const englishWasEditedInSheet = previousSourceHash && previousSourceHash !== hash_(oldEnglish);
      Object.entries(sourceObject).forEach(([header, value]) => {
        if (header === 'EN' && englishWasEditedInSheet) return;
        sheet.getRange(found.index, headers.indexOf(header) + 1).setValue(value);
      });
      if (headers.includes('Last Synced')) sheet.getRange(found.index, headers.indexOf('Last Synced') + 1).setValue(new Date());
      if (headers.includes('Source Hash')) sheet.getRange(found.index, headers.indexOf('Source Hash') + 1).setValue(hash_(source.en));
      if (englishWasEditedInSheet || (oldEnglish && oldEnglish !== source.en && ['IT', 'PT', 'ES'].some(locale => text_(found.row[locale])))) setStatus_(sheet, found.index, 'SOURCE CHANGED');
    }
  });
  rows.forEach((row, index) => { if (!active.has(identity(row))) setStatus_(sheet, index + 2, 'Inactive'); });
}

function mergeGameRows_(incoming) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.games);
  const headers = headers_(sheet);
  const rows = objects_(sheet);
  const existing = new Map(rows.map((row, index) => [text_(row.Slug), { row, index: index + 2 }]));
  const active = new Set();
  incoming.forEach(row => {
    active.add(row.slug);
    const object = {
      'Game ID': row.id, 'Internal Name': row.name, Slug: row.slug, Status: row.status, Order: row.order, Type: row.type,
      'RTP Mode': row.rtp === 'configurable' ? 'configurable' : 'fixed', RTP: row.rtp, Volatility: row.volatility,
      'Max Win Value': row.maxWinValue, 'Max Win Unit': row.maxWinUnit, 'Max Win Approx': row.maxWinApprox,
      'Bet Min': row.betMin, 'Bet Max': row.betMax, 'Demo Enabled': row.demoEnabled, 'Demo Mode': row.demoMode,
      'Adapter Game ID': row.demoGameId, 'Direct Build': row.demoBuild, 'Direct Version': row.demoVersion, 'API Host': row.demoApiHost,
      'Card Logo': row.cardLogo, 'Card Background': row.cardBackground, 'Hero Image': row.heroImage, Changed: false, Publish: true,
    };
    const sourceHash = hash_(JSON.stringify(row));
    const found = existing.get(row.slug);
    if (!found) {
      sheet.appendRow(headers.map(header => header === 'Last Synced' ? new Date() : header === 'Source Hash' ? sourceHash : header === 'Validation Status' ? 'Ready' : object[header] ?? ''));
      return;
    }
    if (truthy_(found.row.Changed)) {
      if (text_(found.row['Source Hash']) !== sourceHash) setStatus_(sheet, found.index, 'SOURCE CHANGED');
      return;
    }
    Object.entries(object).forEach(([header, value]) => sheet.getRange(found.index, headers.indexOf(header) + 1).setValue(value));
    if (headers.includes('Last Synced')) sheet.getRange(found.index, headers.indexOf('Last Synced') + 1).setValue(new Date());
    if (headers.includes('Source Hash')) sheet.getRange(found.index, headers.indexOf('Source Hash') + 1).setValue(sourceHash);
    setStatus_(sheet, found.index, 'Ready');
  });
  rows.forEach((row, index) => { if (!active.has(text_(row.Slug))) setStatus_(sheet, index + 2, 'Inactive'); });
}

function validateTranslationSheet_(sheetName, identityHeaders, errors, knownIdentities) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const rows = objects_(sheet);
  const seen = new Set();
  rows.forEach((row, index) => {
    if (text_(row.Status) === 'Inactive') return;
    const place = `${sheetName} row ${index + 2}`;
    const identity = identityHeaders.map(header => text_(row[header === 'key' ? 'Key' : header === 'fieldKey' ? 'Field Key' : 'Slug'])).join('::');
    if (!identity) errors.push(`${place}: identity is empty`);
    else if (seen.has(identity)) errors.push(`${place}: duplicate ${identity}`);
    else if (!knownIdentities.has(identity)) errors.push(`${place}: unknown ${identity}; create content slots in code and use Sync Content from Site`);
    seen.add(identity);
    if (!text_(row.EN)) errors.push(`${place}: EN is required`);
    if (!ACE.types.includes(text_(row.Type))) errors.push(`${place}: invalid Type`);
    ['EN', 'IT', 'PT', 'ES'].forEach(locale => { if (/<\/?(?:script|iframe|object|embed)\b/i.test(text_(row[locale]))) errors.push(`${place}: unsafe HTML in ${locale}`); });
    if (row.Type === 'seo_title' && text_(row.EN).length > 70) errors.push(`${place}: SEO title exceeds 70 characters`);
    if (row.Type === 'seo_description' && text_(row.EN).length > 165) errors.push(`${place}: SEO description exceeds 165 characters`);
  });
  paintErrors_(sheet, errors);
}

function formatWorkbook_() {
  const spreadsheet = SpreadsheetApp.getActive();
  [ACE.sheets.site, ACE.sheets.games, ACE.sheets.gameText, ACE.sheets.settings, ACE.sheets.log].forEach(name => {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#171717').setFontColor('#fffaf0');
    sheet.getDataRange().setVerticalAlignment('top');
  });
  spreadsheet.getSheetByName(ACE.sheets.site).setFrozenColumns(5);
  spreadsheet.getSheetByName(ACE.sheets.games).setFrozenColumns(3);
  spreadsheet.getSheetByName(ACE.sheets.gameText).setFrozenColumns(6);
}

function refreshRowStatus_(sheet, rowNumber) {
  const headers = headers_(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  if ([ACE.sheets.site, ACE.sheets.gameText].includes(sheet.getName())) {
    const visibleCount = sheet.getName() === ACE.sheets.site ? 9 : 10;
    const currentHash = hash_(JSON.stringify(values.slice(0, visibleCount)));
    const baseline = text_(row['Last Published Hash']);
    const baseStatus = !text_(row.EN) ? 'Error' : ['IT', 'PT', 'ES'].every(locale => text_(row[locale])) ? 'Ready' : 'Missing';
    setStatus_(sheet, rowNumber, baseline && baseline === currentHash ? baseStatus : 'Changed');
  } else {
    const currentHash = hash_(JSON.stringify(values.slice(0, 23)));
    const changed = !text_(row['Last Published Hash']) || text_(row['Last Published Hash']) !== currentHash;
    const changedIndex = headers.indexOf('Changed') + 1;
    if (changedIndex) sheet.getRange(rowNumber, changedIndex).setValue(changed);
    setStatus_(sheet, rowNumber, changed ? 'Changed' : 'Published');
  }
}

function setStatus_(sheet, rowNumber, value) {
  const statusHeader = sheet.getName() === ACE.sheets.games ? 'Validation Status' : 'Status';
  const column = headers_(sheet).indexOf(statusHeader) + 1;
  if (column) sheet.getRange(rowNumber, column).setValue(value);
}

function paintErrors_(sheet, errors) {
  const errorRows = new Set(errors.map(error => Number(error.match(/row (\d+)/i)?.[1])).filter(Boolean));
  const statusHeader = sheet.getName() === ACE.sheets.games ? 'Validation Status' : 'Status';
  const statusColumn = headers_(sheet).indexOf(statusHeader) + 1;
  if (!statusColumn) return;
  for (let row = 2; row <= sheet.getLastRow(); row += 1) if (errorRows.has(row)) sheet.getRange(row, statusColumn).setValue('Error');
}

function appendLog_(values) {
  SpreadsheetApp.getActive().getSheetByName(ACE.sheets.log).appendRow(values);
}

function snapshotFolder_() {
  const name = 'Ace Games Content Snapshots';
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function assertPublisher_() {
  const allowed = (PropertiesService.getScriptProperties().getProperty('PUBLISH_ALLOWLIST') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const email = currentUser_().toLowerCase();
  if (!email || (allowed.length && !allowed.includes(email))) throw new Error('Your Google account is not allowed to publish production content.');
}

function settings_() {
  const rows = objects_(SpreadsheetApp.getActive().getSheetByName(ACE.sheets.settings));
  return Object.fromEntries(rows.map(row => [text_(row.Setting), row.Value]));
}

function registrySeed_(force) {
  const cache = CacheService.getScriptCache();
  if (force) cache.remove('ace-content-registry');
  const cached = cache.get('ace-content-registry');
  if (cached) return JSON.parse(cached);
  const url = settings_()['Registry URL'] || ACE.registryUrl;
  const githubToken = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
  });
  if (response.getResponseCode() !== 200) throw new Error(`Registry download failed: ${response.getResponseCode()}`);
  const registry = JSON.parse(response.getContentText());
  cache.put('ace-content-registry', JSON.stringify(registry), 300);
  return registry;
}

function headers_(sheet) { return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(text_); }
function objects_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  const headers = headers_(sheet);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().map(values => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}
function text_(value) { return value == null ? '' : String(value).trim(); }
function truthy_(value) { return value === true || text_(value).toLowerCase() === 'true'; }
function currentUser_() { return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail(); }
function localeChanged_(row) { return ACE.locales.some(locale => text_(row[locale])); }
function hash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text_(value), Utilities.Charset.UTF_8)
    .map(byte => (`0${(byte + 256).toString(16)}`).slice(-2)).join('');
}
function toastValidation_(errors, label) {
  const message = errors.length ? `${errors.length} ${label} error(s). Open Status cells and Publish Log.` : `${label[0].toUpperCase()}${label.slice(1)} are valid.`;
  SpreadsheetApp.getActive().toast(message, 'Ace Games', 8);
}
