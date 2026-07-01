import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

// Build the ui-scada-faceplate widget UMD. See vite.mimic.mjs for why
// cssInjectedByJs and emptyOutDir:false are required.
export default defineConfig({
  plugins: [vue(), cssInjectedByJs()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'ui/faceplate/index.js'),
      name: 'ui-scada-faceplate',
      formats: ['umd'],
      fileName: () => 'ui-scada-faceplate.umd.js',
    },
    rollupOptions: {
      external: ['vue'],
      output: { globals: { vue: 'Vue' }, exports: 'named' },
    },
    outDir: 'resources',
    emptyOutDir: false,
  },
});
