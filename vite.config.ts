import { defineConfig } from 'vitest/config'
import visualizer from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      gzipSize: true,
      brotliSize: true
    })
  ]
})
