/** Ace Games CMS bulk editor for Google Sheets (Apps Script V8). */

const ACE = Object.freeze({
  sheets: { games: 'Games', translations: 'Translations', content: 'Game Content', media: 'Media' },
  colors: { missing: '#f4cccc', draft: '#fff2cc', review: '#cfe2f3', approved: '#d9ead3', system: '#eeeeee', conflict: '#f6b26b' },
  gameHeaders: ['Game ID', 'Name', 'Slug', 'Release Status', 'Order', 'Game Type', 'RTP Mode', 'RTP', 'Volatility', 'Max Win', 'Max Win Unit', 'Approx', 'Bet Min', 'Bet Max', 'Demo Enabled', 'Demo Mode', 'Adapter Game ID', 'Direct Build', 'Direct Version', 'API Host', 'Hero Image', 'Game Cover', 'Card Background', 'Card Logo', 'Changed', 'Publish', 'Status', 'Revision'],
  translationBaseHeaders: ['Key', 'Scope', 'Entity', 'Page', 'Section', 'Context', 'Type'],
  translationSystemHeaders: ['Changed', 'Publish', 'Status', 'Revision', '__collection', '__parent_field', '__parent_id', '__field'],
  contentHeaders: ['Block ID', 'Game', 'Parent Block ID', 'Block Type', 'Item Kind', 'Order', 'Enabled', 'Image', 'Changed', 'Publish', 'Status', 'Revision'],
  mediaHeaders: ['Media ID', 'Game', 'Role', 'Parent ID', 'Order', 'Drive URL / File ID / CMS Asset', 'Enabled', 'Changed', 'Publish', 'Status', 'Revision'],
  statuses: { draft: 'Draft', changed: 'Local changes', saved: 'Saved to CMS', incomplete: 'Translation incomplete', ready: 'Ready to publish', publishing: 'Publishing…', conflict: 'Conflict', failed: 'Build failed' },
  maxUploadBytes: 25 * 1024 * 1024,
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ace CMS')
    .addItem('1. Настроить подключение', 'aceConfigure')
    .addSeparator()
    .addItem('Обновить Games из CMS', 'acePullGames')
    .addItem('Обновить переводы из CMS', 'acePullTranslations')
    .addItem('Обновить Content из CMS', 'acePullContent')
    .addItem('Обновить Media из CMS', 'acePullMedia')
    .addSeparator()
    .addItem('Сохранить изменения', 'aceSaveChanges')
    .addItem('Опубликовать отмеченные', 'acePublishSelected')
    .addItem('Проверить локализацию', 'aceCheckLocalization')
    .addToUi();
}

function onEdit(event) {
  const range = event && event.range;
  if (!range || range.getRow() < 2) return;
  const sheet = range.getSheet();
  if (!Object.values(ACE.sheets).includes(sheet.getName())) return;
  const headers = aceHeaders_(sheet);
  const changedColumn = headers.indexOf('Changed') + 1;
  if (!changedColumn || range.getColumn() === changedColumn) return;
  const editedHeader = headers[range.getColumn() - 1] || '';
  if (editedHeader === 'Status' || editedHeader === 'Revision' || editedHeader.startsWith('__')) return;
  sheet.getRange(range.getRow(), changedColumn).setValue(true);
  const statusColumn = headers.indexOf('Status') + 1;
  if (statusColumn) sheet.getRange(range.getRow(), statusColumn).setValue(ACE.statuses.changed);
}

function aceConfigure() {
  const ui = SpreadsheetApp.getUi();
  const urlPrompt = ui.prompt('Ace CMS', 'CMS URL, например https://cms.acegames.io', ui.ButtonSet.OK_CANCEL);
  if (urlPrompt.getSelectedButton() !== ui.Button.OK) return;
  const tokenPrompt = ui.prompt('Ace CMS', 'Scoped ACE_CMS_SYNC_TOKEN', ui.ButtonSet.OK_CANCEL);
  if (tokenPrompt.getSelectedButton() !== ui.Button.OK) return;
  const url = String(urlPrompt.getResponseText()).trim().replace(/\/$/, '');
  const token = String(tokenPrompt.getResponseText()).trim();
  if (!/^https?:\/\//.test(url) || !token) throw new Error('Нужны корректный CMS URL и scoped token.');
  PropertiesService.getScriptProperties().setProperties({ ACE_CMS_URL: url, ACE_CMS_SYNC_TOKEN: token });
  aceRequest_('/users/me?fields=id,email', { method: 'get' });
  ui.alert('Подключение сохранено и проверено.');
}

function acePullGames() {
  aceRun_('Games', () => {
    const games = aceList_('games', '*');
    const rows = games.sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map(aceGameToRow_);
    const sheet = aceReplacePreservingDirty_(ACE.sheets.games, ACE.gameHeaders, rows, 'Game ID', 'Revision');
    aceStyleSheet_(sheet, ['Game ID', 'Revision']);
    aceApplyGameValidation_(sheet);
  });
}

function acePullTranslations() {
  aceRun_('Translations', () => {
    const locales = aceActiveLocales_();
    const headers = ACE.translationBaseHeaders.concat(locales.flatMap(locale => [locale.code.toUpperCase(), `${locale.code.toUpperCase()} Status`]), ACE.translationSystemHeaders);
    const descriptors = aceTranslationDescriptors_();
    const rows = descriptors.map(descriptor => aceTranslationRow_(descriptor, locales, headers));
    const sheet = aceReplacePreservingDirty_(ACE.sheets.translations, headers, rows, 'Key', 'Revision');
    aceStyleSheet_(sheet, ACE.translationSystemHeaders.filter(header => header.startsWith('__')).concat(['Revision']));
    aceApplyTranslationFormatting_(sheet, locales);
    aceInstallFilter_(sheet);
  });
}

function acePullContent() {
  aceRun_('Game Content', () => {
    const gameNames = aceGameNameMap_();
    const sections = aceList_('game_sections', '*');
    const items = aceList_('game_section_items', '*');
    const rows = sections.map(section => aceArrayRow_(ACE.contentHeaders, {
      'Block ID': section.id, Game: gameNames[aceId_(section.game_id)] || aceId_(section.game_id), 'Parent Block ID': '', 'Block Type': section.section_type,
      'Item Kind': 'section', Order: section.sort_order, Enabled: section.enabled, Image: aceAssetRef_(section.media_file), Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: section.updated_at || '',
    })).concat(items.map(item => aceArrayRow_(ACE.contentHeaders, {
      'Block ID': item.id, Game: '', 'Parent Block ID': aceId_(item.section_id), 'Block Type': '', 'Item Kind': 'item', Order: item.sort_order, Enabled: item.enabled,
      Image: aceAssetRef_(item.image_file || item.icon_file), Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: item.updated_at || '',
    })));
    const sheet = aceReplacePreservingDirty_(ACE.sheets.content, ACE.contentHeaders, rows, 'Block ID', 'Revision');
    aceStyleSheet_(sheet, ['Block ID', 'Revision']);
    aceApplyContentValidation_(sheet);
  });
}

function acePullMedia() {
  aceRun_('Media', () => {
    const games = aceList_('games', 'id,internal_name,card_image,hero_image,card_background_image,card_logo_image,updated_at');
    const gameNames = Object.fromEntries(games.map(game => [game.id, game.internal_name]));
    const gallery = aceList_('game_gallery', '*');
    const sections = aceList_('game_sections', '*');
    const rows = [];
    games.forEach(game => {
      [['hero', game.hero_image], ['card', game.card_image], ['card_background', game.card_background_image], ['card_logo', game.card_logo_image]].forEach(([role, asset]) => {
        if (asset) rows.push(aceArrayRow_(ACE.mediaHeaders, { 'Media ID': `${game.id}:${role}`, Game: game.internal_name, Role: role, 'Parent ID': game.id, Order: 0, 'Drive URL / File ID / CMS Asset': aceAssetRef_(asset), Enabled: true, Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: game.updated_at || '' }));
      });
    });
    gallery.forEach(item => rows.push(aceArrayRow_(ACE.mediaHeaders, { 'Media ID': item.id, Game: gameNames[aceId_(item.game_id)] || aceId_(item.game_id), Role: 'gallery', 'Parent ID': aceId_(item.game_id), Order: item.sort_order, 'Drive URL / File ID / CMS Asset': aceAssetRef_(item.file), Enabled: item.enabled, Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: item.updated_at || '' })));
    sections.filter(section => section.media_file).forEach(section => rows.push(aceArrayRow_(ACE.mediaHeaders, { 'Media ID': `section:${section.id}`, Game: gameNames[aceId_(section.game_id)] || aceId_(section.game_id), Role: 'section', 'Parent ID': section.id, Order: section.sort_order, 'Drive URL / File ID / CMS Asset': aceAssetRef_(section.media_file), Enabled: section.enabled, Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: section.updated_at || '' })));
    const sheet = aceReplacePreservingDirty_(ACE.sheets.media, ACE.mediaHeaders, rows, 'Media ID', 'Revision');
    aceStyleSheet_(sheet, ['Media ID', 'Parent ID', 'Revision']);
    aceApplyMediaValidation_(sheet);
  });
}

function aceSaveChanges() {
  aceRun_('Save', () => {
    const results = [aceSaveGames_(), aceSaveTranslations_(), aceSaveContent_(), aceSaveMedia_()];
    SpreadsheetApp.getActive().toast(`Saved ${results.reduce((sum, value) => sum + value, 0)} changed rows`, 'Ace CMS', 6);
  });
}

function acePublishSelected() {
  aceRun_('Publish', () => {
    const selections = aceCollectPublishSelections_();
    if (!selections.games.length && !selections.translations.length && !selections.content.length && !selections.media.length) throw new Error('Отметьте Publish хотя бы в одной строке.');
    aceAssertTrustedPublisher_();
    aceSetSelectedStatuses_(ACE.statuses.publishing);
    const result = aceRequest_('/ace-releases/publish', { method: 'post', payload: { selections, source: 'google-sheets', spreadsheet_id: SpreadsheetApp.getActive().getId() } });
    const label = result.version ? `Deploying v${result.version}` : 'Publishing';
    aceSetSelectedStatuses_(label, true);
    SpreadsheetApp.getActive().toast(label, 'Ace CMS', 8);
  });
}

function aceCheckLocalization() {
  aceRun_('Localization', () => {
    acePullTranslations();
    const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.translations);
    if (!sheet || sheet.getLastRow() < 2) return;
    const headers = aceHeaders_(sheet);
    const locales = aceActiveLocales_();
    let missing = 0, draft = 0, review = 0;
    for (let row = 2; row <= sheet.getLastRow(); row += 1) {
      locales.forEach(locale => {
        const value = sheet.getRange(row, headers.indexOf(locale.code.toUpperCase()) + 1).getValue();
        const status = String(sheet.getRange(row, headers.indexOf(`${locale.code.toUpperCase()} Status`) + 1).getValue()).toLowerCase();
        if (!String(value).trim()) missing += 1;
        else if (status === 'draft') draft += 1;
        else if (status === 'review') review += 1;
      });
    }
    SpreadsheetApp.getUi().alert(`Localization report\nMissing: ${missing}\nDraft: ${draft}\nReview: ${review}`);
  });
}

function aceSaveGames_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.games);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headers = aceHeaders_(sheet);
  let saved = 0;
  aceDataRows_(sheet).forEach(({ rowNumber, object }) => {
    if (!aceBool_(object.Changed)) return;
    try {
      const payload = aceValidateGameRow_(object);
      const id = String(object['Game ID'] || '').trim();
      let record;
      if (id) {
        aceCheckRevision_('games', id, object.Revision);
        record = aceRequest_(`/items/games/${encodeURIComponent(id)}`, { method: 'patch', payload });
      } else {
        record = aceRequest_('/items/games', { method: 'post', payload });
      }
      aceSetRowValues_(sheet, headers, rowNumber, { 'Game ID': record.id, Changed: false, Status: id ? ACE.statuses.saved : 'Создано в CMS · Draft', Revision: record.updated_at || '' });
      saved += 1;
    } catch (error) {
      aceWriteRowError_(sheet, headers, rowNumber, error);
    }
  });
  return saved;
}

