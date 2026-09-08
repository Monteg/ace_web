import type { EventData } from '../data/events';
import { t, type Locale } from './i18n';

export function getLocalizedEvent(event: EventData, locale: Locale): EventData {
  return {
    ...event,
    eventLocation: t('event.location', locale),
    headline: t('event.seo.title', locale, { event: event.eventName }),
    tagline: t('event.hero.tagline', locale),
    introduction: t('event.hero.introduction', locale),
    bookingLabel: t('event.booking.cta', locale),
    whyTitle: t('event.why.title', locale),
    reasons: event.reasons.map((reason, index) => ({
      ...reason,
      title: t(`event.why.${index + 1}.title`, locale),
      body: t(`event.why.${index + 1}.body`, locale),
    })),
    stats: event.stats.map((stat, index) => ({
      ...stat,
      label: t(`event.stats.${index + 1}.label`, locale),
    })),
    gamesTitle: t('event.games.title', locale),
    featuredGames: event.featuredGames.map((game) => ({
      ...game,
      name: t(`event.games.${game.id}.name`, locale),
      description: t(`event.games.${game.id}.description`, locale),
    })),
    teamTitle: t('event.team.title', locale),
    team: event.team.map((member) => ({
      ...member,
      expertise: t(`event.team.${member.id}.expertise`, locale),
    })),
    topicsTitle: t('event.topics.title', locale),
    topics: event.topics.map((topic, index) => ({
      ...topic,
      title: t(`event.topics.${index + 1}.title`, locale),
      description: t(`event.topics.${index + 1}.description`, locale),
    })),
    bookingTitle: t('event.booking.title', locale),
    bookingIntro: t('event.booking.intro', locale),
    bookingDescription: t('event.booking.description', locale),
  };
}
