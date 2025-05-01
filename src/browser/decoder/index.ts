import type { PixelData, PixeliftOptions } from 'pixelift';
import { isImageBitmapSource, isWebCodecsSupportedForType } from '../validation';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types.ts';
import type { PixeliftBrowserInput } from 'pixelift/browser';

const decoderStrategies: DecoderStrategy[] = [
  {
    id: 'webCodecs',
    isSupported: (type) => isWebCodecsSupportedForType(type),
    decode: (blob, options): Promise<PixelData> => {
      console.log('Using [ WebCodecs ] decoder for type:', blob.type);
      return decodeWithWebCodecs(blob, options);
    }
  },
  {
    id: 'offscreenCanvas',
    isSupported: () => Promise.resolve(true),
    decode: (blob, options): Promise<PixelData> => {
      console.log('Using [ OffscreenCanvas ] decoder for type:', blob.type);
      return decodeWithOffscreenCanvas(blob, options);
    }
  },
  {
    id: 'webgl',
    isSupported: () => Promise.resolve(false),
    decode: (blob, options): Promise<PixelData> => {
      console.log(`Using [ WebGL ] decoder for type: [ ${blob.type} ] `);
      return decodeWithWebGL(blob, options);
    }
  }
] as const;

async function decodeWithWebGL(
  blob: Blob | File,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const decoder = await import('./webgl');
  return decoder.decode(blob, options);
}

async function decodeWithWebCodecs(
  blob: Blob | File,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const decoder = await import('./webcodecs');
  return decoder.decode(blob, options);
}

async function decodeWithOffscreenCanvas(
  source: PixeliftBrowserInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const decoder = await import('./canvas');
  return decoder.decode(source, options);
}

export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  if (isImageBitmapSource(source)) {
    return decodeWithOffscreenCanvas(source, options);
  }

  const blob = await toBlob(source, options);

  let lastError: unknown;
  for (const { isSupported, decode } of decoderStrategies) {
    if (!(await isSupported(blob.type))) {
      continue;
    }
    try {
      return await decode(blob, options);
    } catch (error: unknown) {
      lastError = error;
    }
  }

  throw Error(`Unable to decode image format "${blob.type}".`, {
    cause: lastError
  });
}
