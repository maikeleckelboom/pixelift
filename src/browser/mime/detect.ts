import type { BrowserInput } from '../index';
import { isStringOrURL } from '../../shared/guards';
import { lookup } from './registry';

export function detectMimeType(input: BrowserInput) {
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

  if (typeof HTMLSourceElement !== 'undefined' && input instanceof HTMLSourceElement) {
    src = input.src;
  }

  if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    src = input.currentSrc;
  }

  if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    src = input.src;
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    const svgString = new XMLSerializer().serializeToString(input);
    src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }

  return src ? lookup(src) : undefined;
}
