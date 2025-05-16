import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type {
  BrowserDecoder,
  BrowserInput,
  BrowserOptions,
  OffscreenCanvasDecoderOptions,
  WebCodecsDecoderOptions
} from '../types';
import { detectMimeType } from '../mime/detect-mime-type';
import * as WebCodecsDecoder from './webcodecs'; // Has isSupported and decode
import * as CanvasDecoder from './canvas'; // Assuming this is the correct import path

/**
 * A Promise that resolves to the `CanvasDecoder` module imported dynamically.
 *
 * This promise is used to asynchronously load the `CanvasDecoder` module
 * from the specified file path. Once resolved, the promise will provide
 * access to the `CanvasDecoder` object, which provides decoding functionalities
 * for canvas-related operations.
 *
 * The dynamic import ensures that the `CanvasDecoder` module is not loaded
 * until required, optimizing the application's performance by reducing
 * initial loading time and memory usage.
 */
const canvasDecoderPromise: Promise<typeof CanvasDecoder> = import('./canvas');
/**
 * A Map object that serves as a cache for promises resolving to a boolean value.
 * The keys in the map are strings, and the corresponding values are Promises
 * that resolve to a boolean indicating the result of a specific operation or condition.
 *
 * This variable is typically used to store the state of ongoing or previously
 * resolved asynchronous operations, allowing for efficient reuse of results
 * and prevention of redundant executions.
 *
 * Key Characteristics:
 * - Keys: Represent identifiers or names associated with a specific operation.
 * - Values: Promises that resolve to a boolean, indicating success or failure.
 */
const supportPromiseCache: Map<string, Promise<boolean>> = new Map();

/**
 * Checks if the WebCodecs API supports decoding for a specific MIME type.
 *
 * @param {string} [mime] - The MIME type to check for WebCodecs support. If not provided, the method will resolve to false.
 * @return {Promise<boolean>} - A promise that resolves to `true` if the MIME type is supported or `false` otherwise. If the MIME type is not provided, the promise resolves to `false`.
 */
function isWebCodecsSupported(mime?: string): Promise<boolean> {
  if (!mime) return Promise.resolve(false);
  if (!supportPromiseCache.has(mime)) {
    const promise = WebCodecsDecoder.isSupported(mime).catch((err) => {
      supportPromiseCache.delete(mime);
      throw createError.rethrow(err);
    });
    supportPromiseCache.set(mime, promise);
  }
  return supportPromiseCache.get(mime) as Promise<boolean>; // Safe due to controlled map access
}

/**
 * Represents a set of options specific to a strategy parameter.
 * This type is derived from the `BrowserOptions` type with the exclusion
 * of 'decoder' and 'type' properties, then extends it to include a mandatory
 * 'type' string property.
 *
 * It allows the customization of strategy details while encapsulating shared
 * properties from the base `BrowserOptions` type.
 */
type StrategyParameterOptions = Omit<BrowserOptions, 'decoder' | 'type'> & {
  type: string;
};

/**
 * Decodes video or image input using the WebCodecs API.
 *
 * @param {BrowserInput} input - The source input containing the video or image data to decode.
 * @param {WebCodecsDecoderOptions} options - Configuration options for the WebCodecs decoder.
 * @return {Promise<PixelData>} A promise that resolves to the decoded pixel data.
 */
async function performWebCodecsDecode(
  input: BrowserInput,
  options: WebCodecsDecoderOptions
): Promise<PixelData> {
  return WebCodecsDecoder.decode(input, options);
}

/**
 * Performs decoding of image data using an offscreen canvas and returns the resulting pixel data.
 *
 * @param {BrowserInput} input - The input source containing image data to be decoded.
 * @param {OffscreenCanvasDecoderOptions} options - Configuration options for the offscreen canvas decoder.
 * @return {Promise<PixelData>} A promise that resolves with the decoded pixel data.
 */
async function performOffscreenCanvasDecode(
  input: BrowserInput,
  options: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  const module = await canvasDecoderPromise;
  return module.decode(input, options);
}

