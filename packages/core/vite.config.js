import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'ScadaCore',
      formats: ['cjs', 'es'],
      fileName: (format) => `core.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['ajv', 'dompurify', 'jsdom', 'sanitize-html'],
    },
    outDir: 'dist',
  },
});
