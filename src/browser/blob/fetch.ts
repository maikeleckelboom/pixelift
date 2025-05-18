import type { BrowserOptions } from '../types';
import { resolveContextOrigin } from '../utils/url-context';
import { createError, PixeliftError } from '../../shared/error';
import { isAbortError } from '../../shared/guards';

export async function blobFromRemoteResource(
  urlInput: string | URL,
  options?: BrowserOptions
): Promise<Blob> {
  try {
    const baseUrl = resolveContextOrigin();
    const resourceUrl = new URL(urlInput.toString(), baseUrl).toString();

    const response = await fetch(resourceUrl, {
      mode: options?.mode ?? 'cors',
      headers: options?.headers,
      signal: options?.signal,
      credentials: options?.credentials
    });

    if (!response.ok) {
      throw createError.fetchFailed(resourceUrl, response.status, response.statusText);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof PixeliftError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw createError.aborted();
    }

    throw createError.networkError(`Failed to fetch resource: ${urlInput.toString()}`, {
      cause: error
    });
  }
}
