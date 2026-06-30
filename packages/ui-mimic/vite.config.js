import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'ui/index.js'),
      name: 'UIScadaMimic',
      formats: ['umd'],
      fileName: () => 'ui-scada-mimic.umd.js',
    },
    rollupOptions: {
      // Vue is provided by Dashboard 2.0 runtime — do not bundle
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
    outDir: 'resources',
  },
});
