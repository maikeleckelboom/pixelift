import { toBlob } from './blob';
import { createError } from '../shared/error';

/**
 * Represents pixel data for an image, including its dimensions and color space.
 */
export interface PixelData {
  /** A typed array containing pixel values in row-major RGBA order. */
  data: Uint8ClampedArray;
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
  /** Color space used to interpret the pixel data. */
  colorSpace: PredefinedColorSpace;
}

/** Supported color spaces for CanvasRenderingContext2D. */
export type PredefinedColorSpace = 'srgb' | 'display-p3' | 'rec2020';

/** Subset of RequestInit for fetch customization. */
export type FetchOptions = Pick<RequestInit, 'credentials' | 'headers' | 'signal' | 'mode'>;

/**
 * Types of input that can be transferred or decoded.
 */
export type TransferableInput =
  | string
  | URL
  | Blob
  | BufferSource
  | ReadableStream<Uint8Array>
  | Response
  | ImageBitmap
  | OffscreenCanvas;

/** DOM-based sources for rendering contexts. */
export type DOMSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | SVGImageElement;

/** All supported browser-side inputs. */
export type BrowserInput = TransferableInput | ImageData | DOMSource;

/** Quality levels matching CanvasRenderingContext2D.imageSmoothingQuality. */
export type QualityLevel = 'low' | 'medium' | 'high';

/**
 * Canvas-based decoding and rendering options.
 */
export interface CanvasConfig {
  /** Pass-through to getContext('2d', { alpha }). Defaults to true. */
  alpha?: boolean;
  /** Target width for resizing; if undefined, use original width. */
  resizeWidth?: number;
  /** Target height for resizing; if undefined, use original height. */
  resizeHeight?: number;
  /** Custom quality abstraction for resizing; does not map to browser API. */
  resizeQuality?: QualityLevel;
  /** Maps to context.imageSmoothingEnabled. Defaults to true. */
  smoothingEnabled?: boolean;
  /** Maps to context.imageSmoothingQuality. Defaults to 'medium'. */
  smoothingQuality?: QualityLevel;
  /** Pass-through to getContext('2d', { colorSpace }). */
  colorSpace?: PredefinedColorSpace;
}

/**
 * WebCodecs-based decoding options.
 */
export interface WebCodecsConfig {
  /** MIME type for ImageDecoder (e.g., 'image/png'). */
  type?: string;
  /** Frame index when decoding multi-frame images. */
  frameIndex?: number;
  /** If true, only complete frames are decoded. */
  completeFramesOnly?: boolean;
  /** Hints to prefer animation decoding. */
  preferAnimation?: boolean;
}

/**
 * Unified options for Pixelift decoding.
 */
export type PixeliftOptions = FetchOptions &
  (
    | { decoder: 'offscreenCanvas'; options?: CanvasConfig }
    | { decoder: 'webCodecs'; options?: WebCodecsConfig }
  );

/**
 * Sensible defaults for both decoders; no resizing by default.
 */
export const dummyTestOptions: PixeliftOptions[] = [
  {
    decoder: 'offscreenCanvas',
    options: {
      alpha: true,
      colorSpace: 'srgb',
      smoothingEnabled: true,
      smoothingQuality: 'medium'
    }
  },
  {
    decoder: 'webCodecs',
    options: {
      type: 'image/png',
      frameIndex: 0,
      completeFramesOnly: true,
      preferAnimation: false
    }
  }
];

/**
 * Draws a source onto a CanvasRenderingContext2D.
 */
export function renderSourceToCanvas(
  context2D: CanvasRenderingContext2D,
  src: ImageData | HTMLCanvasElement | OffscreenCanvas,
  width: number,
  height: number
): void {
  if (src instanceof ImageData) {
    context2D.putImageData(src, 0, 0);
  } else {
    context2D.drawImage(src, 0, 0, width, height);
  }
}

export function createOffscreenCanvasAndContext(
  width: number,
  height: number,
  options?: CanvasConfig
): [OffscreenCanvas, OffscreenCanvasRenderingContext2D] {
  const finalWidth = options?.resizeWidth ?? width;
  const finalHeight = options?.resizeHeight ?? height;

  const canvas = new OffscreenCanvas(finalWidth, finalHeight);

  const context = canvas.getContext('2d', {
    alpha: options?.alpha ?? true,
    colorSpace: options?.colorSpace ?? 'srgb'
  });

  if (!context) {
    throw new Error('Failed to create OffscreenCanvasRenderingContext2D');
  }

  if (typeof options?.smoothingEnabled === 'boolean') {
    context.imageSmoothingEnabled = options.smoothingEnabled;
    if (options.smoothingEnabled && options.smoothingQuality) {
      context.imageSmoothingQuality = options.smoothingQuality;
    }
  }

  return [canvas, context];
}

