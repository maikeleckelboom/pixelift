import type { BrowserOptions } from '../types';
import { createError } from '../../shared/error';

export async function blobFromCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options?: BrowserOptions
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    try {
      return await canvas.convertToBlob({
        type: options?.type,
        quality: options?.options?.quality
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        throw createError.runtimeError(
          'OffscreenCanvas is not in a valid state for conversion to Blob.'
        );
      }
      throw createError.runtimeError('Failed to convert OffscreenCanvas to Blob.', {
        cause: error
      });
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(
            createError.runtimeError(
              'Failed to convert HTMLCanvasElement to Blob. This could be due to security restrictions or an unsupported image type.'
            )
          );
        }
      },
      options?.type,
      options?.options?.quality
    );
  });
}
