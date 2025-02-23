export type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'

export interface PixelData {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type NodeInput =
  | string
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array

export type BrowserInput = string

type FutureBrowserInput =
  | ImageData
  | HTMLImageElement
  | ImageBitmap
  | OffscreenCanvas
  | Blob
  | File

type PixeliftImpl<T> = (input: T) => Promise<PixelData>

export type Pixelift = PixeliftImpl<NodeInput> | PixeliftImpl<BrowserInput>
