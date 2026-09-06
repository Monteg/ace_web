import crypto from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function deterministicUuid(value) {
  const bytes = crypto.createHash('sha256').update(`ace-games-cms:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function normalizeColumn(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function valueFrom(row, ...names) {
  const entries = new Map(Object.entries(row).map(([key, value]) => [normalizeColumn(key), value]));
  for (const name of names) {
    const value = entries.get(normalizeColumn(name));
    if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  }
  return null;
}

export function parseBoolean(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return null;
}

export function migrateStatus(row) {
  const released = parseBoolean(valueFrom(row, 'Relised', 'Released'));
  const coming = parseBoolean(valueFrom(row, 'Coming', 'Coming Soon'));
  if (released === true && coming === false) return { value: 'live' };
  if (released === false && coming === true) return { value: 'coming_soon' };
  return { value: null, conflict: `Unsupported status combination: released=${released}, coming=${coming}` };
}

export function parseRtp(value) {
  if (!value) return null;
  if (/configurable/i.test(value)) return { mode: 'configurable', value: null };
  const number = Number(String(value).replace('%', '').replace(',', '.').trim());
  if (!Number.isFinite(number)) return null;
  const decimal = number > 1 ? number / 100 : number;
  return { mode: 'fixed', value: decimal };
}

export function parseVolatility(value) {
  if (!value) return [];
  return String(value).toLowerCase().split(/[\/,|]+/).map((item) => item.trim().replace(/\s+/g, '_')).filter((item) => ['low', 'medium', 'high', 'very_high'].includes(item));
}

export function parseMaxWin(value) {
  if (!value) return null;
  const source = String(value).trim();
  const numeric = Number(source.replace(/[^0-9.,]/g, '').replaceAll(',', ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const unit = /coins?/i.test(source) ? 'coins' : /x/i.test(source) ? 'x' : null;
  return { value: numeric, unit, approx: /\+|approx/i.test(source) };
}

export function parseBet(value) {
  if (!value) return null;
  const values = String(value).match(/\d+(?:[.,]\d+)?/g)?.map((part) => Number(part.replace(',', '.'))) ?? [];
  return values.length >= 2 ? { min: values[0], max: values[1] } : null;
}

export function parseDemo(value) {
  if (!value) return { enabled: false, config: null };
  let url;
  try { url = new URL(value); } catch { return { enabled: false, config: null, warning: 'Demo URL is invalid' }; }
  if (url.hostname === 'adapter-api-demo.rstars.cc') {
    const gameId = url.searchParams.get('gameId');
    if (gameId && UUID.test(gameId)) return { enabled: true, config: { mode: 'adapter', gameId } };
    return { enabled: false, config: null, warning: 'Adapter URL has no valid gameId' };
  }
  if (url.hostname === 'cdn.rstars.cc') {
    const parts = url.pathname.split('/').filter(Boolean);
    const version = Number(parts[1]);
    if (parts.length >= 3 && Number.isInteger(version) && version > 0) {
      return { enabled: true, config: { mode: 'direct', build: parts[0], version, apiHost: url.searchParams.get('host') || null } };
    }
    return { enabled: false, config: null, warning: 'Direct URL does not contain build and version' };
  }
  return { enabled: false, config: null, warning: `Unknown demo URL host: ${url.hostname}` };
}

export function normalizeLegacyType(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['slot', 'instant', 'table'].includes(normalized) ? normalized : null;
}

export function firstParagraph(markdown) {
  return String(markdown ?? '').split(/\n\s*\n/).map((part) => part.replace(/^#+\s+/gm, '').trim()).find((part) => part && !part.startsWith('- ')) ?? '';
}

export function compareRecords(current, legacy, fields) {
  const differences = [];
  for (const field of fields) {
    const left = field.split('.').reduce((value, key) => value?.[key], current);
    const right = field.split('.').reduce((value, key) => value?.[key], legacy);
    if (right === undefined || right === null || right === '') continue;
    if (JSON.stringify(left) !== JSON.stringify(right)) differences.push({ field, astro: left ?? null, legacy: right });
  }
  return differences;
}

export function findDuplicateValues(entries, minimumLength = 80) {
  const seen = new Map();
  const duplicates = [];
  for (const entry of entries) {
    const value = String(entry.value ?? '').trim();
    if (value.length < minimumLength) continue;
    const key = crypto.createHash('sha256').update(value).digest('hex');
    const previous = seen.get(key);
    if (previous && previous.owner !== entry.owner) duplicates.push({ first: previous.owner, second: entry.owner, field: entry.field });
    else seen.set(key, entry);
  }
  return duplicates;
}

