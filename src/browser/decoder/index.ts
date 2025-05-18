import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type {
  BrowserInput,
  BrowserOptions,
  OffscreenCanvasDecoderOptions,
  OffscreenCanvasOptions,
  WebCodecsDecoderOptions
} from '../types';
import { detectMimeType } from '../mime/detect';
import * as WebCodecsDecoder from './webcodecs';

const canvasDecoderPromise: Promise<typeof import('./canvas')> = import('./canvas');
const supportPromiseCache = new Map<string, Promise<boolean>>();

function isWebCodecsSupported(mime?: string): Promise<boolean> {
  if (!mime) return Promise.resolve(false);
  if (!supportPromiseCache.has(mime)) {
    const isBrowserSupported = typeof ImageDecoder !== 'undefined';
    if (!isBrowserSupported) return Promise.resolve(false);

    const promise = WebCodecsDecoder.isSupported(mime).catch((err) => {
      supportPromiseCache.delete(mime);
      throw createError.rethrow(err);
    });
    supportPromiseCache.set(mime, promise);
  }
  return supportPromiseCache.get(mime) as Promise<boolean>;
}

async function performWebCodecsDecode(
  input: BrowserInput,
  options: WebCodecsDecoderOptions
): Promise<PixelData> {
  const supported = await isWebCodecsSupported(options.type);
  if (!supported) throw createError.decoderUnsupported('webCodecs');
  return WebCodecsDecoder.decode(input, options);
}

async function performOffscreenCanvasDecode(
  input: BrowserInput,
  options: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  const module = await canvasDecoderPromise;
  const canvasOptions: OffscreenCanvasDecoderOptions = {
    ...options,
    options: {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'high',
      ...options.options
    }
  };
  return module.decode(input, canvasOptions);
}

const strategies = {
  webCodecs: (input: BrowserInput, options: Omit<BrowserOptions, 'decoder'>) =>
    performWebCodecsDecode(input, { ...options, decoder: 'webCodecs' }),
  offscreenCanvas: async function (
    input: BrowserInput,
    options: Omit<BrowserOptions, 'decoder'>
  ) {
    return performOffscreenCanvasDecode(input, {
      ...options,
      decoder: 'offscreenCanvas',
      options: options.options ? (options.options as OffscreenCanvasOptions) : undefined
    });
  },
  auto: async (input: BrowserInput, options: Omit<BrowserOptions, 'decoder'>) => {
    try {
      if (await isWebCodecsSupported(options.type)) {
        return await strategies.webCodecs(input, options);
      }
    } catch (error) {
      const env = Bun.env.MODE ?? process.env.NODE_ENV;
      if (env === 'development') {
        console.warn('🍂️ Falling back to Canvas:', error);
      }
    }
    return strategies.offscreenCanvas(input, options);
  }
};

export async function decode(
  input: BrowserInput,
  userOptions: BrowserOptions = {}
): Promise<PixelData> {
  const { decoder: selectedDecoder = 'auto', type: explicitType, ...rest } = userOptions;

  if (selectedDecoder !== 'auto' && !strategies[selectedDecoder]) {
    throw createError.decoderUnsupported(selectedDecoder);
  }

  const mimeType = explicitType ?? detectMimeType(input);
  if (!mimeType) throw createError.runtimeError('MIME type detection failed');

  return strategies[selectedDecoder](input, { ...rest, type: mimeType });
}
