import { throwIfAborted } from './abort';
import { AbortError } from '@/shared/errors.ts';

/**
 * Options for controlling stream processing behavior.
 */
export interface StreamControlOptions {
  /**
   * An AbortSignal object that allows canceling the stream operation.
   */
  signal?: AbortSignal;

  /**
   * Maximum number of bytes to read from the stream.
   * If undefined, the stream will be read to completion.
   */
  maxBytes?: number;

  /**
   * Size (in bytes) of each chunk to be read from the stream.
   * Defaults to 16 KiB if not specified.
   */
  chunkSize?: number;

  /**
   * The total number of bytes expected in the stream.
   * Used for calculating the progress ratio. If undefined, the ratio will be null.
   */
  totalBytes?: number;

  /**
   * Callback invoked during progress updates.
   *
   * @param bytesProcessed - Total bytes processed so far.
   * @param ratio - Progress ratio (0 to 1), or null if `totalBytes` is undefined.
   */
  onProgress?: (bytesProcessed: number, ratio: number | null) => void;
}

export function streamWithControls(
  options: StreamControlOptions
): TransformStream<Uint8Array, Uint8Array> {
  const {
    signal,
    maxBytes = Infinity,
    chunkSize = 16 * 1024,
    totalBytes,
    onProgress
  } = options;

  if (maxBytes !== undefined && maxBytes < 0) {
    throw new RangeError('maxBytes must be non-negative if specified');
  }
  if (chunkSize <= 0) {
    throw new RangeError('chunkSize must be positive if specified');
  }

  const buffer = new Uint8Array(chunkSize);
  let offset = 0;
  let total = 0;

  const ensureWithinBounds = (bytes: number) => {
    const nextTotal = total + bytes;
    if (nextTotal > maxBytes) {
      throw new RangeError(
        `streamWithControls exceeded maxBytes: ${nextTotal} > ${maxBytes}`
      );
    }
  };

  const reportProgress = () => {
    if (onProgress) {
      onProgress(total, totalBytes !== undefined ? total / totalBytes : null);
    }
  };

  let onAbort: (() => void) | undefined;

  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      throwIfAborted(signal);
      onAbort = () => controller.error(new AbortError('Operation aborted'));
      signal?.addEventListener('abort', onAbort, { once: true });
    },

    transform(chunk, controller) {
      throwIfAborted(signal);

      let inputOffset = 0;
      const inputLength = chunk.length;

      while (inputOffset < inputLength) {
        const spaceLeft = chunkSize - offset;
        const copyLength = Math.min(spaceLeft, inputLength - inputOffset);

        buffer.set(chunk.subarray(inputOffset, inputOffset + copyLength), offset);
        offset += copyLength;
        inputOffset += copyLength;

        if (offset === chunkSize) {
          ensureWithinBounds(chunkSize);
          controller.enqueue(buffer);
          total += chunkSize;
          reportProgress();
          offset = 0;
        }
      }
    },

    flush(controller) {
      throwIfAborted(signal);

      if (offset > 0) {
        const finalChunk = buffer.subarray(0, offset);
        ensureWithinBounds(finalChunk.byteLength);
        controller.enqueue(finalChunk);
        total += finalChunk.byteLength;
        reportProgress();
      }

      if (onAbort && signal) {
        signal.removeEventListener('abort', onAbort);
      }
    }
  });
}
