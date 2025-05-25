import {throwIfAborted} from "./error.ts";

export interface StreamControlOptions {
  signal?: AbortSignal;
  maxBytes?: number;
  chunkSize?: number;
  onProgress?: (bytesProcessed: number) => void;
}

export function streamWithControls(
    options: StreamControlOptions = {}
): TransformStream<Uint8Array, Uint8Array> {
  const { signal, maxBytes, chunkSize, onProgress } = options;
  const enforceChunkSize = Number.isFinite(chunkSize) && chunkSize! > 0;
  const enforcedSize = enforceChunkSize ? chunkSize! : 0;

  let buffer = enforceChunkSize ? new Uint8Array(enforcedSize) : null;
  let offset = 0;
  let total = 0;
  let onAbort: (() => void) | undefined;

  const ensureWithinBounds = (bytes: number): void => {
    const nextTotal = total + bytes;
    if (maxBytes !== undefined && nextTotal > maxBytes) {
      throw new RangeError(`streamWithControls exceeded maxBytes: ${nextTotal} > ${maxBytes}`);
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
        onProgress?.(total);
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
          onProgress?.(total);
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
        onProgress?.(total);
      }

      if (onAbort && signal) {
        signal.removeEventListener('abort', onAbort);
      }
    },
  });
}
