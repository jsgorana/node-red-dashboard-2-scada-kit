import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

// Build the ui-scada-mimic widget UMD. Dashboard 2.0 only loads the widget's JS
// bundle (the `output` file) — never a separate CSS file — so cssInjectedByJs
// inlines the component <style> into the UMD. Vue + Vuex are provided by the
// Dashboard runtime; core/dompurify/ajv are bundled in.
export default defineConfig({
  plugins: [vue(), cssInjectedByJs()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'ui/mimic/index.js'),
      name: 'ui-scada-mimic',
      formats: ['umd'],
      fileName: () => 'ui-scada-mimic.umd.js',
    },
    rollupOptions: {
      external: ['vue', 'vuex'],
      output: { globals: { vue: 'Vue', vuex: 'vuex' }, exports: 'named' },
    },
    outDir: 'resources',
    emptyOutDir: false, // shared with the faceplate build — never wipe the dir
  },
});
