import path from 'node:path';
import fs from 'node:fs/promises';
import type { ServerInput, ServerOptions } from './types';
import { createError } from '../shared/error';
import { fileURLToPath } from 'node:url';
import { isAbortError } from '../shared/guards';
import fsSync from 'node:fs';
import { Readable } from 'node:stream';

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

export async function getSourceData(
  input: ServerInput,
  options: ServerOptions = {}
): Promise<Readable | ReadableStream<Uint8Array> | Buffer> {
  // This is a Web API ReadableStream from fetch or passed in
  if (typeof ReadableStream !== 'undefined' && input instanceof ReadableStream) {
    return input;
  }

  // Add handling for Node.js Readable streams
  if (input instanceof Readable) {
    return input;
  }

  const { signal, headers, credentials, mode } = options; // `mode` is from CommonDecoderOptions
  signal?.throwIfAborted();

  // 2. Already a Buffer
  if (Buffer.isBuffer(input)) return input;

  // 3. ArrayBuffer or TypedArray
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return Buffer.from(input as ArrayBufferLike);
  }

  // 4. Blob/File (Note: Blob.stream() could also return a ReadableStream)
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return input.stream(); // Web ReadableStream
  }

  // 5. Data URL
  const str = String(input);
  const dataMatch = /^data:([^;]+);base64,(.*)$/.exec(str);
  if (dataMatch) {
    return Buffer.from(dataMatch[2] || '', 'base64');
  }

  // 6. URL (file:, http:, https:)
  let url: URL | null = null;
  try {
    url = new URL(str);
  } catch {
    /* Will be treated as a local path if not a valid URL structure */
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
        if (!res.body) {
          throw createError.runtimeError(`Response from ${url.toString()} has no body.`);
        }
        return res.body;
      }
      default:
        throw createError.invalidInput(
          'URL protocol must be "file:", "http:", or "https:"',
          `Received protocol: ${url.protocol}`
        );
    }
  }

  // 7. Local filesystem path
  signal?.throwIfAborted();
  const local = resolveLocalPath(str);
  try {
    return fsSync.createReadStream(local, { signal });
    // return fs.readFile(local, { signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw createError.aborted();
    }
    throw createError.fileReadError(local, error);
  }
}
