import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://acegames.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    icon({ include: { ph: ['*'] } }),
    sitemap({ filter: (page) => page !== 'https://acegames.io/effects-lab' }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
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
});
