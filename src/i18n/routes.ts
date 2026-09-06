import { defaultLocale, type SiteLocale } from './config';

export function stripLocalePrefix(pathname: string, locales: Pick<SiteLocale, 'code'>[]): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const first = path.split('/')[1];
  if (first && first !== defaultLocale && locales.some((locale) => locale.code === first)) {
    return path.slice(first.length + 1) || '/';
  }
  return path || '/';
}

export function localePath(pathname: string, locale: string, locales: Pick<SiteLocale, 'code'>[] = []): string {
  const base = stripLocalePrefix(pathname, locales);
  if (locale === defaultLocale) return base;
  return base === '/' ? `/${locale}` : `/${locale}${base}`;
}

export function switchLocaleUrl(url: URL, locale: string, locales: Pick<SiteLocale, 'code'>[]): string {
  return `${localePath(url.pathname, locale, locales)}${url.search}${url.hash}`;
}
