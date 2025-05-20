import type { ProgressCallback, ServerInput, ServerOptions } from '../types';
import type { PixelData } from '../../types';
import type * as SharpNS from 'sharp';
import type { SharpInput } from 'sharp';
import { getSourceData } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
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
  const sharpFunc = sharpModule.default;
  if (typeof sharpFunc !== 'function') {
    throw createError.dependencyMissing('sharp');
  }

  let pipeline: SharpNS.Sharp | undefined;
  let bufferPromise: Promise<{ data: Buffer; info: { width: number; height: number } }>;

  let nodeStream: Readable | undefined;

  try {
    if (source instanceof Buffer) {
      if (onProgress) {
        trackBufferProgress(source, onProgress);
      }
      pipeline = sharpFunc(source as SharpInput);
      bufferPromise = pipeline
        .raw({ depth: 'uchar' })
        .toColorspace('srgb')
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
    } else {
      if (isWebReadable(source)) {
        nodeStream = Readable.fromWeb(
          <import('stream/web').ReadableStream>(<unknown>source)
        );
        if (onProgress) {
          nodeStream = trackWebStreamProgress(
            <import('stream/web').ReadableStream>(<unknown>source),
            onProgress
          );
        }
      } else if (isNodeReadable(source)) {
        nodeStream = onProgress ? trackStreamProgress(source, onProgress) : source;
      } else {
        throw createError.invalidInput(
          'Buffer, Node.js Readable, or Web ReadableStream',
          source
        );
      }

      pipeline = sharpFunc();
      nodeStream.on('error', (err) =>
        pipeline?.destroy(createError.rethrow(err, 'Source stream error'))
      );
      pipeline.on('error', (err) =>
        nodeStream?.destroy(createError.rethrow(err, 'Sharp pipeline error'))
      );

      nodeStream.pipe(pipeline);
      bufferPromise = pipeline
        .raw({ depth: 'uchar' })
        .toColorspace('srgb')
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
    }

    const result = options?.signal
      ? await Promise.race([
          bufferPromise,
          new Promise<never>((_, reject) =>
            options.signal?.addEventListener(
              'abort',
              () => {
                if (nodeStream && !nodeStream.destroyed) {
                  nodeStream.destroy(createError.aborted());
                }
                reject(createError.aborted());
              },
              {
                once: true
              }
            )
          )
        ])
      : await bufferPromise;

    const { data, info } = result;
    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height
    };
  } catch (err) {
    if (
      options?.signal?.aborted ||
      (err instanceof Error && err.message.includes('aborted'))
    ) {
      if (nodeStream && !nodeStream.destroyed) {
        nodeStream.destroy(createError.aborted());
      }
      throw createError.aborted();
    }
    throw createError.rethrow(err as Error, 'Image processing failed');
  } finally {
    pipeline?.destroy?.();
  }
}
