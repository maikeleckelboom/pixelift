import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    target: 'esnext',
    ssr: false,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'pixelift'
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
        chunkFileNames: '[name].[hash].js',
        inlineDynamicImports: false
      }
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: 'src',
      exclude: 'test'
    }),
  ]
})
