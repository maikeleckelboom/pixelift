import { isStringOrURL } from '../../../shared/validation';
import { isImageBitmapSource } from '../../validation';
import { canvasRenderingOptions, imageBitmapOptions } from './options';
import type {
  PixelData,
  PixeliftBrowserInput,
  PixeliftBrowserOptions
} from '../../types';

let sharedCanvas: OffscreenCanvas | undefined;
let sharedCtx: OffscreenCanvasRenderingContext2D | undefined;

function getCanvasContext(
  width: number,
  height: number
): OffscreenCanvasRenderingContext2D {
  if (!sharedCanvas || !sharedCtx) {
    sharedCanvas = new OffscreenCanvas(width, height);
    const ctx = sharedCanvas.getContext('2d', canvasRenderingOptions());
    if (ctx === null) throw new Error('Failed to get OffscreenCanvas context');
    sharedCtx = ctx;
    sharedCtx.imageSmoothingEnabled = false;
    sharedCtx.imageSmoothingQuality = 'low';
  }
  if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
    sharedCanvas.width = width;
    sharedCanvas.height = height;
  }
  return sharedCtx;
}

function assertDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0)
    throw new TypeError('Image dimensions must be positive values');
}

async function ensureBitmap(
  blob: Blob,
  _options: PixeliftBrowserOptions
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions();
  return createImageBitmap(blob, opts);
}

async function createImageFromSource(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<{ bitmap: ImageBitmap; blob?: Blob }> {
  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    const res = await fetch(url, { mode: 'cors', headers: options.headers });
    const blob = await res.blob();
    const bitmap = await ensureBitmap(blob, options);
    return { bitmap };
  }
  if (source instanceof Blob) {
    const bitmap = await ensureBitmap(source, options);
    return { bitmap, blob: source };
  }
  if (isImageBitmapSource(source)) {
    const bitmap = await createImageBitmap(
      source as CanvasImageSource,
      imageBitmapOptions()
    );
    return { bitmap };
  }
  throw new TypeError(
    'Invalid image source. Expected URL/string, Blob, or ImageBitmapSource'
  );
}

export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const { bitmap } = await createImageFromSource(imageSource, options);
  const { width, height } = bitmap;
  assertDimensions(width, height);

  const ctx = getCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { data: imageData.data, width, height };
}

export function isSupported(_type?: string): Promise<boolean> {
  return Promise.resolve(OffscreenCanvas !== undefined);
}
