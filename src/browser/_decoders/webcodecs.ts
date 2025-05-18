// src/browser/decoder/webcodecs/index.ts

import type { PixelData } from '../../types';
import type {
  BrowserInput,
  BrowserOptions, // For toBlob
  WebCodecsOptions // The specific options for WebCodecs
} from '../types';
import { toBlob } from '../blob';
import { createError } from '../../shared/error';
import { createPixelData } from '../../shared/factory';

/**
 * Internal helper to create and prepare a configured ImageDecoder instance.
 *
 * @param blobInput - The image data as a Blob.
 * @param _options
 * @returns A Promise resolving to a ready-to-use ImageDecoder.
 * @throws {PixeliftError} If ImageDecoder creation or preparation fails.
 */
async function _createAndPrepareImageDecoder(
  blobInput: Blob,
  _options?: WebCodecsOptions // Accepts the refined WebCodecsOptions
): Promise<ImageDecoder> {
  if (!blobInput.type) {
    throw createError.decodingFailed(
      'unknown',
      'Input Blob does not have a valid MIME type for WebCodecs processing.'
    );
  }

  const decoderInit: ImageDecoderInit = {
    data: blobInput.stream(), // ImageDecoder now prefers a stream
    type: blobInput.type,
    colorSpaceConversion: 'none' // Standardize: get raw, convert later if needed
    // Apply preferAnimation if provided by the user
    // ...(webCodecsOptions?.preferAnimation !== undefined && {
    //   preferAnimation: webCodecsOptions.preferAnimation
  };

  try {
    const decoder = new ImageDecoder(decoderInit);
    // Wait for the decoder to be fully initialized and tracks ready.
    // `decoder.completed` is for when all frames are decoded,
    // `decoder.tracks.ready` is usually what you await before starting to decode specific frames.
    // For single image decoding, `decoder.completed` might also work if it resolves early.
    // Let's assume `decoder.tracks.ready` or simply `decoder.completed` if it covers setup.
    // For simplicity and common single-image use cases, `decoder.completed` often suffices.
    await decoder.completed;
    return decoder;
  } catch (error) {
    throw createError.decodingFailed(
      blobInput.type,
      'Failed to initialize ImageDecoder.',
      error
    );
  }
}

/**
 * Decodes a browser-based image input into PixelData using the WebCodecs strategy.
 *
 * @param input - The image input.
 * @param browserDecodeOptions - Optional configuration for the decoding process.
 * @returns A Promise resolving to the image's PixelData.
 * @throws {PixeliftError} If decoding fails.
 */
export async function decode(
  input: BrowserInput,
  browserDecodeOptions?: BrowserOptions // Accepts general BrowserOptions
): Promise<PixelData> {
  let blobInput: Blob;

  // 1. Ensure input is a Blob
  if (input instanceof Blob) {
    blobInput = input;
  } else {
    try {
      // Pass general BrowserOptions to toBlob for fetch settings etc.
      blobInput = await toBlob(input, browserDecodeOptions);
    } catch (conversionError) {
      const inputType = input?.constructor?.name || typeof input;
      throw createError.decodingFailed(
        browserDecodeOptions?.type || 'unknown',
        `Failed to convert input (${inputType}) to Blob for WebCodecs.`,
        conversionError
      );
    }
  }

  // 2. Extract specific WebCodecs options
  // This assumes BrowserOptions might contain a nested 'options' object for the specific decoder
  const webCodecsOptions: WebCodecsOptions | undefined =
    browserDecodeOptions?.decoder === 'webCodecs'
      ? browserDecodeOptions.options
      : (browserDecodeOptions?.options as WebCodecsOptions | undefined);

  let imageDecoder: ImageDecoder | undefined;
  let frame: VideoFrame | undefined;

  try {
    // 3. Create and prepare the ImageDecoder using the internal helper
    imageDecoder = await _createAndPrepareImageDecoder(blobInput, webCodecsOptions);

    // 4. Define decode options for the frame
    const frameDecodeOpts: ImageDecodeOptions = {
      frameIndex: webCodecsOptions?.frameIndex ?? 0,
      completeFramesOnly: webCodecsOptions?.completeFramesOnly ?? false
      // ...(webCodecsOptions?.region && { region: webCodecsOptions.region })
    };

    // 5. Decode the image frame
    const decodedResult = await imageDecoder.decode(frameDecodeOpts);
    frame = decodedResult.image; // Keep reference to close it

    // 6. Copy pixel data from the VideoFrame to a Uint8ClampedArray
    //    Ensure RGBA format and sRGB color space for standardized PixelData.
    const targetColorSpace: PredefinedColorSpace = 'srgb';
    const allocationSize = frame.allocationSize({
      format: 'RGBA',
      colorSpace: targetColorSpace
    });
    const pixelBuffer = new Uint8ClampedArray(allocationSize);

    await frame.copyTo(pixelBuffer, {
      format: 'RGBA',
      colorSpace: targetColorSpace // Explicitly request sRGB during copy
    });

    // 7. Create and return PixelData
    return createPixelData(
      pixelBuffer,
      frame.codedWidth,
      frame.codedHeight,
      targetColorSpace
    );
  } catch (error) {
    // Rethrow ensures it's a PixeliftError
    throw createError.rethrow(
      error,
      `WebCodecs decoding failed for type: ${blobInput.type}`
    );
  } finally {
    // 8. Cleanup resources
    frame?.close();
    imageDecoder?.close();
  }
}
