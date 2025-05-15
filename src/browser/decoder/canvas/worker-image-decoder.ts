import { imageBitmapOptions } from './options';
import { createError } from '../../../shared/error';
import type { PixelData } from '../../../types';
import type { OffscreenCanvasDecoderOptions, WorkerCompatibleInput } from '../../types';
import { createCanvasAndContext } from './utils';
import { toBlob } from '../../blob';

export async function decodeInWorker(
  input: WorkerCompatibleInput,
  options?: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  // if bitmap than now i do from bitmap -> blob -> bitmap -> canvas
  const blob = await toBlob(input, options);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, imageBitmapOptions(options));
  } catch (error) {
    throw createError.decodingFailed(
      options?.type || 'unknown',
      `Failed to create ImageBitmap from Blob for OffscreenCanvas`,
      error
    );
  }

  const [canvas, context] = createCanvasAndContext(bitmap.width, bitmap.height, options);
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  bitmap.close();

  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  };
}
