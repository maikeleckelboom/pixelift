import { createError, ErrorCode, PixeliftError } from '../../shared/error';

/**
 * Options for configuring the stream-to-Blob conversion behavior.
 */
export interface StreamToBlobOptions {
  /**
   * AbortSignal to allow cancellation of the stream processing.
   * If aborted, the Promise will be rejected with an AbortError.
   */
  signal?: AbortSignal;
  /**
   * MIME type for the resulting Blob
   */
  type?: string;
  /**
   * Maximum allowed size in bytes for the stream data.
   * If exceeded, processing will abort and the Promise will reject.
   */
  maxSizeBytes?: number;
}

/**
 * Converts a ReadableStream of Uint8Array data into a Blob, with proper
 * abort handling and size limit enforcement. Works in any environment
 * supporting the Web Streams API and Blob constructor.
 *
 * @param readableStream - Stream to convert to a Blob
 * @param options - Conversion options
 * @returns Promise resolving to the resulting Blob
 * @throws {PixeliftError} With code 'aborted' for cancellations
 * @throws {PixeliftError} With code 'runtime-error' for other failures
 */
export async function streamToBlob(
  readableStream: ReadableStream<Uint8Array>,
  options?: StreamToBlobOptions
): Promise<Blob> {
  if (readableStream.locked) {
    throw createError.runtimeError('ReadableStream is locked and cannot be processed');
  }

  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let abortHandler: (() => void) | undefined;

  // TO
  const abortPromise = new Promise<never>((_, reject) => {
    const signal = options?.signal;
    if (!signal) return;

    if (signal.aborted) {
      cleanupReader(reader, createError.aborted('Stream processing pre-aborted'));
      reject(createError.aborted('Stream processing pre-aborted'));
      return;
    }

    abortHandler = () => {
      const abortError = createError.aborted('Stream processing aborted');
      cleanupReader(reader, abortError);
      reject(abortError);
    };

    signal.addEventListener('abort', abortHandler, { once: true });
  });

  try {
    await Promise.race([
      (async () => {
        try {
          while (true) {
            enforceAbortState(options?.signal);
            const { done, value } = await reader.read();

            if (done) break;
            if (!value) continue;

            chunks.push(value);
            totalBytes += value.byteLength;

            if (options?.maxSizeBytes && totalBytes > options.maxSizeBytes) {
              throw createError.runtimeError(
                `Stream exceeds size limit of ${options.maxSizeBytes} bytes`
              );
            }
          }
        } catch (error) {
          return handleReadError(error);
        }
      })(),
      abortPromise
    ]);

    validatePostReadState(options?.signal);
    return new Blob(chunks, { type: options?.type });
  } catch (error) {
    return handleConversionError(error);
  } finally {
    cleanupAbortListener(options?.signal, abortHandler);
    releaseReaderLock(reader);
  }
}

// Helper functions remain as separate implementations but use PixeliftError

function validatePostReadState(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createError.aborted('Processing completed but signal was aborted');
  }
}

function handleConversionError(error: unknown): never {
  if (error instanceof PixeliftError) {
    if (error.code === ErrorCode.aborted) throw error;
    throw createError.rethrow(error, 'Stream conversion failed');
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    throw createError.aborted('Stream operation aborted', { cause: error });
  }

  throw createError.rethrow(error, 'Stream conversion failed');
}

function handleReadError(error: unknown): never {
  if (error instanceof PixeliftError) {
    if (error.code === ErrorCode.aborted) throw error;
    throw createError.rethrow(error, 'Stream read failed');
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    throw createError.aborted('Stream read aborted', { cause: error });
  }

  throw createError.rethrow(error, 'Stream read operation failed');
}

function enforceAbortState(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createError.aborted('Read operation aborted');
  }
}

function cleanupReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  reason?: unknown
): void {
  reader.cancel(reason).catch(() => {
    /* Ignore cancellation errors */
  });
}

function releaseReaderLock(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    reader.releaseLock();
  } catch (error) {
    console.warn('Failed to release stream reader lock:', error);
  }
}

function cleanupAbortListener(signal?: AbortSignal, handler?: () => void): void {
  if (signal && handler) {
    signal.removeEventListener('abort', handler);
  }
}
