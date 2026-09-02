# Recipes: things people ask for, and what the assistant does

Each recipe is a request as a person would phrase it, followed by the exact
steps. An assistant should follow the steps and then run the checks in
`AI-HANDOVER.md` section 9. A person can paste the request line into their
assistant as-is.

---

### "Add our new game Neon Vault. Here are the two images."

1. Save the images as `src/assets/games/neon-vault.webp` (key art) and
   `src/assets/heroes/neon-vault.webp` (wide banner).
2. `npm run new-game -- --slug neon-vault --name "Neon Vault" --type slot`
3. Open `src/content/games/neon-vault.md`, replace every `TODO`, set the real
   `rtp`, `volatility`, `maxWin`, `bet`, `layout`, `mainFeature`, write the
   overview.
4. If there is a demo, add the `demo` block (AI-HANDOVER.md section 4).
5. Set `status: live` if it is released.
6. Optionally set `order` (lower numbers come first) to place it in the
   catalogue; without it the game sorts alphabetically within its status group.
7. `npm run ship`, then open `/portfolio/neon-vault`, `/games` and `/`.

### "Mark Blackjack as released."

1. In `src/content/games/blackjack.md` change `status: coming_soon` to `status: live`.
2. Add its `demo` block if a demo exists.
3. `npm run ship`.

### "Change the RTP of Gold of Ra to 96.2%."

1. In `src/content/games/gold-of-ra.md` set `rtp: 0.962`. A number, no percent sign.
2. `npm run ship`. The tile, the spec strip and the maths board all update.

### "Take Toy Story off the site."

Do not delete the file: the URL exists and may be linked. Instead:

1. Move the record to `src/content/_retired/toy-story.md`. Anything outside
   `src/content/games/` is invisible to the build.
2. Add `/portfolio/toy-story /games 301` to `public/_redirects`. That file
   is read by Cloudflare Pages, not by the local build, so the redirect can
   only be checked on the deployed preview URL.
3. In `scripts/verify.mjs`, remove `'toy-story'` from the `OLD` array. This is
   the one sanctioned edit to that file, and only together with step 2.
4. `npm run ship`: every gate passes again and the page count drops by one.

### "Change the headline on the home page."

1. `src/components/showcase/Wall.astro`, the `<h1 class="d0">`. Keep it under
   about 40 characters; the `<em>` wraps the peach-coloured emphasis.
2. `npm run dev`, check it is two lines at 1440 px and four or fewer at 375 px.

### "Put our real numbers under the hero."

1. `src/data/site.ts`, `heroStats`: set each `value` to a string such as
   `'38'` or `'12 markets'`. Keep the `label`.
2. `npm run ship`.

### "Add our operator logos."

1. Save SVGs into `public/partners/`. White or single-colour marks read best.
2. In `src/data/site.ts` fill `partners`:
   `{ name: 'Unibet', src: '/partners/unibet.svg' }`, one per logo.
3. `npm run dev`. The "Live with" wall appears below the craft block.

### "Fill in the compliance table: we are certified by iTech Labs, live in Malta and Sweden."

1. `src/data/site.ts`, `integration`, the Compliance group: set the `value` of
   `Testing laboratory` to `'iTech Labs'` and `Jurisdictions` to `'Malta, Sweden'`.
2. Also answer the matching FAQ entries in `faq` (`a: '...'`).
3. Ask the person for the certificate numbers before touching `Certified to`;
   leave it `null` until they arrive.

### "Add the licence line to the footer."

Only with the real number. Then in `src/components/Footer.astro`, inside
`.foot-bottom`, add a `<p class="legal">` with the licence text next to the
existing company line.

### "Change the contact email."

`src/data/site.ts`, `company.email`. Used in the contact section, the thank-you
page and the JSON-LD.

### "Make the orange a bit deeper."

`src/styles/tokens.css`: `--brand` and `--brand-hover`. Then check that
`--on-brand` (dark text on the button) still reads at 4.5:1 or better.

### "The wall moves too fast."

`src/components/showcase/Wall.astro`, the three `animation:` durations on
`.wall-row-0/1/2`. Larger numbers are slower. Keep them different from each
other; that difference is the depth cue.

### "Add a page about the team."

1. Create `src/pages/team.astro` using `Base.astro` like `games/index.astro`.
2. Give it one `<h1>`, a `title` and `description` in the `<Base>` props.
3. Add `{ href: '/team', label: 'Team' }` to `nav` in `src/data/site.ts`.
4. `npm run ship`; the sitemap picks it up on its own.

### "Set up hosting."

Follow `DEPLOY.md` top to bottom. Do not skip section 1 (export from the old
host) or section 6 step A (move DNS first, still pointing at the old host).

### "Why is there a dashed line under this?"

That is a value the owner has not supplied yet. `TODO.md` lists them. It is
not a bug and must not be filled with a guess.
