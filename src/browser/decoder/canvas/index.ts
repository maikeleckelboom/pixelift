import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { convertToBlobOptions, imageBitmapOptions } from './options';
import { createVideoFrameBitmap } from './video/utils';
import { createCanvasContext } from './utils';
import { toBlob as convertInputToBlob } from '../../blob';
import { createError } from '../../../shared/error';

export function isSupported(): boolean {
  return (
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

async function createImageBitmapFromBlob(
  blob: Blob,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, imageBitmapOptions(options));
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return await createImageBitmap(image, imageBitmapOptions(options));
    } catch (cause) {
      throw createError.decodingFailed(blob.type, '', cause);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function decode(
  input: Blob | ImageBitmap,
  options?: BrowserOptions
): Promise<PixelData> {
  let sourceBitmap: ImageBitmap;
  let shouldClose = false;

  if (input instanceof ImageBitmap) {
    sourceBitmap = input;
  } else {
    sourceBitmap = await createImageBitmapFromBlob(input, options);
    shouldClose = true;
  }

  try {
    const targetWidth = options?.width ?? sourceBitmap.width;
    const targetHeight = options?.height ?? sourceBitmap.height;
    const needsResize =
      targetWidth !== sourceBitmap.width || targetHeight !== sourceBitmap.height;

    const [canvas, context] = createCanvasContext(
      needsResize ? targetWidth : sourceBitmap.width,
      needsResize ? targetHeight : sourceBitmap.height
    );

    context.drawImage(sourceBitmap, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: 'srgb' });
  } finally {
    if (shouldClose) sourceBitmap.close();
  }
}
export async function convertToBlobUsingCanvas(
  input: string | URL | CanvasImageSource | ImageData,
  options?: BrowserOptions
): Promise<Blob> {
  let tempBitmap: ImageBitmap | undefined; // For VideoFrame path
  let videoFrame: VideoFrame | undefined; // For VideoFrame path

  const targetWidthOpt = options?.width;
  const targetHeightOpt = options?.height;

  try {
    if (input instanceof ImageData) {
      const inputW = input.width;
      const inputH = input.height;
      const finalWidth = targetWidthOpt ?? inputW;
      const finalHeight = targetHeightOpt ?? inputH;

      if (finalWidth === inputW && finalHeight === inputH) {
        // No resize needed, just put on canvas and convert
        const [canvas, ctx] = createCanvasContext(inputW, inputH);
        ctx.putImageData(input, 0, 0);
        return await canvas.convertToBlob(convertToBlobOptions(options));
      } else {
        // Resize IS needed for ImageData
        const [tempCanvas, tempCtx] = createCanvasContext(inputW, inputH); // Original size
        tempCtx.putImageData(input, 0, 0);

        const [targetCanvas, targetCtx] = createCanvasContext(finalWidth, finalHeight); // Target size
        targetCtx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight); // Draw & scale
        return await targetCanvas.convertToBlob(convertToBlobOptions(options));
      }
    }

    if (input instanceof OffscreenCanvas) {
      const finalWidth = targetWidthOpt ?? input.width;
      const finalHeight = targetHeightOpt ?? input.height;

      if (finalWidth === input.width && finalHeight === input.height) {
        // No resize needed
        return await input.convertToBlob(convertToBlobOptions(options));
      } else {
        // Resize IS needed for OffscreenCanvas
        const [targetCanvas, targetCtx] = createCanvasContext(finalWidth, finalHeight); // Target size
        targetCtx.drawImage(input, 0, 0, finalWidth, finalHeight); // Draw & scale input OffscreenCanvas
        return await targetCanvas.convertToBlob(convertToBlobOptions(options));
      }
    }

    if (input instanceof VideoFrame) {
      videoFrame = input;
      // imageBitmapOptions will attempt to resize based on options.width/height
      tempBitmap = await createImageBitmap(input, imageBitmapOptions(options));
    }

    // getSourceBitmap will handle other types and also attempt resize via imageBitmapOptions
    const sourceBitmap = await getSourceBitmap(input, options, tempBitmap);

    // createResizedBlob will ensure the final canvas is at target dimensions
    // and draw sourceBitmap (scaled if necessary) into it.
    return await createResizedBlob(sourceBitmap, options);
  } finally {
    tempBitmap?.close();
    videoFrame?.close();
  }
}
async function getSourceBitmap(
  input: BrowserInput,
  options?: BrowserOptions,
  existingBitmap?: ImageBitmap
): Promise<ImageBitmap> {
  if (existingBitmap) return existingBitmap;
  if (input instanceof ImageBitmap) return input;

  if (input instanceof HTMLVideoElement && options?.targetTime) {
    return createVideoFrameBitmap(input, options.targetTime, options);
  }

  if (input instanceof SVGElement || input instanceof HTMLImageElement) {
    return createImageBitmap(input, imageBitmapOptions(options));
  }

  const blob = await convertInputToBlob(input, options);
  return createImageBitmapFromBlob(blob, options);
}

async function createResizedBlob(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const targetWidth = options?.width ?? bitmap.width;
  const targetHeight = options?.height ?? bitmap.height;
  const [canvas, ctx] = createCanvasContext(targetWidth, targetHeight);
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  return canvas.convertToBlob(convertToBlobOptions(options));
}
