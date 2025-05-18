import { createError } from '../../shared/error';

export async function rasterizeBlob(
  blob: Blob,
  opts: ImageBitmapOptions
): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return await createImageBitmap(img, opts);
  } catch (error) {
    throw createError.decodingFailed(
      'Blob via ImageElement',
      'createImageBitmap failed via ImageElement (main thread)',
      error
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
