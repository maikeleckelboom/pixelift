import { throwIfAborted } from './abort';
import { isBrowser } from '@/shared/env.ts';
import { AbortError, SecurityError } from '@/shared/errors.ts';

const MAX_STREAM_DEPTH = 3;

let nodeCrypto: typeof import('crypto') | null = null;

/**
 * Fills the given Uint8Array buffer with secure random values.
 * Supports both browser and Node.js environments.
 */
export async function getRandomValues(buffer: Uint8Array): Promise<void> {
  if (isBrowser()) {
    crypto.getRandomValues(buffer);
    return;
  }
  nodeCrypto ??= await import('crypto');
  nodeCrypto.randomFillSync(buffer);
}

const streamDepthMap = new WeakMap<ReadableStream<any>, number>();

export function createInitialStream<T>(stream: ReadableStream<T>): ReadableStream<T> {
  streamDepthMap.set(stream, 1);
  return createValidatedStream(stream);
}

export function createValidatedStream<T>(stream: ReadableStream<T>): ReadableStream<T> {
  const depth = streamDepthMap.get(stream) ?? 1;

  if (depth > MAX_STREAM_DEPTH) {
    throw new SecurityError(
      `Stream depth ${depth} exceeds maximum allowed of ${MAX_STREAM_DEPTH}`
    );
  }

  const proxy = new Proxy(stream, {
    get(target, prop, receiver) {
      if (prop === 'pipeThrough') {
        return function <U>(transform: TransformStream<T, U>): ReadableStream<U> {
          const newStream = target.pipeThrough(transform);
          streamDepthMap.set(newStream, depth + 1);
          return createValidatedStream(newStream);
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  streamDepthMap.set(proxy, depth);
  return proxy;
}

export interface StreamControlOptions {
  signal?: AbortSignal;
  maxBytes?: number;
  chunkSize?: number; // default 16 KiB
  totalBytes?: number;
  onProgress?: (bytesProcessed: number, totalBytes?: number) => void;
}

export function streamWithControls(
  options: StreamControlOptions = {}
): TransformStream<Uint8Array, Uint8Array> {
  const { signal, maxBytes, chunkSize = 16 * 1024, totalBytes, onProgress } = options;

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
    if (maxBytes !== undefined && nextTotal > maxBytes) {
      throw new RangeError(
        `streamWithControls exceeded maxBytes: ${nextTotal} > ${maxBytes}`
      );
    }
  };

  const reportProgress = () => {
    if (onProgress) {
      onProgress(total, totalBytes);
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
