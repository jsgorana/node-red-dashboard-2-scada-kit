import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'ui/index.js'),
      name: 'UIScadaFaceplate',
      formats: ['umd'],
      fileName: () => 'ui-scada-faceplate.umd.js',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
    outDir: 'resources',
  },
});