function aceSaveTranslations_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.translations);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headers = aceHeaders_(sheet);
  const locales = aceActiveLocales_();
  let saved = 0;
  aceDataRows_(sheet).forEach(({ rowNumber, object }) => {
    if (!aceBool_(object.Changed)) return;
    try {
      const revisions = aceJson_(object.Revision, {});
      const collection = String(object.__collection);
      const parentField = String(object.__parent_field);
      const parentId = String(object.__parent_id);
      const field = String(object.__field);
      if (!collection || !parentField || !parentId || !field) throw new Error('Translation system metadata is incomplete. Pull translations again.');
      locales.forEach(locale => {
        const valueHeader = locale.code.toUpperCase();
        const statusHeader = `${valueHeader} Status`;
        const value = String(object[valueHeader] || '');
        const status = String(object[statusHeader] || (value ? 'draft' : '')).toLowerCase();
        if (!value && !status) return;
        if (!['draft', 'review', 'approved'].includes(status)) throw new Error(`${statusHeader}: expected draft, review, or approved.`);
        const query = aceQuery_({ [`filter[${parentField}][_eq]`]: parentId, 'filter[locale][_eq]': locale.code, fields: 'id,updated_at,' + field, limit: '1' });
        const existing = aceRequest_(`/items/${collection}?${query}`, { method: 'get' });
        const current = existing[0];
        const expected = revisions[locale.code] || '';
        if (current && expected && String(current.updated_at || '') !== String(expected)) throw new Error(`CONFLICT: ${locale.code.toUpperCase()} translation changed in CMS. Pull before saving.`);
        const body = { [field]: value || null, translation_status: status || 'draft' };
        const savedRecord = current
          ? aceRequest_(`/items/${collection}/${encodeURIComponent(current.id)}`, { method: 'patch', payload: body })
          : aceRequest_(`/items/${collection}`, { method: 'post', payload: Object.assign(body, { [parentField]: parentId, locale: locale.code }) });
        revisions[locale.code] = savedRecord.updated_at || '';
      });
      aceSetRowValues_(sheet, headers, rowNumber, { Changed: false, Status: ACE.statuses.saved, Revision: JSON.stringify(revisions) });
      saved += 1;
    } catch (error) {
      aceWriteRowError_(sheet, headers, rowNumber, error);
    }
  });
  return saved;
}

