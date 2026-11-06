import { defineConfig } from 'vite';

// Native modules must remain external so Electron can load their platform binary.
export default defineConfig({
  build: { rolldownOptions: { external: ['koffi'] } },
});
