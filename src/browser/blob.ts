import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';

export async function toBlob(
  source: BrowserInput,
  options: BrowserOptions = {}
): Promise<Blob> {
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

  if (source instanceof Blob) {
    return source;
  }

  throw createError.invalidInput('"Blob", "File", or a valid URL', typeof source);
}