function aceSaveContent_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.content);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headers = aceHeaders_(sheet);
  const gameMap = aceGameLookup_();
  let saved = 0;
  aceDataRows_(sheet).forEach(({ rowNumber, object }) => {
    if (!aceBool_(object.Changed)) return;
    try {
      const kind = String(object['Item Kind'] || 'section').toLowerCase();
      const id = String(object['Block ID'] || '').trim();
      const asset = aceResolveAsset_(object.Image, `content-${id || Utilities.getUuid()}`);
      let collection, payload;
      if (kind === 'section') {
        collection = 'game_sections';
        const gameId = aceResolveGame_(object.Game, gameMap);
        const type = String(object['Block Type'] || '').trim();
        if (!['rich_text', 'feature_grid', 'bullet_list', 'media_text'].includes(type)) throw new Error('Block Type must be rich_text, feature_grid, bullet_list, or media_text.');
        payload = { game_id: gameId, section_type: type, sort_order: Number(object.Order || 100), enabled: aceBool_(object.Enabled), media_file: asset || null, style_preset: 'default' };
      } else if (kind === 'item') {
        collection = 'game_section_items';
        const parent = String(object['Parent Block ID'] || '').trim();
        if (!parent) throw new Error('Parent Block ID is required for an item.');
        payload = { section_id: parent, sort_order: Number(object.Order || 100), enabled: aceBool_(object.Enabled), image_file: asset || null, icon_file: null };
      } else {
        throw new Error('Item Kind must be section or item.');
      }
      if (id) aceCheckRevision_(collection, id, object.Revision);
      const record = id ? aceRequest_(`/items/${collection}/${encodeURIComponent(id)}`, { method: 'patch', payload }) : aceRequest_(`/items/${collection}`, { method: 'post', payload });
      aceSetRowValues_(sheet, headers, rowNumber, { 'Block ID': record.id, Changed: false, Status: ACE.statuses.saved, Revision: record.updated_at || '' });
      saved += 1;
    } catch (error) {
      aceWriteRowError_(sheet, headers, rowNumber, error);
    }
  });
  return saved;
}

