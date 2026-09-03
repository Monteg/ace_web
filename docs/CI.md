# How the site ships

Push to `main`, and about three minutes later acegames.io is serving that
commit. Nobody clicks anything.

```
push to main
  ├─ check:astro        astro check, 0 errors required
  ├─ build:image        docker build, which runs `npm run ship` inside the image
  ├─ deploy:production  helm upgrade against the gamma cluster
  └─ purge:cloudflare   drop the edge copy of every page
```

A merge request runs the first two jobs and stops. The image is built (so a
broken gate or a broken Dockerfile shows up in review) but not pushed.

## The pieces

**The image.** `Dockerfile` builds the site with Node 22 and serves the result
from nginx. The build stage runs `npm run ship`, so the fourteen parity gates in
`scripts/verify.mjs` run against the very `dist/` that ends up in the image. A
failed gate fails the build; there is no way to ship past it. The runtime stage
runs `nginx -t` for the same reason.

**The serving rules.** `deploy/nginx/`. Cloudflare Pages read `public/_headers`
and `public/_redirects`; nginx does not, so both files are mirrored there. They
have to be changed together. `public/` keeps its copies so the site can still be
dropped on Pages if that is ever wanted.

**The chart.** `helm/chart` with `helm/env/production.yaml`. Two replicas, a
read-only root filesystem, an ingress for `acegames.io` and `www.acegames.io`,
and a cert-manager certificate from the cluster's `letsencrypt` issuer. The
image tag is never written into a file: CI passes the commit it just built.

**The cluster.** gamma (`hetzner-fsn1-gamma-k8s`), namespace `acegames-www`.
The deploy job reaches it through the GitLab agent in
`money.energy/devops/infra`, authenticating as the CI job itself rather than as
the agent, so it can act inside `acegames-www` and nowhere else. See
`deploy/bootstrap/`.

## Rolling back

The previous commit's image is still in the registry, so a rollback is a
deploy:

```bash
helm --kubeconfig ~/.kube/gamma.yml -n acegames-www upgrade www ./helm/chart \
  -f helm/env/production.yaml \
  --set image.repository=registry.gitlab.com/money.energy/www \
  --set image.tag=<the good short sha> --wait
```

or `helm -n acegames-www rollback www` for the release helm itself remembers.
Either way, purge the Cloudflare cache afterwards, or the edge keeps serving the
bad build:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## What is not wired yet

- **`CF_ZONE_ID` and `CF_API_TOKEN`.** Masked, protected project variables. The
  purge job does not exist until both are set, so the pipeline stays green and
  the edge simply holds pages for their TTL.
- **DNS, and with it the certificate.** `acegames.io` still resolves to Webflow
  through GoDaddy nameservers. Moving the zone to Cloudflare is section 6 of
  `DEPLOY.md`, and the records point at the cluster's public entry rather than
  at Pages. The move is also what makes HTTPS possible: the cluster's
  `letsencrypt` issuer solves DNS-01 through one Cloudflare token, so the
  certificate for `acegames.io` cannot be issued until that zone is in the same
  Cloudflare account and the token can write in it.
- **The contact form.** `functions/api/contact.ts` is a Cloudflare Pages
  Function and does not run on the cluster. Until it has a home, nginx answers
  `POST /api/contact` the way that function answers when it has no inbox:
  a redirect to `/thanks?status=error&reason=unconfigured`, which tells the
  visitor the form is not connected and offers the direct address. The
  alternatives are a Cloudflare Worker on the same route or a small service in
  the namespace.
