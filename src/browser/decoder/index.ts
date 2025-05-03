import { isImageBitmapSource } from '../validation';
import { toBlob } from '../blob';
import type { DecoderStrategy } from './types';
import type { PixelData, PixeliftBrowserOptions } from '../types';
import { createError } from '../../shared/error';

const webCodecsModule: Promise<typeof import('./webcodecs')> = import('./webcodecs');

let canvasDecoderModule: Promise<typeof import('./canvas')> | null = null;

async function loadCanvasDecoder(): Promise<typeof import('./canvas')> {
  if (!canvasDecoderModule) {
    canvasDecoderModule = import('./canvas');
  }
  return canvasDecoderModule;
}

const DECODER_STRATEGIES: DecoderStrategy[] = [
  {
    id: 'webCodecs',
    isSupported: (type: string) =>
      webCodecsModule.then(({ isSupported }) => isSupported(type)),
    decode: (blob: Blob, options: PixeliftBrowserOptions) =>
      webCodecsModule.then(({ decode }) => decode(blob, options))
  },
  {
    id: 'offscreenCanvas',
    isSupported: async (type: string): Promise<boolean> => {
      const { isSupported } = await loadCanvasDecoder();
      return isSupported(type);
    },
    decode: async (blob: Blob, options: PixeliftBrowserOptions): Promise<PixelData> => {
      const { decode } = await loadCanvasDecoder();
      return decode(blob, options);
    }
  }
];

async function findSupportedStrategy(
  blob: Blob,
  decoder: PixeliftBrowserOptions['decoder']
): Promise<DecoderStrategy> {
  if (decoder) {
    const strategy = DECODER_STRATEGIES.find((s) => s.id === decoder);

    if (!strategy) {
      throw createError.decoderUnsupported(
        decoder.toString(),
        `Unknown decoder strategy "${decoder.toString()}"`
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
  source: Blob,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  if (isImageBitmapSource(source)) {
    const { decode } = await loadCanvasDecoder();
    return decode(source, options);
  }

  const blob = await toBlob(source, options);
  const strategy = await findSupportedStrategy(blob, options.decoder);

  return strategy.decode(blob, options);
}
