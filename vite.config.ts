import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'node:path';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [path.resolve(__dirname, 'tsconfig.json')],
      root: path.resolve(__dirname, './')
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
