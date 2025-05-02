import { isImageBitmapSource } from '../validation';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types';
import type { PixelData, PixeliftBrowserInput, PixeliftBrowserOptions } from '../types';
import { DecoderError } from '../../shared/error';

import * as webCodecsDecoder from './webcodecs';
import * as canvasDecoder from './canvas';
import * as webGLDecoder from './webgl';

const DecoderStrategies: DecoderStrategy[] = [
  {
    id: 'webCodecs',
    isSupported: (type) => webCodecsDecoder.isSupported(type),
    decode: (blob, options): Promise<PixelData> => {
      // console.log(`Using [WebCodecs] decoder for [${blob.type}]`);
      return webCodecsDecoder.decode(blob, options);
    }
  },
  {
    id: 'offscreenCanvas',
    isSupported: (type) => canvasDecoder.isSupported(type),
    decode: (blob, options): Promise<PixelData> => {
      // console.log(`Using [OffscreenCanvas] decoder for [${blob.type}]`);
      return canvasDecoder.decode(blob, options);
    }
  },
  {
    id: 'webgl',
    isSupported: (type) => webGLDecoder.isSupported(type),
    decode: (blob, options): Promise<PixelData> => {
      // console.log(`Using [WebGL] decoder for [${blob.type}]`);
      return webGLDecoder.decode(blob, options);
    }
  }
];

async function decodeUsingStrategy(
  blob: Blob,
  strategy: DecoderStrategy,
  options: PixeliftBrowserOptions
): Promise<PixelData> {
  if (!(await strategy.isSupported(blob.type))) {
    throw new DecoderError(
      strategy.id,
      `Decoder "${strategy.id}" unsupported for type "${blob.type}"`,
      blob.type
    );
  }
  try {
    return await strategy.decode(blob, options);
  } catch (error) {
    throw new DecoderError(
      strategy.id,
      `Decoder "${strategy.id}" failed to decode "${blob.type}"`,
      blob.type,
      { cause: error }
    );
  }
}

export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  if (isImageBitmapSource(source)) {
    return canvasDecoder.decode(source, options);
  }

  const blob = await toBlob(source, options);

  if (options.strategy) {
    const strategy = DecoderStrategies.find((s) => s.id === options.strategy);
    if (!strategy) {
      throw new DecoderError(
        String(options.strategy),
        `Decoder "${options.strategy}" not found. Available: ${DecoderStrategies.map((s) => s.id).join(', ')}`,
        blob.type
      );
    }
    return decodeUsingStrategy(blob, strategy, options);
  }

  for (const strategy of DecoderStrategies) {
    if (!(await strategy.isSupported(blob.type))) {
      continue;
    }
    try {
      return await strategy.decode(blob, options);
    } catch {
      console.warn(`Decoder "${strategy.id}" failed for type "${blob.type}"`);
    }
  }

  throw new DecoderError('all', `No decoder could decode "${blob.type}"`, blob.type);
}