function aceSaveMedia_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ACE.sheets.media);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const headers = aceHeaders_(sheet);
  const gameMap = aceGameLookup_();
  let saved = 0;
  aceDataRows_(sheet).forEach(({ rowNumber, object }) => {
    if (!aceBool_(object.Changed)) return;
    try {
      const role = String(object.Role || '').toLowerCase();
      const mediaId = String(object['Media ID'] || '').trim();
      const parentId = String(object['Parent ID'] || '').trim();
      const asset = aceResolveAsset_(object['Drive URL / File ID / CMS Asset'], `${role}-${mediaId || Utilities.getUuid()}`);
      if (!asset) throw new Error('An image reference is required.');
      let record;
      if (role === 'gallery') {
        const gameId = parentId || aceResolveGame_(object.Game, gameMap);
        if (mediaId) aceCheckRevision_('game_gallery', mediaId, object.Revision);
        const payload = { game_id: gameId, file: asset, sort_order: Number(object.Order || 100), enabled: aceBool_(object.Enabled) };
        record = mediaId ? aceRequest_(`/items/game_gallery/${encodeURIComponent(mediaId)}`, { method: 'patch', payload }) : aceRequest_('/items/game_gallery', { method: 'post', payload });
      } else if (role === 'section') {
        if (!parentId) throw new Error('Parent ID is required for section media.');
        aceCheckRevision_('game_sections', parentId, object.Revision);
        record = aceRequest_(`/items/game_sections/${encodeURIComponent(parentId)}`, { method: 'patch', payload: { media_file: asset, enabled: aceBool_(object.Enabled) } });
      } else if (['hero', 'card', 'card_background', 'card_logo'].includes(role)) {
        if (!parentId) throw new Error('Parent ID is required for game media.');
        aceCheckRevision_('games', parentId, object.Revision);
        const field = { hero: 'hero_image', card: 'card_image', card_background: 'card_background_image', card_logo: 'card_logo_image' }[role];
        record = aceRequest_(`/items/games/${encodeURIComponent(parentId)}`, { method: 'patch', payload: { [field]: asset } });
      } else {
        throw new Error('Role must be hero, card, card_background, card_logo, gallery, or section.');
      }
      aceSetRowValues_(sheet, headers, rowNumber, { 'Media ID': role === 'gallery' ? record.id : (mediaId || `${role}:${parentId}`), 'Drive URL / File ID / CMS Asset': aceAssetUrl_(asset), Changed: false, Status: ACE.statuses.saved, Revision: record.updated_at || '' });
      saved += 1;
    } catch (error) {
      aceWriteRowError_(sheet, headers, rowNumber, error);
    }
  });
  return saved;
}

