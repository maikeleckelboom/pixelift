import type { BrowserInput, PixelData } from '../types.ts'

export async function pixelift(input: BrowserInput, options?: unknown): Promise<PixelData> {
  const imageData = await loadAndGetImageData(input)
  return {
    data: new Uint8ClampedArray(imageData.data),
    width: imageData.width,
    height: imageData.height,
    channels: 4
  }
}

async function loadAndGetImageData(imageSource: BrowserInput): Promise<ImageData> {
  let bitmap: ImageBitmap

  if (imageSource instanceof ImageBitmap) {
    bitmap = imageSource
  } else if (typeof imageSource === 'string' || imageSource instanceof URL) {
    const blob = await getBlob(imageSource)
    bitmap = await createImageBitmap(blob)
  } else {
    bitmap = await createImageBitmap(imageSource)
  }

  const context = createCanvasContext(bitmap)
  context.drawImage(bitmap, 0, 0)
  return context.getImageData(0, 0, bitmap.width, bitmap.height)
}

async function getBlob(url: string | URL) {
  const response = await fetch(url, { mode: 'cors' })
  if (!response.ok) throw new Error('Network response was not ok')
  return await response.blob()
}

function createCanvasContext({ width, height }: ImageBitmap) {
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to get 2D context')
  return context
}