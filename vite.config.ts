import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const repoName = 'eye-vision-simulator';

export default defineConfig({
  plugins: [vue()],
  base: `/${repoName}/`,
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
