import { defineConfig } from 'vite';

export default defineConfig({
  base: '/paper-mario-boss-rush/',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5173,
  },
});
