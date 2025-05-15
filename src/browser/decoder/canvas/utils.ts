import { createError } from '../../../shared/error';
import type { BrowserOptions } from '../../types';
import { DEFAULT_IMAGE_SMOOTHING_SETTINGS, offscreenCanvasOptions } from './options';

/**
 * Creates an OffscreenCanvas and its 2D rendering context with the specified dimensions and options.
 *
 * @param {number} width - The width of the OffscreenCanvas.
 * @param {number} height - The height of the OffscreenCanvas.
 * @param {BrowserOptions<'offscreenCanvas'>} [options] - Optional settings for the OffscreenCanvas and its rendering context.
 * @return {[OffscreenCanvas, OffscreenCanvasRenderingContext2D]} A tuple containing the created OffscreenCanvas and its rendering context.
 * @throws {Error} Throws an error if the 2D rendering context cannot be created.
 */
export function createCanvasAndContext(
  width: number,
  height: number,
  options?: BrowserOptions<'offscreenCanvas'>
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

export function setImageSmoothingSettings(
  context: OffscreenCanvasRenderingContext2D,
  options?: BrowserOptions<'offscreenCanvas'>
): void {
  const { imageSmoothingQuality, imageSmoothingEnabled } = options?.options || {};
  const {
    imageSmoothingEnabled: defaultImageSmoothingEnabled,
    imageSmoothingQuality: defaultImageSmoothingQuality
  } = DEFAULT_IMAGE_SMOOTHING_SETTINGS;
  context.imageSmoothingEnabled = imageSmoothingEnabled || defaultImageSmoothingEnabled;
  context.imageSmoothingQuality = imageSmoothingQuality || defaultImageSmoothingQuality;
}
