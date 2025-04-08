import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: 'src/index.ts',
        node: 'src/node/index.ts',
        browser: 'src/browser.ts'
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['sharp', 'jpeg-js', 'pngjs', 'omggif']
    }
  },
  plugins: [dts({ entryRoot: 'src' })]
});