import type { BrowserInput, BrowserOptions, PixelData } from '../types.ts';
import { loadAndGetImageData } from './utils.ts';

export async function pixelift(
  input: BrowserInput,
  options?: BrowserOptions,
): Promise<PixelData> {
  const imageData = await loadAndGetImageData(input, options);
  return {
    data: new Uint8ClampedArray(imageData.data.buffer),
    width: imageData.width,
    height: imageData.height,
  };
}

