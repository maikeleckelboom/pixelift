import path from 'node:path';
import fs from 'node:fs/promises';
import type { ServerInput, ServerOptions } from './types';
import { createError } from '../shared/error';
import { fileURLToPath } from 'node:url';
import { isAbortError } from '../shared/guards';

function sanitizeFilePath(url: URL): string {
  const decoded = fileURLToPath(url);
  const resolved = path.resolve(decoded);
  const cwd = process.cwd();

  if (!resolved.startsWith(cwd + path.sep)) {
    throw createError.pathTraversal(resolved);
  }
  return resolved;
}

function resolveLocalPath(inputPath: string): string {
  const decoded = decodeURIComponent(inputPath);
  const resolved = path.resolve(decoded);
  const projectRoot = path.resolve(process.cwd()) + path.sep;

  if (!resolved.startsWith(projectRoot)) {
    throw createError.pathTraversal(resolved);
  }
  return resolved;
}

export async function getBuffer(
  input: ServerInput,
  options: ServerOptions = {}
): Promise<Buffer> {
  const { signal, headers, credentials, mode } = options;
  signal?.throwIfAborted();

  // 1) Already a Buffer
  if (Buffer.isBuffer(input)) return input;

  // 2) ArrayBuffer or TypedArray
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return Buffer.from(input as ArrayBufferLike);
  }

  // 3) Blob/File
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    signal?.throwIfAborted();
    const arr = await input.arrayBuffer();
    return Buffer.from(arr);
  }

  // 4) Data URL
  const str = String(input);
  const dataMatch = /^data:([^;]+);base64,(.*)$/.exec(str);
  if (dataMatch) {
    return Buffer.from(dataMatch[2] || '', 'base64');
  }

  // 5) URL
  let url: URL | null = null;
  try {
    url = new URL(str);
  } catch {
    /* empty */
  }

  if (url) {
    signal?.throwIfAborted();
    switch (url.protocol) {
      case 'file:': {
        const filePath = sanitizeFilePath(url);
        try {
          return fs.readFile(filePath, { signal });
        } catch (e) {
          if (signal?.aborted) {
            throw createError.aborted();
          }
          throw createError.fileReadError(filePath, e);
        }
      }
      case 'http:':
      case 'https:': {
        signal?.throwIfAborted();
        const res = await fetch(url.toString(), { headers, signal, mode, credentials });
        if (!res.ok) {
          throw createError.fetchFailed(url.toString(), res.status, res.statusText);
        }
        const buf = await res.arrayBuffer();
        return Buffer.from(buf);
      }
      default:
        throw createError.invalidInput(
          '"file:", "http:", or "https:" URL',
          `Buffer, ArrayBuffer, Blob, File, or a valid URL`
        );
    }
  }

  // 6) Local filesystem path
  signal?.throwIfAborted();
  const local = resolveLocalPath(str);

  try {
    return fs.readFile(local, { signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw createError.aborted();
    }
    throw createError.fileReadError(local, error);
  }
}
