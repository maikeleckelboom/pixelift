import sharp, { type Sharp, type Raw } from 'sharp';
import type { ServerInput, ServerOptions, ProgressCallback } from '../types';
import type { PixelData } from '../../types';
import { Readable } from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Buffer } from 'node:buffer';
import { getSourceData } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';
import {
  trackBufferProgress,
  trackStreamProgress,
  trackWebStreamProgress
} from '../../shared/streams/progress';
import type { ReadableStream as WebStream } from 'stream/web';

export interface ProgressOptions {
  onProgress?: ProgressCallback;
  totalBytes?: number;
}

export interface DecodeOptions extends ServerOptions, ProgressOptions {}

function isNodeReadable(src: unknown): src is Readable {
  return src instanceof Readable;
}

function isWebReadable(src: unknown): src is WebStream {
  return src instanceof ReadableStream;
}

/**
 * Initialize a Sharp pipeline with common transforms
 */
function initSharpPipeline(sharpFactory: typeof sharp, input?: Buffer): Sharp & Raw {
  return (input ? sharpFactory(input) : sharpFactory())
    .raw({ depth: 'uchar' })
    .toColorspace('srgb')
    .ensureAlpha() as Sharp & Raw;
}

let sharpFactoryPromise: Promise<typeof sharp> | null = null;
async function getSharpFactory(signal?: AbortSignal): Promise<typeof sharp> {
  if (sharpFactoryPromise) return sharpFactoryPromise;

  sharpFactoryPromise = (async () => {
    const sharpModule = await getSharp();
    signal?.throwIfAborted();
    if (typeof sharpModule.default !== 'function') {
      throw createError.dependencyMissing('sharp');
    }
    return sharpModule.default;
  })();

  try {
    return await sharpFactoryPromise;
  } catch (err) {
    sharpFactoryPromise = null;
    throw err;
  }
}

function awaitWithAbort<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
  onAbort?: () => void
): Promise<T> {
  if (signal?.aborted) {
    onAbort?.();
    return Promise.reject(createError.aborted());
  }
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      signal?.addEventListener(
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

export async function decode(
  input: ServerInput,
  options?: DecodeOptions
): Promise<PixelData> {
  const { signal, totalBytes, onProgress } = options || {};
  try {
    signal?.throwIfAborted();

    const [sourceData, sharpFactory] = await Promise.all([
      getSourceData(input, options),
      getSharpFactory(signal)
    ]);

    signal?.throwIfAborted();

    let pipeline: Sharp & Raw;
    let stream: Readable | undefined;
    let pipePromise: Promise<void> | undefined;

    if (sourceData instanceof Buffer) {
      const bufferCopy = Buffer.from(sourceData);
      if (onProgress) trackBufferProgress(bufferCopy, onProgress);
      pipeline = initSharpPipeline(sharpFactory, bufferCopy);
      pipeline.on('error', (err) => {
        throw createError.rethrow(err, 'Buffer processing error');
      });
    } else {
      if (isWebReadable(sourceData)) {
        stream = onProgress
          ? trackWebStreamProgress(sourceData, { onProgress, totalBytes, signal })
          : Readable.fromWeb(sourceData, { signal });
      } else if (isNodeReadable(sourceData)) {
        stream = onProgress
          ? trackStreamProgress(sourceData, { onProgress, totalBytes })
          : sourceData;
      } else {
        throw createError.invalidInput(
          'Buffer, Node.js Readable, or Web ReadableStream',
          sourceData
        );
      }

      pipeline = initSharpPipeline(sharpFactory);

      pipeline.on('error', (err) =>
        stream?.destroy(createError.rethrow(err, 'Sharp pipeline error'))
      );
      stream.once('error', (err) =>
        pipeline.destroy(createError.rethrow(err, 'Source stream error'))
      );

      pipePromise = streamPipeline(stream, pipeline).catch((err) => {
        throw createError.rethrow(err, 'Stream pipeline error');
      });
    }

    // Perform transform and extract buffer
    const resultPromise = pipeline.toBuffer({ resolveWithObject: true });

    const mainPromise = pipePromise
      ? Promise.all([resultPromise, pipePromise]).then(([res]) => res)
      : resultPromise;

    const { data, info } = await awaitWithAbort(mainPromise, signal, () => {
      pipeline.destroy(createError.aborted());
      stream?.destroy(createError.aborted());
    });

    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createError.aborted();
    }
    throw createError.rethrow(
      error instanceof Error ? error : new Error(String(error)),
      'Transcoding error'
    );
  }
}
