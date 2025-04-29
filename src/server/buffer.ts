import type { PixeliftServerInput, PixeliftServerOptions } from './types.ts';
import { getRepositoryUrl, getVersion } from '../shared/env.ts';

export async function getBuffer(input: PixeliftServerInput, options:PixeliftServerOptions = {}): Promise<Buffer> {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return Buffer.from(input as ArrayBufferLike);
  }

  const dataMatch = input.match(/^data:([^;]+);base64,(.*)$/);
  if (dataMatch && dataMatch[2]) {
    return Buffer.from(dataMatch[2], 'base64');
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    const fs = await import('node:fs/promises');
    return fs.readFile(input);
  }
  switch (url.protocol) {
    case 'file:': {
      const fs = await import('node:fs/promises');
      const { fileURLToPath } = await import('node:url');
      return fs.readFile(fileURLToPath(url));
    }

    case 'http:':
    case 'https:': {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': `Pixelift/${getVersion()} (+${getRepositoryUrl()})`,
          ...options.headers,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP request failed: ${res.status} ${res.statusText}`);
      }
      return Buffer.from(await res.arrayBuffer());
    }

    default:
      throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}