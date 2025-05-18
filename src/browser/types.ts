import type { CommonDecoderOptions } from '../types';

// type AllPossibleInputTypes =
//   | string
//   | URL
//   | Blob
//   | BufferSource
//   | ReadableStream<Uint8Array>
//   | Response
//   | ImageBitmap
//   | ImageData
//   | VideoFrame
//   | OffscreenCanvas
//   | HTMLImageElement
//   | HTMLVideoElement
//   | HTMLCanvasElement
//   | SVGElement;

/**
 * Represents the raw input that can be provided to a web worker or other similar processing utility.
 * This type accommodates a variety of input formats, allowing flexibility in handling different source data.
 *
 * It supports the following types of inputs:
 * - `string`: A textual representation, typically a URL or inline script content.
 * - `URL`: A URL object providing a reference to the resource to be processed.
 * - `Blob`: A Blob object representing immutable binary data, often used for file handling.
 * - `BufferSource`: A buffer or array buffer content designed for low-level binary data manipulation.
 * - `ReadableStream<Uint8Array>`: A stream of binary data, usually for handling dynamic or continuous input.
 * - `Response`: A fetch API Response instance, typically containing HTTP payloads.
 */
export type WorkerTransportData =
  | string
  | URL
  | Blob
  | BufferSource
  | ReadableStream<Uint8Array>
  | Response;

/**
 * Defines a type union, `DecodedImageData`, that represents various input types
 * that can be transferred across threads or contexts for processing in operations
 * involving decoded data.
 *
 * This type can be one of the following:
 * - `ImageBitmap`: Represents an efficiently created and handled bitmap of image data.
 * - `ImageData`: Represents raw pixel data and dimensions of an image.
 * - `VideoFrame`: Represents a frame of video data, typically used with modern video APIs.
 * - `OffscreenCanvas`: Represents a canvas that can be rendered off the main thread. // Contains decoded pixel data
 */
export type DecodedImageData = ImageBitmap | ImageData | VideoFrame | OffscreenCanvas;

/**
 * Type definition for a ElementSource.
 *
 * Represents a source type that can be used as input in various DOM-related operations.
 * The supported sources include:
 *
 * - HTMLImageElement: Represents an image element. // Typically holds encoded data
 * - HTMLVideoElement: Represents a video element. // Typically holds encoded data
 * - HTMLCanvasElement: Represents a canvas element. // Contains decoded pixel data
 * - SVGElement: Represents an SVG element. // Vector format, requires rasterization (not bitmap decoding)
 */
export type ElementSource =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | SVGElement;

/**
 * Represents an input type that is compatible with a worker.
 * This type is a union of `WorkerTransportData` and `DecodedImageData`.
 *
 * - `WorkerTransportData`: A type that typically includes raw data or information
 * that can be directly consumed or processed by the worker.
 * - `DecodedImageData`: A type that includes decoded or structured
 * information, often involving data that can be transferred efficiently between
 * threads or processes using transferable objects.
 */
export type WorkerImageInput = WorkerTransportData | DecodedImageData;

/**
 * Represents the possible input types for a browser environment.
 * This can be one of two types:
 * - `WorkerImageInput`: Represents input that is compatible with a web worker.
 * - `ElementSource`: Represents a source related to the Document Object Model.
 *
 * The `BrowserImageInput` type abstracts the input mechanisms for browser-based processes.
 * It aids in handling worker-compatible inputs or DOM-related resources seamlessly.
 */
export type BrowserImageInput = WorkerImageInput | ElementSource;

/**
 * EncodedImageSource represents a type that can either be `WorkerTransportData` or `ElementSource`.
 * It is used to specify the input type for handling encoded data in a browser environment.
 *
 * NOTE: This type name is potentially misleading as it includes `HTMLCanvasElement` which contains
 * decoded pixel data, not encoded data. It represents a union of initial browser source types.
 *
 * - `WorkerTransportData`: Refers to data input obtained from a worker thread, typically raw or preprocessed content.
 * - `ElementSource`: Refers to a browser-based Document Object Model (DOM) source, such as HTML elements or other DOM-related data.
 */
export type EncodedImageSource = WorkerTransportData | ElementSource;

/**
 * Interface representing configuration options for a `CanvasRenderingContext`.
 * It combines settings for `CanvasRenderingContext2D` and image smoothing properties.
 *
 * This interface extends:
 * - `CanvasRenderingContext2DSettings`: Provides configurable options for a 2D rendering context,
 * such as alpha compositing, desynchronized rendering, and more.
 * - `CanvasImageSmoothing`: Includes properties to control image smoothing behavior
 * when resizing images within the canvas.
 *
 * Use this interface to specify options when creating and manipulating 2D rendering contexts
 * for a `HTMLCanvasElement`.
 */
