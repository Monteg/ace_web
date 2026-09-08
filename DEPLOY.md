# Putting this site live

Written to be followed start to finish. Roughly two hours of work spread over a
few days, most of it waiting for DNS.

If you are doing this with an AI assistant, point it at `AGENTS.md` first.

---

## 0. Run it on your own machine first

You need [Node.js](https://nodejs.org) 20 or newer. Check with `node --version`.

```bash
npm install
npm run dev
```

Open http://localhost:4321. That is the whole site, running locally.

Before you deploy anything, run:

```bash
npm run ship
```

It builds the site and then runs the checks against the result. Every one
must say PASS. Each check exists because the old site failed it, so a failure means
something regressed.

---

## 1. Before you cancel anything at Webflow

**These three things exist only inside that account and disappear with it.**

1. **Export the contact form submissions.** Webflow dashboard, Forms, export CSV.
   Every enquiry the business has ever received is in there.
2. **Note the DNS records.** Project Settings, Publishing. Copy them somewhere,
   especially anything to do with mail.
3. **Keep the plan paid for 30 days after the switch.** It is the rollback.

The images, the fonts and the game data are already in this repo. Nothing else
has to be rescued.

---

## 2. Put the code somewhere

Create a private repository on GitHub and push this folder to it.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/acegames.git
git push -u origin main
```

`node_modules`, `dist` and `.astro` are already ignored. They are rebuilt from
source and should never be committed.

---

## 3. Cloudflare Pages

Free, and bandwidth is not metered, which is the whole reason for choosing it:
an art-heavy site does not turn into a bill that grows with traffic.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com), go to
   **Workers & Pages**, **Create**, **Pages**, **Connect to Git**.
2. Pick the repository.
3. Settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: add an environment variable `NODE_VERSION` = `20`
4. Save and deploy. A few minutes later you get a `*.pages.dev` address.

Open it and click around. This is the real site, just not on your domain yet.

---

## 4. Make the contact form work

Without this the form redirects to an error page. It takes ten minutes.

1. Create a free account at [resend.com](https://resend.com).
2. Add and verify `acegames.io` as a sending domain. Resend gives you three DNS
   records to add; do that in whichever DNS panel you use today.
3. Create an API key.
4. In Cloudflare Pages, **Settings**, **Variables and Secrets**, add three:

   | name | value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from step 3 |
   | `CONTACT_TO` | `info@acegames.io` |
   | `CONTACT_FROM` | `site@acegames.io` (must be on the verified domain) |

5. Redeploy, then send yourself a test message through the form.

The handler is `functions/api/contact.ts`. Cloudflare picks it up automatically
because of where the file sits.

---

## 5. Analytics, before the switch and not after

Do this while the old site is still live, so you have something to compare
against.

- Cloudflare Pages, **Analytics**, enable **Web Analytics**. Free, no cookies,
  so it creates no consent obligation.
- Add the domain to [Google Search Console](https://search.google.com/search-console)
  and let it collect for two weeks. That is your ranking baseline.

---

## 6. Moving the domain

Split into two steps so only one thing is ever in motion.

**Step A, move the DNS zone, still pointing at Webflow.**

Add `acegames.io` to Cloudflare as a site. It reads your existing records;
check every one against what you copied in section 1.

> The mail records matter most. `info@acegames.io` and `legal@acegames.io` are
> published in the terms and the privacy policy. Losing mail is worse than a
> slow website. Copy MX, SPF, DKIM and DMARC exactly. Check for a CAA record
> too; a restrictive one stops Cloudflare issuing a certificate.

Change the nameservers at your registrar, then **wait 72 hours** and confirm the
site and mail both still work. Nothing about the website has changed yet, so
this step is independently reversible.

**Step B, attach the domain to Pages.**

In the Pages project, **Custom domains**, add `acegames.io` and
`www.acegames.io`. The certificate is issued in advance, so there is no gap on
the day.

**Step C, 48 hours before the switch,** lower the TTL on the apex and www
records to 60 seconds.

**Step D, the switch.** Point the apex and www records at the Pages project.
Because both sites are complete and the TTL is 60 seconds, there is no moment
where anything is down: old lookups keep getting Webflow, new ones get Pages,
and within a minute everyone is on the new site.

**Step E.** Leave Webflow paid and published for 30 days.

**Step F, after 30 clean days.** Raise the TTL back, cancel Webflow, and delete
the `ace-games` S3 bucket. That last one removes a per-visitor AWS charge that
exists today for a background video.

---

## 7. If something goes wrong

Point the apex and www DNS records back at Webflow. With a 60 second TTL the old
site is back within a minute or two. This works for the whole 30 days.

For a bad deploy rather than a bad migration: Cloudflare Pages keeps every
previous build. Promote the last good one from the dashboard. Seconds, no rebuild.

The only thing that cannot be undone is cancelling Webflow, which is why it is
the last step.

---

## 8. Afterwards

- Fill in `TODO.md`. Sixty items, and they show on the live site as dashed
  orange underlines until they are answered. The three that cost you deals:
  the testing laboratory and certificate numbers, the jurisdictions you can
  supply, and how an operator integrates.
- **Update the privacy policy.** It still names Webflow as a data processor.
  After the move that is Cloudflare, plus Resend for the contact form. Your
  lawyer should see the new list.
- Submit the sitemap at `https://acegames.io/sitemap-index.xml` in Search
  Console. The old site had no sitemap at all; the file returned a 404.
- Watch Search Console for two weeks. Every old URL still resolves, so nothing
  should move much.

---

## Costs

| | before | after |
| --- | --- | --- |
| Webflow CMS plan | about $23 to $29 a month | gone |
| AWS egress on the hero video | grows with every visitor | gone |
| Cloudflare Pages | | free |
| Resend, under 3,000 emails a month | | free |
| Cloudflare Web Analytics | | free |

Check your actual Webflow and AWS invoices for the real "before" figure. The
numbers above are list prices.
