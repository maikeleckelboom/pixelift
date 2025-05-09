import { createError } from '../../shared/error';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';

let canvasDecoderModule: Promise<typeof import('./canvas')>;

async function loadCanvasDecoder(): Promise<typeof import('./canvas')> {
  if (!canvasDecoderModule) {
    canvasDecoderModule = import('./canvas');
  }
  return canvasDecoderModule;
}

let webCodecsModule: Promise<typeof import('./webcodecs')>;

async function loadWebCodecsDecoder(): Promise<typeof import('./webcodecs')> {
  if (!webCodecsModule) {
    webCodecsModule = import('./webcodecs');
  }
  return webCodecsModule;
}

const DECODER_STRATEGIES: DecoderStrategy<Blob, BrowserOptions>[] = [
  {
    id: 'offscreenCanvas',
    isSupported: async (type: string): Promise<boolean> => {
      const { isSupported } = await loadCanvasDecoder();
      return isSupported(type);
    },
    decode: async (input: Blob, options?: BrowserOptions): Promise<PixelData> => {
      const { decode } = await loadCanvasDecoder();
      return decode(input, options);
    }
  },
  {
    id: 'webCodecs',
    isSupported: async (type: string) => {
      const { isSupported } = await loadWebCodecsDecoder();
      return isSupported(type);
    },
    decode: async (input: Blob, options?: BrowserOptions): Promise<PixelData> => {
      const { decode } = await loadWebCodecsDecoder();
      return decode(input, options);
    }
  }
];

async function findSupportedStrategy(
  blob: Blob,
  options?: BrowserOptions
): Promise<DecoderStrategy<Blob, BrowserOptions>> {
  if (options?.decoder) {
    const strategy = DECODER_STRATEGIES.find((s) => s.id === options?.decoder);

    if (!strategy) {
      throw createError.decoderUnsupported(
        options?.decoder,
        `Unknown decoder strategy "${options?.decoder.toString()}"`
      );
    }

    const isSupported = await strategy.isSupported(blob.type);

    if (!isSupported) {
      throw createError.decoderUnsupported(
        strategy.id,
        `MIME type "${blob.type}" is not supported by "${strategy.id}" decoder`
      );
    }

    return strategy;
  }

  for (const strategy of DECODER_STRATEGIES) {
    if (await strategy.isSupported(blob.type)) {
      return strategy;
    }
  }

  throw createError.decoderUnsupported(
    blob.type,
    `No available decoder supports MIME type "${blob.type}"`
  );
}

export async function decode(
  source: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const blob = await toBlob(source, options);
  const strategy = await findSupportedStrategy(blob, options);
  return strategy.decode(blob, options);
}