function aceValidateGameRow_(row) {
  const name = String(row.Name || '').trim();
  const slug = String(row.Slug || '').trim();
  const releaseStatus = String(row['Release Status'] || 'coming_soon').trim().toLowerCase();
  const gameType = String(row['Game Type'] || '').trim().toLowerCase();
  const rtpMode = String(row['RTP Mode'] || 'fixed').trim().toLowerCase();
  const rtp = aceNullableNumber_(row.RTP);
  const volatility = String(row.Volatility || '').split(/[,;/]/).map(value => value.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean);
  const betMin = aceNullableNumber_(row['Bet Min']);
  const betMax = aceNullableNumber_(row['Bet Max']);
  const demoEnabled = aceBool_(row['Demo Enabled']);
  const demoMode = String(row['Demo Mode'] || '').trim().toLowerCase() || null;
  if (!name) throw new Error('Name is required.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug must use lowercase letters, numbers, and single hyphens.');
  if (!['live', 'coming_soon'].includes(releaseStatus)) throw new Error('Release Status must be live or coming_soon.');
  if (!['slot', 'instant', 'crash', 'table'].includes(gameType)) throw new Error('Game Type must be slot, instant, crash, or table.');
  if (!['fixed', 'configurable'].includes(rtpMode)) throw new Error('RTP Mode must be fixed or configurable.');
  if (rtpMode === 'fixed' && (rtp === null || rtp < 0.8 || rtp > 0.995)) throw new Error('Fixed RTP must be between 0.8 and 0.995.');
  if (!volatility.length || volatility.some(value => !['low', 'medium', 'high', 'very_high'].includes(value))) throw new Error('Volatility needs one or more valid values.');
  if (betMin !== null && betMax !== null && betMin > betMax) throw new Error('Bet Min cannot exceed Bet Max.');
  if (demoEnabled && demoMode === 'adapter' && !aceUuid_(String(row['Adapter Game ID'] || ''))) throw new Error('Enabled adapter demo requires a UUID.');
  if (demoEnabled && demoMode === 'direct' && (!String(row['Direct Build'] || '').trim() || !Number(row['Direct Version']))) throw new Error('Enabled direct demo requires build and version.');
  return {
    internal_name: name, slug, release_status: releaseStatus, sort_order: Number(row.Order || 100), game_type: gameType,
    rtp_mode: rtpMode, rtp: rtpMode === 'fixed' ? rtp : null, volatility,
    max_win_value: aceNullableNumber_(row['Max Win']), max_win_unit: String(row['Max Win Unit'] || '').trim() || null, max_win_approx: aceBool_(row.Approx),
    bet_min: betMin, bet_max: betMax, demo_enabled: demoEnabled, demo_mode: demoEnabled ? demoMode : null,
    demo_game_id: demoEnabled && demoMode === 'adapter' ? String(row['Adapter Game ID']).trim() : null,
    direct_build: demoEnabled && demoMode === 'direct' ? String(row['Direct Build']).trim() : null,
    direct_version: demoEnabled && demoMode === 'direct' ? Number(row['Direct Version']) : null,
    api_host: demoEnabled && demoMode === 'direct' ? String(row['API Host'] || '').trim() || null : null,
    hero_image: aceResolveAsset_(row['Hero Image'], `hero-${slug}`), card_image: aceResolveAsset_(row['Game Cover'], `card-${slug}`),
    card_background_image: aceResolveAsset_(row['Card Background'], `card-background-${slug}`), card_logo_image: aceResolveAsset_(row['Card Logo'], `card-logo-${slug}`),
  };
}

function aceGameToRow_(game) {
  return aceArrayRow_(ACE.gameHeaders, {
    'Game ID': game.id, Name: game.internal_name, Slug: game.slug, 'Release Status': game.release_status, Order: game.sort_order, 'Game Type': game.game_type,
    'RTP Mode': game.rtp_mode, RTP: game.rtp, Volatility: Array.isArray(game.volatility) ? game.volatility.join(', ') : '', 'Max Win': game.max_win_value,
    'Max Win Unit': game.max_win_unit, Approx: game.max_win_approx, 'Bet Min': game.bet_min, 'Bet Max': game.bet_max, 'Demo Enabled': game.demo_enabled,
    'Demo Mode': game.demo_mode, 'Adapter Game ID': game.demo_game_id, 'Direct Build': game.direct_build, 'Direct Version': game.direct_version, 'API Host': game.api_host,
    'Hero Image': aceAssetRef_(game.hero_image), 'Game Cover': aceAssetRef_(game.card_image), 'Card Background': aceAssetRef_(game.card_background_image), 'Card Logo': aceAssetRef_(game.card_logo_image),
    Changed: false, Publish: false, Status: ACE.statuses.draft, Revision: game.updated_at || '',
  });
}

function aceTranslationDescriptors_() {
  const descriptors = [];
  aceList_('site_strings', 'id,key,page,section,context,type,translations.*').forEach(item => descriptors.push({ key: item.key, scope: 'Site', entity: '', page: item.page, section: item.section, context: item.context || '', type: item.type, collection: 'site_string_translations', parentField: 'site_string_id', parentId: item.id, field: 'value', translations: item.translations || [] }));
  aceList_('faq_items', 'id,sort_order,translations.*').forEach(item => [['question', 'Question', 'plain'], ['answer_markdown', 'Answer', 'rich']].forEach(([field, label, type]) => descriptors.push({ key: `faq:${item.id}:${field}`, scope: 'Website', entity: `FAQ ${item.sort_order}`, page: 'Home', section: label, context: item.id, type, collection: 'faq_item_translations', parentField: 'faq_item_id', parentId: item.id, field, translations: item.translations || [] })));
  const gameFields = [['display_name', 'Name', 'plain'], ['short_description', 'Short description', 'plain'], ['overview', 'Overview', 'rich'], ['main_feature', 'Main feature', 'plain'], ['layout_display', 'Layout', 'plain'], ['seo_title', 'SEO title', 'seo_title'], ['seo_description', 'SEO description', 'seo_description'], ['card_alt', 'Card alt', 'aria'], ['hero_alt', 'Hero alt', 'aria']];
  aceList_('games', 'id,slug,internal_name,translations.*').forEach(game => gameFields.forEach(([field, section, type]) => descriptors.push({ key: `game:${game.slug}:${field}`, scope: 'Game', entity: game.internal_name, page: 'Game', section, context: game.slug, type, collection: 'game_translations', parentField: 'game_id', parentId: game.id, field, translations: game.translations || [] })));
  aceList_('game_sections', 'id,game_id,section_type,translations.*').forEach(section => [['heading', 'Heading', 'plain'], ['body_markdown', 'Body', 'rich']].forEach(([field, label, type]) => descriptors.push({ key: `section:${section.id}:${field}`, scope: 'Game Content', entity: aceId_(section.game_id), page: 'Game', section: `${section.section_type} · ${label}`, context: section.id, type, collection: 'game_section_translations', parentField: 'section_id', parentId: section.id, field, translations: section.translations || [] })));
  aceList_('game_section_items', 'id,section_id,translations.*').forEach(item => [['title', 'Item title', 'plain'], ['text', 'Item text', 'plain']].forEach(([field, label, type]) => descriptors.push({ key: `item:${item.id}:${field}`, scope: 'Game Content', entity: aceId_(item.section_id), page: 'Game', section: label, context: item.id, type, collection: 'game_section_item_translations', parentField: 'item_id', parentId: item.id, field, translations: item.translations || [] })));
  aceList_('game_gallery', 'id,game_id,translations.*').forEach(item => [['alt', 'Gallery alt', 'aria'], ['caption', 'Gallery caption', 'plain']].forEach(([field, label, type]) => descriptors.push({ key: `gallery:${item.id}:${field}`, scope: 'Media', entity: aceId_(item.game_id), page: 'Game', section: label, context: item.id, type, collection: 'game_gallery_translations', parentField: 'gallery_id', parentId: item.id, field, translations: item.translations || [] })));
  return descriptors;
}

