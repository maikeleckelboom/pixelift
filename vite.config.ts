import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    target: 'esnext',
    ssr: false,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
      name: 'pixelift'
    },
    rollupOptions: {
      external: [
        'node:fs/promises',
        // PNG dependencies
        'util',
        'stream',
        'zlib',
        'buffer',
        'assert',
        // WEBP dependencies
        'fs',
        'path'
      ],
      output: {
        chunkFileNames: '[name].[hash].js',
        inlineDynamicImports: false
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: 'src',
      exclude: 'test'
    })
  ]
})
