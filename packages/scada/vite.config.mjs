import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Default config loaded by Vitest so it can transform .vue single-file
// components in the test suite. The actual widget UMDs are built with the
// dedicated vite.mimic.mjs / vite.faceplate.mjs configs.
export default defineConfig({
  plugins: [vue()],
});
