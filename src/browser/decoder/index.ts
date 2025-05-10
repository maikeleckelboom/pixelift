import { createError } from '../../shared/error';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';

let canvasDecoderModule: Promise<typeof import('./canvas')>;
let webCodecsModule: Promise<typeof import('./webcodecs')>;

async function loadCanvasDecoder(): Promise<typeof import('./canvas')> {
  return (canvasDecoderModule ||= import('./canvas'));
}

async function loadWebCodecsDecoder(): Promise<typeof import('./webcodecs')> {
  return (webCodecsModule ||= import('./webcodecs'));
}

const DECODER_STRATEGIES: DecoderStrategy<Blob, BrowserOptions>[] = [
  {
    id: 'offscreenCanvas',
    isSupported: async (type: string): Promise<boolean> => {
      const canvasDecoder = await loadCanvasDecoder();
      return canvasDecoder.isSupported(type);
    },
    decode: async (
      blob: Blob | ImageBitmap,
      options?: BrowserOptions
    ): Promise<PixelData> => {
      const canvasDecoder = await loadCanvasDecoder();
      return canvasDecoder.decode(blob, options);
    }
  },
  {
    id: 'webCodecs',
    isSupported: async (type: string): Promise<boolean> => {
      const webcodecs = await loadWebCodecsDecoder();
      return webcodecs.isSupported(type);
    },
    decode: async (blob: Blob, options?: BrowserOptions): Promise<PixelData> => {
      const webcodecs = await loadWebCodecsDecoder();
      return webcodecs.decode(blob, options);
    }
  }
];

async function findSupportedStrategy(
  blob: Blob,
  options?: BrowserOptions
): Promise<DecoderStrategy<Blob, BrowserOptions>> {
  // Forced decoder selection
  if (options?.decoder) {
    const strategy = DECODER_STRATEGIES.find((s) => s.id === options.decoder);
    if (!strategy) {
      throw createError.decoderUnsupported(options.decoder, 'Explicit decoder not found');
    }
    const supported = await strategy.isSupported(blob.type);
    if (supported) return strategy;
    throw createError.decoderUnsupported(
      strategy.id,
      `Unsupported MIME type ${blob.type} for forced decoder`
    );
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
