import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import type { ProgressCallback } from '../../server/types';

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
 * @param onProgress - Progress callback
 * @returns A new stream that tracks progress
 */
export function trackStreamProgress(
  stream: Readable,
  onProgress: ProgressCallback
): Readable {
  let bytesRead = 0;

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
          : 0;

    bytesRead += chunkSize;

    const progressValue = bytesRead / (stream.readableLength + chunkSize);

    const progress = {
      loaded: bytesRead,
      total: stream.readableLength + chunkSize,
      progress: progressValue
    };

    onProgress(progress);

    const canContinue = trackingStream.push(chunk);

    // Handle backpressure
    if (!canContinue) {
      stream.pause();
    }
  });

  stream.on('end', () => {
    onProgress({
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
  webStream: import('stream/web').ReadableStream<Uint8Array>,
  onProgress: ProgressCallback
): Readable {
  const nodeStream = Readable.fromWeb(webStream);
  return trackStreamProgress(nodeStream, onProgress);
}
