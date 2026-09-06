import fs from 'node:fs';
import path from 'node:path';
import { getLiveCmsSnapshot } from '../lib/cms-live';
import { cmsContentMode, contentSource } from '../lib/cms-mode';

export interface SiteLocale {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  fallbackLocale: string | null;
  direction: 'ltr' | 'rtl';
  hreflang: string;
}

export const defaultLocale = 'en';
export const defaultLocaleConfig: SiteLocale = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  isDefault: true,
  isActive: true,
  sortOrder: 1,
  fallbackLocale: null,
  direction: 'ltr',
  hreflang: 'en',
};

function normalizeLocales(source: Record<string, unknown>[]): SiteLocale[] {
  const locales = source
    .filter((locale) => Boolean(locale.is_active))
    .map((locale) => ({
      code: String(locale.code),
      name: String(locale.name),
      nativeName: String(locale.native_name),
      isDefault: Boolean(locale.is_default),
      isActive: Boolean(locale.is_active),
      sortOrder: Number(locale.sort_order),
      fallbackLocale: locale.fallback_locale ? String(typeof locale.fallback_locale === 'object' ? (locale.fallback_locale as any).code : locale.fallback_locale) : null,
      direction: locale.direction === 'rtl' ? 'rtl' as const : 'ltr' as const,
      hreflang: String(locale.hreflang),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const defaults = locales.filter((locale) => locale.isDefault);
  if (defaults.length !== 1 || defaults[0]?.code !== defaultLocale) throw new Error('Exactly one active English default locale is required.');
  return locales;
}

export async function getActiveLocales(): Promise<SiteLocale[]> {
  if (contentSource() !== 'cms') return [defaultLocaleConfig];
  if (cmsContentMode() === 'live') return normalizeLocales((await getLiveCmsSnapshot()).locales);
  const metaPath = path.resolve(process.cwd(), 'src', 'generated', 'cms', 'meta.json');
  if (!fs.existsSync(metaPath)) throw new Error('CMS content is enabled but generated locale metadata is missing. Run npm run cms:sync.');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { locales?: Record<string, unknown>[] };
  return normalizeLocales(meta.locales ?? []);
}
