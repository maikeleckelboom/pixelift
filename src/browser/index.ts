import type { BrowserInput, BrowserOptions, PixelData, PixeliftOptions } from '../types'
import { NetworkError, PixeliftError } from '../shared'

export async function pixelift(input: BrowserInput, options?: PixeliftOptions<'browser'>): Promise<PixelData> {
  const imageData = await loadAndGetImageData(input, options)
  return {
    data: new Uint8ClampedArray(imageData.data),
    width: imageData.width,
    height: imageData.height,
    channels: 4
  }
}

async function loadAndGetImageData(
  imageSource: BrowserInput,
  options?: BrowserOptions
): Promise<ImageData> {
  let bitmap: ImageBitmap

  if (imageSource instanceof ImageBitmap) {
    bitmap = imageSource
  } else if (typeof imageSource === 'string' || imageSource instanceof URL) {
    const blob = await getBlob(imageSource)
    bitmap = await createImageBitmap(blob, options)
  } else {
    bitmap = await createImageBitmap(imageSource, options)
  }

  const context = createCanvasContext(bitmap)
  context.drawImage(bitmap, 0, 0)
  return context.getImageData(0, 0, bitmap.width, bitmap.height, { colorSpace: options?.colorSpace })
}

async function getBlob(url: string | URL) {
  const response = await fetch(url, { mode: 'cors' })
  if (!response.ok) throw new NetworkError(`Failed to fetch: ${response.statusText}`, { status: response.status })
  return await response.blob()
}

function createCanvasContext({ width, height }: ImageBitmap) {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) throw new PixeliftError('Failed to get 2D context')
  return context
}