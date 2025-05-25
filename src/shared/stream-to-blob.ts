import {type StreamControlOptions, streamWithControls} from "./stream-with-controls.ts";
import {throwIfAborted} from "./error.ts";

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
    const {type = 'application/octet-stream', ...controlOptions} = options;

    throwIfAborted(controlOptions.signal);

    const transformPipe = streamWithControls(controlOptions);
    const controlledStream: ReadableStream<Uint8Array> = stream.pipeThrough(transformPipe);

    const chunks: Uint8Array[] = [];

    try {
        for await (const chunk of controlledStream) {
            chunks.push(chunk);
        }

        throwIfAborted(controlOptions.signal);

        return new Blob(chunks, {type});
    } catch (error) {
        throw error;
    }
}
