export const DEFAULT_LOCALE: 'en';
export const LOCALES: readonly ['en', 'it', 'pt', 'es'];
export type Locale = (typeof LOCALES)[number];
export const LOCALE_LABELS: Record<Locale, string>;
