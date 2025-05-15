import type { BrowserInput } from '../browser';
import { isStringOrURL } from './validation';

const DATA_PREFIX = 'data:';
const QUERY_OR_FRAGMENT = /[?#].*$/; // still OK once
const SLASH_BACKSLASH = /[\\/]/;

function parseDataUrlMimeType(dataUrl: string): string | undefined {
  // data:mime/sub[;...],base64,...
  const semicolon = dataUrl.indexOf(';', DATA_PREFIX.length);
  const comma = dataUrl.indexOf(',', DATA_PREFIX.length);
  const end = semicolon > 0 ? semicolon : comma;
  if (end < 0) return undefined;

  const mime = dataUrl.substring(DATA_PREFIX.length, end).toLowerCase();
  const slash = mime.indexOf('/');
  return slash > 0
    ? mime.substring(0, slash + 1).concat(mime.substring(slash + 1).split('+')[0] || '')
    : undefined;
}

export function getFileExtension(input: string | URL): string | undefined {
  let path =
    typeof input === 'string'
      ? input
      : input.protocol === DATA_PREFIX
        ? input.href
        : input.pathname;

  if (path.startsWith(DATA_PREFIX)) {
    const mime = parseDataUrlMimeType(path);
    return mime ? mime.split('/')[1] : undefined;
  }

  // strip query & fragment
  path = path.replace(QUERY_OR_FRAGMENT, '');

  // find filename
  const sepIdx = path.search(SLASH_BACKSLASH);
  const file =
    sepIdx < 0
      ? path
      : path.slice(path.lastIndexOf(path.match(SLASH_BACKSLASH)?.[0] || '') + 1);

  const dot = file.lastIndexOf('.');
  if (dot <= 0 || dot === file.length - 1) return undefined;
  return file.slice(dot + 1).toLowerCase();
}

export function guessInputMimeType(input: BrowserInput): string | undefined {
  // Blob case is already fast
  if (input instanceof Blob) return input.type || undefined;

  // String data URL is very common—catch early
  if (typeof input === 'string' && input.startsWith(DATA_PREFIX)) {
    return parseDataUrlMimeType(input) || 'text/plain';
  }

  // Determine a “source” URL string for images/videos/strings
  let src: string | undefined;
  if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
    src = input.src;
  } else if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
    src = input.currentSrc;
  } else if (isStringOrURL(input)) {
    src = input.toString();
  }

  if (!src) return undefined;

  // Data URL inside a URL object?
  if (src.startsWith(DATA_PREFIX)) {
    return parseDataUrlMimeType(src) || 'text/plain';
  }

  const ext = getFileExtension(src);
  const isVideo = input instanceof HTMLVideoElement;

  if (ext) {
    return `${isVideo ? 'video' : 'image'}/${ext}`;
  }

  // fallback
  return isVideo ? 'video/mp4' : undefined;
}
