import { type StreamControlOptions, streamWithControls } from './stream-with-controls';
import { throwIfAborted } from './abort';

export interface StreamToBlobOptions extends StreamControlOptions {
  type?: string;
}

/**
 * Converts a ReadableStream of Uint8Array chunks into a Blob.
 * Allows specifying StreamControlOptions to manage the stream processing
 * and the MIME type for the resulting Blob. Includes robust AbortSignal handling.
 */
export async function streamToBlob(
  stream: ReadableStream<Uint8Array>,
  options: StreamToBlobOptions = {}
): Promise<Blob> {
  const { type = 'application/octet-stream', ...controlOptions } = options;

  if (stream == null) {
    throw new TypeError('streamToBlob: stream is null or undefined.');
  }

  if (typeof stream.getReader !== 'function') {
    throw new TypeError('streamToBlob: Not a valid ReadableStream.');
  }

  throwIfAborted(controlOptions.signal);

  const transformPipe = streamWithControls(controlOptions);
  const controlledStream: ReadableStream<Uint8Array> = stream.pipeThrough(transformPipe);

  const chunks: Uint8Array[] = [];

  for await (const chunk of controlledStream) {
    chunks.push(chunk);
  }

  throwIfAborted(controlOptions.signal);

  return new Blob(chunks, { type });
}
