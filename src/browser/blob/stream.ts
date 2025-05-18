import type { BrowserOptions } from '../types';
import { isAbortError } from '../../shared/guards';
import { createError } from '../../shared/error';

/**
 * Processes a ReadableStream into a Blob with robust abort handling.
 */
export async function blobFromReadableStream(
  readableStream: ReadableStream<Uint8Array>,
  options?: BrowserOptions & { type?: string }
): Promise<Blob> {
  if (readableStream.locked) {
    throw createError.runtimeError('ReadableStream is locked.');
  }

  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  let abortHandler: (() => void) | undefined;

  const abortPromise = new Promise<never>((_, reject) => {
    if (!options?.signal) return;

    if (options.signal.aborted) {
      reader.cancel(createError.aborted()).catch(() => {});
      reject(createError.aborted('Stream processing aborted (pre-aborted).'));
      return;
    }

    abortHandler = () => {
      reader.cancel(createError.aborted()).catch(() => {});
      reject(createError.aborted('Stream processing aborted.'));
    };

    options.signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    const readLoop = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    };

    await Promise.race([readLoop(), abortPromise]);
    return new Blob(chunks, { type: options?.type });
  } catch (error) {
    if (isAbortError(error) || options?.signal?.aborted) {
      throw error instanceof Error
        ? error
        : createError.aborted('Aborted', { cause: error });
    }
    throw createError.runtimeError('Stream processing failed', { cause: error });
  } finally {
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener('abort', abortHandler);
    }
    try {
      reader.releaseLock();
    } catch {
      /* Ignore release errors */
    }
  }
}
