import { isStringOrURL } from '../../../shared/validation';
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

async function ensureBitmap(
  blob: Response | Blob | ImageBitmapSource
): Promise<ImageBitmap> {
  if (blob instanceof Response) {
    const res = await blob.blob();
    return ensureBitmap(res);
  }

  if (blob instanceof ImageBitmap) {
    return blob;
  }

  return createImageBitmap(blob, imageBitmapOptions());
}

async function createImageFromSource(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  if (isStringOrURL(source)) {
    const { headers, signal } = options;
    const url = new URL(source.toString(), location.origin).toString();
    const response = await fetch(url, { mode: 'cors', headers, signal });
    return ensureBitmap(response);
  }
  return ensureBitmap(source);
}

export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const bitmap = await createImageFromSource(imageSource, options);
  const { width, height } = bitmap;

  const ctx = getCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { data: imageData.data, width, height };
}

export function isSupported(_type?: string): Promise<boolean> {
  return Promise.resolve(OffscreenCanvas !== undefined);
}