function aceTranslationRow_(descriptor, locales, headers) {
  const values = { Key: descriptor.key, Scope: descriptor.scope, Entity: descriptor.entity, Page: descriptor.page, Section: descriptor.section, Context: descriptor.context, Type: descriptor.type, Changed: false, Publish: false, Status: ACE.statuses.draft, __collection: descriptor.collection, __parent_field: descriptor.parentField, __parent_id: descriptor.parentId, __field: descriptor.field };
  const revisions = {};
  locales.forEach(locale => {
    const translation = (descriptor.translations || []).find(item => String(aceId_(item.locale)) === locale.code);
    values[locale.code.toUpperCase()] = translation ? translation[descriptor.field] || '' : '';
    values[`${locale.code.toUpperCase()} Status`] = translation ? translation.translation_status || 'draft' : '';
    revisions[locale.code] = translation ? translation.updated_at || '' : '';
  });
  values.Revision = JSON.stringify(revisions);
  return aceArrayRow_(headers, values);
}

function aceCollectPublishSelections_() {
  return {
    games: aceSelectedIds_(ACE.sheets.games, 'Game ID'),
    translations: aceSelectedIds_(ACE.sheets.translations, 'Key'),
    content: aceSelectedIds_(ACE.sheets.content, 'Block ID'),
    media: aceSelectedIds_(ACE.sheets.media, 'Media ID'),
  };
}

function aceSelectedIds_(sheetName, idHeader) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return aceDataRows_(sheet).filter(row => aceBool_(row.object.Publish)).map(row => String(row.object[idHeader] || '')).filter(Boolean);
}

function aceSetSelectedStatuses_(status, clearPublish) {
  Object.values(ACE.sheets).forEach(sheetName => {
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    const headers = aceHeaders_(sheet);
    aceDataRows_(sheet).forEach(({ rowNumber, object }) => {
      if (!aceBool_(object.Publish)) return;
      aceSetRowValues_(sheet, headers, rowNumber, Object.assign({ Status: status }, clearPublish ? { Publish: false } : {}));
    });
  });
}

function aceAssertTrustedPublisher_() {
  const allowed = String(PropertiesService.getScriptProperties().getProperty('ACE_TRUSTED_PUBLISHERS') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const user = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!allowed.length) throw new Error('Publishing is disabled until ACE_TRUSTED_PUBLISHERS is configured.');
  if (!user || !allowed.includes(user)) throw new Error('Your Google account is not allowed to publish production releases.');
}

function aceResolveAsset_(value, title) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const uuid = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (uuid && (raw === uuid[0] || raw.includes('/assets/'))) return uuid[0];
  const driveId = aceDriveFileId_(raw);
  if (driveId) return aceUploadDriveFile_(driveId, title);
  if (/^https:\/\//i.test(raw)) {
    const result = aceRequest_('/files/import', { method: 'post', payload: { url: raw, data: { title } } });
    return result.id;
  }
  throw new Error('Media must be a Drive ID/URL, public HTTPS URL, CMS asset URL, or CMS UUID.');
}

function aceUploadDriveFile_(fileId, title) {
  const props = PropertiesService.getScriptProperties();
  const key = `ACE_DRIVE_ASSET_${fileId}`;
  const cached = props.getProperty(key);
  if (cached) {
    try { aceRequest_(`/files/${encodeURIComponent(cached)}?fields=id`, { method: 'get' }); return cached; } catch (error) { props.deleteProperty(key); }
  }
  const file = DriveApp.getFileById(fileId);
  const mime = file.getMimeType();
  if (!/^image\/(?:avif|gif|jpeg|png|svg\+xml|webp)$/i.test(mime)) throw new Error(`Unsupported Drive MIME type: ${mime}`);
  const max = Number(props.getProperty('ACE_MAX_UPLOAD_BYTES') || ACE.maxUploadBytes);
  if (file.getSize() > max) throw new Error(`Drive file exceeds ${Math.round(max / 1024 / 1024)} MB.`);
  const blob = file.getBlob().setName(file.getName());
  const response = aceFetch_('/files', { method: 'post', payload: { title: title || file.getName(), file: blob } });
  const asset = aceParseResponse_(response).data;
  props.setProperty(key, asset.id);
  return asset.id;
}

