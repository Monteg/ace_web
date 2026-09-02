# Showcase build: plan

Built on the functional base in `../acegames` (content schema, 24 game records,
optimised assets, parity gates). This project keeps all of that and replaces the
visual layer with one meant to impress an operator's Head of Games.

## What the competitors do (seen live, 2 September 2026)

| | Peter & Sons | Hacksaw | Push Gaming |
| --- | --- | --- | --- |
| Hero | Character art, two mascots, big "NEXT LEVEL GAMING" | Full-bleed gameplay video of a real slot | 18+ gate first, then dark video |
| Proof | 60+ games, 1000+ partners, 50+ countries strip | +250 games, +3,000 operator brands, +35 regulated markets | Partner logos (Unibet) |
| Catalogue | 4-col grid of key art, NEW / COMING SOON badges, 5 filters (type, theme, features, volatility, max win) | Featured big card + 4 small, volatility shown as a 5-step icon meter, "Try it now" | Grid |
| Trust | Regulator logos in the footer (MGA, UKGC, AGCO, ADM), age gate on game pages | Cookie + age notice | Age gate modal |
| Accent | Yellow on near-black | Black on white, condensed caps | Red on charcoal |
| Personality | Illustrated, playful, mascots | Loud, arcade, the game is the hero | Corporate, restrained |

Common denominators: a stat strip under the hero; a partner/operator logo wall;
key art at large scale; volatility shown visually, not as a word; a per-game page
with a playable demo and a spec block; regulators named in the footer.

None of them shows the maths in a way a buyer can explore. None of them makes the
catalogue itself the hero. That is the gap.

## The questions, answered before drawing anything

**1. What must a Head of Games feel in the first three seconds?**
That this studio ships finished, polished games, plural. Not a stock city video.
So the hero is the games: a slowly drifting wall of all 24 key arts in shallow
perspective, the way a lobby looks, with the headline over it. Real assets we
already own, at cinematic scale, moving. This is the one bold move on the page
and everything else stays quiet around it.

**2. What do they screenshot and send to their team?**
Something no competitor has: the catalogue as a maths map. An interactive RTP by
volatility chart of all 24 titles, filterable by type, each dot a game, click to
open. It says "we know our maths" without a paragraph of claims, and it speaks
the buyer's language (RTP band, volatility profile, max win) rather than ours.

**3. What proves craft rather than claiming it?**
Motion that is choreographed, not sprinkled: one pinned scroll sequence (the
wall settling into the grid), hover states that reveal name, RTP and volatility
on every card, type set with intent (Tanker at display size, one accent), and a
game page whose header is layered art with depth rather than a flat banner.
Everything else is still. Three motion moments, each with a reason.

**4. Can they play something within one click?**
Yes. "Play" on every card and a spotlight demo on the home page that loads on
click. The demo is the strongest asset and it stays one click from anywhere.

**5. Do they trust the numbers?**
Published RTP and volatility on every card and in the explorer, a compliance
and integration block that answers their six questions, and honest gaps where
figures are still missing (dashed underline, never a made-up number).

**6. Does it work on their phone during a call?**
Same performance discipline as the base: content visible without JS, images
through the build pipeline, video only on desktop, the parity gates still pass.
The wall degrades to a static collage on mobile.

## Design read

B2B showcase for game acquisition teams, with a "confident arcade" language:
dark ground, one hot accent, poster typography, art at scale. Dials: variance 8,
motion 7, density 3. Dark theme locked for the whole page.

Kept from the brand: `#FF5600` orange, `#111` ground, `#FFFFF5` cream for one
inverted block, `#F6CB95` peach for display emphasis, Tanker display, the four
pastel tints for icon tiles. Added: a deeper layered surface scale (four steps of
near-black) so panels read as depth without borders, and a warm shadow tint.

Type: Tanker for display (already licensed and self-hosted), Inter Variable
for body (already in the base; kept because switching fonts is not what makes
this page better), JetBrains Mono for data.

## Page plan (home)

1. **Wall hero.** Full-bleed, 3 rows of key art drifting at different speeds in
   slight perspective, dark scrim, headline + one line + two CTAs left-aligned.
   Pinned for one viewport of scroll while the wall flattens into the grid.
2. **Proof strip.** Four figures with icon tiles (from the base; the real values
   still come from the owner).
3. **Catalogue.** Asymmetric grid: one featured tile (2x2) with a live demo
   spotlight, then 3-col cards. Hover reveals name, RTP, volatility, Play.
   Filter chips (no counts). "All 24" link to /games.
4. **Maths explorer.** RTP x volatility scatter of the catalogue, type filter,
   click a dot to open the game. Built with plain SVG + a little JS, no chart
   library. This is the signature B2B element.
5. **Craft.** One inverted cream block: three columns (Maths, Art, Engine) with
   a real crop of game art in each, short copy. Shows the in-house pipeline.
6. **Integration and compliance.** The six answers, from the base.
7. **Operators.** Logo wall slot (empty until the owner supplies real logos;
   renders nothing rather than fakes).
8. **Contact.** Form from the base.

Game page: layered header (banner art + floating key art with parallax depth),
spec strip, demo, overview, features with art crops, related. Everything else
from the base.

## Build split

- Skeleton, tokens, layout, hero wall, catalogue grid: me.
- Maths explorer component: agent, against a written spec.
- Game page header and spec strip: agent, against a written spec.
- Craft block and logo wall: agent.
- Integration and verification: me. `npm run ship` must keep passing every gate.

## Learnings folded in from the competitor teardowns (2 September 2026)

Three agents tore down Peter & Sons, BGaming, Hacksaw and Push Gaming from source.
The full reports are in the session transcript; what changed here because of them:

- **Numbers wherever a game appears.** BGaming carries RTP and volatility on every
  card and ten hard figures on the detail grid; Hacksaw puts a five-step volatility
  meter on every tile. Ours: RTP and a four-bar meter on every tile, a six-cell
  spec strip directly under the game header.
- **Play from the grid, in the page.** Hacksaw launches the demo in an in-page
  modal; Push opens a new tab whose lobby URL is google.com. Ours: click-to-load
  in place, "Copy demo link" next to it, because evaluators share demos all day.
- **The first screen is the games, not a slogan.** Hacksaw uses a 7.5 MB teaser
  video; Push a layered hero per release. Ours: the catalogue's own art as a wall,
  ~200 KB, and it scrolls away into the grid.
- **Licence honesty in the footer.** Hacksaw lists eight regulators with numbers
  and links to the verifiers; BGaming prints the MGA licence number on every page.
  Ours: the slot is there and dashed until the owner supplies the numbers. Do not
  invent a licence line.
- **Mechanics as products** (Push "Our Features") and a **certified-markets
  filter** (BGaming, 30 jurisdictions) are the two ideas worth a later phase once
  the data exists: `mainFeature` is already structured per game.
- **What not to copy:** 800 KB catalogue HTML, 270 KB thumbnails, 900 meter
  images, awards shown as unlabeled pictures, promo packs as Google Drive links,
  stale counters ("40+ games" next to 89 tiles), dark modes built and abandoned.
