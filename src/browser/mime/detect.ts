import type { BrowserImageInput } from '../index';
import { isStringOrURL } from '../../shared/guards';
import { lookup } from './registry';

export function detectMimeType(input: BrowserImageInput) {
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

  if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) {
    src = input.toDataURL();
  }

  if (typeof HTMLAudioElement !== 'undefined' && input instanceof HTMLAudioElement) {
    src = input.currentSrc;
  }

  if (typeof HTMLSourceElement !== 'undefined' && input instanceof HTMLSourceElement) {
    src = input.src;
  }

  return src ? lookup(src) : undefined;
}