/**
 * Helper to ensure VideoFrame or ImageBitmap is closed after use.
 */
async function withAutoClose<T extends { close(): void }, R>(
  resource: T,
  fn: (res: T) => Promise<R>
): Promise<R> {
  try {
    return await fn(resource);
  } finally {
    resource.close();
  }
}

// Convert various inputs to a Blob
async function inputToBlob(input: BrowserInput, fetchOpts: RequestInit): Promise<Blob> {
  if (typeof input === 'string' || input instanceof URL) {
    const response = await fetch(input.toString(), fetchOpts);
    if (!response.ok) {
      throw createError.runtimeError(
        `Fetch failed ${response.status}`,
        response.statusText
      );
    }
    return await response.blob();
  }
  if (input instanceof Response) return await input.blob();
  if (input instanceof ReadableStream) return await toBlob(input);
  if (input instanceof Blob) return input;
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return new Blob([input]);
  throw createError.invalidInput('Cannot convert input to Blob', typeof input);
}

// Canvas-based decoding (supports resize, smoothing, colorSpace)
async function decodeWithCanvas(
  input: BrowserInput,
  options: CanvasConfig,
  fetchOpts: RequestInit
): Promise<PixelData> {
  // Obtain ImageBitmap or renderable source
  let bmpSrc: ImageBitmap | OffscreenCanvas | ImageData;
  if (
    input instanceof ImageData ||
    input instanceof OffscreenCanvas ||
    input instanceof ImageBitmap
  ) {
    bmpSrc = input;
  } else {
    const blob = await inputToBlob(input, fetchOpts);
    bmpSrc = await createImageBitmap(blob, {
      resizeWidth: options.resizeWidth,
      resizeHeight: options.resizeHeight,
      resizeQuality: options.resizeQuality,
      premultiplyAlpha: options.alpha ? 'premultiply' : 'none'
    });
  }

  // Ensure we have an ImageBitmap
  const bitmap =
    bmpSrc instanceof ImageBitmap
      ? bmpSrc
      : await createImageBitmap(bmpSrc, {
          resizeWidth: options.resizeWidth,
          resizeHeight: options.resizeHeight,
          resizeQuality: options.resizeQuality,
          premultiplyAlpha: options.alpha ? 'premultiply' : 'none'
        });

  // Draw, extract pixels, and auto-close
  return withAutoClose(bitmap, async (bmp) => {
    const [canvas, ctx] = createOffscreenCanvasAndContext(bmp.width, bmp.height, options);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return {
      data: img.data,
      width: img.width,
      height: img.height,
      colorSpace: options.colorSpace ?? 'srgb'
    };
  });
}

// WebCodecs-based decoding (native resolution)
async function decodeWithWebCodecs(
  input: BrowserInput,
  options: WebCodecsConfig,
  fetchOpts: RequestInit
): Promise<PixelData> {
  const blob = await inputToBlob(input, fetchOpts);
  const decoder = new ImageDecoder({
    data: blob.stream(),
    type: options.type ?? '',
    preferAnimation: options.preferAnimation ?? false
  });

  await decoder.tracks.ready;
  const frameIndex = options.frameIndex ?? 0;
  const completeFramesOnly = options.completeFramesOnly ?? true;
  const { image: frame } = await decoder.decode({
    frameIndex,
    completeFramesOnly
  });

  const data = new Uint8ClampedArray(frame.codedWidth * frame.codedHeight * 4);
  await frame.copyTo(data, {
    format: 'RGBA'
  });

  return {
    data: new Uint8ClampedArray(),
    width: frame.codedWidth,
    height: frame.codedHeight,
    colorSpace: 'srgb'
  };
}

// Public decode API
export async function decode(
  input: BrowserInput,
  opts:
    | { decoder: 'offscreenCanvas'; options?: CanvasConfig; fetchOpts?: RequestInit }
    | { decoder: 'webCodecs'; options?: WebCodecsConfig; fetchOpts?: RequestInit }
): Promise<PixelData> {
  const fetchOpts = opts.fetchOpts ?? {};
  if (opts.decoder === 'offscreenCanvas') {
    return decodeWithCanvas(input, opts.options ?? {}, fetchOpts);
  }
  return decodeWithWebCodecs(input, opts.options ?? {}, fetchOpts);
}
