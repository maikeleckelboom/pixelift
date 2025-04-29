import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';
import { PixeliftError } from '../shared/errors.ts';
import { isImageBitmapSource, isStringOrURL } from '../shared/validation.ts';
import type { PixelData } from '../types.ts';
import { isWebCodecsSupportedForType } from './utils.ts';

async function decodeWithWebCodecs(
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
    // @ts-expect-error: The WebCodecs API is experimental and may not be fully typed
    premultiplyAlpha: 'none'
  });

  await decoder.completed;
  const { image: frame } = await decoder.decode();

  // Copy to a tightly packed RGBA buffer
  const byteLength = frame.allocationSize({ format: 'RGBA' });
  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  // Clean up
  frame.close();
  decoder.close();

  return { data, width: frame.codedWidth, height: frame.codedHeight };
}

/**
 * Fallback path using createImageBitmap + OffscreenCanvas
 */
async function decodeWithFallback(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./fallback-decoder.ts');
  return await decoder.decode(source, options);
}

/**
 * Resilient decoder: tries WebCodecs, auto-fallback on any failure
 */
export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  let blob: Blob;

  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw PixeliftError.requestFailed(`Fetch failed (${response.status})`);
    }
    blob = await response.blob();
  } else if (source instanceof Blob) {
    blob = source;
  } else if (isImageBitmapSource(source)) {
    // Cannot feed ImageBitmap to WebCodecs
    return decodeWithFallback(source, options);
  } else {
    throw PixeliftError.decodeFailed('Unsupported image source');
  }

  // Try WebCodecs if supported
  if (await isWebCodecsSupportedForType(blob.type)) {
    try {
      return await decodeWithWebCodecs(blob, options);
    } catch (err) {
      console.warn('WebCodecs decode failed, falling back:', err);
      return decodeWithFallback(source, options);
    }
  }

  // No WebCodecs, use fallback
  return decodeWithFallback(source, options);
}
