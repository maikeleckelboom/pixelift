import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import type { ProgressCallback, ProgressData } from '../../server/types';
import type { ProgressOptions } from '../../server/decoder';

/**
 * Wraps a Buffer with progress tracking
 *
 * @param buffer - Input buffer to track
 * @param onProgress - Progress callback
 * @returns The same buffer (for chaining)
 */
export function trackBufferProgress(buffer: Buffer, onProgress: ProgressCallback): Buffer {
  onProgress({
    loaded: buffer.length,
    total: buffer.length,
    progress: 1.0
  });

  return buffer;
}

/**
 * Wraps a Node.js Readable stream with progress tracking
 *
 * @param stream - Input stream to track
 * @param options
 * @returns A new stream that tracks progress
 */
export function trackStreamProgress(stream: Readable, options: ProgressOptions): Readable {
  const { onProgress, totalBytes } = options;

  let bytesRead: number = 0;

  const trackingStream = new Readable({
    objectMode: stream.readableObjectMode,
    highWaterMark: stream.readableHighWaterMark,

    read() {
      stream.resume();
    }
  });

  stream.on('data', (chunk) => {
    const chunkSize = Buffer.isBuffer(chunk)
      ? chunk.length
      : chunk instanceof Uint8Array
        ? chunk.byteLength
        : typeof chunk === 'string'
          ? Buffer.byteLength(chunk)
          : stream.readableObjectMode
            ? 1 // Count objects instead of bytes in object mode
            : 0;

    bytesRead += chunkSize;

    const progressData: ProgressData = {
      loaded: bytesRead,
      total: totalBytes,
      progress: undefined
    };

    if (typeof totalBytes === 'number' && totalBytes > 0) {
      progressData.progress = Math.min(bytesRead / totalBytes, 1);
    }

    onProgress?.(progressData);

    if (!trackingStream.push(chunk)) {
      stream.pause();
    }
  });

  stream.on('end', () => {
    onProgress?.({
      loaded: bytesRead,
      total: bytesRead,
      progress: 1.0
    });
    trackingStream.push(null);
  });

  stream.on('error', (err) => {
    trackingStream.emit('error', err);
  });

  trackingStream.on('close', () => {
    if (!stream.destroyed) {
      stream.destroy();
    }
  });

  return trackingStream;
}

export function trackWebStreamProgress(
  stream: import('stream/web').ReadableStream<Uint8Array>,
  options: ProgressOptions & { signal?: AbortSignal }
): Readable {
  const { signal, ...progressOptions } = options;
  return trackStreamProgress(Readable.fromWeb(stream, { signal }), progressOptions);
}
