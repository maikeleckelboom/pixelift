import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';
import { guessInputMimeType } from '../../shared/file-type';

// Eagerly load WebCodecs decoder (default path)
import * as WebCodecsDecoder from './webcodecs';

// Prepare a single, cached promise for the Canvas decoder (fallback)
let canvasDecoderPromise: Promise<typeof import('./canvas')> | null = null;

function loadCanvasDecoder() {
  return (canvasDecoderPromise ||= import('./canvas'));
}

// Memoize WebCodecs support per MIME type
const webCodecsSupportCache = new Map<string, boolean>();

async function isWebCodecsSupported(type: string): Promise<boolean> {
  if (webCodecsSupportCache.has(type)) {
    return !!webCodecsSupportCache.get(type);
  }
  const supported = await WebCodecsDecoder.isSupported(type);
  webCodecsSupportCache.set(type, supported);
  return supported;
}

// Core decode function: default to WebCodecs, fallback to Canvas
export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const fileType = options?.type || guessInputMimeType(input);

  if (!fileType) {
    throw createError.invalidInput(
      'Unsupported input type for decoder',
      input?.constructor?.name || typeof input
    );
  }

  // If a user explicitly requests Canvas, use it immediately
  if (options?.decoder === 'offscreenCanvas') {
    const { decode: decodeCanvas } = await loadCanvasDecoder();
    return decodeCanvas(input, options);
  }

  // If a user explicitly requests WebCodecs, or WebCodecs supports this type, use it
  if (options?.decoder === 'webCodecs' || (await isWebCodecsSupported(fileType))) {
    return WebCodecsDecoder.decode(input, options);
  }

  // Fallback: load and invoke Canvas decoder
  const { decode: decodeCanvas } = await loadCanvasDecoder();
  return decodeCanvas(input, options);
}
