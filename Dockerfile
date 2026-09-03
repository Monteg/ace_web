# The site image: Astro builds the pages, nginx serves the folder.
#
# The build stage runs `npm run ship`, so the parity gates run against the very
# dist that ships. A failed gate fails the image, not the deploy. AGENTS.md
# calls ship the definition of done; here it is also the definition of buildable.

FROM node:22-alpine AS build
WORKDIR /app

# package-lock.json carries every platform's sharp binary, so npm ci resolves
# @img/sharp-linuxmusl-x64 here with no rebuild step.
#
# The retries and the socket cap are not cosmetic. Inside the CI docker daemon,
# npm 10.8 spent two minutes on this and then died with "Exit handler never
# called!" — while still exiting 0, so the build carried on with half a
# node_modules and failed further down with `astro: not found`. The last line is
# the guard against that ever being silent again.
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set maxsockets 8 \
 && npm ci --no-audit --no-fund \
 && test -x node_modules/.bin/astro

COPY . .
RUN npm run ship

FROM nginxinc/nginx-unprivileged:1.30.4-alpine AS runtime

# This image runs as uid 101 and listens on 8080. Nothing below needs root.
COPY deploy/nginx/snippets/ /etc/nginx/snippets/
COPY deploy/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# A bad regex or a missing snippet should fail the build, not the rollout.
RUN nginx -t

EXPOSE 8080
