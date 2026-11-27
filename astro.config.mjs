import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sidneirnjr.github.io',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
