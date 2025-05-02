import type { PixeliftServerInput, PixeliftServerOptions } from './types';

export async function getBuffer(
  input: PixeliftServerInput,
  options: PixeliftServerOptions = {}
): Promise<Buffer> {
  const { signal, headers } = options;

  signal?.throwIfAborted();

  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return Buffer.from(input as ArrayBufferLike);
  }

  if (input instanceof Blob || input instanceof File) {
    signal?.throwIfAborted();
    const buffer = await input.arrayBuffer();
    return Buffer.from(buffer);
  }

  const inputString = String(input);

  const dataMatch = inputString.match(/^data:([^;]+);base64,(.*)$/);
  if (dataMatch && dataMatch[2]) {
    return Buffer.from(dataMatch[2], 'base64');
  }

  let url: URL;
  try {
    url = new URL(inputString);
    signal?.throwIfAborted();
  } catch {
    signal?.throwIfAborted();
    try {
      const fs = await import('node:fs/promises');
      return await fs.readFile(inputString);
    } catch (err: unknown) {
      throw new Error(
        `Failed to read local file from path: "${inputString}".\n` +
          `Please check if the file exists and is accessible.\n` +
          `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // --- Handle URL Protocols ---
  switch (url.protocol) {
    case 'file:': {
      signal?.throwIfAborted();
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
      signal?.throwIfAborted();
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: headers,
        signal: signal
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
