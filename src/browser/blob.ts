import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';

export async function toBlob(
  source: BrowserInput,
  options: BrowserOptions = {}
): Promise<Blob> {
  if (source instanceof Blob) {
    return source;
  }

  if (source instanceof File) {
    return new Blob([source], { type: source.type });
  }

  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    let res: Response;

    try {
      res = await fetch(url, { mode: 'cors', headers: options.headers });
    } catch (error: unknown) {
      throw createError.networkError(`Network error: Unable to fetch from "${url}".`, {
        cause: error
      });
    }

    if (!res.ok) {
      throw createError.fetchFailed(url, res.status, res.statusText);
    }

    return res.blob();
  }

  throw createError.invalidInput('"Blob", "File", or a valid URL', typeof source);
}