export interface CanvasRenderingContextOptions
  extends CanvasRenderingContext2DSettings,
    CanvasImageSmoothing {}

export type PartialImageEncodeOptions = Pick<ImageEncodeOptions, 'quality'>;

/**
 * Represents the options that can be used with WebCodecs API for image decoding.
 * Extends the `ImageDecodeOptions` interface to include additional properties for fine-tuning image decoding.
 *
 * The `WebCodecsOptions` interface provides flexibility in specifying decoding behavior for images while
 * also allowing adjustment of factors like quality level.
 *
 * - `quality`: An optional property to specify the desired quality of the resulting image. The value must be
 * a number between 0 and 1, where 0 represents the lowest quality and 1 represents the highest quality.
 */
export interface WebCodecsOptions extends ImageDecodeOptions, PartialImageEncodeOptions {}

/**
 * Represents configuration options for an `OffscreenCanvas`.
 * Extends `ImageBitmapOptions` and `CanvasRenderingContextOptions` to provide additional
 * properties and configurations for creating an offscreen rendering context.
 *
 * Properties in this interface can be used to control aspects such as rendering
 * quality and other canvas-related settings.
 *
 * @property {number} [quality] - A number specifying the desired quality for the rendering context.
 * The interpretation of this value may vary depending on the
 * implemented rendering context.
 */
export interface OffscreenCanvasOptions
  extends ImageBitmapOptions,
    CanvasRenderingContextOptions,
    PartialImageEncodeOptions {}

/**
 * Interface representing the configuration options for a browser-based decoder.
 * Extends the `CommonDecoderOptions` to include additional settings specific
 * to browser decoding.
 *
 * @interface BrowserDecoderOptions
 * @extends CommonDecoderOptions
 *
 * @property {string} [type] Specifies the type or format of the decoding process.
 */
export interface BrowserDecoderOptions extends CommonDecoderOptions {
  /**
   * @expected MIME type hint for input data
   * @example 'image/png'
   */
  type?: string;
}

/**
 * Represents the options for configuring a decoder that uses the WebCodecs API.
 * This configuration interface extends the base `BrowserDecoderOptions`.
 * It is specifically tailored for using the WebCodecs API to decode media.
 *
 * The `decoder` property must be set to `'webCodecs'` to indicate the use of the WebCodecs API.
 * Additional decoding configuration may be provided through the optional `options` property.
 *
 * This is used in scenarios where you want to work with low-level media decoding,
 * leveraging the WebCodecs API for high performance and efficient handling of media content.
 */
export interface WebCodecsDecoderOptions extends BrowserDecoderOptions {
  decoder: 'webCodecs';
  options?: WebCodecsOptions;
}

/**
 * Represents the options for configuring a decoder that utilizes an offscreen canvas.
 * This interface extends the base `BrowserDecoderOptions` interface and is specifically
 * used to initialize or configure the functionality of an offscreen canvas decoder.
 *
 * The `decoder` property is predefined as `'offscreenCanvas'`, identifying it as an offscreen canvas decoder.
 * Additional optional configurations can be provided through the `options` property, which represents
 * specific settings for the offscreen canvas.
 *
 * Use this interface to ensure the decoder is set to work efficiently with offscreen canvas features.
 */
export interface OffscreenCanvasDecoderOptions extends BrowserDecoderOptions {
  decoder: 'offscreenCanvas';
  options?: OffscreenCanvasOptions;
}

/**
 * Represents the available options for configuring browser-based decoders.
 *
 * This type can take the form of one of the following:
 * - `WebCodecsDecoderOptions`: Specific configuration options for a decoder
 * using the WebCodecs API.
 * - `OffscreenCanvasDecoderOptions`: Specific configuration options for a
 * decoder using the OffscreenCanvas API.
 * - A combination of `BrowserDecoderOptions` with `decoder` and `options`
 * properties explicitly omitted to avoid conflicts when specifying custom
 * decoder configurations.
 */
export type BrowserOptions =
  | WebCodecsDecoderOptions
  | OffscreenCanvasDecoderOptions
  | (BrowserDecoderOptions & {
      decoder?: never;
      options?: never;
    });

export type BrowserDecoder = 'webCodecs' | 'offscreenCanvas';
