import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import { DEFAULT_LOCALE, LOCALES } from './locales.mjs';

export default defineConfig({
  site: 'https://acegames.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    fallback: Object.fromEntries(LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => [locale, DEFAULT_LOCALE])),
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
      fallbackType: 'rewrite',
    },
  },
  integrations: [
    icon({ include: { ph: ['*'] } }),
    sitemap({
      filter: (page) => !/^\/(?:[a-z]{2}\/)?(?:404|effects-lab|under-18)$/.test(new URL(page).pathname),
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
