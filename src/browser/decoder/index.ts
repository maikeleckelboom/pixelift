import type { PixelData } from 'pixelift';
import { isImageBitmapSource, isWebCodecsSupportedForType } from '../validation';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types.ts';
import type { PixeliftBrowserInput } from 'pixelift/browser';
import type { PixeliftBrowserOptions } from '../types';
import { DecoderError, FormatError } from '../../shared/error';

export const DecoderStrategies: DecoderStrategy[] = [
  {
    id: 'webCodecs',
    isSupported: (type) => isWebCodecsSupportedForType(type),
    decode: (blob, options): Promise<PixelData> => {
      console.log(`Using [WebCodecs] decoder for [${blob.type}]`);
      return decodeWithWebCodecs(blob, options);
    }
  },
  {
    id: 'offscreenCanvas',
    isSupported: () => Promise.resolve(true),
    decode: (blob, options): Promise<PixelData> => {
      console.log(`Using [OffscreenCanvas] decoder for [${blob.type}]`);
      return decodeWithOffscreenCanvas(blob, options);
    }
  },
  {
    id: 'webgl',
    isSupported: () => Promise.resolve(false),
    decode: (blob, options): Promise<PixelData> => {
      console.log(`Using [WebGL] decoder for [${blob.type}]`);

      return decodeWithWebGL(blob, options);
    }
  }
] as const;

async function decodeUsingStrategy(
  blob: Blob,
  strategies: readonly DecoderStrategy[],
  options: PixeliftBrowserOptions
): Promise<PixelData> {
  const { decoder } = options || {};
  const strategy = strategies.find((s) => s.id === decoder);

  console.log(`Using [${decoder}] decoder for [${blob.type}]`);

  if (!strategy) {
    throw new DecoderError(
      String(decoder),
      `Decoder "${decoder}" not found. Available: ${strategies.map((s) => s.id).join(', ')}`,
      blob.type
    );
  }

  if (!(await strategy.isSupported(blob.type))) {
    throw new DecoderError(
      String(decoder),
      `Decoder "${decoder}" unsupported for type "${blob.type}"`,
      blob.type
    );
  }

  try {
    return await strategy.decode(blob, options);
  } catch (error) {
    throw new DecoderError(
      String(decoder),
      `Decoder "${decoder}" failed to decode "${blob.type}"`,
      blob.type,
      { cause: error }
    );
  }
}

async function decodeWithWebGL(
  blob: Blob | File,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./webgl');
  return decoder.decode(blob, options);
}

async function decodeWithWebCodecs(
  blob: Blob | File,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./webcodecs');
  return decoder.decode(blob, options);
}

async function decodeWithOffscreenCanvas(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./canvas');
  return decoder.decode(source, options);
}

export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  if (isImageBitmapSource(source)) {
    return decodeWithOffscreenCanvas(source, options);
  }

  const blob = await toBlob(source, options);

  if (options.decoder) {
    return decodeUsingStrategy(blob, DecoderStrategies, options);
  }

  let lastError: unknown;
  for (const strategy of DecoderStrategies) {
    if (!(await strategy.isSupported(blob.type))) continue;

    try {
      return await strategy.decode(blob, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw new FormatError(blob.type, { cause: lastError });
}
