import { isImageBitmapSource } from '../validation';
import { toBlob } from '../blob';
import { DecoderError } from '../../shared/error';
import type { DecoderStrategy } from './types';
import type { PixelData, PixeliftBrowserInput, PixeliftBrowserOptions } from '../types';

let canvasDecoder: Promise<typeof import('./canvas')> | null = null;

async function getCanvasDecoder(): Promise<typeof import('./canvas')> {
  if (!canvasDecoder) {
    canvasDecoder = import('./canvas');
  }
  return canvasDecoder;
}

const DECODER_STRATEGIES: DecoderStrategy[] = [
  {
    id: 'webgl',
    isSupported: async (type: string): Promise<boolean> => {
      const { isSupported } = await import('./webgl');
      return isSupported(type);
    },
    decode: async (blob: Blob, options: PixeliftBrowserOptions): Promise<PixelData> => {
      const { decode } = await import('./webgl');
      if (options.debug) console.log(`Using [WebGL] decoder for [${blob.type}]`);
      return decode(blob, options);
    }
  },
  {
    id: 'webCodecs',
    isSupported: async (type: string): Promise<boolean> => {
      const { isSupported } = await import('./webcodecs');
      return isSupported(type);
    },
    decode: async (blob: Blob, options: PixeliftBrowserOptions): Promise<PixelData> => {
      const { decode } = await import('./webcodecs');
      if (options.debug) console.log(`Using [WebCodecs] decoder for [${blob.type}]`);
      return decode(blob, options);
    }
  },
  {
    id: 'offscreenCanvas',
    isSupported: async (type: string): Promise<boolean> => {
      const { isSupported } = await getCanvasDecoder();
      return isSupported(type);
    },
    decode: async (blob: Blob, options: PixeliftBrowserOptions): Promise<PixelData> => {
      const { decode } = await getCanvasDecoder();
      if (options.debug)
        console.log(`Using [OffscreenCanvas] decoder for [${blob.type}]`);
      return decode(blob, options);
    }
  }
];

async function decodeWithStrategy(
  blob: Blob,
  strategy: DecoderStrategy,
  options: PixeliftBrowserOptions
): Promise<PixelData> {
  if (!(await strategy.isSupported(blob.type))) {
    throw new Error(`Decoder "${strategy.id}" is not supported for type "${blob.type}"`);
  }

  return strategy.decode(blob, options);
}

async function findSupportedStrategy(
  blob: Blob,
  options: PixeliftBrowserOptions
): Promise<DecoderStrategy | null> {
  if (options.strategy) {
    return DECODER_STRATEGIES.find((s) => s.id === options.strategy) || null;
  }

  const results = await Promise.all(
    DECODER_STRATEGIES.map((s) => s.isSupported(blob.type))
  );

  return DECODER_STRATEGIES.find((_, i) => results[i]) || null;
}

export async function decode(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  if (isImageBitmapSource(source)) {
    canvasDecoder ||= import('./canvas');
    const decodeFn = await canvasDecoder.then((mod) => mod.decode);
    return decodeFn(source, options);
  }

  const blob = await toBlob(source, options);

  const strategy = await findSupportedStrategy(blob, options);

  if (strategy) {
    return decodeWithStrategy(blob, strategy, options);
  }

  throw new DecoderError('all', `No decoder available for "${blob.type}"`, blob.type);
}
