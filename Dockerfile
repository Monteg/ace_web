# Serves a dist/ that has already been built and gated.
#
# The build deliberately does NOT happen in here. Running `npm ci` inside the CI
# docker daemon took 527 seconds and then died with npm's "Exit handler never
# called!", twice, on two Node versions — while the identical install on the
# same runner outside the daemon takes 29. So the site is built by the
# build:site CI job, which runs `npm run ship`, and the dist that passed the
# fourteen parity gates is the dist copied in below.
#
# Locally that means: `npm run ship` first, then `docker build .`. A missing
# dist/ fails the COPY rather than shipping an empty site.

FROM nginxinc/nginx-unprivileged:1.30.4-alpine

# This image runs as uid 101 and listens on 8080. Nothing here needs root.
COPY deploy/nginx/snippets/ /etc/nginx/snippets/
COPY deploy/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

# A bad regex or a missing snippet should fail the build, not the rollout.
RUN nginx -t

EXPOSE 8080

