import { promises as fs } from 'node:fs';
import { Buffer } from 'node:buffer';
import { isNode } from '../../core/env.ts';
import { NetworkError, PixeliftError } from '../../core';
import type { SharpInput } from 'sharp';

/**
 * Determines if the input string is a valid URL.
 * @param input - The string to validate.
 * @returns True if valid URL, false otherwise.
 */
const isURL = (input: string): boolean => {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
};

/**
 * Retrieves a Buffer from a string, Buffer, or SharpInput.
 * @param input - The input which may be a Buffer, a file path, or a URL.
 * @returns A Promise that resolves to a Buffer.
 * @throws PixeliftError or NetworkError on failure.
 */
export async function getBuffer(input: string | Buffer | SharpInput): Promise<Buffer> {
  if (Buffer.isBuffer(input)) {
    if (input.length === 0) {
      throw new PixeliftError('Empty buffer provided');
    }
    return input;
  }

  if (typeof input === 'string') {
    return isURL(input) ? handleRemoteResource(input) : handleLocalFile(input);
  }

  throw new PixeliftError(`Unsupported input type: ${typeof input}`);
}

/**
 * Fetches a resource from a URL and returns its Buffer.
 * @param url - The URL to fetch.
 * @returns A Promise that resolves to a Buffer.
 * @throws NetworkError on network failures.
 */
async function handleRemoteResource(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
    });

    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}`, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    // Allow already-wrapped errors to propagate.
    if (error instanceof PixeliftError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timed out', { status: 408 });
    }
    if (error instanceof NetworkError) throw error;
    throw new NetworkError('Network request failed', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Reads a local file from the file system and returns its Buffer.
 * @param path - The local file path.
 * @returns A Promise that resolves to a Buffer.
 * @throws PixeliftError if file access fails.
 */
async function handleLocalFile(path: string): Promise<Buffer> {
  if (!isNode()) {
    throw new PixeliftError('File system access unavailable in browser');
  }

  try {
    await fs.access(path, fs.constants.R_OK);
    return fs.readFile(path);
  } catch (error: any) {
    if (error instanceof PixeliftError) throw error;
    if (error?.code) {
      if (error.code === 'ENOENT') {
        throw new PixeliftError(`File not found: ${path}`, { cause: error });
      }
      if (error.code === 'EACCES') {
        throw new PixeliftError(`Permission denied: ${path}`, { cause: error });
      }
    }
    throw new PixeliftError(`Failed to read file: ${path}`, { cause: error });
  }
}
