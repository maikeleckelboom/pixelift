import { createError } from '../../../shared/error';
import type { OffscreenCanvasDecoderOptions } from '../../types';
import { DEFAULT_IMAGE_SMOOTHING_SETTINGS, offscreenCanvasOptions } from './options';

/**
 * Creates an OffscreenCanvas of specified dimensions along with its 2D rendering context.
 *
 * @param {number} width - The width of the canvas in pixels.
 * @param {number} height - The height of the canvas in pixels.
 * @param {OffscreenCanvasDecoderOptions} [options] - An optional parameter object for configuring the canvas and context.
 * @return {[OffscreenCanvas, OffscreenCanvasRenderingContext2D]} A tuple containing the created OffscreenCanvas and its associated 2D rendering context.
 * @throws {Error} If the OffscreenCanvasRenderingContext2D could not be created.
 */
export function createCanvasAndContext(
  width: number,
  height: number,
  options?: OffscreenCanvasDecoderOptions
): [OffscreenCanvas, OffscreenCanvasRenderingContext2D] {
  const canvas = new OffscreenCanvas(width, height);
  const contextOptions = offscreenCanvasOptions(options);
  const context = canvas.getContext('2d', contextOptions);
  if (!context) {
    throw createError.runtimeError('Failed to create OffscreenCanvasRenderingContext2D');
  }
  context.canvas.width = width;
  context.canvas.height = height;
  setImageSmoothingSettings(context, options);
  return [canvas, context];
}

/**
 * Configures the image smoothing settings for the provided rendering context.
 *
 * @param {OffscreenCanvasRenderingContext2D} context - The rendering context to apply the image smoothing settings to.
 * @param {OffscreenCanvasDecoderOptions} [options] - Optional settings to specify image smoothing properties.
 * @return {void} Does not return a value.
 */
export function setImageSmoothingSettings(
  context: OffscreenCanvasRenderingContext2D,
  options?: OffscreenCanvasDecoderOptions
): void {
  const { imageSmoothingQuality, imageSmoothingEnabled } = options?.options || {};
  const {
    imageSmoothingEnabled: defaultImageSmoothingEnabled,
    imageSmoothingQuality: defaultImageSmoothingQuality
  } = DEFAULT_IMAGE_SMOOTHING_SETTINGS;
  context.imageSmoothingEnabled = imageSmoothingEnabled || defaultImageSmoothingEnabled;
  context.imageSmoothingQuality = imageSmoothingQuality || defaultImageSmoothingQuality;
}
