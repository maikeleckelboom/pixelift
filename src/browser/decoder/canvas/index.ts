import { isStringOrURL } from '../../../shared/validation';
import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { BITMAP_OPTIONS, CANVAS_OPTIONS } from './options';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';

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
  // Normalize all inputs through the createImageFromSource path
  // which will properly handle SVGs and other formats
  const bitmap = await createImageFromSource(input, options);
  const { width, height } = bitmap;
  const ctx = getCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { data: imageData.data, width, height };
}

async function createImageFromSource(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  // Handle SVG URLs directly to avoid double blob conversion issues
  if (
    isStringOrURL(input) &&
    typeof input === 'string' &&
    input.toLowerCase().endsWith('.svg')
  ) {
    const url = new URL(input.toString(), location.origin).toString();
    let res: Response;
    try {
      res = await fetch(url, { mode: 'cors', headers: options?.headers });
    } catch (error) {
      throw createError.networkError(`Network error: Unable to fetch from "${url}".`, {
        cause: error
      });
    }
    if (!res.ok) {
      throw createError.fetchFailed(url, res.status, res.statusText);
    }
    const blob = await res.blob();
    const svgUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = svgUrl;
    await image.decode();
    const bitmap = await createImageBitmap(image, BITMAP_OPTIONS);
    URL.revokeObjectURL(svgUrl);
    return bitmap;
  }

  // For all other inputs, normalize to Blob
  const blob = isStringOrURL(input)
    ? await toBlob(input, options)
    : input instanceof Blob
      ? input
      : await toBlob(input, options); // Files, URLs, etc.

  return createBitmap(blob);
}

async function createBitmap(input: ImageBitmapSource): Promise<ImageBitmap> {
  if (input instanceof ImageBitmap) {
    return input;
  }

  // Special handling for SVG blobs
  if (input instanceof Blob && input.type === 'image/svg+xml') {
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
