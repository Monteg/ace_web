import type { CmsLiveImage } from './content-source';

interface LiveSnapshot {
  fetchedAt: number;
  cmsUrl: string;
  locales: any[];
  games: any[];
  siteStrings: any[];
  faqItems: any[];
}

interface CmsGlobalCache {
  snapshot: LiveSnapshot | null;
  pending: Promise<LiveSnapshot> | null;
  token: string | null;
  tokenExpiresAt: number;
}

const globalCache = globalThis as typeof globalThis & { __aceCmsLive?: CmsGlobalCache };
globalCache.__aceCmsLive ??= { snapshot: null, pending: null, token: null, tokenExpiresAt: 0 };
const cache = globalCache.__aceCmsLive;

function env(name: string): string {
  return String(import.meta.env[name] ?? process.env[name] ?? '').trim();
}

function cmsUrl(): string {
  return (env('CMS_URL') || 'http://localhost:8055').replace(/\/$/, '');
}

function ttlMs(): number {
  const seconds = Number(env('CMS_LIVE_CACHE_SECONDS') || 5);
  return Math.max(1, Math.min(60, Number.isFinite(seconds) ? seconds : 5)) * 1000;
}

async function request(pathname: string, token?: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${cmsUrl()}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.errors?.map((error: any) => error.message).join('; ') || response.statusText;
    throw new Error(`Ace CMS ${response.status}: ${detail}`);
  }
  return body?.data ?? body;
}

async function accessToken(): Promise<string> {
  const staticToken = env('CMS_LIVE_TOKEN') || env('CMS_BUILD_TOKEN');
  if (staticToken) return staticToken;
  if (cache.token && cache.tokenExpiresAt > Date.now()) return cache.token;
  const email = env('DIRECTUS_ADMIN_EMAIL');
  const password = env('DIRECTUS_ADMIN_PASSWORD');
  if (!email || !password) throw new Error('Live CMS mode needs CMS_LIVE_TOKEN (or CMS_BUILD_TOKEN) or local Directus admin credentials.');
  const auth = await request('/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, password, mode: 'json' }),
  });
  cache.token = auth.access_token;
  cache.tokenExpiresAt = Date.now() + Math.max(60_000, Number(auth.expires ?? 900_000) - 30_000);
  return String(cache.token);
}

function query(fields: string, filter?: Record<string, string>): string {
  const params = new URLSearchParams({ fields, limit: '-1', ...(filter ?? {}) });
  return params.toString();
}

async function loadSnapshot(): Promise<LiveSnapshot> {
  const token = await accessToken();
  const [locales, games, siteStrings, faqItems] = await Promise.all([
    request(`/items/locales?${query('*', { 'filter[is_active][_eq]': 'true', sort: 'sort_order' })}`, token),
    request(`/items/games?${query('*,translations.*,sections.*,sections.translations.*,sections.items.*,sections.items.translations.*,gallery.*,gallery.translations.*,card_image.*,hero_image.*,card_background_image.*,card_logo_image.*,sections.media_file.*,sections.items.icon_file.*,sections.items.image_file.*,gallery.file.*', { sort: 'sort_order,internal_name' })}`, token),
    request(`/items/site_strings?${query('*,translations.*', { 'filter[active][_eq]': 'true', sort: 'page,section,sort_order' })}`, token),
    request(`/items/faq_items?${query('*,translations.*', { 'filter[enabled][_eq]': 'true', sort: 'sort_order' })}`, token),
  ]);
  return { fetchedAt: Date.now(), cmsUrl: cmsUrl(), locales, games, siteStrings, faqItems };
}

export async function getLiveCmsSnapshot(options: { fresh?: boolean } = {}): Promise<LiveSnapshot> {
  if (!options.fresh && cache.snapshot && Date.now() - cache.snapshot.fetchedAt < ttlMs()) return cache.snapshot;
  if (!cache.pending) {
    cache.pending = loadSnapshot()
      .then((snapshot) => {
        cache.snapshot = snapshot;
        return snapshot;
      })
      .catch((error) => {
        if (cache.snapshot) {
          console.warn(`[cms live] ${error.message}; serving the last successful snapshot.`);
          return cache.snapshot;
        }
        throw error;
      })
      .finally(() => { cache.pending = null; });
  }
  return cache.pending;
}

export function clearLiveCmsCache(): void {
  cache.snapshot = null;
  cache.pending = null;
}

function relationId(value: any): string {
  return String(value?.id ?? value?.code ?? value ?? '');
}

export function approvedTranslation(items: any[], locale: string, english = 'en'): any {
  const requested = (items ?? []).find((entry) => relationId(entry.locale) === locale && entry.translation_status === 'approved');
  if (requested) return requested;
  const fallback = (items ?? []).find((entry) => relationId(entry.locale) === english && entry.translation_status === 'approved');
  if (!fallback) throw new Error(`Missing approved English CMS translation (${locale}).`);
  if (locale !== english) console.warn(`[cms live fallback] ${locale} -> ${english}`);
  return fallback;
}

export function cmsLiveImage(file: any, cmsBaseUrl: string): CmsLiveImage {
  const id = relationId(file);
  if (!id) throw new Error('CMS image relation is empty.');
  const type = String(file?.type ?? 'image/webp');
  const format = type.split('/')[1]?.replace('jpeg', 'jpg') || 'webp';
  return {
    cmsLive: true,
    id,
    src: `${cmsBaseUrl}/assets/${id}`,
    width: Number(file?.width) || 1600,
    height: Number(file?.height) || 900,
    format,
  };
}

export function liveSiteMessages(snapshot: LiveSnapshot, locale: string): Record<string, string> {
  const output: Record<string, string> = {};
  for (const slot of snapshot.siteStrings) {
    const entry = (slot.translations ?? []).find((item: any) => relationId(item.locale) === locale && item.translation_status === 'approved');
    if (entry && String(entry.value ?? '').trim()) output[slot.key] = String(entry.value);
  }
  return output;
}

export function liveFaq(snapshot: LiveSnapshot, locale: string): { id: string; question: string; answerMarkdown: string }[] {
  return snapshot.faqItems.filter((item) => (item.translations ?? []).some((entry: any) => relationId(entry.locale) === 'en' && entry.translation_status === 'approved')).map((item) => {
    const english = approvedTranslation(item.translations, 'en');
    const entry = approvedTranslation(item.translations, locale);
    return {
      id: item.id,
      question: String(entry.question ?? '').trim() ? entry.question : english.question,
      answerMarkdown: String(entry.answer_markdown ?? '').trim() ? entry.answer_markdown : english.answer_markdown,
    };
  });
}
