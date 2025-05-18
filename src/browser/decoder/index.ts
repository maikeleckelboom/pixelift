import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type {
  BrowserImageInput,
  BrowserOptions,
  OffscreenCanvasDecoderOptions,
  OffscreenCanvasOptions,
  WebCodecsDecoderOptions
} from '../types';
import { detectMimeType } from '../mime/detect';
import * as WebCodecsDecoder from './webcodecs';

const canvasDecoderPromise: Promise<typeof import('./canvas')> = import('./canvas');
const supportPromiseCache = new Map<string, Promise<boolean>>();

// WebCodecs detection 📌
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

// Decoding functions
async function performWebCodecsDecode(
  input: BrowserImageInput,
  options: WebCodecsDecoderOptions
): Promise<PixelData> {
  const supported = await isWebCodecsSupported(options.type);
  if (!supported) throw createError.decoderUnsupported('webCodecs');
  return WebCodecsDecoder.decode(input, options);
}

// Explicit type casting when passing options
async function performOffscreenCanvasDecode(
  input: BrowserImageInput,
  options: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  const module = await canvasDecoderPromise;

  // Type-safe options handling 📌
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

// Type-safe strategy implementations 📌
const strategies = {
  webCodecs: (input: BrowserImageInput, options: Omit<BrowserOptions, 'decoder'>) =>
    performWebCodecsDecode(input, { ...options, decoder: 'webCodecs' }),

  offscreenCanvas: async function (
    input: BrowserImageInput,
    options: Omit<BrowserOptions, 'decoder'>
  ) {
    return performOffscreenCanvasDecode(input, {
      ...options,
      decoder: 'offscreenCanvas',
      // Explicit type narrowing 📌
      options: options.options ? (options.options as OffscreenCanvasOptions) : undefined
    });
  },
  auto: async (input: BrowserImageInput, options: Omit<BrowserOptions, 'decoder'>) => {
    try {
      if (await isWebCodecsSupported(options.type)) {
        return strategies.webCodecs(input, options);
      }
    } catch (error) {
      const env = Bun.env.MODE ?? process.env.NODE_ENV;
      if (env === 'development') {
        console.warn('⚡️ WebCodecs failed – falling back to Canvas:', error);
      }
    }
    return strategies.offscreenCanvas(input, options);
  }
};

export async function decode(
  input: BrowserImageInput,
  userOptions: BrowserOptions = {}
): Promise<PixelData> {
  const { decoder: selectedDecoder = 'auto', type: explicitType, ...rest } = userOptions;

  // Validate decoder choice
  if (selectedDecoder !== 'auto' && !strategies[selectedDecoder]) {
    throw createError.decoderUnsupported(selectedDecoder);
  }

  // Determine MIME type
  const mimeType = explicitType ?? detectMimeType(input);
  if (!mimeType) throw createError.runtimeError('MIME type detection failed');

  return strategies[selectedDecoder](input, { ...rest, type: mimeType });
}
