import siteEn from '../generated/content/site.en.json';
import siteIt from '../generated/content/site.it.json';
import sitePt from '../generated/content/site.pt.json';
import siteEs from '../generated/content/site.es.json';
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, type Locale } from '../../locales.mjs';

export { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS };
export type { Locale };

const messages: Record<Locale, Record<string, string>> = {
  en: siteEn,
  it: siteIt,
  pt: sitePt,
  es: siteEs,
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && LOCALES.includes(value as Locale));
}

export function localeFromPath(pathname: string, astroLocale?: string): Locale {
  if (isLocale(astroLocale)) return astroLocale;
  const candidate = pathname.split('/').filter(Boolean)[0];
  return isLocale(candidate) ? candidate : DEFAULT_LOCALE;
}

export function stripLocale(pathname: string): string {
  const [pathPart = '/', suffix = ''] = pathname.split(/(?=[?#])/u, 2);
  const pieces = pathPart.split('/').filter(Boolean);
  if (isLocale(pieces[0])) pieces.shift();
  // Astro's `build.format: 'file'` exposes the generated pathname to page
  // components with a terminal `.html`. Public URLs intentionally remain
  // extensionless, so canonical, hreflang, and language-switcher links must
  // normalize the build-time pathname before a locale prefix is applied.
  const base = `/${pieces.join('/')}`.replace(/\.html$/u, '').replace(/\/$/, '') || '/';
  return `${base}${suffix}`;
}

export function localizePath(href: string, locale: Locale): string {
  if (!href || href.startsWith('#') || /^(?:[a-z]+:|\/\/)/iu.test(href)) return href;
  const match = href.match(/^([^?#]*)(.*)$/u);
  const base = stripLocale(match?.[1] || '/');
  const suffix = match?.[2] || '';
  if (locale === DEFAULT_LOCALE) return `${base}${suffix}`;
  return `${base === '/' ? `/${locale}` : `/${locale}${base}`}${suffix}`;
}

export function alternatePaths(pathname: string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, localizePath(stripLocale(pathname), locale)])) as Record<Locale, string>;
}

export function t(
  key: string,
  locale: Locale,
  variables: Record<string, string | number> = {},
): string {
  const template = messages[locale][key]?.trim() || messages.en[key]?.trim();
  if (!template) throw new Error(`Missing English translation for ${key}`);
  return template.replace(/\{([a-zA-Z0-9_]+)\}/gu, (token, name) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : token,
  );
}

export function lowerTypeLabel(type: 'slot' | 'instant' | 'table', locale: Locale): string {
  return t(`global.game_type.${type}_single`, locale).toLocaleLowerCase(locale);
}
