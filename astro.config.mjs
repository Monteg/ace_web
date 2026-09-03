import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://acegames.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [icon({ include: { ph: ['*'] } }), sitemap()],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
});
