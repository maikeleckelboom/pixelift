import type { BrowserInput, PixelData } from '../types.ts'

export async function pixelift(input: BrowserInput): Promise<PixelData> {
  return await loadAndGetImageData(input)
}

async function loadAndGetImageData(url: string): Promise<PixelData> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.decoding = 'async'
  image.src = url

  await image.decode()

  const canvas = Object.assign(document.createElement('canvas'), {
    width: image.width,
    height: image.height
  })

  const context = canvas.getContext('2d')

  if (!context) throw new Error('Failed to get 2D context')

  context.drawImage(image, 0, 0)

  const imageData = context.getImageData(0, 0, image.width, image.height)

  return {
    data: new Uint8ClampedArray(imageData.data),
    width: imageData.width,
    height: imageData.height
  }
}
