import type { PixeliftOptions } from 'pixelift';
import type { PixeliftBrowserInput } from 'pixelift/browser';
import { isStringOrURL } from '../shared/validation';

export async function toBlob(
  source: PixeliftBrowserInput,
  options: PixeliftOptions = {}
): Promise<Blob> {
  if (source instanceof Blob) {
    return source;
  }

  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    let res: Response;

    try {
      res = await fetch(url, { mode: 'cors', headers: options.headers });
    } catch (cause: unknown) {
      throw new Error(
        `Network error: Unable to fetch from "${url}". Please check your network connection.`,
        { cause }
      );
    }

    if (!res.ok) {
      throw new Error(
        `Resource error: Failed to fetch from "${url}" (${res.status} ${res.statusText}). ` +
          `Please verify the resource exists and is accessible via CORS.`
      );
    }

    return res.blob();
  }

  throw new TypeError(
    `Type error: Expected a Blob or URL string, but received ${typeof source}. ` +
      `Please provide a valid input format.`
  );
}
