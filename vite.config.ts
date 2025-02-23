import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    target: 'esnext',
    minify: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'node:fs/promises',
        'util',
        'stream',
        'zlib',
        'assert',
        'buffer',
        /^@jsquash\/.*/,
        /\.test\.ts$/
      ],
      output: {
        // Single file output without hashes
        inlineDynamicImports: true,
        // Clean directory structure
        preserveModules: false,
        // No chunk splitting
        manualChunks: undefined
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,  // Bundle all types
      outDir: './dist',
      exclude: ['test']
    })
  ]
})
