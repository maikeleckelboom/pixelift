import type { GifBinary } from 'omggif'
import type { BufferLike } from 'jpeg-js'

export interface PixelData {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'

export type NodeInput = string | Buffer | BufferLike | GifBinary

export type BrowserInput = string

type PixeliftImpl<T> = (input: T) => Promise<PixelData>

export type Pixelift = PixeliftImpl<NodeInput> | PixeliftImpl<BrowserInput>

// import type { PNG } from 'pngjs'
// type FirstInArray<T> = T extends [infer U, ...unknown[]] ? U : never
// type PngBinary = FirstInArray<Parameters<typeof PNG.sync.read>>