function aceDriveFileId_(value) {
  if (/^[A-Za-z0-9_-]{20,}$/.test(value)) return value;
  const match = value.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/);
  return match ? match[1] : null;
}

function aceCheckRevision_(collection, id, expected) {
  if (!expected) return;
  const current = aceRequest_(`/items/${collection}/${encodeURIComponent(id)}?fields=id,updated_at`, { method: 'get' });
  if (String(current.updated_at || '') !== String(expected)) throw new Error('CONFLICT: CMS item changed after the last Sheet sync. Reload the row before saving.');
}

function aceReplacePreservingDirty_(name, headers, remoteRows, keyHeader, revisionHeader) {
  const spreadsheet = SpreadsheetApp.getActive();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const oldHeaders = sheet.getLastColumn() ? aceHeaders_(sheet) : [];
  const dirty = new Map();
  if (oldHeaders.includes('Changed') && oldHeaders.includes(keyHeader)) {
    aceDataRows_(sheet).forEach(({ array, object }) => {
      if (aceBool_(object.Changed)) dirty.set(String(object[keyHeader]), { array, revision: String(object[revisionHeader] || '') });
    });
  }
  const keyIndex = headers.indexOf(keyHeader);
  const revisionIndex = headers.indexOf(revisionHeader);
  const statusIndex = headers.indexOf('Status');
  const merged = remoteRows.map(remote => {
    const local = dirty.get(String(remote[keyIndex]));
    if (!local || local.array.length !== headers.length) return remote;
    if (String(remote[revisionIndex] || '') !== local.revision) local.array[statusIndex] = 'CONFLICT: CMS changed. Reload or reconcile this row.';
    dirty.delete(String(remote[keyIndex]));
    return local.array;
  }).concat(Array.from(dirty.values()).map(value => value.array));
  sheet.clear();
  const values = [headers].concat(merged.length ? merged : [headers.map(() => '')]);
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  return sheet;
}

function aceStyleSheet_(sheet, hiddenHeaders) {
  const headers = aceHeaders_(sheet);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
  hiddenHeaders.forEach(header => { const index = headers.indexOf(header) + 1; if (index) sheet.hideColumns(index); });
  ['Changed', 'Publish'].forEach(header => { const index = headers.indexOf(header) + 1; if (index && sheet.getMaxRows() > 1) sheet.getRange(2, index, sheet.getMaxRows() - 1).insertCheckboxes(); });
  aceInstallFilter_(sheet);
}

function aceApplyTranslationFormatting_(sheet, locales) {
  const headers = aceHeaders_(sheet);
  const rules = [];
  locales.forEach(locale => {
    const valueColumn = headers.indexOf(locale.code.toUpperCase()) + 1;
    const statusColumn = headers.indexOf(`${locale.code.toUpperCase()} Status`) + 1;
    if (!valueColumn || !statusColumn) return;
    const valueRange = sheet.getRange(2, valueColumn, Math.max(1, sheet.getMaxRows() - 1));
    const statusRange = sheet.getRange(2, statusColumn, Math.max(1, sheet.getMaxRows() - 1));
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenCellEmpty().setBackground(ACE.colors.missing).setRanges([valueRange]).build());
    [['draft', ACE.colors.draft], ['review', ACE.colors.review], ['approved', ACE.colors.approved]].forEach(([status, color]) => rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(status).setBackground(color).setRanges([statusRange]).build()));
    statusRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['draft', 'review', 'approved'], true).setAllowInvalid(false).build());
  });
  sheet.setConditionalFormatRules(rules);
}

function aceApplyGameValidation_(sheet) {
  const headers = aceHeaders_(sheet);
  aceSetListValidation_(sheet, headers, 'Release Status', ['live', 'coming_soon']);
  aceSetListValidation_(sheet, headers, 'Game Type', ['slot', 'instant', 'crash', 'table']);
  aceSetListValidation_(sheet, headers, 'RTP Mode', ['fixed', 'configurable']);
  aceSetListValidation_(sheet, headers, 'Max Win Unit', ['x', 'coins']);
  aceSetListValidation_(sheet, headers, 'Demo Mode', ['', 'adapter', 'direct']);
}

function aceApplyContentValidation_(sheet) {
  const headers = aceHeaders_(sheet);
  aceSetListValidation_(sheet, headers, 'Block Type', ['', 'rich_text', 'feature_grid', 'bullet_list', 'media_text']);
  aceSetListValidation_(sheet, headers, 'Item Kind', ['section', 'item']);
}

function aceApplyMediaValidation_(sheet) {
  const headers = aceHeaders_(sheet);
  aceSetListValidation_(sheet, headers, 'Role', ['hero', 'card', 'card_background', 'card_logo', 'gallery', 'section']);
}

