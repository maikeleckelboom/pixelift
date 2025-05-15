import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { imageDecoderInitOptions, imageDecoderOptions } from './options';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';

export async function isSupported(mimeType: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof ImageDecoder === 'function' &&
    (await ImageDecoder.isTypeSupported(mimeType))
  );
}

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
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
  const type = blobInput.type ?? blobInput.type;

  if (!type) {
    throw createError.decodingFailed(
      blobInput.type,
      'Input Blob does not have a valid MIME type for WebCodecs processing'
    );
  }

  const decoderConfig = imageDecoderInitOptions(blobStream, type, options);

  let decoder: ImageDecoder | undefined;
  let frame: VideoFrame | undefined;

  try {
    decoder = new ImageDecoder(decoderConfig);
    await decoder.completed;

    const decodeOptions = imageDecoderOptions(options);
    const { image: frame } = await decoder.decode(decodeOptions);

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
