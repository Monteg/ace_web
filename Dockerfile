# The site image: Astro builds the pages, nginx serves the folder.
#
# The build stage runs `npm run ship`, so the parity gates run against the very
# dist that ships. A failed gate fails the image, not the deploy. AGENTS.md
# calls ship the definition of done; here it is also the definition of buildable.

FROM node:20-alpine AS build
WORKDIR /app

# package-lock.json carries every platform's sharp binary, so npm ci resolves
# @img/sharp-linuxmusl-x64 here with no rebuild step.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

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
