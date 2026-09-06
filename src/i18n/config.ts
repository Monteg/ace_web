import fs from 'node:fs';
import path from 'node:path';

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

export function getActiveLocales(): SiteLocale[] {
  if ((import.meta.env.CONTENT_SOURCE ?? 'local') !== 'cms') return [defaultLocaleConfig];
  const metaPath = path.resolve(process.cwd(), 'src', 'generated', 'cms', 'meta.json');
  if (!fs.existsSync(metaPath)) throw new Error('CMS content is enabled but generated locale metadata is missing. Run npm run cms:sync.');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { locales?: Record<string, unknown>[] };
  const locales = (meta.locales ?? [])
    .filter((locale) => Boolean(locale.is_active))
    .map((locale) => ({
      code: String(locale.code),
      name: String(locale.name),
      nativeName: String(locale.native_name),
      isDefault: Boolean(locale.is_default),
      isActive: Boolean(locale.is_active),
      sortOrder: Number(locale.sort_order),
      fallbackLocale: locale.fallback_locale ? String(locale.fallback_locale) : null,
      direction: locale.direction === 'rtl' ? 'rtl' as const : 'ltr' as const,
      hreflang: String(locale.hreflang),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const defaults = locales.filter((locale) => locale.isDefault);
  if (defaults.length !== 1 || defaults[0]?.code !== defaultLocale) throw new Error('Exactly one active English default locale is required.');
  return locales;
}
