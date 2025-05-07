import { isStringOrURL } from '../../../shared/validation';
import { createError } from '../../../shared/error';
import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { BITMAP_OPTIONS, CANVAS_OPTIONS } from './options';

let sharedCanvas: OffscreenCanvas | undefined;
let sharedCtx: OffscreenCanvasRenderingContext2D | undefined;

export async function isSupported(_type: string = ''): Promise<boolean> {
  return (
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

function getCanvasContext(
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

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const bitmap = await createImageFromSource(input, options);
  const { width, height } = bitmap;
  const ctx = getCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { data, width, height };
}

async function createImageFromSource(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  if (isStringOrURL(input)) {
    const { headers, signal } = options || {};
    const url = new URL(input.toString(), location.origin).toString();
    const response = await fetch(url, { mode: 'cors', headers, signal });

    if (!response.ok) {
      throw createError.fetchFailed(url, response.status, response.statusText);
    }

    const blob = await response.blob();
    return createBitmap(blob);
  }

  return createBitmap(input);
}

async function createBitmap(input: ImageBitmapSource): Promise<ImageBitmap> {
  if (input instanceof ImageBitmap) {
    return input;
  }

  if (input instanceof Blob && input.type === 'image/svg+xml') {
    const svgBlob = new Blob([input], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.src = svgUrl;
    await image.decode();
    const bitmap = await createBitmap(image);
    URL.revokeObjectURL(svgUrl);
    return bitmap;
  }

  return createImageBitmap(input, BITMAP_OPTIONS);
}
