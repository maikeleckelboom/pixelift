import type { PixeliftServerInput, PixeliftServerOptions } from './types';

async function sanitizeFilePath(url: URL): Promise<string> {
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const decodedPath = fileURLToPath(url);
  const resolved = path.resolve(decodedPath);

  if (!resolved.startsWith(process.cwd())) {
    throw new Error(`Path traversal attempt detected: ${resolved}`);
  }

  return resolved;
}

async function resolveLocalPath(inputPath: string): Promise<string> {
  const path = await import('node:path');
  const decodedPath = decodeURIComponent(inputPath);
  const resolved = path.resolve(decodedPath);
  const projectRoot = path.resolve(process.cwd());
  const absolutePath = path.normalize(resolved);
  const normalizedRoot = path.normalize(projectRoot + path.sep);

  if (!absolutePath.startsWith(normalizedRoot)) {
    throw new Error(`Path traversal attempt detected: ${absolutePath}`);
  }

  return absolutePath;
}

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
      const safePath = await resolveLocalPath(inputString);
      return await fs.readFile(safePath);
    } catch (err: unknown) {
      throw new Error(
        `Failed to read local file: "${inputString}".\n` +
          `Path must be within project directory.\n` +
          `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  switch (url.protocol) {
    case 'file:': {
      signal?.throwIfAborted();
      try {
        const fs = await import('node:fs/promises');
        const safePath = await sanitizeFilePath(url);
        return await fs.readFile(safePath);
      } catch (err: unknown) {
        throw new Error(
          `Failed to read local file from URL: "${url.toString()}".\n` +
            `Path must be within project directory.\n` +
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
