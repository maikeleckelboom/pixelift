import type { BrowserOptions } from '../types';
import { createCanvasAndContext } from '../decoder/canvas/utils';

export async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const { width, height } = bitmap;
  const [canvas, context] = createCanvasAndContext(width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return await canvas.convertToBlob({
    type: options?.type,
    quality: options?.options?.quality
  });
}
