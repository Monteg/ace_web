import type { EventData, EventTeamMember } from '../data/events';
import type { Locale } from './i18n';

const localeTag: Record<Locale, string> = {
  en: 'en-GB',
  de: 'de-DE',
  pt: 'pt-PT',
  es: 'es-ES',
};

export function isCampaignActive(event: Pick<EventData, 'campaignStart' | 'eventEnd'>, now = Date.now()) {
  return now >= Date.parse(event.campaignStart) && now < Date.parse(event.eventEnd);
}

export function eventDateRange(event: EventData, month: 'long' | 'short' = 'long', locale: Locale = 'en') {
  const format = new Intl.DateTimeFormat(localeTag[locale], { day: 'numeric', month, timeZone: event.timeZone });
  const start = format.format(new Date(event.eventStart)).replace(/\bSept\b/, 'Sep');
  const end = format.format(new Date(Date.parse(event.eventEnd) - 1)).replace(/\bSept\b/, 'Sep');
  return `${start}–${end}`;
}

export function memberBookingUrl(event: EventData, member: EventTeamMember) {
  return member.bookingUrl ?? event.bookingUrl ?? `${event.eventUrl}?member=${member.id}${event.bookingAnchor}`;
}

export function meetingDays(event: EventData, locale: Locale = 'en') {
  const days: { value: string; label: string }[] = [];
  const label = new Intl.DateTimeFormat(localeTag[locale], { day: 'numeric', month: 'long', timeZone: event.timeZone });
  const value = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: event.timeZone });
  for (let at = Date.parse(event.eventStart); at < Date.parse(event.eventEnd); at += 86_400_000) {
    days.push({ value: value.format(at), label: label.format(at) });
  }
  return days;
}
