import { type StreamControlOptions, streamWithControls } from './stream-with-controls';
import { throwIfAborted } from './abort';

export interface StreamToBlobOptions extends StreamControlOptions {
  type?: string;
}

/**
 * Converts a ReadableStream of Uint8Array chunks into a Blob.
 * Allows specifying StreamControlOptions to manage the stream processing
 * and the MIME type for the resulting Blob. Includes robust AbortSignal handling.
 * Also accepts a Promise that resolves to a ReadableStream, or a Response object.
 */
export async function streamToBlob(
  stream:
    | ReadableStream<Uint8Array>
    | Promise<ReadableStream<Uint8Array> | null>
    | Response
    | null
    | undefined,
  options: StreamToBlobOptions = {}
): Promise<Blob> {
  const { type: optionsType = 'application/octet-stream', ...controlOptions } = options;

  let resolvedType = optionsType;

  if (stream == null) {
    throw new TypeError('streamToBlob: stream is null or undefined.');
  }

  throwIfAborted(controlOptions.signal);

  let resolvedStream: ReadableStream<Uint8Array>;

  if (stream instanceof Response) {
    if (!stream.body) {
      throw new TypeError('streamToBlob: Response has no body.');
    }
    resolvedStream = stream.body;
    const contentType = stream.headers.get('content-type');
    if (!options.type && contentType) {
      resolvedType = contentType;
    }
  } else {
    const awaitedStream = await stream;

    if (awaitedStream == null) {
      throw new TypeError('streamToBlob: resolved stream is null or undefined.');
    }

    if (typeof awaitedStream.getReader !== 'function') {
      throw new TypeError('streamToBlob: Not a valid ReadableStream.');
    }

    resolvedStream = awaitedStream;
  }

  throwIfAborted(controlOptions.signal);

  const controlledStream = resolvedStream.pipeThrough(streamWithControls(controlOptions));

  const chunks: Uint8Array[] = [];

  try {
    for await (const chunk of controlledStream) {
      chunks.push(chunk);
      throwIfAborted(controlOptions.signal);
    }
  } finally {
    if (controlOptions.signal?.aborted) {
      await controlledStream.cancel();
    }
  }

  throwIfAborted(controlOptions.signal);

  return new Blob(chunks, { type: resolvedType });
}
