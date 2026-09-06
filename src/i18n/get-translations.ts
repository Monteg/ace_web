import fs from 'node:fs';
import path from 'node:path';
import { englishMessages, type TranslationKey, type TranslationMessages } from './en';
import { defaultLocale, getActiveLocales } from './config';
import { resolveTranslation } from '../../scripts/cms/lib/i18n.mjs';

export type Translate = (key: TranslationKey | string, variables?: Record<string, string | number>) => string;
const warned = new Set<string>();

function cmsMessages(locale: string): TranslationMessages {
  const target = path.resolve(process.cwd(), 'src', 'generated', 'cms', 'site', `${locale}.json`);
  if (!fs.existsSync(target)) return {};
  return JSON.parse(fs.readFileSync(target, 'utf8')) as TranslationMessages;
}

export function getTranslations(locale = defaultLocale): Translate {
  const active = getActiveLocales();
  if (!active.some((item) => item.code === locale)) throw new Error(`Inactive or unknown locale: ${locale}`);
  const fromCms = (import.meta.env.CONTENT_SOURCE ?? 'local') === 'cms';
  const requested = fromCms ? cmsMessages(locale) : {};
  const master = fromCms ? { ...englishMessages, ...cmsMessages(defaultLocale) } : englishMessages;

  return (key, variables = {}) => {
    return resolveTranslation({
      key,
      locale,
      requested,
      english: master,
      variables,
      onFallback: (missingKey: string, missingLocale: string) => {
        if (warned.has(`${missingLocale}:${missingKey}`)) return;
        warned.add(`${missingLocale}:${missingKey}`);
        console.warn(`[i18n fallback] ${missingLocale}:${missingKey} -> ${defaultLocale}`);
      },
    });
  };
}
