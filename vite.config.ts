import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'node:path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Pixelift',
      formats: ['es', 'cjs'],
      fileName: (format) => `pixelift.${format}.js`
    },
    rollupOptions: {
      external: ['sharp']
    }
  }
});
