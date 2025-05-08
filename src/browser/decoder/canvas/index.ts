import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
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

function getOffscreenCanvasContext(
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

  if (input instanceof ImageBitmap) {
    return input;
  }

  return createImageBitmap(input, BITMAP_OPTIONS);
}

export async function decode(input: Blob, _options?: BrowserOptions): Promise<PixelData> {
  const bitmap = await createImageFromBlob(input);
  const { width, height } = bitmap;
  const ctx = getOffscreenCanvasContext(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { data: imageData.data, width, height };
}
