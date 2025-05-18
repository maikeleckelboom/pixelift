import type { OffscreenCanvasDecoderOptions } from '../../types';

/**
 * A constant object defining the default configuration settings for image smoothing
 * when rendering images onto a canvas.
 *
 * Properties:
 * - `imageSmoothingEnabled`: A boolean indicating whether image smoothing is enabled,
 *   allowing the rendering engine to smooth pixel transitions. Default is `true`.
 * - `imageSmoothingQuality`: A string specifying the quality of image smoothing.
 *   Possible values are 'low', 'medium', or 'high'. Default is `'high'`.
 *
 * This configuration is typically used to control how images are rendered, to balance
 * performance and visual quality, especially when scaling or resizing images on a canvas.
 */
export const DEFAULT_IMAGE_SMOOTHING_SETTINGS: CanvasImageSmoothing = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
} as const;

/**
 * Configuration object for the default 2D canvas image smoothing settings.
 *
 * This constant defines a set of properties used during the creation of a `CanvasRenderingContext2D`
 * to customize the rendering behavior of the canvas. The provided settings are immutable.
 *
 * Properties:
 * - **alpha**: A boolean indicating whether the canvas should include an alpha (transparency) channel. Set to `true`, enabling transparency in the canvas.
 * - **colorSpace**: Specifies the color space for rendering. The value is set to `'srgb'`, ensuring compatibility with standard sRGB color profiles.
 * - **desynchronized**: Used to improve rendering performance by reducing synchronization during rendering. Set to `undefined` (not specified) in this configuration.
 * - **willReadFrequently**: A boolean indicating whether the canvas is expected to have frequent read-back operations, such as calls to `getImageData`. Set to `true` to optimize for such use cases.
 *
 * This is a constant configuration that supports efficient and smooth rendering on 2D canvas contexts
 * while accounting for performance and quality considerations.
 *
 * @constant
 * @type {Readonly<CanvasRenderingContext2DSettings>}
 */
export const DEFAULT_CANVAS_CONTEXT_SETTINGS: CanvasRenderingContext2DSettings = {
  alpha: true,
  colorSpace: 'srgb',
  desynchronized: undefined,
  willReadFrequently: true
} as const;

/**
 * The `DEFAULT_IMAGE_BITMAP_OPTIONS` constant defines the default configuration options
 * for creating an `ImageBitmap` object. It specifies how image data should be handled during
 * the creation process, including alpha premultiplication, color space conversion, image orientation,
 * and optional resizing.
 *
 * - `premultiplyAlpha`: Determines whether the alpha channel is premultiplied into the color channels.
 *   Possible values are 'none', meaning no premultiplication is applied.
 * - `colorSpaceConversion`: Specifies if color space conversion should occur. A value of 'none' indicates
 *   no conversion will be performed.
 * - `imageOrientation`: Determines the orientation of the image as defined by its metadata. The value
 *   'from-image' respects the orientation embedded in the image file.
 * - `resizeHeight`: An optional value defining the height to resize the image to. If omitted, no resizing for height is applied.
 * - `resizeWidth`: An optional value defining the width to resize the image to. If omitted, no resizing for width is applied.
 * - `resizeQuality`: Specifies the quality of resizing when `resizeHeight` and `resizeWidth` are provided.
 *   Defaults to undefined if not explicitly set.
 */
export const DEFAULT_IMAGE_BITMAP_OPTIONS: ImageBitmapOptions = {
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
  imageOrientation: 'from-image',
  resizeQuality: 'high',
  resizeHeight: 0,
  resizeWidth: 0
} as const;

/**
 * Configures and returns an `ImageBitmapOptions` object based on the provided browser options.
 *
 * @param {BrowserOptions} [options] - Optional browser options which may include settings like decoder type, image orientation, premultiply alpha, color space conversion, and resize parameters.
 * @return {ImageBitmapOptions} Returns an `ImageBitmapOptions` object with the configured options or default options if no relevant settings are provided.
 */
export function imageBitmapOptions(
  options?: OffscreenCanvasDecoderOptions
): ImageBitmapOptions {
  return {
    resizeWidth: options?.options?.resizeWidth,
    resizeHeight: options?.options?.resizeHeight,
    resizeQuality: options?.options?.resizeQuality,
    premultiplyAlpha: options?.options?.alpha ? 'premultiply' : 'none'
  };
}
