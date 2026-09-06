import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { MaxWin, Rtp, Volatility } from './format';
import { approvedTranslation, cmsLiveImage, getLiveCmsSnapshot } from './cms-live';
import { cmsContentMode, contentSource } from './cms-mode';

export type GameType = 'slot' | 'instant' | 'crash' | 'table';
export type GameStatus = 'live' | 'coming_soon';
export type GameDetailSlot = 'sidebar_features' | 'gameplay' | 'main_feature' | 'bonus' | 'multiplier' | 'additional';
export interface CmsLiveImage {
  cmsLive: true;
  id: string;
  src: string;
  width: number;
  height: number;
  format: string;
}
export type GameImage = ImageMetadata | CmsLiveImage;
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
  detailSlot: GameDetailSlot;
  heading: string | null;
  bodyMarkdown: string;
  stylePreset: string;
  media?: GameImage;
  items: GameSectionItem[];
}

export interface GameDetailViewModel {
  game: GameRecord;
  stats: GameRecord['data']['specs'];
  media: {
    demo?: GameDemo;
    gallery: GameRecord['data']['gallery'];
    fallback: GameImage;
  };
  featureGroups: Array<{
    id: string;
    heading: string | null;
    bodyMarkdown: string;
    items: GameSectionItem[];
  }>;
  overviewMarkdown: string;
  tabs: Array<{
    slot: Exclude<GameDetailSlot, 'sidebar_features' | 'additional'>;
    sections: GameSection[];
  }>;
  additionalSections: GameSection[];
  relatedGames: GameRecord[];
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

function localMarkdownDetail(body: string, slug: string): { overviewMarkdown: string; sections: GameSection[] } {
  const headings = [...body.matchAll(/^##\s+(.+)\s*$/gm)];
  if (!headings.length) return { overviewMarkdown: body.trim(), sections: [] };
  const overviewMarkdown = body.slice(0, headings[0].index).trim();
  const sections = headings.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = headings[index + 1]?.index ?? body.length;
    return {
      id: `local-${slug}-${index + 1}`,
      type: 'rich_text' as const,
      detailSlot: 'additional' as const,
      heading: match[1].trim(),
      bodyMarkdown: body.slice(start, end).trim(),
      stylePreset: 'default',
      items: [],
    };
  });
  return { overviewMarkdown, sections };
}

function fromLocal(entry: CollectionEntry<'games'>): GameRecord {
  const detail = localMarkdownDetail(entry.body?.trim() ?? '', entry.id);
  return {
    id: entry.id,
    source: 'local',
    data: {
      ...entry.data,
      type: entry.data.type as GameType,
      overviewMarkdown: detail.overviewMarkdown,
      shortDescription: entry.data.seo.description,
      sections: detail.sections,
    },
  };
}

const DETAIL_SLOTS = new Set<GameDetailSlot>(['sidebar_features', 'gameplay', 'main_feature', 'bonus', 'multiplier', 'additional']);

function detailSlot(value: unknown, sectionType: GameSection['type']): GameDetailSlot {
  if (DETAIL_SLOTS.has(value as GameDetailSlot)) return value as GameDetailSlot;
  if (sectionType === 'feature_grid' || sectionType === 'bullet_list') return 'sidebar_features';
  return 'additional';
}

function approved<T extends { translation_status?: string }>(value: T | null | undefined): value is T {
  return Boolean(value && value.translation_status === 'approved');
}

function hasApprovedEnglish(items: any[]): boolean {
  return (items ?? []).some((entry) => (entry.locale?.code ?? entry.locale) === 'en' && entry.translation_status === 'approved');
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
          detailSlot: detailSlot(section.detail_slot, section.section_type),
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

function loadLiveGame(game: any, locale: string, cmsUrl: string): GameRecord {
  const english = approvedTranslation(game.translations, 'en');
  const requested = approvedTranslation(game.translations, locale);
  const localized = (field: string) => String(requested?.[field] ?? '').trim() ? requested[field] : english[field];
  const sections: GameSection[] = (game.sections ?? [])
    .filter((section: any) => section.enabled && hasApprovedEnglish(section.translations))
    .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order))
    .map((section: any) => {
      const sectionEnglish = approvedTranslation(section.translations, 'en');
      const translation = approvedTranslation(section.translations, locale);
      const sectionValue = (field: string) => String(translation?.[field] ?? '').trim() ? translation[field] : sectionEnglish[field];
      return {
        id: section.id,
        type: section.section_type,
        detailSlot: detailSlot(section.detail_slot, section.section_type),
        heading: sectionValue('heading') ?? null,
        bodyMarkdown: sectionValue('body_markdown') ?? '',
        stylePreset: section.style_preset ?? 'default',
        media: section.media_file ? cmsLiveImage(section.media_file, cmsUrl) : undefined,
        items: (section.items ?? [])
          .filter((item: any) => item.enabled && hasApprovedEnglish(item.translations))
          .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order))
          .map((item: any) => {
            const itemEnglish = approvedTranslation(item.translations, 'en');
            const itemTranslation = approvedTranslation(item.translations, locale);
            const itemValue = (field: string) => String(itemTranslation?.[field] ?? '').trim() ? itemTranslation[field] : itemEnglish[field];
            return {
              id: item.id,
              title: itemValue('title') ?? null,
              text: itemValue('text') ?? null,
              icon: item.icon_file ? cmsLiveImage(item.icon_file, cmsUrl) : undefined,
              image: item.image_file ? cmsLiveImage(item.image_file, cmsUrl) : undefined,
            };
          }),
      } satisfies GameSection;
    });
  const gallery = (game.gallery ?? [])
    .filter((item: any) => item.enabled && item.file && hasApprovedEnglish(item.translations))
    .sort((a: any, b: any) => Number(a.sort_order) - Number(b.sort_order))
    .map((item: any) => {
      const galleryEnglish = approvedTranslation(item.translations, 'en');
      const translation = approvedTranslation(item.translations, locale);
      const value = (field: string) => String(translation?.[field] ?? '').trim() ? translation[field] : galleryEnglish[field];
      return { image: cmsLiveImage(item.file, cmsUrl), alt: value('alt'), caption: value('caption') ?? null };
    });
  const maxWin = game.max_win_value == null ? undefined : {
    value: Number(game.max_win_value),
    unit: game.max_win_unit,
    approx: Boolean(game.max_win_approx),
  };
  const bet = game.bet_min == null || game.bet_max == null ? undefined : {
    min: Number(game.bet_min),
    max: Number(game.bet_max),
  };
  const demo: GameDemo | undefined = !game.demo_enabled ? undefined : game.demo_mode === 'adapter'
    ? { mode: 'adapter', gameId: game.demo_game_id }
    : { mode: 'direct', build: game.direct_build, version: Number(game.direct_version), ...(game.api_host ? { apiHost: game.api_host } : {}) };
  const featureSection = sections.find((section) => section.type === 'feature_grid');
  const bulletSection = sections.find((section) => section.type === 'bullet_list');
  return {
    id: game.slug,
    source: 'cms',
    data: {
      name: localized('display_name'),
      type: game.game_type,
      status: game.release_status,
      order: Number(game.sort_order),
      seo: { title: localized('seo_title'), description: localized('seo_description') },
      card: cmsLiveImage(game.card_image, cmsUrl),
      ...(game.card_background_image && game.card_logo_image ? {
        cardLayers: {
          background: cmsLiveImage(game.card_background_image, cmsUrl),
          logo: cmsLiveImage(game.card_logo_image, cmsUrl),
        },
      } : {}),
      hero: cmsLiveImage(game.hero_image, cmsUrl),
      gallery,
      specs: {
        rtp: game.rtp_mode === 'configurable' ? 'configurable' : Number(game.rtp),
        ...(maxWin ? { maxWin } : {}),
        volatility: game.volatility,
        ...(bet ? { bet } : {}),
        ...(localized('main_feature') ? { mainFeature: localized('main_feature') } : {}),
        ...(localized('layout_display') ? { layout: localized('layout_display') } : {}),
      },
      ...(demo ? { demo } : {}),
      highlights: bulletSection?.items.flatMap((item) => item.text ? [item.text] : []) ?? [],
      features: featureSection?.items.map((item) => ({ title: item.title ?? '', body: item.text ?? '' })) ?? [],
      overviewMarkdown: localized('overview'),
      shortDescription: localized('short_description'),
      sections,
    },
  };
}

