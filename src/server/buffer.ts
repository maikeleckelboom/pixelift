import type { PixeliftServerInput } from './types.ts';

export async function getBuffer(input: PixeliftServerInput): Promise<Buffer> {
  // Already a Buffer - return immediately
  if (Buffer.isBuffer(input)) {
    return input;
  }

  // Handle BufferSource (ArrayBuffer or TypedArray)
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return Buffer.from(input as ArrayBufferLike);
  }

  // Check for data URL
  const dataMatch = input.match(/^data:([^;]+);base64,(.*)$/);
  if (dataMatch) {
    return Buffer.from(dataMatch[2]!, 'base64');
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    // Invalid URL - treat as a filesystem path
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
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`HTTP request failed: ${res.status} ${res.statusText}`);
      }
      return Buffer.from(await res.arrayBuffer());
    }

    default:
      throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}