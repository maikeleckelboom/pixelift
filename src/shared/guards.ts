type Ctor<T = unknown> = new (...args: any[]) => T;

function isInstance<T>(value: unknown, ctor: Ctor<T>): value is T {
  return value instanceof ctor;
}

const imageBitmapSourceConstructors = [
  typeof HTMLImageElement !== 'undefined' ? HTMLImageElement : undefined,
  typeof SVGImageElement !== 'undefined' ? SVGImageElement : undefined,
  typeof HTMLVideoElement !== 'undefined' ? HTMLVideoElement : undefined,
  typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : undefined,
  typeof ImageBitmap !== 'undefined' ? ImageBitmap : undefined,
  typeof OffscreenCanvas !== 'undefined' ? OffscreenCanvas : undefined,
  typeof VideoFrame !== 'undefined' ? VideoFrame : undefined,
  typeof Blob !== 'undefined' ? Blob : undefined,
  typeof ImageData !== 'undefined' ? ImageData : undefined
].filter(Boolean) as Array<new (...args: any[]) => unknown>;

export function isImageBitmapSource(value: unknown): value is ImageBitmapSource {
  if (value == null || typeof value !== 'object') return false;
  return imageBitmapSourceConstructors.some((ctor) => isInstance(value, ctor));
}

export function isStreamResponse(value: unknown): value is Response & {
  body: ReadableStream<Uint8Array>;
} {
  return value instanceof Response && typeof value.body === 'object' && value.body !== null;
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
