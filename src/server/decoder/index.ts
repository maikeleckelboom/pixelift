import type { ServerInput, ServerOptions } from '../types';
import type { PixelData } from '../../types';
import { getSourceData } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';
import type * as SharpNS from 'sharp';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';

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

export async function decode(
  input: ServerInput,
  options?: ServerOptions
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

  // Return a promise that rejects when aborted
  let rejectWithAbort: ((error: Error) => void) | undefined;
  const abortPromise = options?.signal
    ? new Promise<never>((_, reject) => {
        rejectWithAbort = reject;
      })
    : null;

  // Set up abort handling
  const cleanupResources = () => {
    if (sharpInstance && !sharpInstance.destroyed) {
      sharpInstance.destroy(createError.aborted());
    }
    if (sourceStream && !sourceStream.destroyed) {
      sourceStream.destroy(createError.aborted());
    }
  };

  // Track if we've already handled an abort
  let abortHandled = false;

  // AbortSignal handler that destroys all resources immediately
  const handleAbort = () => {
    // Prevent multiple handling of the same abort
    if (abortHandled) return;
    abortHandled = true;

    // Clean up resources
    cleanupResources();

    // Reject the abortPromise to ensure the Promise.race below resolves
    if (rejectWithAbort) {
      rejectWithAbort(createError.aborted());
    }
  };

  // Set up abort signal listener if provided
  if (options?.signal) {
    // Use addEventListener for abort event
    options.signal.addEventListener('abort', handleAbort, { once: true });

    // Also check if already aborted
    if (options.signal.aborted) {
      handleAbort();
    }
  }

  try {
    if (source instanceof Buffer) {
      sharpInstance = sharpFunction(source);
    } else if (isWebReadableStream(source)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceStream = Readable.fromWeb(source as any);
      sharpInstance = sharpFunction();

      // Listen for errors on the source stream
      sourceStream.on('error', (err) => {
        if (sharpInstance && !sharpInstance.destroyed) {
          sharpInstance.destroy(
            createError.rethrow(err, 'Source stream (fromWeb) errored')
          );
        }
      });

      sourceStream.pipe(sharpInstance);
    } else if (isNodeReadableStream(source)) {
      sourceStream = source;
      sharpInstance = sharpFunction();

      // Listen for errors on the source stream
      sourceStream.on('error', (err) => {
        if (sharpInstance && !sharpInstance.destroyed) {
          sharpInstance.destroy(createError.rethrow(err, 'Source Node.js stream errored'));
        }
      });

      sourceStream.pipe(sharpInstance);
    } else {
      throw createError.invalidInput(
        'Buffer, Node.js Readable stream, or Web API ReadableStream',
        `Received type: ${source?.constructor?.name || typeof source}`
      );
    }

    if (!sharpInstance) {
      throw createError.runtimeError('Sharp instance was not initialized.');
    }

    // This is needed else, sharp will throw an error on the stream
    sharpInstance.on('error', (_err) => {});

    const processingPipeline = sharpInstance
      .toColorspace('srgb')
      .ensureAlpha()
      .raw({ depth: 'uchar' });

    // Check for abort before proceeding
    if (options?.signal?.aborted) {
      throw createError.aborted();
    }

    // Use Promise.race to allow abortion during the buffer operation
    const bufferPromise = processingPipeline.toBuffer({ resolveWithObject: true });

    // If we have an abort signal, race the buffer promise against the abort promise
    const result = abortPromise
      ? await Promise.race([bufferPromise, abortPromise])
      : await bufferPromise;

    const { data, info } = result as {
      data: Buffer;
      info: { width: number; height: number };
    };

    // Remove abort listener after successful processing
    if (options?.signal) {
      options.signal.removeEventListener('abort', handleAbort);
    }

    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (error) {
    // Remove abort listener in the error case too
    if (options?.signal) {
      options.signal.removeEventListener('abort', handleAbort);
    }

    // If already aborted or this is an abort error, throw a clean abort error
    if (
      options?.signal?.aborted ||
      (error instanceof Error && error.message.includes('aborted'))
    ) {
      throw createError.aborted();
    }

    // Clean up resources in case of any error
    cleanupResources();

    throw createError.rethrow(error, 'Image processing failed');
  } finally {
    // Final cleanup - ensure all resources are destroyed
    if (!abortHandled) {
      cleanupResources();
    }
  }
}
