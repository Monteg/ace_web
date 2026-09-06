export function interpolate(value, variables = {}) {
  return value.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match,
  );
}

export function resolveTranslation({ key, locale, requested, english, variables = {}, onFallback = (_key, _locale) => {} }) {
  const own = requested[key];
  const fallback = english[key];
  if (locale !== 'en' && !own) onFallback(key, locale);
  if (!own && !fallback) throw new Error(`Missing required English site string: ${key}`);
  return interpolate(own || fallback, variables);
}
