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

export function assertImageBitmapSource(
  value: unknown
): asserts value is ImageBitmapSource {
  if (!isImageBitmapSource(value)) {
    throw new TypeError('Expected a valid ImageBitmapSource');
  }
}

export function isStreamResponse(value: unknown): value is Response & {
  body: ReadableStream<Uint8Array>;
} {
  return value instanceof Response && typeof value.body === 'object' && value.body !== null;
}
