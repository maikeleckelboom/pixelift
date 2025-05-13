import { canvasContextOptions } from './options';
import { createError } from '../../../shared/error';
import type { BrowserOptions } from '../../types';

export function createCanvasAndContext(
  width: number,
  height: number,
  options?: BrowserOptions
): [OffscreenCanvas, OffscreenCanvasRenderingContext2D] {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', canvasContextOptions(options));
  if (!ctx) throw createError.runtimeError('Canvas context creation failed');
  setImageSmoothingSettings(ctx, options);
  return [canvas, ctx];
}

export function setImageSmoothingSettings(
  context: OffscreenCanvasRenderingContext2D,
  options?: BrowserOptions
): void {
  const { imageSmoothingQuality, imageSmoothingEnabled } = options || {};

  context.imageSmoothingEnabled = imageSmoothingEnabled ?? true;
  context.imageSmoothingQuality = imageSmoothingQuality ?? 'low';
}
