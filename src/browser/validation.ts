import type { BrowserInput } from './types';

export function isImageBitmapSource(src: unknown): src is ImageBitmapSource {
  return (
    src instanceof HTMLImageElement ||
    src instanceof SVGImageElement ||
    src instanceof HTMLVideoElement ||
    src instanceof HTMLCanvasElement ||
    src instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && src instanceof OffscreenCanvas) ||
    src instanceof VideoFrame ||
    src instanceof ImageData ||
    src instanceof Blob
  );
}

export function isSVGInput(input: BrowserInput): boolean {
  if (input instanceof HTMLImageElement) {
    return input.tagName === 'IMAGE' && input.src.endsWith('.svg');
  }
  if (input instanceof SVGImageElement) {
    return true;
  }
  if (input instanceof HTMLCanvasElement) {
    return input.toDataURL().endsWith('.svg');
  }
  if (input instanceof Blob) {
    return input.type === 'image/svg+xml';
  }
  if (input instanceof File) {
    return input.type === 'image/svg+xml';
  }
  return false;
}
