import { createError, PixeliftError } from '../../shared/error';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';
import { guessInputMimeType } from '../../shared/file-type';
import * as WebCodecsDecoder from './webcodecs';

const canvasDecoderPromise: Promise<typeof import('./canvas')> = import('./canvas');
const supportPromiseCache: Map<string, Promise<boolean>> = new Map();

function isWebCodecsSupported(mime: string): Promise<boolean> {
  if (!supportPromiseCache.has(mime)) {
    const promise = WebCodecsDecoder.isSupported(mime).catch((err) => {
      supportPromiseCache.delete(mime);
      throw createError.rethrow(err);
    });
    supportPromiseCache.set(mime, promise);
  }
  return supportPromiseCache.get(mime) as Promise<boolean>;
}

type DecoderOption = 'auto' | 'webCodecs' | 'offscreenCanvas';

interface DecodeOptions extends BrowserOptions {
  readonly type: string;
  readonly onError?: (type: string, error?: PixeliftError) => void;
}

type DecoderStrategy = (input: BrowserInput, options: DecodeOptions) => Promise<PixelData>;

const strategies: Record<DecoderOption, DecoderStrategy> = {
  async webCodecs(input, options) {
    try {
      return await WebCodecsDecoder.decode(input, options);
    } catch (error: unknown) {
      options?.onError?.('webCodecs', createError.rethrow(error));
      return strategies.offscreenCanvas(input, options);
    }
  },

  async offscreenCanvas(input, options) {
    const module = await canvasDecoderPromise;
    try {
      return await module.decode(input, options);
    } catch (error: unknown) {
      options?.onError?.('offscreenCanvas', createError.rethrow(error));
      throw createError.rethrow(error);
    }
  },

  async auto(input, opts) {
    try {
      const supported = await isWebCodecsSupported(opts.type);
      if (supported) return strategies.webCodecs(input, opts);
    } catch {
      /* Fallback to Canvas */
    }

    return strategies.offscreenCanvas(input, opts);
  }
};

export async function decode(
  input: BrowserInput,
  options: BrowserOptions = {}
): Promise<PixelData> {
  const { decoder, type: explicitType, ...rest } = options;

  if (decoder && !strategies[decoder]) {
    throw createError.decoderUnsupported(decoder);
  }

  const type = explicitType ?? guessInputMimeType(input);

  if (!type) {
    throw createError.runtimeError('Unable to determine MIME type for input.');
  }

  const strategy = decoder ?? 'auto';
  return strategies[strategy](input, { ...rest, type });
}
