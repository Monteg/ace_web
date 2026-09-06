export function interpolate(value: string, variables?: Record<string, string | number>): string;
export function resolveTranslation(input: {
  key: string;
  locale: string;
  requested: Record<string, string>;
  english: Record<string, string>;
  variables?: Record<string, string | number>;
  onFallback?: (key: string, locale: string) => void;
}): string;
