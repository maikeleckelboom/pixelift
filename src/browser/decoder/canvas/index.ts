import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
import { BITMAP_OPTIONS, CANVAS_OPTIONS } from './options';
import { createError } from '../../../shared/error';

let sharedCanvas: OffscreenCanvas | undefined;
let sharedCtx: OffscreenCanvasRenderingContext2D | undefined;

export async function isSupported(type: string): Promise<boolean> {
  return (
    !!type &&
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

export function getOffscreenCanvasContext(
  width: number,
  height: number
): OffscreenCanvasRenderingContext2D {
  if (!sharedCanvas || !sharedCtx) {
    sharedCanvas = new OffscreenCanvas(width, height);
    sharedCtx = sharedCanvas.getContext(
      '2d',
      CANVAS_OPTIONS
    ) as OffscreenCanvasRenderingContext2D;
    sharedCtx.imageSmoothingEnabled = false;
    sharedCtx.imageSmoothingQuality = 'low';
  }
  if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
    sharedCanvas.width = width;
    sharedCanvas.height = height;
  }
  return sharedCtx;
}

async function createImageFromBlob(input: Blob): Promise<ImageBitmap> {
  if (input.type === 'image/svg+xml') {
    const svgUrl = URL.createObjectURL(input);
    const image = new Image();
    image.src = svgUrl;
    await image.decode();
    const bitmap = await createImageBitmap(image, BITMAP_OPTIONS);
    URL.revokeObjectURL(svgUrl);
    return bitmap;
  }

  return createImageBitmap(input, BITMAP_OPTIONS);
}

export async function decode(
  input: Blob | ImageBitmap,
  _options?: BrowserOptions
): Promise<PixelData> {
  let bitmapToProcess: ImageBitmap;
  let shouldCloseBitmapInternally: boolean;

  if (input instanceof ImageBitmap) {
    bitmapToProcess = input;
    // Input ImageBitmap is owned by the caller (the orchestrator in this case).
    // DO NOT CLOSE IT HERE.
    shouldCloseBitmapInternally = false;
  } else {
    bitmapToProcess = await createImageFromBlob(input);
    shouldCloseBitmapInternally = true;
  }

  const { width, height } = bitmapToProcess;
  const ctx = getOffscreenCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmapToProcess, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });

  if (shouldCloseBitmapInternally) {
    bitmapToProcess.close();
  }

  return { data: imageData.data, width, height };
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType?: string,
  quality?: number
): Promise<Blob> {
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(createError.runtimeError('Canvas conversion failed')),
        mimeType || 'image/png',
        quality
      );
    });
  }
  return canvas.convertToBlob({ type: mimeType, quality });
}

export async function rasterizeToBlob(
  source:
    | ImageBitmap
    | ImageData
    | HTMLImageElement
    | SVGImageElement
    | HTMLVideoElement
    | VideoFrame,
  _options?: BrowserOptions
): Promise<Blob> {
  let width: number, height: number;
  let rasterSource:
    | ImageBitmap
    | VideoFrame
    | ImageData
    | HTMLVideoElement
    | HTMLImageElement
    | SVGImageElement = source;
  let shouldCleanup = false;

  if (source instanceof HTMLImageElement || source instanceof SVGImageElement) {
    rasterSource = await createImageBitmap(source);
    shouldCleanup = true;
    width = rasterSource.width;
    height = rasterSource.height;
  } else if (source instanceof ImageData) {
    width = source.width;
    height = source.height;
  } else if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
  } else {
    width = 'displayWidth' in source ? source.displayWidth : source.width;
    height = 'displayHeight' in source ? source.displayHeight : source.height;
  }

  if (source instanceof VideoFrame && typeof OffscreenCanvas === 'undefined') {
    source.close();
    throw createError.runtimeError('OffscreenCanvas required for VideoFrame processing');
  }

  const canvas = new OffscreenCanvas(width, height);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw createError.runtimeError('Canvas context acquisition failed');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low';

  try {
    if (rasterSource instanceof ImageData) {
      ctx.putImageData(rasterSource, 0, 0);
    } else if (rasterSource instanceof VideoFrame) {
      ctx.drawImage(rasterSource, 0, 0, width, height);
      rasterSource.close();
    } else {
      ctx.drawImage(rasterSource as CanvasImageSource, 0, 0, width, height);
    }

    return await canvasToBlob(canvas);
  } finally {
    if (shouldCleanup && rasterSource instanceof ImageBitmap) {
      rasterSource.close();
    }
  }
}
