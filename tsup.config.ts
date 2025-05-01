import { defineConfig } from 'tsup';

export default defineConfig([
  {
    name: 'full',
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: true,
    clean: true,
    minify: true,
    splitting: false
  },
  {
    name: 'browser',
    platform: 'browser',
    format: ['esm', 'cjs'],
    entry: { index: 'src/browser/index.ts' },
    outDir: 'dist/browser',
    dts: true,
    minify: true,
    clean: false,
    splitting: false
  },
  {
    name: 'server',
    platform: 'node',
    format: ['esm', 'cjs'],
    entry: { index: 'src/server/index.ts' },
    outDir: 'dist/server',
    dts: true,
    minify: true,
    clean: false,
    splitting: false
  }
]);
