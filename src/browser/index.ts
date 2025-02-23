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
async function loadAndGetImageData(url: string): Promise<ImageData> {
  const response = await fetch(url, { mode: 'cors' });
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Failed to get 2D context');

  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}
