import { isNode } from './shared'

let createPixelsArray: any

if (isNode) {
  const { default: nodeImpl } = await import('./node/create-pixels-array')
  createPixelsArray = nodeImpl
} else {
  const { default: browserImpl } = await import('./browser/create-pixels-array')
  createPixelsArray = browserImpl
}

export { createPixelsArray }
