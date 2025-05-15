import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type { BrowserDecoder, BrowserInput, BrowserOptions } from '../types';
import { getMimeType } from '../../shared/mime';
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

interface DecodeOptions extends BrowserOptions {
  readonly type: string;
}

type DecoderStrategy = (input: BrowserInput, options: DecodeOptions) => Promise<PixelData>;

const strategies: Record<BrowserDecoder | 'auto', DecoderStrategy> = {
  async webCodecs(input, options) {
    return WebCodecsDecoder.decode(input, options);
  },

  async offscreenCanvas(input, options) {
    const module = await canvasDecoderPromise;
    try {
      return await module.decode(input, options as BrowserOptions<'offscreenCanvas'>);
    } catch (error: unknown) {
      throw createError.rethrow(error);
    }
  },

  async auto(input, options) {
    try {
      const supported = await isWebCodecsSupported(options.type);
      if (supported) return strategies.webCodecs(input, options);
    } catch {
      /* empty */
    }

    return strategies.offscreenCanvas(input, options);
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

  const type = explicitType ?? getMimeType(input);

  if (!type) {
    throw createError.runtimeError(
      'Unable to determine MIME type. Please provide a valid type.'
    );
  }

  const strategy = decoder ?? 'auto';
  return strategies[strategy](input, { ...rest, type });
}
