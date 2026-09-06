import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

const liveCms = process.env.CONTENT_SOURCE === 'cms' && (
  process.env.CMS_CONTENT_MODE === 'live' || process.env.CMS_LIVE_MODE === 'true'
);

export default defineConfig({
  site: 'https://acegames.io',
  trailingSlash: 'never',
  output: liveCms ? 'server' : 'static',
  adapter: liveCms ? node({ mode: 'standalone' }) : undefined,
  build: { format: 'file' },
  integrations: [
    icon({ include: { ph: ['*'] } }),
    sitemap({
      filter: (page) =>
        page !== 'https://acegames.io/effects-lab' &&
        page !== 'https://acegames.io/under-18',
    }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
  vite: {
    server: {
      watch: {
        // Windows locks these files at the drive root. Ignoring them prevents
        // Chokidar from terminating the local dev server while scanning.
        ignored: [
          '**/hiberfil.sys',
          '**/pagefile.sys',
          '**/swapfile.sys',
          '**/DumpStack.log.tmp',
        ],
      },
    },
  },
});
