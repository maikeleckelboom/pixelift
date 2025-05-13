import { createError } from '../../shared/error';
import type { DecoderStrategy } from './types';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';
import { getFileType } from '../../shared/file-type';

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
    id: 'webCodecs',
    isSupported: async (type: string): Promise<boolean> => {
      const webcodecs = await loadWebCodecsDecoder();
      return webcodecs.isSupported(type);
    },
    decode: async (blob: Blob, options?: BrowserOptions): Promise<PixelData> => {
      const webcodecs = await loadWebCodecsDecoder();
      return webcodecs.decode(blob, options);
    }
  },
  {
    id: 'offscreenCanvas',
    isSupported: async (): Promise<boolean> => {
      const canvasDecoder = await loadCanvasDecoder();
      return canvasDecoder.isSupported();
    },
    decode: async (blob: Blob, options?: BrowserOptions): Promise<PixelData> => {
      const canvasDecoder = await loadCanvasDecoder();
      return canvasDecoder.decode(blob, options);
    }
  }
];

async function getDecoderStrategy(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<DecoderStrategy<Blob, BrowserOptions>> {
  const fileType = getFileType(input, options);

  if (options?.decoder) {
    const strategy = DECODER_STRATEGIES.find((s) => s.id === options?.decoder);

    if (!strategy) {
      throw createError.decoderUnsupported(options.decoder);
    }

    if (await strategy.isSupported(fileType)) {
      return strategy;
    }

    throw createError.decoderUnsupported(strategy.id, `Unsupported MIME type ${fileType}.`);
  }

  for (const strategy of DECODER_STRATEGIES) {
    if (await strategy.isSupported(fileType)) {
      return strategy;
    }
  }

  throw createError.decoderUnsupported('webCodecs', `Unsupported MIME type ${fileType}.`);
}

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  console.log('🌐 Invoking browser decoder (debug)');

  if (input instanceof ImageData && !(options?.width || options?.height)) {
    return {
      data: input.data,
      width: input.width,
      height: input.height
    };
  }

  const decoder = await getDecoderStrategy(input, options);

  if (decoder.id === 'webCodecs') {
    const webcodecs = await loadWebCodecsDecoder();
    return webcodecs.decode(input, options);
  }

  if (decoder.id === 'offscreenCanvas') {
    const canvasDecoder = await loadCanvasDecoder();
    return canvasDecoder.decode(input, options);
  }

  throw createError.decoderUnsupported(decoder.id, 'Strategy could not be executed.');
}
