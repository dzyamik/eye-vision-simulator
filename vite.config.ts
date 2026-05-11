import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  // Relative base ('./') so the built docs/ can be served from any path —
  // GH Pages /<repo>/, a CDN subdirectory, file://, etc. — without
  // recompiling. import.meta.env.BASE_URL is './' in production builds and
  // '/' in dev; runtime URL builds (sample manifest, samples/*.jpg) use
  // BASE_URL so they resolve correctly against either.
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  assetsInclude: ['**/*.glsl', '**/*.frag.glsl', '**/*.vert.glsl'],
});
