import type { BrowserInput } from '../browser';
import { isStringOrURL } from './validation';
import { lookup } from '../browser/mime';

export function getMimeType(input: BrowserInput) {
  if (isStringOrURL(input)) {
    return lookup(input.toString());
  }

  if (input instanceof Blob) {
    return input.type;
  }

  if (
    typeof input === 'object' &&
    (input instanceof ArrayBuffer || ArrayBuffer.isView(input))
  ) {
    return 'application/octet-stream';
  }

  let src: string | undefined;
  if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    src = input.src;
  } else if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    src = input.currentSrc;
  }

  return src ? lookup(src) : undefined;
}

// todo: move to browser/mime.ts
