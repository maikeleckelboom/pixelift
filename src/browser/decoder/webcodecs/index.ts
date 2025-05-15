import type { PixelData } from '../../../types';
import type { BrowserInput, WebCodecsDecoderOptions } from '../../types';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';

export async function isSupported(mimeType: string): Promise<boolean> {
  return ImageDecoder.isTypeSupported(mimeType);
}

export async function decode(
  input: BrowserInput,
  options?: WebCodecsDecoderOptions
): Promise<PixelData> {
  let blobInput: Blob;

  if (input instanceof Blob) {
    blobInput = input;
  } else {
    try {
      blobInput = await toBlob(input, options);
    } catch (conversionError) {
      const inputType = input?.constructor?.name || typeof input;
      throw createError.decodingFailed(
        options?.type || 'unknown',
        `Failed to convert input (${inputType}) to Blob for WebCodecs`,
        conversionError
      );
    }
  }

  const blobStream = blobInput.stream();
  const type = blobInput.type;

  if (!type) {
    throw createError.decodingFailed(
      blobInput.type,
      'Input Blob does not have a valid MIME type for WebCodecs processing'
    );
  }

  let decoder: ImageDecoder | undefined;
  let frame: VideoFrame | undefined;

  try {
    decoder = new ImageDecoder({
      data: blobStream,
      type: options?.type ?? 'image/png',
      colorSpaceConversion: 'none'
    });

    await decoder.completed;

    const { image: frame } = await decoder.decode({
      frameIndex: options?.options?.frameIndex ?? 0,
      completeFramesOnly: options?.options?.completeFramesOnly ?? false
    });

    const byteLength = frame.allocationSize({ format: 'RGBA' });
    const data = new Uint8ClampedArray(byteLength);

    await frame.copyTo(data, {
      format: 'RGBA',
      colorSpace: 'srgb'
    });

    return {
      data,
      width: frame.codedWidth,
      height: frame.codedHeight
    };
  } catch (error) {
    throw createError.rethrow(error);
  } finally {
    frame?.close();
    decoder?.close();
  }
}
