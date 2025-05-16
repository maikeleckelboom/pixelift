import type { PixelData } from '../types';
import { createError } from './error';

export function createPixelData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): PixelData {
  if (width <= 0 || height <= 0) {
    throw createError.invalidInput(
      'Invalid dimensions',
      'Width and height must be positive integers'
    );
  }
  return {
    data,
    width,
    height
  };
}
