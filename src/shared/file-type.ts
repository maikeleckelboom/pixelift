import type { BrowserInput } from '../browser';
import { isStringOrURL } from './validation';
import { SUPPORTED_MIME_MAP } from './constants';

const DATA_URI_MIME_REGEX = /^data:([^;,]+)/i;
const QUERY_FRAGMENT_REGEX = /[?#].*$/;

function parseDataUrlMimeType(dataUrl: string): string | undefined {
  const match = dataUrl.match(DATA_URI_MIME_REGEX);
  return match?.[1]?.split(';')[0]?.trim().toLowerCase() || undefined;
}

export function getFileExtension(input: string | URL): string | undefined {
  let path: string;

  if (typeof input === 'string') {
    path = input;
  } else {
    path = input.protocol === 'data:' ? input.href : input.pathname;
  }

  if (path.startsWith('data:')) {
    const mimeType = parseDataUrlMimeType(path);
    if (!mimeType) return undefined;
    const [, subtype] = mimeType.split('/', 2);
    return subtype?.split('+')[0];
  }

  let cleanPath: string;
  try {
    cleanPath = decodeURIComponent(path.replace(QUERY_FRAGMENT_REGEX, ''));
  } catch {
    cleanPath = path.replace(QUERY_FRAGMENT_REGEX, '');
  }

  const lastSlash = Math.max(cleanPath.lastIndexOf('/'), cleanPath.lastIndexOf('\\'));
  const filename = cleanPath.substring(lastSlash + 1);
  const lastDotIndex = filename.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return undefined;
  }

  return filename.substring(lastDotIndex + 1).toLowerCase();
}

export function guessInputMimeType(
  input: BrowserInput,
  fallbackMimeType?: string
): string | undefined {
  if (input instanceof Blob) {
    return input.type || fallbackMimeType;
  }

  if (typeof input === 'string' && input.startsWith('data:')) {
    return parseDataUrlMimeType(input) || 'text/plain';
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
    const urlString = sourceUrl instanceof URL ? sourceUrl.href : sourceUrl;

    // Data URL handling for URL objects
    if (urlString.startsWith('data:')) {
      return parseDataUrlMimeType(urlString) || 'text/plain';
    }

    const ext = getFileExtension(sourceUrl);
    const isVideo = input instanceof HTMLVideoElement;

    // Handle known extensions
    if (ext && SUPPORTED_MIME_MAP[ext]) {
      return SUPPORTED_MIME_MAP[ext];
    }

    // Smart fallbacks
    if (isVideo) {
      return ext ? `video/${ext}` : 'video/mp4';
    }

    return ext ? `image/${ext}` : fallbackMimeType;
  }

  return fallbackMimeType;
}
