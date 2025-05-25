import { isNode } from '@/shared/env.ts';
import { isStreamResponse, isValidUrl } from '@/shared/guards.ts';
import { rethrowIfAbortError, throwIfAborted } from '@/shared/abort.ts';
import { getTypeName } from '@/shared/helpers.ts';

export interface FetchWithControlsOptions extends RequestInit {
  signal?: AbortSignal;
  headers?: HeadersInit;
  mode?: RequestMode;
  credentials?: RequestCredentials;
}

export const DEFAULT_HEADERS: HeadersInit = {
  Accept: '*/*',
  'Content-Type': 'application/octet-stream'
};

export const DEFAULT_FETCH_OPTIONS: FetchWithControlsOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'same-origin'
};

export const DEFAULT_CHUNK_SIZE = 16 * 1024; // 16KB

export async function fetchWithError(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }
  return response;
}

export async function fetchWithControls(
  input: RequestInfo | URL | string,
  options: FetchWithControlsOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  const signal = options.signal ?? controller.signal;

  if (typeof input === 'string' && !isValidUrl(input)) {
    throw new TypeError(`Invalid URL: ${input}`);
  }

  throwIfAborted(signal);

  const fetchOptions: FetchWithControlsOptions = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers ?? {})
    }
  };

  const response = await fetchWithError(
    typeof input === 'string' || input instanceof URL
      ? new Request(input, fetchOptions)
      : input,
    fetchOptions
  );

  rethrowIfAbortError(response, signal);

  if (!response.body) {
    throw new Error('Response body is not readable');
  }

  return response;
}

export function isStreamable(
  input: unknown
): input is
  | ReadableStream<Uint8Array>
  | NodeJS.ReadableStream
  | { stream(): ReadableStream<Uint8Array> } {
  if (typeof input !== 'object' || input == null) return false;

  if (typeof ReadableStream !== 'undefined' && input instanceof ReadableStream) return true;

  if (typeof (input as any).stream === 'function') return true;

  if (isNode()) {
    const nodeStream = input as NodeJS.ReadableStream;
    return (
      typeof nodeStream.pipe === 'function' &&
      typeof nodeStream.on === 'function' &&
      typeof nodeStream.readable === 'boolean' &&
      nodeStream.readable
    );
  }

  return false;
}

export async function toReadableStream(
  input: unknown,
  options?: FetchWithControlsOptions
): Promise<ReadableStream<Uint8Array>> {
  if (!input) throw new TypeError('Input must be provided');

  if (isStreamResponse(input)) {
    if (!input.body) throw new Error('Response body is unavailable');
    return input.body;
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    return chunkedBufferToStream(input);
  }

  if (typeof input === 'string' || input instanceof URL) {
    try {
      const response = await fetchWithControls(input, options);
      if (!response.body) throw new Error('Empty response body');
      return response.body;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  if (ArrayBuffer.isView(input) || input instanceof ArrayBuffer) {
    const buffer =
      input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return chunkedBufferToStream(buffer);
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    if (input.size === 0) throw new Error('Empty blob/file');
    return input.stream();
  }

  if (isStreamable(input)) {
    if (typeof (input as any).stream === 'function') {
      return (input as any).stream();
    }

    if (isNode()) {
      return nodeToWebStream(input as NodeJS.ReadableStream);
    }

    if (input instanceof ReadableStream) {
      return input;
    }

    throw new TypeError('Unsupported stream-like object');
  }

  return Promise.reject(new TypeError(`Unsupported input type: ${getTypeName(input)}`));
}

export function nodeToWebStream(
  nodeStream: NodeJS.ReadableStream
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream
        .on('data', (chunk: Buffer) => {
          controller.enqueue(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
          if (controller.desiredSize === null || controller.desiredSize <= 0) {
            nodeStream.pause();
          }
        })
        .on('end', () => controller.close())
        .on('error', (err) => controller.error(err))
        .on('pause', () => nodeStream.pause())
        .on('resume', () => nodeStream.resume());
    },
    pull() {
      nodeStream.resume();
    },
    cancel(reason) {
      if (
        'destroy' in nodeStream &&
        nodeStream.destroy &&
        typeof nodeStream.destroy === 'function'
      ) {
        nodeStream.destroy(reason);
      }
    }
  });
}

function chunkedBufferToStream(
  data: Uint8Array,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      const end = Math.min(offset + chunkSize, data.byteLength);
      if (offset < data.byteLength) {
        controller.enqueue(data.subarray(offset, end));
        offset = end;
      } else {
        controller.close();
      }
    }
  });
}
