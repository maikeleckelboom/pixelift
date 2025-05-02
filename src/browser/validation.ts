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
