import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: 'src/index.ts',
        node: 'src/node/index.ts',
        browser: 'src/browser/index.ts'
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['sharp', 'jpeg-js', 'pngjs', 'omggif', "node:fs", "node:path", "node:stream", "node:buffer"],
    }
  },
  plugins: [dts({ entryRoot: 'src' })]
});