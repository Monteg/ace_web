import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { currentEvent } from '../src/data/events.ts';
import { eventDateRange, isCampaignActive, meetingDays, memberBookingUrl } from '../src/lib/event.ts';
import { buildMeetingEmail, selectMeetingMember } from '../src/lib/event-booking.ts';

const builtEvent = new URL('../dist/event.html', import.meta.url);

test('production event keeps the clean canonical URL and its booking navigation', { skip: !existsSync(builtEvent) }, () => {
  const html = readFileSync(builtEvent, 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/acegames\.io\/event"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/acegames\.io\/event"/);
  assert.equal((html.match(/data-event-track="book_meeting_header"/g) ?? []).length, 2);
  assert.match(html, /href="\/event" aria-current="page"/);
});

test('campaign is active only inside its date window, including Lisbon midnight', () => {
  const start = Date.parse(currentEvent.campaignStart);
  const end = Date.parse(currentEvent.eventEnd);
  assert.equal(isCampaignActive(currentEvent, start - 1), false);
  assert.equal(isCampaignActive(currentEvent, start), true);
  assert.equal(isCampaignActive(currentEvent, Date.parse(currentEvent.eventStart)), true);
  assert.equal(isCampaignActive(currentEvent, end - 1), true);
  assert.equal(isCampaignActive(currentEvent, end), false);
  assert.equal(isCampaignActive(currentEvent, end + 86_400_000), false);
  assert.equal(eventDateRange(currentEvent), '29 September–1 October');
  assert.equal(eventDateRange(currentEvent, 'short'), '29 Sep–1 Oct');
});

test('booking dates and person links come from the event configuration', () => {
  assert.deepEqual(meetingDays(currentEvent).map(day => day.value), ['2026-09-29', '2026-09-30', '2026-10-01']);
  const member = currentEvent.team[0];
  assert.equal(memberBookingUrl(currentEvent, member), '/event?member=angelina#book-meeting');
  assert.equal(memberBookingUrl({ ...currentEvent, bookingUrl: 'https://example.com/team' }, member), 'https://example.com/team');
  assert.equal(memberBookingUrl(currentEvent, { ...member, bookingUrl: 'https://example.com/person' }), 'https://example.com/person');
});

test('person preselection accepts only configured options', () => {
  const select = { value: 'team', options: [{ value: 'team' }, ...currentEvent.team.map(member => ({ value: member.id }))] };
  assert.equal(selectMeetingMember(select, 'timur'), true);
  assert.equal(select.value, 'timur');
  assert.equal(selectMeetingMember(select, '<script>'), false);
  assert.equal(select.value, 'timur');
});

test('the email draft retains meeting context and safely encodes user text', () => {
  const meeting = { eventName: currentEvent.eventName, recipient: 'info@acegames.io', name: 'Test Person', company: 'QA & Co', email: 'qa@example.com', member: 'Angelina', day: '29 September', time: '14:30', message: 'Custom games & integration?\nA + B #1' };
  const draft = buildMeetingEmail(meeting);
  const url = new URL(draft.href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'info@acegames.io');
  assert.equal(url.searchParams.get('subject'), 'SBC Lisbon: meeting request from QA & Co');
  assert.equal(url.searchParams.get('body'), draft.body);
  assert.ok(draft.body.includes('Meet: Angelina'));
  assert.ok(draft.body.includes('Preferred time (Lisbon): 14:30'));
  assert.ok(draft.body.includes(meeting.message));
});

test('the shipped early script hides a stale campaign without a rebuild', () => {
  const layout = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
  const match = layout.match(/<script is:inline define:vars=\{\{ eventCampaignWindow:[\s\S]*?\}\}>\s*([\s\S]*?)<\/script>/);
  assert.ok(match, 'campaign script exists');
  let now = Date.parse(currentEvent.eventEnd) - 1000;
  let active = false;
  let next;
  const listeners = {};
  runInNewContext(match[1], {
    eventCampaignWindow: [Date.parse(currentEvent.campaignStart), Date.parse(currentEvent.eventEnd)],
    Date: { now: () => now },
    document: { documentElement: { classList: { toggle: (_, value) => { active = value; } } }, addEventListener: (event, fn) => { listeners[event] = fn; } },
    window: { addEventListener: (event, fn) => { listeners[event] = fn; } },
    clearTimeout: () => {},
    setTimeout: (fn, delay) => { next = { fn, delay }; return 1; },
  });
  assert.equal(active, true);
  assert.equal(next.delay, 1050);
  now += 1000;
  next.fn();
  assert.equal(active, false);
  now = Date.parse(currentEvent.campaignStart) - 1;
  listeners.pageshow();
  assert.equal(active, false);
  now += 1;
  listeners.visibilitychange();
  assert.equal(active, true);
});