function aceSetListValidation_(sheet, headers, header, values) {
  const column = headers.indexOf(header) + 1;
  if (!column || sheet.getMaxRows() < 2) return;
  sheet.getRange(2, column, sheet.getMaxRows() - 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build());
}

function aceInstallFilter_(sheet) {
  const existing = sheet.getFilter();
  if (existing) existing.remove();
  if (sheet.getLastRow() > 1 && sheet.getLastColumn()) sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).createFilter();
}

function aceSetRowValues_(sheet, headers, rowNumber, updates) {
  Object.keys(updates).forEach(header => {
    const column = headers.indexOf(header) + 1;
    if (column) sheet.getRange(rowNumber, column).setValue(updates[header]);
  });
}

function aceWriteRowError_(sheet, headers, rowNumber, error) {
  const message = String(error && error.message ? error.message : error);
  const conflict = message.startsWith('CONFLICT');
  const statusColumn = headers.indexOf('Status') + 1;
  if (statusColumn) sheet.getRange(rowNumber, statusColumn).setValue(conflict ? message : `ERROR: ${message}`).setNote(error && error.stack ? String(error.stack) : message).setBackground(conflict ? ACE.colors.conflict : ACE.colors.missing);
}

function aceGameLookup_() {
  const games = aceList_('games', 'id,slug,internal_name');
  const map = {};
  games.forEach(game => { map[game.id] = game.id; map[String(game.slug).toLowerCase()] = game.id; map[String(game.internal_name).toLowerCase()] = game.id; });
  return map;
}

function aceGameNameMap_() {
  return Object.fromEntries(aceList_('games', 'id,internal_name').map(game => [game.id, game.internal_name]));
}

function aceResolveGame_(value, lookup) {
  const key = String(value || '').trim();
  const id = lookup[key] || lookup[key.toLowerCase()];
  if (!id) throw new Error(`Unknown game: ${key}`);
  return id;
}

function aceActiveLocales_() {
  return aceList_('locales', '*').filter(locale => aceBool_(locale.is_active)).sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
}

function aceList_(collection, fields) {
  return aceRequest_(`/items/${collection}?${aceQuery_({ fields: fields || '*', limit: '-1' })}`, { method: 'get' });
}

function aceQuery_(parameters) {
  return Object.keys(parameters)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
    .join('&');
}

function aceRequest_(path, options) {
  const response = aceFetch_(path, options || {});
  return aceParseResponse_(response).data;
}

function aceFetch_(path, options) {
  const props = PropertiesService.getScriptProperties();
  const base = String(props.getProperty('ACE_CMS_URL') || '').replace(/\/$/, '');
  const token = String(props.getProperty('ACE_CMS_SYNC_TOKEN') || '');
  if (!base || !token) throw new Error('Run Ace CMS → 1. Настроить подключение.');
  const request = Object.assign({ method: 'get', muteHttpExceptions: true, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }, options || {});
  const isBlobPayload = request.payload && request.payload.file && typeof request.payload.file.getBytes === 'function';
  if (request.payload && !isBlobPayload) {
    request.contentType = 'application/json';
    request.payload = JSON.stringify(request.payload);
  }
  return UrlFetchApp.fetch(`${base}${path}`, request);
}

function aceParseResponse_(response) {
  const status = response.getResponseCode();
  const text = response.getContentText();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch (error) { throw new Error(`CMS returned invalid JSON (${status}).`); }
  if (status < 200 || status >= 300) {
    const detail = body && body.errors && body.errors[0] ? body.errors[0].message : text;
    const error = new Error(`CMS ${status}: ${detail || 'request failed'}`);
    error.httpStatus = status;
    throw error;
  }
  return body;
}

function aceHeaders_(sheet) {
  if (!sheet.getLastColumn()) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(String);
}

function aceDataRows_(sheet) {
  const headers = aceHeaders_(sheet);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().map((array, index) => ({ rowNumber: index + 2, array, object: Object.fromEntries(headers.map((header, column) => [header, array[column]])) }));
}

function aceArrayRow_(headers, object) {
  return headers.map(header => Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '');
}

function aceBool_(value) {
  return value === true || String(value).toLowerCase() === 'true' || value === 1;
}

function aceNullableNumber_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error(`Expected a number, received ${value}.`);
  return number;
}

function aceUuid_(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function aceId_(value) {
  return value && typeof value === 'object' ? value.id || value.code || '' : value || '';
}

function aceAssetRef_(value) {
  const id = aceId_(value);
  return id ? aceAssetUrl_(id) : '';
}

function aceAssetUrl_(id) {
  const base = String(PropertiesService.getScriptProperties().getProperty('ACE_CMS_URL') || '').replace(/\/$/, '');
  return `${base}/assets/${id}`;
}

function aceJson_(value, fallback) {
  try { return value ? JSON.parse(String(value)) : fallback; } catch (error) { return fallback; }
}

function aceRun_(label, operation) {
  const spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.toast(`${label}…`, 'Ace CMS', 4);
  try { return operation(); }
  catch (error) {
    console.error(error);
    SpreadsheetApp.getUi().alert(`Ace CMS · ${label}`, String(error && error.message ? error.message : error), SpreadsheetApp.getUi().ButtonSet.OK);
    throw error;
  }
}
