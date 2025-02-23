import { PNG } from 'pngjs'
import type { GifBinary } from 'omggif'
import type { BufferLike } from 'jpeg-js'

export interface PixelData {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'

type FirstInArray<T> = T extends [infer U, ...unknown[]] ? U : never
type PngBinary = FirstInArray<Parameters<typeof PNG.sync.read>>

export type NodeInput = string | BufferLike | GifBinary | PngBinary

export type BrowserInput = string

type PixeliftImpl<T> = (input: T) => Promise<PixelData>

export type Pixelift = PixeliftImpl<NodeInput> | PixeliftImpl<BrowserInput>