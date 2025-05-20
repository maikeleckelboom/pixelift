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

function isNodeReadable(src: unknown): src is Readable {
  return src instanceof Readable;
}

function isWebReadable(src: unknown): src is ReadableStream<Uint8Array> {
  return (
    typeof src === 'object' &&
    src !== null &&
    typeof (src as ReadableStream<Uint8Array>).getReader === 'function'
  );
}

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

function createPipelineFromBuffer(
  sharpFactory: typeof SharpNS,
  buffer: Buffer,
  onProgress?: ProgressCallback
): SharpInstance {
  if (onProgress) {
    trackBufferProgress(buffer, onProgress);
  }
  return sharpFactory(buffer).raw({ depth: 'uchar' }).toColorspace('srgb').ensureAlpha();
}

function createPipelineFromStream(
  sharpFactory: typeof SharpNS,
  source: unknown,
  onProgress?: ProgressCallback
): [SharpInstance, Readable] {
  let stream: Readable;

  if (isWebReadable(source)) {
    const webStream = <import('stream/web').ReadableStream>(<unknown>source);
    stream = onProgress
      ? trackWebStreamProgress(webStream, onProgress)
      : Readable.fromWeb(webStream);
  } else if (isNodeReadable(source)) {
    stream = onProgress ? trackStreamProgress(source, onProgress) : source;
  } else {
    throw createError.invalidInput(
      'Buffer, Node.js Readable, or Web ReadableStream',
      source
    );
  }

  const pipeline = sharpFactory().raw({ depth: 'uchar' });

  stream.on('error', (err) =>
    pipeline.destroy(createError.rethrow(err, 'Source stream error'))
  );

  pipeline.on('error', (err) =>
    stream.destroy(createError.rethrow(err, 'Sharp pipeline error'))
  );

  stream.pipe(pipeline);

  return [pipeline, stream];
}

export async function decode(
  input: ServerInput,
  options?: ServerOptions,
  onProgress?: ProgressCallback
): Promise<PixelData> {
  const sourceData = await getSourceData(input, options);

  if (options?.signal?.aborted) {
    throw createError.aborted();
  }

  const sharpModule = await getSharp();
  const sharpFactory = sharpModule.default;
  if (typeof sharpFactory !== 'function') {
    throw createError.dependencyMissing('sharp');
  }

  let pipeline: ReturnType<typeof sharpFactory> | undefined;
  let stream: Readable | undefined;

  try {
    if (sourceData instanceof Buffer) {
      pipeline = createPipelineFromBuffer(sharpFactory, sourceData, onProgress);
    } else {
      [pipeline, stream] = createPipelineFromStream(sharpFactory, sourceData, onProgress);
    }

    const bufferResult = pipeline
      .toColorspace('srgb')
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = await awaitWithAbort(bufferResult, options?.signal, () => {
      if (stream && !stream.destroyed) {
        stream.destroy(createError.aborted());
      }
    });

    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (err) {
    if (createError.isAbortError(err)) {
      if (stream && !stream.destroyed) {
        stream.destroy(createError.aborted());
      }
      throw createError.aborted();
    }
    throw createError.rethrow(err, 'Transcoding error');
  } finally {
    pipeline?.destroy();
  }
}
