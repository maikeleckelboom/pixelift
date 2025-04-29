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
    entry: { browser: 'src/browser/index.ts' },
    outDir: 'dist/browser',
    dts: true,
    clean: true,
    minify: true,
    splitting: false
  },
  {
    name: 'server',
    platform: 'node',
    format: ['esm', 'cjs'],
    entry: { server: 'src/server/index.ts' },
    outDir: 'dist/server',
    dts: true,
    clean: true,
    minify: true,
    splitting: false
  }
]);
