import type { ProgressCallback, ServerInput, ServerOptions } from '../types';
import type { PixelData } from '../../types';
import type { Sharp as SharpInstance } from 'sharp';
import SharpNS from 'sharp';

import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';

import { getSourceData } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';
import {
  trackBufferProgress,
  trackStreamProgress,
  trackWebStreamProgress
} from '../../shared/streams/progress';

/** Detect Node.js Readable streams. */
function isNodeReadable(src: unknown): src is Readable {
  return src instanceof Readable;
}

/** Detect Web ReadableStream<Uint8Array>. */
function isWebReadable(src: unknown): src is ReadableStream<Uint8Array> {
  return (
    typeof src === 'object' &&
    src !== null &&
    typeof (src as ReadableStream<Uint8Array>).getReader === 'function'
  );
}

/**
 * Wraps a Promise so it rejects with `createError.aborted()` if the
 * provided AbortSignal fires first.
 */
function awaitWithAbort<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
  onAbort?: () => void
): Promise<T> {
  if (!signal) return promise;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      signal.addEventListener(
        'abort',
        () => {
          onAbort?.();
          reject(createError.aborted());
        },
        { once: true }
      );
    })
  ]);
}

/**
 * Build a raw‐pixel Sharp pipeline from a Buffer.
 */
function createPipelineFromBuffer(
  sharpFactory: typeof SharpNS,
  buffer: Buffer,
  onProgress?: ProgressCallback
): SharpInstance {
  if (onProgress) {
    trackBufferProgress(buffer, onProgress);
  }
  // sharpFactory(buffer) returns a SharpInstance
  return sharpFactory(buffer).raw({ depth: 'uchar' });
}

/**
 * Build a raw‐pixel Sharp pipeline from a Readable source.
 * Includes the exact `<import('stream/web').ReadableStream>` casts
 * your original code required.
 */
function createPipelineFromStream(
  sharpFactory: typeof SharpNS,
  source: unknown,
  onProgress?: ProgressCallback
): { pipeline: SharpInstance; stream: Readable } {
  let nodeStream: Readable;

  if (isWebReadable(source)) {
    const webStream = <import('stream/web').ReadableStream>(<unknown>source);
    nodeStream = Readable.fromWeb(webStream);
    if (onProgress) {
      nodeStream = trackWebStreamProgress(webStream, onProgress);
    }
  } else if (isNodeReadable(source)) {
    nodeStream = onProgress ? trackStreamProgress(source, onProgress) : source;
  } else {
    throw createError.invalidInput(
      'Buffer, Node.js Readable, or Web ReadableStream',
      source
    );
  }

  const pipeline = sharpFactory().raw({ depth: 'uchar' });

  nodeStream.on('error', (err) =>
    pipeline.destroy(createError.rethrow(err, 'Source stream error'))
  );
  pipeline.on('error', (err) =>
    nodeStream.destroy(createError.rethrow(err, 'Sharp pipeline error'))
  );

  nodeStream.pipe(pipeline);
  return { pipeline, stream: nodeStream };
}

/**
 * Decode any ServerInput into raw RGBA pixel data.
 */
export async function decode(
  input: ServerInput,
  options?: ServerOptions,
  onProgress?: ProgressCallback
): Promise<PixelData> {
  // 1. Retrieve the raw source (Buffer or stream)
  const sourceData = await getSourceData(input, options);
  if (options?.signal?.aborted) {
    throw createError.aborted();
  }

  // 2. Dynamically load and validate sharp
  const sharpModule = await getSharp();
  const sharpFactory = sharpModule.default;
  if (typeof sharpFactory !== 'function') {
    throw createError.dependencyMissing('sharp');
  }

  // 3. Prepare for pipeline + possible stream
  let pipeline: ReturnType<typeof sharpFactory> | undefined;
  let activeStream: Readable | undefined;

  try {
    // 4. Branch on Buffer vs stream
    if (sourceData instanceof Buffer) {
      pipeline = createPipelineFromBuffer(sharpFactory, sourceData, onProgress);
    } else {
      const result = createPipelineFromStream(sharpFactory, sourceData, onProgress);
      pipeline = result.pipeline;
      activeStream = result.stream;
    }

    // 5. Apply colorspace & alpha, then get a Buffer+info
    const bufferResult = pipeline
      .toColorspace('srgb')
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    // 6. Await completion, respecting abort
    const { data, info } = await awaitWithAbort(bufferResult, options?.signal, () => {
      if (activeStream && !activeStream.destroyed) {
        activeStream.destroy(createError.aborted());
      }
    });

    // 7. Return identical PixelData shape
    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (err) {
    const aborted =
      options?.signal?.aborted || (err instanceof Error && err.message.includes('aborted'));
    if (aborted) {
      if (activeStream && !activeStream.destroyed) {
        activeStream.destroy(createError.aborted());
      }
      throw createError.aborted();
    }
    throw createError.rethrow(err as Error, 'Image processing failed');
  } finally {
    pipeline?.destroy();
  }
}
