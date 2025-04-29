import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';
import { PixeliftError } from '../shared/errors.ts';
import { isStringOrURL } from '../shared/validation.ts';
import type { PixelData } from '../types.ts';
import { isImageBitmapSource, isWebCodecsSupportedForType } from './validation.ts';

export async function decodeBlobWithWebCodecs(
  blob: Blob,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const buffer = await blob.arrayBuffer();
  const decoder = new ImageDecoder({
    type: blob.type,
    data: buffer,
    desiredWidth: options.width,
    desiredHeight: options.height,
    colorSpaceConversion: 'none',
    // @ts-expect-error `WebCodecs API` is not yet in TS
    premultiplyAlpha: 'none'
  });

  await decoder.completed;
  const { image: frame } = await decoder.decode();

  const byteLength = frame.allocationSize({ format: 'RGBA' });

  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  const width = frame.codedWidth;
  const height = frame.codedHeight;

  frame.close();
  decoder.close();

  return { data, width, height };
}

async function decodeWithOffscreenCanvas(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./fallback-decoder.ts');
  return decoder.decode(source, options);
}

export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  let blob: Blob;

  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    const response = await fetch(url, { mode: 'cors', headers: options.headers });
    if (!response.ok) {
      throw PixeliftError.requestFailed(`Fetch failed (${response.status})`);
    }
    blob = await response.blob();
  } else if (source instanceof Blob) {
    blob = source;
  } else if (isImageBitmapSource(source)) {
    // No WebCodecs support
    return decodeWithOffscreenCanvas(source, options);
  } else {
    throw PixeliftError.decodeFailed('Unsupported image source');
  }

  if (await isWebCodecsSupportedForType(blob.type)) {
    try {
      return await decodeBlobWithWebCodecs(blob, options);
    } catch (err) {
      console.warn('WebCodecs decode failed, falling back:', err);
      // WebCodecs Failed -> Fallback to OffscreenCanvas
      return decodeWithOffscreenCanvas(source, options);
    }
  }

  // No WebCodecs support
  return decodeWithOffscreenCanvas(source, options);
}