async function loadLiveCmsGames(locale: string): Promise<GameRecord[]> {
  const snapshot = await getLiveCmsSnapshot();
  return snapshot.games.flatMap((game) => {
    if (!game.card_image || !game.hero_image || !hasApprovedEnglish(game.translations)) {
      console.warn(`[cms live] skipped incomplete Main game: ${game.slug ?? game.id}`);
      return [];
    }
    return [loadLiveGame(game, locale, snapshot.cmsUrl)];
  });
}

export async function getGames(locale = 'en'): Promise<GameRecord[]> {
  if (contentSource() !== 'cms') return (await getCollection('games')).map(fromLocal);
  return cmsContentMode() === 'live' ? loadLiveCmsGames(locale) : loadCmsGames(locale);
}

export function sortGames(games: GameRecord[]): GameRecord[] {
  return [...games].sort((a, b) => Number(a.data.status === 'coming_soon') - Number(b.data.status === 'coming_soon') || a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export function buildGameDetailViewModel(game: GameRecord, allGames: GameRecord[]): GameDetailViewModel {
  const sections = game.data.sections;
  const sidebarSections = sections.filter((section) => section.detailSlot === 'sidebar_features');
  const featureGroups = sidebarSections.map((section) => ({
    id: section.id,
    heading: section.heading,
    bodyMarkdown: section.bodyMarkdown,
    items: section.items,
  }));

  if (!featureGroups.length && (game.data.features.length || game.data.highlights.length)) {
    featureGroups.push({
      id: `legacy-${game.id}-features`,
      heading: null,
      bodyMarkdown: '',
      items: [
        ...game.data.features.map((item, index) => ({ id: `legacy-feature-${index + 1}`, title: item.title, text: item.body })),
        ...game.data.highlights.map((text, index) => ({ id: `legacy-highlight-${index + 1}`, title: null, text })),
      ],
    });
  }

  const tabOrder: GameDetailViewModel['tabs'][number]['slot'][] = ['gameplay', 'main_feature', 'bonus', 'multiplier'];
  const tabs = tabOrder.flatMap((slot) => {
    const tabSections = sections.filter((section) => section.detailSlot === slot);
    return tabSections.length ? [{ slot, sections: tabSections }] : [];
  });

  return {
    game,
    stats: game.data.specs,
    media: {
      ...(game.data.demo ? { demo: game.data.demo } : {}),
      gallery: game.data.gallery,
      fallback: game.data.hero,
    },
    featureGroups,
    overviewMarkdown: game.data.overviewMarkdown,
    tabs,
    additionalSections: sections.filter((section) => section.detailSlot === 'additional'),
    relatedGames: sortGames(allGames).filter((candidate) => candidate.id !== game.id && candidate.data.status === 'live' && candidate.data.type === game.data.type),
  };
}
