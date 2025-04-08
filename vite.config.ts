import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'node/index': 'src/node/index.ts',
        'browser/index': 'src/browser/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'sharp',
        'jpeg-js',
        'pngjs',
        'omggif',
        /^node:/,
      ],
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src/index.ts', 'src/node/**/*.ts', 'src/browser/**/*.ts'],
    }),
    dynamicImportVars({
      include: ['src/**/*.ts'],
      exclude: ['src/node/**/*.ts', 'src/browser/**/*.ts'],
      // Use the default Rollup plugin options
      // https://rollupjs.org/plugin-legacy/#options
    })
  ],
});