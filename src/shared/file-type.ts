import type { BrowserInput, BrowserOptions } from '../browser';
import { isStringOrURL } from './validation';
import { MIME_MAP } from './constants';

const DATA_URI_EXT_REGEX = /^data:[^/]+\/([^;,]+)/;
const DATA_URI_MIME_REGEX = /^data:([^;,]+)/;
const QUERY_FRAGMENT_REGEX = /[?#].*$/;

export function getFileExtension(input: string | URL): string {
  let path: string;

  if (typeof input === 'string') {
    path = input;
  } else {
    path = input.protocol === 'data:' ? input.href : input.pathname;
  }

  if (path.startsWith('data:')) {
    const mimeMatch = path.match(DATA_URI_EXT_REGEX);
    return mimeMatch?.[1]?.toLowerCase() || '';
  }

  const cleanPath = path.replace(QUERY_FRAGMENT_REGEX, '');
  const lastSlash = Math.max(cleanPath.lastIndexOf('/'), cleanPath.lastIndexOf('\\'));
  const filename = cleanPath.substring(lastSlash + 1);
  const lastDotIndex = filename.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.substring(lastDotIndex + 1).toLowerCase();
}

export function getFileType(input: BrowserInput, options?: BrowserOptions): string {
  if (options?.type) return options.type;

  if (input instanceof Blob && input.type) {
    return input.type;
  }

  if (input instanceof HTMLCanvasElement) {
    return 'image/png';
  }

  if (typeof input === 'string' && input.startsWith('data:')) {
    const mimeMatch = input.match(DATA_URI_MIME_REGEX);
    return mimeMatch?.[1] || 'image/png';
  }

  let sourceUrl: string | URL | undefined;

  if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    sourceUrl = input.src;
  } else if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    sourceUrl = input.currentSrc;
  } else if (isStringOrURL(input)) {
    sourceUrl = input;
  }

  if (sourceUrl) {
    if (typeof sourceUrl === 'string' && sourceUrl.startsWith('data:')) {
      const mimeMatch = sourceUrl.match(DATA_URI_MIME_REGEX);
      return mimeMatch?.[1] || 'image/png';
    }

    const ext = getFileExtension(sourceUrl);
    const isVideo =
      typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement;

    if (ext) {
      return MIME_MAP[ext] || (isVideo ? 'video/mp4' : 'image/png');
    }

    if (isVideo) {
      return 'video/mp4';
    }
  }

  return 'image/png';
}