/**
 * A set of strategies for decoding browser inputs into pixel data. Each strategy
 * represents a specific decoding implementation. The available strategies include:
 * - `webCodecs`: Uses the WebCodecs API for decoding.
 * - `offscreenCanvas`: Uses the OffscreenCanvas API for decoding.
 * - `auto`: Automatically selects the best available decoding strategy based on
 *   environment and browser capabilities.
 *
 * @property {Function} webCodecs - Decoding strategy that uses the WebCodecs API. This
 *   strategy is suited for environments where WebCodecs is supported and provides
 *   optimized performance for processing.
 * @param {BrowserInput} input - The browser input data to decode.
 * @param {StrategyParameterOptions} opts - Options to configure the decoder.
 * @returns {Promise<PixelData>} A promise that resolves to the decoded pixel data.
 *
 * @property {Function} offscreenCanvas - Decoding strategy that uses the OffscreenCanvas
 *   API. This serves as an alternative for environments where WebCodecs is not supported
 *   or is inaccessible.
 * @param {BrowserInput} input - The browser input data to decode.
 * @param {StrategyParameterOptions} opts - Options to configure the decoder.
 * @returns {Promise<PixelData>} A promise that resolves to the decoded pixel data.
 *
 * @property {Function} auto - Automatically selects the decoding strategy based on the
 *   availability and support of browser features. Prioritizes WebCodecs if supported,
 *   otherwise falls back to OffscreenCanvas.
 * @param {BrowserInput} input - The browser input data to decode.
 * @param {StrategyParameterOptions} opts - Options to configure the decoder.
 * @returns {Promise<PixelData>} A promise that resolves to the decoded pixel data. Logs
 *   a warning and falls back to OffscreenCanvas in case WebCodecs detection fails.
 */
const strategies: Record<
  BrowserDecoder | 'auto',
  (input: BrowserInput, opts: StrategyParameterOptions) => Promise<PixelData>
> = {
  async webCodecs(input, options) {
    const fullOptions: WebCodecsDecoderOptions = {
      ...(options as Omit<WebCodecsDecoderOptions, 'decoder'>),
      decoder: 'webCodecs'
    };
    return performWebCodecsDecode(input, fullOptions);
  },

  async offscreenCanvas(input, options) {
    const fullOptions: OffscreenCanvasDecoderOptions = {
      ...(options as Omit<OffscreenCanvasDecoderOptions, 'decoder'>),
      decoder: 'offscreenCanvas'
    };
    return performOffscreenCanvasDecode(input, fullOptions);
  },

  async auto(input, opts) {
    try {
      const supported = await isWebCodecsSupported(opts.type);
      if (supported) {
        return strategies.webCodecs(input, opts);
      }
    } catch (err) {
      console.warn(
        `WebCodecs support check failed for type "${opts.type}", falling back to canvas.`,
        err
      );
    }
    return strategies.offscreenCanvas(input, opts);
  }
};

/**
 * Decodes the input image data using the designated decoding strategy.
 *
 * @param {BrowserInput} input - The input to be decoded, typically image data or source.
 * @param {BrowserOptions} [userProvidedOptions={}] - Optional settings provided by the user,
 *     which can include the decoder strategy, explicit type (MIME type), and other configurations.
 * @return {Promise<PixelData>} A promise that resolves to the decoded pixel data.
 * @throws {Error} Throws an error if the specified decoder is unsupported or if the MIME type cannot be determined.
 */
export async function decode(
  input: BrowserInput,
  userProvidedOptions: BrowserOptions = {}
): Promise<PixelData> {
  const {
    decoder: selectedDecoder,
    type: explicitType,
    ...restPayload
  } = userProvidedOptions;

  if (
    selectedDecoder &&
    !(
      selectedDecoder === 'webCodecs' ||
      selectedDecoder === 'offscreenCanvas' ||
      selectedDecoder === 'auto'
    )
  ) {
    throw createError.decoderUnsupported(selectedDecoder);
  }

  const finalMimeType = explicitType ?? detectMimeType(input);
  if (!finalMimeType) {
    throw createError.runtimeError(
      'Unable to determine MIME type. Please provide a valid type.'
    );
  }

  const strategyCallOpts: StrategyParameterOptions = {
    ...restPayload,
    type: finalMimeType
  };

  const strategyKeyToCall = selectedDecoder ?? 'auto';

  return strategies[strategyKeyToCall](input, strategyCallOpts);
}
