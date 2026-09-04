# SBC Lisbon event page

The local page is `/event`. All event copy, dates, selected games, team members,
portraits and booking URLs are configured in `src/data/events.ts`. Components
in `src/components/event/` receive that data and can be reused for another event.

## Campaign dates

- Campaign starts 1 September 2026, Lisbon time.
- Event runs 29 September through 1 October 2026.
- `eventEnd` is exclusive: 2 October at 00:00 in Lisbon (`+01:00`).

The announcement uses the build-time clock for its no-JavaScript default and an
early browser check plus a boundary timer for cached/static pages. It also
rechecks on page restoration and tab visibility changes. No scheduled rebuild
is needed to remove the announcement for JavaScript-enabled visitors. With
JavaScript disabled, a static page necessarily retains its build-time state.
The header and its mobile menu use normal flow, so hiding the announcement
does not leave a reserved gap. The Event navigation link remains available.

The close button dismisses the announcement for the current tab session using
an event-specific `sessionStorage` key. It stays dismissed through internal
navigation, reloads and history restoration. Closing the tab and visiting in a
fresh tab shows it again, provided the campaign is still active. Nothing is
saved permanently. If storage is unavailable, dismissal works for the current
page only. Without JavaScript the close button is hidden, while the banner link
remains usable.

## Content to supply

- Real portraits for Angelina, Timur and Mykola. Import them as Astro image
  assets and replace each member's `photo: null`. Existing slots preserve layout.
- Confirmed positions, if they should be displayed. `position: null` deliberately
  renders no invented job title.
- A common booking URL in `bookingUrl`, or individual member `bookingUrl` values.
- Optional gameplay clips. Current visuals are existing Ace Games artwork,
  not invented footage, generated portraits or stock photos.

## Booking in the local version

There is no configured calendar in this repository. The existing general
contact handler needs hosting secrets and does not run in the Astro dev server.
The event form therefore prepares a real `mailto:` draft without sending data,
claiming a reservation or displaying artificial availability. The visitor must
send it from an email application. The requested person, day, Lisbon time,
company and discussion topics are included. The draft can also be copied.

Setting the common booking URL replaces this form with a link to the real
scheduler. Individual profile URLs take precedence over the common URL.
Without an external URL, profile CTAs preselect the local form and support
direct links such as `/event?member=timur#book-meeting`.

## Media, SEO and tracking

Images use Astro responsive optimization. The Event page has its own title,
description and an optimized Ace City banner as its Open Graph / X share image.
The canonical and Open Graph URL stay `/event`, including file-format builds.
No new media or analytics library is installed. The project has no analytics
provider, so `data-event-track` attributes are integration points only and do
not send telemetry. They cover every requested CTA event name.

## Checks

Run the normal Astro diagnostics and `npm run ship`. With Node 24 or newer:

```sh
node --test scripts/event.test.mjs
```

These tests cover dates, expiry in the actual early script, valid member
selection, booking URL precedence and safe email-draft encoding. When `dist`
exists, they also verify the built Event header and canonical URL; build first
so this check uses the latest source.
