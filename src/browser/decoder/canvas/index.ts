import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { convertToBlobOptions, imageBitmapOptions } from './options';
import { createVideoFrameBitmap } from './video/utils';
import { createCanvasContext } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import { isWebWorker } from '../../../shared/env';
import { isStringOrURL } from '../../../shared/validation';

export function isSupported(): boolean {
  return (
    !isWebWorker() &&
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  if (options?.debug) {
    console.log('🌐 🎨 Invoking canvas decoder (debug)');
  }

  let sourceBitmap: ImageBitmap | undefined = undefined; // Initialize as undefined
  let imageDataToReturn: PixelData | undefined = undefined; // For ImageData fast path
  let shouldCloseBitmap = false; // Flag to close the bitmap if we created it

  // --- Start: ImageData Handling (including resize) ---
  if (input instanceof ImageData) {
    const targetWidthOpt = options?.width;
    const targetHeightOpt = options?.height;
    const inputW = input.width;
    const inputH = input.height;

    const finalWidth = targetWidthOpt ?? inputW;
    const finalHeight = targetHeightOpt ?? inputH;

    // If no resize is needed, or options match ImageData dimensions
    if (finalWidth === inputW && finalHeight === inputH) {
      imageDataToReturn = {
        data: input.data, // Use original data
        width: input.width,
        height: input.height
      };
    } else {
      // Resize IS needed for ImageData
      const [tempCanvas, tempCtx] = createCanvasContext(inputW, inputH); // Original size
      tempCtx.putImageData(input, 0, 0);

      const [, targetCtx] = createCanvasContext(finalWidth, finalHeight); // Target size
      targetCtx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight); // Draw & scale
      // Return directly after getting ImageData from the resized canvas
      return targetCtx.getImageData(0, 0, finalWidth, finalHeight, { colorSpace: 'srgb' });
    }
  }
  // --- End: ImageData Handling ---

  // If ImageData was handled and returned, we're done.
  if (imageDataToReturn) {
    return imageDataToReturn;
  }

  // --- Start: ImageBitmap and other BrowserInput Handling ---
  if (input instanceof ImageBitmap) {
    sourceBitmap = input;
    // shouldCloseBitmap remains false because the caller owns this ImageBitmap
  } else {
    // For all other BrowserInput types (Blobs, URLs, HTML elements, VideoFrames etc.)
    // getSourceBitmap will handle the conversion to an ImageBitmap.
    // It will also apply imageBitmapOptions for potential native resizing.
    sourceBitmap = await getSourceBitmap(input, options);
    // If getSourceBitmap created a new bitmap (which it does for non-ImageBitmap inputs),
    // we are responsible for closing it.
    shouldCloseBitmap = true;
  }
  // --- End: ImageBitmap and other BrowserInput Handling ---

  // At this point, sourceBitmap MUST be defined if imageDataToReturn was not.
  if (!sourceBitmap) {
    // This should ideally not be reached if logic above is correct.
    // It implies input was not ImageData, not ImageBitmap, and getSourceBitmap failed or returned undefined.
    // getSourceBitmap should throw if it fails.
    throw createError.runtimeError('Failed to obtain a source ImageBitmap for decoding.');
  }

  try {
    // Determine target dimensions for drawing (might be a second resize step if native ImageBitmap resize didn't fully match)
    const targetDrawWidth = options?.width ?? sourceBitmap.width;
    const targetDrawHeight = options?.height ?? sourceBitmap.height;

    // Create the canvas with the final target dimensions
    const [canvas, context] = createCanvasContext(targetDrawWidth, targetDrawHeight);

    // Draw the sourceBitmap to the canvas. This step will perform scaling if
    // sourceBitmap dimensions differ from targetDrawWidth/Height.
    context.drawImage(sourceBitmap, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: 'srgb' });
  } finally {
    if (shouldCloseBitmap && sourceBitmap) {
      sourceBitmap.close();
    }
  }
}

async function createImageBitmapFromBlob(
  blob: Blob,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, imageBitmapOptions(options));
  } catch (error) {
    if (isWebWorker()) {
      throw createError.decodingFailed(
        blob.type,
        'ImageBitmap creation failed in Web Worker',
        error
      );
    }
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

export async function convertToBlobUsingCanvas(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<Blob> {
  let tempBitmapForVideoFrame: ImageBitmap | undefined;
  let videoFrameToClose: VideoFrame | undefined;

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
      videoFrameToClose = input;
      // imageBitmapOptions will attempt to resize based on options.width/height
      tempBitmapForVideoFrame = await createImageBitmap(input, imageBitmapOptions(options));
    }

    // getSourceBitmap will handle other types and also attempt resize via imageBitmapOptions
    const sourceBitmap = await getSourceBitmap(input, options, tempBitmapForVideoFrame);

    // createResizedBlob will ensure the final canvas is at target dimensions
    // and draw sourceBitmap (scaled if necessary) into it.
    return await createResizedBlob(sourceBitmap, options);
  } finally {
    tempBitmapForVideoFrame?.close();
    videoFrameToClose?.close();
  }
}

async function getSourceBitmap(
  input: BrowserInput, // Type is already BrowserInput, which is good
  options?: BrowserOptions,
  existingBitmap?: ImageBitmap // This is for the VideoFrame path in convertToBlobUsingCanvas
): Promise<ImageBitmap> {
  if (existingBitmap) {
    return existingBitmap; // Used by convertToBlobUsingCanvas for pre-created VideoFrame bitmap
  }

  if (input instanceof ImageBitmap) {
    return input; // Caller owns this, no close here
  }

  // Handle CanvasImageSource types that createImageBitmap can take directly
  if (
    input instanceof HTMLImageElement ||
    input instanceof SVGImageElement || // Add SVGImageElement if you intend to support it this way
    input instanceof HTMLCanvasElement ||
    input instanceof OffscreenCanvas
    // Note: HTMLVideoElement and VideoFrame are handled more specifically below or by callers
  ) {
    // imageBitmapOptions will apply resize if width/height are in options
    return createImageBitmap(input, imageBitmapOptions(options));
  }

  if (input instanceof HTMLVideoElement) {
    // createVideoFrameBitmap creates a new ImageBitmap and applies imageBitmapOptions
    return createVideoFrameBitmap(input, options);
  }

  if (input instanceof VideoFrame) {
    // VideoFrame can be directly used with createImageBitmap
    // imageBitmapOptions will apply resize if width/height are in options
    // The caller (convertToBlobUsingCanvas) handles closing the original VideoFrame
    return createImageBitmap(input, imageBitmapOptions(options));
  }

  if (input instanceof Blob) {
    return createImageBitmapFromBlob(input, options);
  }

  // Fallback for string, URL, or other types that toBlob can handle
  // (ImageData should have been handled by the main `decode` function already if no resize,
  // or if resize is needed, it's handled there too. If ImageData reaches here,
  // it means it's being processed for a different purpose, e.g. convertToBlobUsingCanvas)
  if (
    isStringOrURL(input) ||
    input instanceof ImageData /* ImageData here implies it's for blob conversion */
  ) {
    const blob = await toBlob(input, options); // toBlob handles string, URL, ImageData -> Blob
    return createImageBitmapFromBlob(blob, options);
  }

  // If we've reached here, the input type is unexpected for getSourceBitmap's direct handlers
  throw createError.invalidInput(
    'Blob, ImageBitmap, HTMLImageElement, HTMLVideoElement, VideoFrame, HTMLCanvasElement, OffscreenCanvas, string, or URL',
    typeof input
  );
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
