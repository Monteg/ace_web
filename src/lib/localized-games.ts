import type { CollectionEntry } from 'astro:content';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import gamesEn from '../generated/content/games.en.json';
import gamesDe from '../generated/content/games.de.json';
import gamesPt from '../generated/content/games.pt.json';
import gamesEs from '../generated/content/games.es.json';
import type { Locale } from './i18n';

type GameMessages = Record<string, Record<string, string>>;
const messages: Record<Locale, GameMessages> = {
  en: gamesEn,
  de: gamesDe,
  pt: gamesPt,
  es: gamesEs,
};

export function gameText(
  slug: string,
  field: string,
  locale: Locale,
  fallback = '',
): string {
  return messages[locale]?.[slug]?.[field]?.trim() || messages.en?.[slug]?.[field]?.trim() || fallback;
}

export function getLocalizedGame(game: CollectionEntry<'games'>, locale: Locale) {
  const data = game.data;
  const configuredFeatureIds = Object.keys(messages.en?.[game.id] ?? {})
    .map((key) => key.match(/^features\.([^.]+)\.(?:title|body)$/u)?.[1])
    .filter((value): value is string => Boolean(value));
  const featureIds = [...new Set([
    ...data.features.map((_feature, index) => `feature_${index + 1}`),
    ...configuredFeatureIds,
  ])];
  const features = featureIds.map((featureId, index) => {
    const feature = data.features[index] ?? { title: '', body: '' };
    return {
      title: gameText(game.id, `features.${featureId}.title`, locale, feature.title),
      body: gameText(game.id, `features.${featureId}.body`, locale, feature.body),
    };
  }).filter((feature) => feature.title || feature.body);

  return {
    ...data,
    name: gameText(game.id, 'display_name', locale, data.name),
    shortDescription: gameText(game.id, 'short_description', locale, data.seo.description),
    seo: {
      title: gameText(game.id, 'seo_title', locale, data.seo.title),
      description: gameText(game.id, 'seo_description', locale, data.seo.description),
    },
    specs: {
      ...data.specs,
      layout: gameText(game.id, 'layout_display', locale, data.specs.layout ?? ''),
    },
    cardAlt: gameText(game.id, 'card_logo_alt', locale, `${data.name} game artwork`),
    heroAlt: gameText(game.id, 'hero_alt', locale, `${data.name} hero artwork`),
    overview: gameText(game.id, 'overview', locale),
    gameplay: gameText(game.id, 'gameplay', locale),
    mainFeatureLabel: gameText(game.id, 'main_feature_label', locale, data.specs.mainFeature ?? 'Main Feature'),
    mainFeatureBody: gameText(game.id, 'main_feature_body', locale),
    bonus: gameText(game.id, 'bonus', locale),
    multiplier: gameText(game.id, 'multiplier', locale),
    designAtmosphere: gameText(game.id, 'design_atmosphere', locale),
    features,
  };
}

export function renderManagedMarkdown(markdown: string): string {
  if (!markdown.trim()) return '';
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'code'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer' },
      }),
    },
  });
}
