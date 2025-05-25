import { throwIfAborted } from './abort';

export interface StreamControlOptions {
  signal?: AbortSignal;
  maxBytes?: number;
  chunkSize?: number;
  totalBytes?: number;
  onProgress?: (bytesProcessed: number, totalBytes?: number) => void;
}

export function extractTotalBytes(input: unknown): number | undefined {
  if (!input) return undefined;

  // Response: check Content-Length header
  if (input instanceof Response) {
    const len = input.headers.get('content-length');
    if (len) return Number(len);
  }

  // Blob or File (browser)
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return input.size;
  }

  // Node.js ReadableStream with known length is tricky; usually unknown

  return undefined;
}

export function streamWithControls(
  options: StreamControlOptions = {}
): TransformStream<Uint8Array, Uint8Array> {
  const { signal, maxBytes, chunkSize, totalBytes: userTotalBytes, onProgress } = options;
  const enforceChunkSize = Number.isFinite(chunkSize) && chunkSize! > 0;
  const enforcedSize = enforceChunkSize ? chunkSize! : 0;

  let buffer = enforceChunkSize ? new Uint8Array(enforcedSize) : null;
  let offset = 0;
  let total = 0;
  let onAbort: (() => void) | undefined;

  // Use totalBytes provided by user or attempt to infer it (once)
  const totalBytes = userTotalBytes ?? undefined;

  const ensureWithinBounds = (bytes: number): void => {
    const nextTotal = total + bytes;
    if (maxBytes !== undefined && nextTotal > maxBytes) {
      throw new RangeError(
        `streamWithControls exceeded maxBytes: ${nextTotal} > ${maxBytes}`
      );
    }
  };

  const reportProgress = (): void => {
    if (onProgress) {
      onProgress(total, totalBytes);
    }
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      throwIfAborted(signal);
      onAbort = () => controller.error(new DOMException('Aborted', 'AbortError'));
      signal?.addEventListener('abort', onAbort, { once: true });
    },

    transform(chunk, controller) {
      throwIfAborted(signal);

      if (!enforceChunkSize || !buffer) {
        ensureWithinBounds(chunk.byteLength);
        controller.enqueue(chunk);
        total += chunk.byteLength;
        reportProgress();
        return;
      }

      let inputOffset = 0;
      const inputLength = chunk.length;

      while (inputOffset < inputLength) {
        const available = inputLength - inputOffset;
        const spaceLeft = enforcedSize - offset;
        const copyLength = Math.min(spaceLeft, available);

        buffer.set(chunk.subarray(inputOffset, inputOffset + copyLength), offset);
        offset += copyLength;
        inputOffset += copyLength;

        if (offset === enforcedSize) {
          ensureWithinBounds(enforcedSize);
          controller.enqueue(buffer);
          total += enforcedSize;
          reportProgress();
          buffer = new Uint8Array(enforcedSize);
          offset = 0;
        }
      }
    },

    flush(controller) {
      throwIfAborted(signal);

      if (enforceChunkSize && buffer && offset > 0) {
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
