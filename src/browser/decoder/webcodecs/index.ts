// src/browser/decoder/webcodecs/index.ts

import type { PixelData } from '../../../types';
import type { BrowserInput, WebCodecsDecoderOptions } from '../../types'; // Added BrowserInput, WebCodecsOptions
import { toBlob } from '../../blob';
import { createError, ErrorCode, PixeliftError } from '../../../shared/error'; // Added PixeliftError, ErrorCode
import { createPixelData } from '../../../shared/factory';
import { isAbortError } from '../../../shared/guards'; // Added isAbortError

/**
 * Checks if a given MIME type is supported by the `ImageDecoder` API in the current environment.
 * @param mimeType The MIME type string to check (e.g., 'image/png').
 * @returns A Promise that resolves to `true` if the type is supported, `false` otherwise.
 */
export async function isSupported(mimeType: string): Promise<boolean> {
  if (typeof ImageDecoder === 'undefined') {
    return false;
  }
  return ImageDecoder.isTypeSupported(mimeType);
}

/**
 * Decodes image data using the WebCodecs API (`ImageDecoder`).
 *
 * This function can handle various input types:
 * - `ReadableStream<Uint8Array>`: Processed directly. `options.type` (MIME type) is crucial.
 * - `Blob`: Processed directly. MIME type is taken from the Blob if not overridden in options.
 * - Other `BrowserInput` types: Converted to a `Blob` using the `toBlob` utility first.
 *
 * It supports `AbortSignal` for cancellation.
 *
 * @param input The image data to decode. Can be a `ReadableStream`, `Blob`, or other `BrowserInput` types.
 * @param options Configuration options for the WebCodecs decoder, including MIME type hint and WebCodecs-specific settings.
 * @returns A Promise that resolves to `PixelData` (containing Uint8ClampedArray, width, height).
 * @throws {PixeliftError} if decoding fails, input is invalid, type is unsupported, or operation is aborted.
 */
export async function decode(
  input: BrowserInput,
  options?: WebCodecsDecoderOptions
): Promise<PixelData> {
  if (typeof ImageDecoder === 'undefined') {
    throw createError.decoderUnsupported('WebCodecs API (ImageDecoder not found)');
  }

  let dataForDecoder: Blob | ReadableStream<Uint8Array>;
  let typeForDecoder: string | undefined = options?.type; // Prefer explicit type from options

  const signal = options?.signal;

  const abortOperationPromise = new Promise<never>((_, reject) => {
    if (!signal) return;
    if (signal.aborted) {
      reject(createError.aborted('WebCodecs decoding aborted (pre-aborted).'));
      return;
    }
    const abortHandler = () => {
      reject(createError.aborted('WebCodecs decoding aborted by signal.'));
    };
    signal.addEventListener('abort', abortHandler, { once: true });
  });

  const raceWithAbort = <T>(promise: Promise<T>): Promise<T> => {
    return signal ? Promise.race([promise, abortOperationPromise]) : promise;
  };

  try {
    if (signal?.aborted) {
      throw createError.aborted('WebCodecs decoding aborted (pre-operation).');
    }

    if (input instanceof ReadableStream) {
      dataForDecoder = input;
      if (!typeForDecoder) {
        throw createError.invalidInput(
          'MIME type (options.type)',
          'undefined for ReadableStream input to WebCodecs. Please provide options.type.'
        );
      }
    } else if (input instanceof Blob) {
      dataForDecoder = input;
      typeForDecoder = typeForDecoder || input.type; // Use blob's type if not overridden by options.type
    } else {
      // For other input types, convert them to a Blob first
      try {
        const blob = await raceWithAbort(toBlob(input, options)); // Pass signal to toBlob
        dataForDecoder = blob;
        typeForDecoder = typeForDecoder || blob.type;
      } catch (conversionError) {
        if (
          conversionError instanceof PixeliftError &&
          conversionError.code === ErrorCode.aborted
        ) {
          throw conversionError; // Propagate abort error
        }
        const inputTypeName = input?.constructor?.name || typeof input;
        throw createError.decodingFailed(
          options?.type || 'unknown',
          `Failed to convert input (${inputTypeName}) to Blob for WebCodecs`,
          conversionError
        );
      }
    }

    if (!typeForDecoder) {
      throw createError.decodingFailed(
        'unknown',
        'MIME type could not be determined or was not provided for WebCodecs processing.'
      );
    }

    const isTypeSupported = await raceWithAbort(
      ImageDecoder.isTypeSupported(typeForDecoder)
    );
    if (!isTypeSupported) {
      throw createError.decodingFailed(
        typeForDecoder,
        `MIME type '${typeForDecoder}' not supported by WebCodecs ImageDecoder.`
      );
    }

    let imageDecoder: ImageDecoder | undefined;
    let frame: VideoFrame | undefined;

    try {
      const decoderOptions: ImageDecoderInit = {
        data: dataForDecoder as ReadableStream | BufferSource,
        type: typeForDecoder
        // colorSpaceConversion: options?.options?.colorSpaceConversion ?? 'default',
        // preferAnimation: options?.options?.preferAnimation ?? false
        // desiredWidth: options?.options?.desiredWidth,
        // desiredHeight: options?.options?.desiredHeight
      };
      imageDecoder = new ImageDecoder(decoderOptions);

      await raceWithAbort(imageDecoder.completed);

      const decodeOpts: ImageDecodeOptions = {
        frameIndex: options?.options?.frameIndex ?? 0,
        completeFramesOnly: options?.options?.completeFramesOnly ?? false
      };
      const result = await raceWithAbort(imageDecoder.decode(decodeOpts));
      frame = result.image;

      // Ensure frame is not closed by signal before copyTo
      if (signal?.aborted)
        throw createError.aborted('WebCodecs decoding aborted before frame copy.');

      // The `copyTo` operation can also be significant.
      // It doesn't directly accept an AbortSignal.
      // If it were very long, one might consider complex workarounds,
      // but for typical image frames, it's usually quick enough.
      const byteLength = frame.allocationSize({ format: 'RGBA' });
      const data = new Uint8ClampedArray(byteLength);

      // Race copyTo if it's potentially long and abort is critical during it
      await raceWithAbort(frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' }));

      return createPixelData(data, frame.codedWidth, frame.codedHeight);
    } catch (decodingError) {
      // Catch and re-categorize errors, especially aborts
      if (
        decodingError instanceof PixeliftError &&
        decodingError.code === ErrorCode.aborted
      ) {
        throw decodingError; // Already our abort error
      }
      if (signal?.aborted || isAbortError(decodingError)) {
        throw createError.aborted('WebCodecs decoding process aborted.', {
          cause: decodingError
        });
      }
      throw createError.decodingFailed(
        typeForDecoder,
        'WebCodecs decoding failed.',
        decodingError
      );
    } finally {
      // Ensure resources are closed even if errors occur
      try {
        frame?.close();
      } catch {
        /* ignore cleanup error */
      }
      try {
        imageDecoder?.close();
      } catch {
        /* ignore cleanup error */
      }
    }
  } catch (error) {
    // This top-level catch ensures any thrown PixeliftError is propagated,
    // and any other error is appropriately wrapped or re-thrown.
    if (error instanceof PixeliftError) {
      throw error;
    }
    // If an unexpected non-Pixelift error bubbles up here.
    throw createError.rethrow(error, 'Unexpected error in WebCodecs decode.');
  }
}
