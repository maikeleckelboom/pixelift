import type { PixeliftOptions, PixeliftServerInput } from './types';

export async function getBuffer(
  input: PixeliftServerInput,
  options: PixeliftOptions = {}
): Promise<Buffer> {
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
      try {
        const fs = await import('node:fs/promises');
        const { fileURLToPath } = await import('node:url');
        return await fs.readFile(fileURLToPath(url));
      } catch (err: unknown) {
        throw new Error(
          `Failed to read local file from URL: "${url.toString()}".\n` +
            `Please check if the file exists and is accessible.\n` +
            `Error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    case 'http:':
    case 'https:': {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: options.headers
      });

      if (!res.ok) {
        throw new Error(
          `HTTP request to "${url.toString()}" failed with status ${res.status}: ${res.statusText}`
        );
      }

      return Buffer.from(await res.arrayBuffer());
    }

    default:
      throw new Error(
        `Unsupported URL protocol: "${url.protocol}".\n` +
          `Please use a local path, "file:", "http:", or "https:" URL.`
      );
  }
}
