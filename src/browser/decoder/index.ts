import { createError } from '../../shared/error';
import { toBlob } from '../blob';
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

async function findSupportedStrategy(
  blob: BrowserInput,
  options?: BrowserOptions
): Promise<DecoderStrategy<Blob, BrowserOptions>> {
  const fileType = getFileType(blob, options);

  if (options?.decoder) {
    const strategy = DECODER_STRATEGIES.find((s) => s.id === options?.decoder);

    if (!strategy) {
      throw createError.decoderUnsupported(options.decoder);
    }

    if (await strategy.isSupported(fileType)) {
      return strategy;
    }

    throw createError.decoderUnsupported(
      strategy.id,
      `Unsupported MIME type ${fileType} for decoder "${strategy.id}"`
    );
  }

  for (const strategy of DECODER_STRATEGIES) {
    if (await strategy.isSupported(fileType)) {
      return strategy;
    }
  }

  throw createError.decoderUnsupported(
    'webCodecs',
    `No available decoder supports MIME type "${fileType}"`
  );
}

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  if (input instanceof ImageData && !(options?.width || options?.height)) {
    return {
      data: input.data,
      width: input.width,
      height: input.height
    };
  }

  if (input instanceof ImageBitmap) {
    const canvasDecoder = await loadCanvasDecoder();
    return canvasDecoder.decode(input, options);
  }

  const blob = await toBlob(input, options);
  const strategy = await findSupportedStrategy(blob, options);
  return strategy.decode(blob, options);
}

export function needsBlobConversion(
  input: BrowserInput,
  options?: BrowserOptions
): boolean {
  const decoder = options?.decoder ?? 'webCodecs';

  // WebCodecs requires Blob for all non-Blob inputs
  if (decoder === 'webCodecs') {
    return !(input instanceof Blob);
  }

  // OffscreenCanvas can handle all input types directly
  return false;
}
