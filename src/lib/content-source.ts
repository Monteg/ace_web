import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { MaxWin, Rtp, Volatility } from './format';

export type GameType = 'slot' | 'instant' | 'crash' | 'table';
export type GameStatus = 'live' | 'coming_soon';
export type GameImage = ImageMetadata;
export type GameDemo = { mode: 'adapter'; gameId: string } | { mode: 'direct'; build: string; version: number; apiHost?: string };

export interface GameSectionItem {
  id: string;
  title: string | null;
  text: string | null;
  icon?: GameImage;
  image?: GameImage;
}

export interface GameSection {
  id: string;
  type: 'rich_text' | 'feature_grid' | 'bullet_list' | 'media_text';
  heading: string | null;
  bodyMarkdown: string;
  stylePreset: string;
  media?: GameImage;
  items: GameSectionItem[];
}

export interface GameRecord {
  id: string;
  source: 'local' | 'cms';
  data: {
    name: string;
    type: GameType;
    status: GameStatus;
    order: number;
    seo: { title: string; description: string };
    card: GameImage;
    cardLayers?: { background: GameImage; logo: GameImage };
    hero: GameImage;
    gallery: { image: GameImage; alt: string; caption?: string | null }[];
    specs: { rtp: Rtp; maxWin?: MaxWin; volatility: Volatility[]; bet?: { min: number; max: number }; mainFeature?: string; layout?: string };
    demo?: GameDemo;
    highlights: string[];
    features: { title: string; body: string }[];
    overviewMarkdown: string;
    shortDescription: string;
    sections: GameSection[];
  };
}

const cmsAssetModules = import.meta.glob<{ default: ImageMetadata }>('../generated/cms/assets/*', { eager: true });

function cmsAsset(id: string, manifest: Record<string, string>): ImageMetadata {
  const filename = manifest[id];
  if (!filename) throw new Error(`CMS asset ${id} is not present in the release manifest.`);
  const match = Object.entries(cmsAssetModules).find(([modulePath]) => modulePath.endsWith(`/${filename}`));
  if (!match) throw new Error(`Generated CMS asset ${filename} was not imported by Astro.`);
  return match[1].default;
}

function fromLocal(entry: CollectionEntry<'games'>): GameRecord {
  return {
    id: entry.id,
    source: 'local',
    data: {
      ...entry.data,
      type: entry.data.type as GameType,
      overviewMarkdown: entry.body?.trim() ?? '',
      shortDescription: entry.data.seo.description,
      sections: [],
    },
  };
}

function approved<T extends { translation_status?: string }>(value: T | null | undefined): value is T {
  return Boolean(value && value.translation_status === 'approved');
}

function chooseTranslation<T extends { translation_status?: string }>(requested: T | null | undefined, english: T | null | undefined, warning: string): T {
  if (approved(requested)) return requested;
  if (approved(english)) {
    console.warn(`[cms fallback] ${warning}`);
    return english;
  }
  throw new Error(`Missing approved English fallback: ${warning}`);
}

function loadCmsGames(locale: string): GameRecord[] {
  const root = path.resolve(process.cwd(), 'src', 'generated', 'cms');
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8'));
  const shared = JSON.parse(fs.readFileSync(path.join(root, 'games', 'shared.json'), 'utf8'));
  const requested = JSON.parse(fs.readFileSync(path.join(root, 'games', `${locale}.json`), 'utf8'));
  const english = locale === 'en' ? requested : JSON.parse(fs.readFileSync(path.join(root, 'games', 'en.json'), 'utf8'));

  return shared.map((game: any) => {
    const localized = chooseTranslation(requested[game.id]?.game, english[game.id]?.game, `${game.slug}: game translation (${locale})`);
    const sections: GameSection[] = game.sections
      .filter((section: any) => section.enabled)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((section: any) => {
        const translation = chooseTranslation(requested[game.id]?.sections?.[section.id], english[game.id]?.sections?.[section.id], `${game.slug}: section ${section.id} (${locale})`);
        return {
          id: section.id,
          type: section.section_type,
          heading: translation.heading ?? null,
          bodyMarkdown: translation.body_markdown ?? '',
          stylePreset: section.style_preset,
          media: section.media_file ? cmsAsset(section.media_file, meta.assets) : undefined,
          items: section.items
            .filter((item: any) => item.enabled)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((item: any) => {
              const itemTranslation = chooseTranslation(requested[game.id]?.items?.[item.id], english[game.id]?.items?.[item.id], `${game.slug}: section item ${item.id} (${locale})`);
              return { id: item.id, title: itemTranslation.title ?? null, text: itemTranslation.text ?? null, icon: item.icon_file ? cmsAsset(item.icon_file, meta.assets) : undefined, image: item.image_file ? cmsAsset(item.image_file, meta.assets) : undefined };
            }),
        };
      });
    const gallery = game.gallery
      .filter((item: any) => item.enabled)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((item: any) => {
        const translation = chooseTranslation(requested[game.id]?.gallery?.[item.id], english[game.id]?.gallery?.[item.id], `${game.slug}: gallery ${item.id} (${locale})`);
        return { image: cmsAsset(item.file, meta.assets), alt: translation.alt, caption: translation.caption ?? null };
      });
    const maxWin = game.max_win_value == null ? undefined : { value: Number(game.max_win_value), unit: game.max_win_unit, approx: Boolean(game.max_win_approx) };
    const bet = game.bet_min == null || game.bet_max == null ? undefined : { min: Number(game.bet_min), max: Number(game.bet_max) };
    const demo: GameDemo | undefined = !game.demo_enabled ? undefined : game.demo_mode === 'adapter'
      ? { mode: 'adapter', gameId: game.demo_game_id }
      : { mode: 'direct', build: game.direct_build, version: Number(game.direct_version), ...(game.api_host ? { apiHost: game.api_host } : {}) };
    return {
      id: game.slug,
      source: 'cms',
      data: {
        name: localized.display_name,
        type: game.game_type,
        status: game.release_status,
        order: Number(game.sort_order),
        seo: { title: localized.seo_title, description: localized.seo_description },
        card: cmsAsset(game.card_image, meta.assets),
        ...(game.card_background_image && game.card_logo_image ? { cardLayers: { background: cmsAsset(game.card_background_image, meta.assets), logo: cmsAsset(game.card_logo_image, meta.assets) } } : {}),
        hero: cmsAsset(game.hero_image, meta.assets),
        gallery,
        specs: { rtp: game.rtp_mode === 'configurable' ? 'configurable' : Number(game.rtp), ...(maxWin ? { maxWin } : {}), volatility: game.volatility, ...(bet ? { bet } : {}), ...(localized.main_feature ? { mainFeature: localized.main_feature } : {}), ...(localized.layout_display ? { layout: localized.layout_display } : {}) },
        ...(demo ? { demo } : {}),
        highlights: [],
        features: [],
        overviewMarkdown: localized.overview,
        shortDescription: localized.short_description,
        sections,
      },
    } satisfies GameRecord;
  });
}

export async function getGames(locale = 'en'): Promise<GameRecord[]> {
  if ((import.meta.env.CONTENT_SOURCE ?? 'local') !== 'cms') return (await getCollection('games')).map(fromLocal);
  return loadCmsGames(locale);
}

export function sortGames(games: GameRecord[]): GameRecord[] {
  return [...games].sort((a, b) => Number(a.data.status === 'coming_soon') - Number(b.data.status === 'coming_soon') || a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}
