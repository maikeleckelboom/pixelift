import { CANVAS_2D_OPTIONS } from './options';
import { createError } from '../../../shared/error';

export function createCanvasContext(
  width: number,
  height: number
): [OffscreenCanvas, OffscreenCanvasRenderingContext2D] {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', CANVAS_2D_OPTIONS);
  if (!ctx) throw createError.runtimeError('Canvas context creation failed');
  setImageSmoothingSettings(ctx);
  return [canvas, ctx];
}

export function setImageSmoothingSettings(
  context: OffscreenCanvasRenderingContext2D
): void {
  context.imageSmoothingEnabled = false;
  context.imageSmoothingQuality = 'low';
}
