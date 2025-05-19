import type { ServerInput, ServerOptions, ProgressCallback } from '../types';
import type { PixelData } from '../../types';
import { getSourceData } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';
import type * as SharpNS from 'sharp';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import {
  trackBufferProgress,
  trackStreamProgress,
  trackWebStreamProgress
} from '../../shared/streams/progress';

function isWebReadableStream(stream: unknown): stream is ReadableStream<Uint8Array> {
  return (
    typeof stream === 'object' &&
    stream !== null &&
    stream.constructor.name === 'ReadableStream' &&
    'getReader' in stream &&
    typeof (stream as ReadableStream<Uint8Array>).getReader === 'function' &&
    'tee' in stream
  );
}

function isNodeReadableStream(stream: unknown): stream is Readable {
  return typeof stream === 'object' && stream !== null && stream instanceof Readable;
}

/**
 * Decodes an image from various input sources
 *
 * @param input - Image source (Buffer, streams, URL, etc.)
 * @param options - Decoder options
 * @param onProgress - Optional callback for tracking decoding progress
 * @returns Promise resolving to decoded image data
 */
export async function decode(
  input: ServerInput,
  options?: ServerOptions,
  onProgress?: ProgressCallback
): Promise<PixelData> {
  const source = await getSourceData(input, options);

  if (options?.signal?.aborted) {
    throw createError.aborted();
  }

  const sharpModule = await getSharp();
  const sharpFunction = sharpModule.default;

  if (typeof sharpFunction !== 'function') {
    throw createError.dependencyMissing('sharp');
  }

  let sharpInstance: SharpNS.Sharp | undefined;
  let sourceStream: Readable | undefined;

  let rejectWithAbort: ((error: Error) => void) | undefined;
  const abortPromise = options?.signal
    ? new Promise<never>((_, reject) => {
        rejectWithAbort = reject;
      })
    : null;

  const cleanupResources = () => {
    if (sharpInstance && !sharpInstance.destroyed) {
      sharpInstance.destroy(createError.aborted());
    }
    if (sourceStream && !sourceStream.destroyed) {
      sourceStream.destroy(createError.aborted());
    }
  };

  let abortHandled = false;

  const handleAbort = () => {
    if (abortHandled) return;
    abortHandled = true;

    cleanupResources();

    if (rejectWithAbort) {
      rejectWithAbort(createError.aborted());
    }
  };

  if (options?.signal) {
    options.signal.addEventListener('abort', handleAbort, { once: true });

    if (options.signal.aborted) {
      handleAbort();
    }
  }

  try {
    if (source instanceof Buffer) {
      // For buffers, report progress once (100%)
      if (onProgress) {
        trackBufferProgress(source, onProgress);
      }
      sharpInstance = sharpFunction(source);
    } else if (isWebReadableStream(source)) {
      // Track progress on web stream if callback provided
      if (onProgress) {
        sourceStream = trackWebStreamProgress(source, onProgress);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceStream = Readable.fromWeb(source as any);
      }

      sharpInstance = sharpFunction();

      sourceStream.on('error', (err) => {
        if (sharpInstance && !sharpInstance.destroyed) {
          sharpInstance.destroy(
            createError.rethrow(err, 'Source stream (fromWeb) errored')
          );
        }
      });

      sourceStream.pipe(sharpInstance);
    } else if (isNodeReadableStream(source)) {
      // Track progress on Node.js stream if callback provided
      if (onProgress) {
        sourceStream = trackStreamProgress(source, onProgress);
      } else {
        sourceStream = source;
      }

      sharpInstance = sharpFunction();

      sourceStream.on('error', (err) => {
        if (sharpInstance && !sharpInstance.destroyed) {
          sharpInstance.destroy(createError.rethrow(err, 'Source Node.js stream errored'));
        }
      });

      sourceStream.pipe(sharpInstance);
    } else {
      throw createError.invalidInput(
        'Buffer, Node.js Readable stream, or Web API ReadableStream',
        source
      );
    }

    if (!sharpInstance) {
      throw createError.runtimeError('Sharp instance was not initialized.');
    }

    sharpInstance.on('error', () => {
      if (abortHandled) {
        return;
      }
      cleanupResources();
    });

    const processingPipeline = sharpInstance
      .toColorspace('srgb')
      .ensureAlpha()
      .raw({ depth: 'uchar' });

    if (options?.signal?.aborted) {
      throw createError.aborted();
    }

    // Promise.race to allow for aborting
    const bufferPromise = processingPipeline.toBuffer({ resolveWithObject: true });

    const result = abortPromise
      ? await Promise.race([bufferPromise, abortPromise])
      : await bufferPromise;

    const { data, info } = result as {
      data: Buffer;
      info: { width: number; height: number };
    };

    if (options?.signal) {
      options.signal.removeEventListener('abort', handleAbort);
    }

    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (error) {
    if (options?.signal) {
      options.signal.removeEventListener('abort', handleAbort);
    }
    if (
      options?.signal?.aborted ||
      (error instanceof Error && error.message.includes('aborted'))
    ) {
      throw createError.aborted();
    }
    cleanupResources();
    throw createError.rethrow(error, 'Image processing failed');
  } finally {
    if (!abortHandled) {
      cleanupResources();
    }
  }
}
