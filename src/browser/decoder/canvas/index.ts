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
  inputBlob: Blob,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  // Attempt direct createImageBitmap for non-SVG types first.
  if (inputBlob.type !== 'image/svg+xml') {
    try {
      return await createImageBitmap(inputBlob, imageBitmapOptions(options));
    } catch (e) {
      // Non-SVG direct creation failed, log and proceed to common fallback.
      console.warn(
        `Direct createImageBitmap(Blob) failed for non-SVG type. Using fallback.`,
        e
      );
    }
  }

  // Common fallback path for:
  // 1. All SVGs (due to observed inconsistencies with direct createImageBitmap(Blob)).
  // 2. Non-SVG types if their direct createImageBitmap(Blob) attempt failed.
  // This HTMLImageElement path is generally more robust for rendering complex images/SVGs.
  // console.log(`Using HTMLImageElement fallback for a Blob type: ${inputBlob.type}`);
  const url = URL.createObjectURL(inputBlob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return await createImageBitmap(image, imageBitmapOptions(options));
  } catch (e) {
    throw createError.decodingFailed(inputBlob.type, `Image creation from Blob failed.`, e);
  } finally {
    URL.revokeObjectURL(url);
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
  input: string | URL | CanvasImageSource,
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

    // --- The rest of the logic for other types ---
    if (input instanceof VideoFrame) {
      videoFrame = input;
      // imageBitmapOptions will attempt resize based on options.width/height
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

// Current Implementation:
// The current code in createResizedBlob always creates a new canvas at targetWidth and targetHeight
// and then draws the input bitmap into it,
// scaled to these dimensions: ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
// This is a clear, robust,
// and correct way to ensure the output Blob comes from a canvas of the exact desired dimensions.
// While it might involve an "unnecessary" draw,
// if the bitmap is already the correct size, this is generally a safe and
// reliable approach.
// The performance impact of drawing an already-correctly sized bitmap to a same-sized canvas is usually minimal.
// The current approach is simpler and less prone to edge-case bugs related to when a redraw is skipped.
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
