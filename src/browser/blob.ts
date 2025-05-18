import { isAbortError, isStringOrURL } from '../shared/guards';
import type { BrowserImageInput, BrowserOptions } from './types';
import { createError, PixeliftError } from '../shared/error';
import { imageBitmapOptions } from './decoder/canvas/options';
import { createCanvasAndContext } from './decoder/canvas/utils';

/**
 * Converts an ImageBitmap to a Blob using canvas rendering
 * @param bitmap The ImageBitmap to convert
 * @param options Conversion options
 * @returns Promise resolving to the resulting Blob
 */
async function convertImageBitmapToBlob(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const { width, height } = bitmap;
  const [canvas, context] = createCanvasAndContext(width, height);

  context.drawImage(bitmap, 0, 0, width, height);
  return await canvas.convertToBlob({
    type: options?.type
  });
}

/**
 * Gets the current execution environment's origin URL
 * @returns Origin URL or undefined if unavailable
 */
function getExecutionEnvironmentOrigin(): string | undefined {
  const globalLocation =
    typeof location !== 'undefined'
      ? location
      : typeof self !== 'undefined'
        ? self.location
        : undefined;

  if (globalLocation) {
    return (
      globalLocation.origin ||
      `${globalLocation.protocol}//${globalLocation.hostname}` +
        (globalLocation.port ? `:${globalLocation.port}` : '')
    );
  }

  return undefined;
}

/**
 * Fetches a remote resource and returns it as a Blob
 * @param urlInput URL string or URL object to fetch
 * @param options Conversion options
 * @returns Promise resolving to the fetched Blob
 */
async function fetchResourceAsBlob(
  urlInput: string | URL,
  options?: BrowserOptions
): Promise<Blob> {
  try {
    const baseUrl = getExecutionEnvironmentOrigin();
    const resourceUrl = new URL(urlInput.toString(), baseUrl).toString();

    const response = await fetch(resourceUrl, {
      mode: options?.mode ?? 'cors',
      headers: options?.headers,
      signal: options?.signal,
      credentials: options?.credentials
    });

    if (!response.ok) {
      throw createError.fetchFailed(resourceUrl, response.status, response.statusText);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof PixeliftError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw createError.aborted();
    }

    throw createError.networkError(`Failed to fetch resource: ${urlInput.toString()}`, {
      cause: error
    });
  }
}

export function isArrayBuffer(data: BufferSource): data is ArrayBuffer {
  return data instanceof ArrayBuffer;
}

function convertToArrayBuffer(data: BufferSource): ArrayBuffer {
  if (isArrayBuffer(data)) {
    return data;
  }
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
}

/**
 * Creates a Blob from binary data
 * @param data ArrayBuffer or ArrayBufferView input
 * @param options Conversion options
 * @returns Resulting Blob
 */
function createBlobFromBinaryData(data: BufferSource, options?: BrowserOptions): Blob {
  const buffer = convertToArrayBuffer(data);
  return new Blob([buffer], { type: options?.type });
}

/**
 * Converts HTMLCanvasElement to Blob with proper error handling
 * @param canvas The canvas element to convert
 * @param options Conversion options
 * @returns Promise resolving to the resulting Blob
 */
function convertCanvasToBlob(
  canvas: HTMLCanvasElement,
  options?: BrowserOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(createError.runtimeError('Canvas to Blob conversion failed')),
      options?.type
    );
  });
}

/**
 * Main conversion function for browser-compatible inputs
 * @param input Input to convert to Blob
 * @param options Conversion options
 * @returns Promise resolving to the resulting Blob
 */
export async function toBlob(
  input: BrowserImageInput,
  options?: BrowserOptions
): Promise<Blob> {
  // Handle URL/string inputs
  if (isStringOrURL(input)) {
    return fetchResourceAsBlob(input, options);
  }

  // Handle binary data inputs
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return createBlobFromBinaryData(input, options);
  }

  // Direct Blob pass-through
  if (input instanceof Blob) {
    return input;
  }

  // Handle VideoFrame inputs
  if (typeof VideoFrame !== 'undefined' && input instanceof VideoFrame) {
    const videoFrameInput = input; // Keep a reference to the original VideoFrame
    const intermediateBitmap = await createImageBitmap(
      videoFrameInput,
      imageBitmapOptions(options)
    );
    try {
      return await convertImageBitmapToBlob(intermediateBitmap, options); // Pass intermediate
    } finally {
      intermediateBitmap.close(); // Close the intermediate bitmap created here
      videoFrameInput.close(); // IMPORTANT: Close the original VideoFrame
    }
  }

  // Handle OffscreenCanvas inputs
  if (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) {
    return input.convertToBlob({
      type: options?.type
    });
  }

  // Handle ImageData inputs
  if (typeof ImageData !== 'undefined' && input instanceof ImageData) {
    const [canvas, context] = createCanvasAndContext(input.width, input.height, options);
    context.putImageData(input, 0, 0);
    return canvas.convertToBlob({
      type: options?.type
    });
  }

  // Handle HTML media elements
  if (input instanceof HTMLImageElement || input instanceof HTMLVideoElement) {
    validateMediaElementReady(input);
    const intermediateBitmap = await createImageBitmap(input, imageBitmapOptions(options));
    try {
      return await convertImageBitmapToBlob(intermediateBitmap, options);
    } finally {
      intermediateBitmap.close();
    }
  }

  // Handle HTMLCanvasElement inputs
  if (input instanceof HTMLCanvasElement) {
    return convertCanvasToBlob(input, options);
  }

  // Handle SVGElement inputs
  if (input instanceof SVGElement) {
    return new Blob([input.outerHTML], { type: 'image/svg+xml' });
  }

  // Handle ImageBitmap inputs with a performance warning
  if (input instanceof ImageBitmap) {
    console.warn(
      'Pixelift: Converting a provided ImageBitmap to a Blob requires rendering it to an internal canvas. ' +
        'This can have performance implications. The original ImageBitmap will remain open.'
    );

    // 'input' is the user's ImageBitmap. convertImageBitmapToBlob will use it but not close it.
    return convertImageBitmapToBlob(input, options);
  }

  // Handle ReadableStream inputs
  if (input instanceof ReadableStream) {
    return processStreamToBlob(input, options);
  }

  // Handle Response inputs
  if (input instanceof Response) {
    if (!input.body) {
      throw createError.runtimeError('Response body unavailable');
    }

    return input.blob();
  }

  throw createError.invalidInput(
    `Unsupported input type: ${typeof input}`,
    input?.constructor?.name
  );
}

/** Helper Functions */

function validateMediaElementReady(element: HTMLImageElement | HTMLVideoElement): void {
  if (element instanceof HTMLImageElement && !element.complete) {
    throw createError.runtimeError('Image element not fully loaded');
  }
  if (
    element instanceof HTMLVideoElement &&
    element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    throw createError.runtimeError('Video element not ready for frame capture');
  }
}

async function processStreamToBlob(
  readableStream: ReadableStream,
  options?: BrowserOptions
): Promise<Blob> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];
  let abortHandler: (() => void) | undefined;

  try {
    if (options?.signal) {
      abortHandler = () => reader.cancel().catch(() => {});
      options.signal.addEventListener('abort', abortHandler);
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Blob(chunks, { type: options?.type });
  } catch (error) {
    if (isAbortError(error)) throw createError.aborted();
    throw createError.runtimeError('Stream processing failed', { cause: error });
  } finally {
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener('abort', abortHandler);
    }
    reader.releaseLock();
  }
}
