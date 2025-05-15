import type { ServerInput } from '../server';
import type { BrowserInput } from '../browser';

export function isStringOrURL(input: unknown): input is string | URL {
  return (
    typeof input === 'string' ||
    input instanceof URL ||
    (typeof input === 'object' &&
      input !== null &&
      Object.prototype.toString.call(input) === '[object URL]')
  );
}

export function isImageData(input: unknown): input is ImageData {
  return (
    typeof input === 'object' &&
    input !== null &&
    'data' in input &&
    'width' in input &&
    'height' in input &&
    Object.prototype.toString.call(input) === '[object ImageData]'
  );
}

export function isBlob(input: unknown): input is Blob {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input instanceof Blob ||
      (Object.prototype.toString.call(input) === '[object Blob]' &&
        'size' in input &&
        'type' in input &&
        'arrayBuffer' in input &&
        typeof (input as Blob).arrayBuffer === 'function'))
  );
}

export function isHTMLImageElement(input: unknown): input is HTMLImageElement {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input instanceof HTMLImageElement ||
      (Object.prototype.toString.call(input) === '[object HTMLImageElement]' &&
        'tagName' in input &&
        (input as Element).tagName === 'IMG' &&
        'src' in input))
  );
}

export function isSVGImageElement(input: unknown): input is SVGImageElement {
  if (typeof input !== 'object' || input === null) return false;
  if (input instanceof SVGImageElement) return true;
  const el = input as Element;

  if (
    el.tagName.toLowerCase() !== 'image' ||
    el.namespaceURI !== 'http://www.w3.org/2000/svg'
  ) {
    return false;
  }

  if (!('href' in el)) return false;
  const hrefProp = (el as SVGImageElement).href;
  return !(typeof hrefProp !== 'object' || hrefProp === null);
}

export function isHTMLVideoElement(input: unknown): input is HTMLVideoElement {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input instanceof HTMLVideoElement ||
      (Object.prototype.toString.call(input) === '[object HTMLVideoElement]' &&
        'videoWidth' in input &&
        'videoHeight' in input &&
        'poster' in input))
  );
}

export function isImageBitmap(input: unknown): input is ImageBitmap {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input instanceof ImageBitmap ||
      (Object.prototype.toString.call(input) === '[object ImageBitmap]' &&
        'width' in input &&
        'height' in input &&
        'close' in input &&
        typeof (input as ImageBitmap).close === 'function'))
  );
}

export function isVideoFrame(input: unknown): input is VideoFrame {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input instanceof VideoFrame ||
      (Object.prototype.toString.call(input) === '[object VideoFrame]' &&
        'format' in input &&
        'codedWidth' in input &&
        'codedHeight' in input &&
        'close' in input &&
        typeof (input as VideoFrame).close === 'function'))
  );
}

export function validateServerInput(input: unknown): input is ServerInput {
  return (
    isStringOrURL(input) ||
    Buffer.isBuffer(input) ||
    input instanceof ArrayBuffer ||
    (typeof input === 'object' &&
      input !== null &&
      Object.prototype.toString.call(input) === '[object ArrayBuffer]') ||
    ArrayBuffer.isView(input)
  );
}

export function validateBrowserInput(input: unknown): input is BrowserInput {
  return (
    isStringOrURL(input) ||
    isBlob(input) ||
    isHTMLImageElement(input) ||
    isSVGImageElement(input) ||
    isHTMLVideoElement(input) ||
    isImageBitmap(input) ||
    isImageData(input) ||
    isVideoFrame(input)
  );
}

// Error type validation
export function isAbortError(error: unknown): error is DOMException {
  return (
    (error instanceof DOMException ||
      (typeof error === 'object' &&
        error !== null &&
        Object.prototype.toString.call(error) === '[object DOMException]')) &&
    (error as DOMException).name === 'AbortError'
  );
}
