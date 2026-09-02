/**
 * Parity gates from the audit, run against dist/ after a build.
 *
 *   node scripts/verify.mjs
 *
 * Each gate is something the old site failed. The build is not "done"
 * until every one of them passes.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
const pages = new Map();
for (const f of html) pages.set(f, await readFile(f, 'utf8'));

const routes = new Set(
  html.map((f) => {
    const rel = relative(DIST, f).split(sep).join('/');
    return '/' + rel.replace(/\.html$/, '').replace(/^index$/, '');
  }),
);

const results = [];
const gate = (name, ok, detail = '') => results.push({ name, ok, detail });

// the gates below rely on regex escapes; make sure the file has not been
// mangled by an editor or a copy tool before trusting any PASS
if (!/\bTODO\b/.test('a TODO b') || !/<img\b/.test('<img src="x">')) {
  console.error('verify.mjs is corrupted: regex escapes are broken');
  process.exit(2);
}

// 1. every URL the old site had still exists
const OLD = [
  '/', '/privacy-policy', '/terms-conditions',
  ...['ace-city','blackjack','chicken-doom','cyber-star','gold-of-ra','good-staf','jackpot-vibe',
      'meme-star','montezuma','pigeon-road','pirates-rush','plinko-game','ring-spin','star-go',
      'star-loot','star-miner','star-rocket','stars-digger','sweet-candy','toy-story','vikings-gold',
      'way-to-olympus','wild-wwst','zeus-run'].map((s) => `/portfolio/${s}`),
];
const missing = OLD.filter((r) => !routes.has(r === '/' ? '/' : r));
gate(`All ${OLD.length} original URLs still resolve`, missing.length === 0, missing.join(', '));

// 2. no dead anchors
let hashLinks = 0;
for (const [, src] of pages) hashLinks += (src.match(/href="#"/g) || []).length;
gate('Zero href="#" anywhere', hashLinks === 0, `${hashLinks} found (old site: 353 of 1141)`);

// 3. internal links all resolve
const broken = new Set();
for (const [file, src] of pages) {
  for (const m of src.matchAll(/href="(\/[^"#?]*)/g)) {
    let href = m[1].replace(/\/$/, '') || '/';
    if (/\.(png|webp|svg|xml|txt|mp4|woff2?|ico|json|css|js)$/.test(href)) continue;
    if (href.startsWith('/_astro') || href.startsWith('/fonts') || href.startsWith('/media')) continue;
    if (!routes.has(href)) broken.add(`${relative(DIST, file)} -> ${href}`);
  }
}
gate('Zero internal links that 404', broken.size === 0, [...broken].join(', '));

// 4. images carry dimensions and a real alt
let imgs = 0, noDims = 0, noAlt = 0;
for (const [, src] of pages) {
  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    imgs++;
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) noDims++;
    // A decorative image is emitted as a bare `alt` attribute, which counts.
    if (!/\salt(=|\s|>)/.test(tag)) noAlt++;
  }
}
gate('Every <img> declares width and height', noDims === 0, `${noDims} of ${imgs} missing (old site: 254 of 257)`);
gate('Every <img> declares alt', noAlt === 0, `${noAlt} of ${imgs} missing`);

// 5. no empty iframe src, which makes a page load itself
let emptySrc = 0;
for (const [, src] of pages) emptySrc += (src.match(/<iframe[^>]*src=""/g) || []).length;
gate('Zero <iframe src="">', emptySrc === 0, `${emptySrc} found (old site: 3)`);

// 6. exactly one h1 per page
const badH1 = [];
for (const [file, src] of pages) {
  const n = (src.match(/<h1\b/g) || []).length;
  if (n !== 1) badH1.push(`${relative(DIST, file)}: ${n}`);
}
gate('Exactly one <h1> per page', badH1.length === 0, badH1.join(', '));

// 7. landmarks on every page
const noLandmark = [];
for (const [file, src] of pages) {
  if (!/<main\b/.test(src) || !/<header\b/.test(src) || !/<footer\b/.test(src) || !/class="skip"/.test(src))
    noLandmark.push(relative(DIST, file));
}
gate('main, header, footer and a skip link on every page', noLandmark.length === 0, noLandmark.join(', '));

// 8. canonical + description on every page
const noMeta = [];
for (const [file, src] of pages) {
  if (!/rel="canonical"/.test(src) || !/name="description"/.test(src)) noMeta.push(relative(DIST, file));
}
gate('Canonical and description on every page', noMeta.length === 0, noMeta.join(', '));

// 9. nothing from the old build came along
const FORBIDDEN = ['webflow', 'website-files', 'Brandfluencer', 'tncflow', 'marketplace-checkout',
                   '_CHEB', 'utility/style-guide', 'placeholder.60f9b184', 'Grow With Authentic',
                   '00000000-0000-0000-0000-000000000000'];
const leaks = [];
for (const [file, src] of pages) {
  // The legal pages name Webflow as a processor. That is factual text the
  // owner has to update after the move, tracked in TODO.md, not a build leak.
  const legal = /privacy-policy|terms-conditions/.test(file);
  for (const term of FORBIDDEN) {
    if (legal && (term === 'webflow' || term === 'website-files')) continue;
    if (src.toLowerCase().includes(term.toLowerCase())) leaks.push(`${relative(DIST, file)}: ${term}`);
  }
}
gate('No trace of the old template or host', leaks.length === 0, leaks.slice(0, 6).join(', '));

// 9b. no scaffold placeholder shipped
const todos = [];
for (const [file, src] of pages) if (/\bTODO\b/.test(src)) todos.push(relative(DIST, file));
gate('No TODO placeholder on any page', todos.length === 0, todos.join(', '));

// 9c. no em-dash in copy (the legal documents are quoted verbatim and exempt)
const dashes = [];
for (const [file, src] of pages) {
  if (/privacy-policy|terms-conditions/.test(file)) continue;
  if (src.includes('—')) dashes.push(relative(DIST, file));
}
gate('No em-dash on any page', dashes.length === 0, dashes.join(', '));

// 10. page weight
async function weigh(route) {
  const file = join(DIST, route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  const src = await readFile(file, 'utf8');
  let total = (await stat(file)).size;
  const assets = new Set();
  // Only what a first paint actually needs: the document, the CSS, the fonts,
  // and the smallest candidate of each image. /media is attached after load.
  for (const m of src.matchAll(/href="(\/(?:_astro|fonts)\/[^"]+\.(?:css|woff2))"/g)) assets.add(m[1]);
  const withSrcset = new Set();
  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const ss = tag.match(/srcset="([^"]+)"/);
    if (ss) {
      const smallest = ss[1].split(',')[0].trim().split(' ')[0];
      assets.add(smallest);
      withSrcset.add(smallest);
    } else {
      const s = tag.match(/src="(\/_astro\/[^"]+)"/);
      if (s) assets.add(s[1]);
    }
  }
  for (const a of assets) {
    try { total += (await stat(join(DIST, a.slice(1)))).size; } catch {}
  }
  return total;
}
const home = await weigh('/');
const gamePage = await weigh('/portfolio/gold-of-ra');
gate('Home page under 1.5 MB', home < 1_572_864, `${(home / 1024).toFixed(0)} KB (old site: 129 MB)`);
gate('Game page under 1.5 MB before Play is pressed', gamePage < 1_572_864, `${(gamePage / 1024).toFixed(0)} KB (old site: 24 to 61 MB)`);

// report
const pass = results.filter((r) => r.ok).length;
console.log('');
for (const r of results) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `\n          ${r.detail}` : ''}`);
}
console.log(`\n  ${pass}/${results.length} gates passed across ${html.length} pages\n`);
process.exit(pass === results.length ? 0 : 1);
