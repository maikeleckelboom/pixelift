import { describe, expect, test } from 'vitest';
import { getSourceData } from '../../../src/server/buffer';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import path from 'node:path';

async function convertResultToBuffer(
  result: Buffer | Readable | ReadableStream<Uint8Array>
): Promise<Buffer> {
  if (result instanceof Buffer) {
    return result;
  }

  if (result instanceof Readable) {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      result.on('data', (chunk: Buffer) => chunks.push(chunk));
      result.on('error', reject);
      result.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  if (typeof (result as ReadableStream<Uint8Array>).getReader === 'function') {
    const reader = (result as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  throw new Error(`Unsupported result type: ${typeof result}`);
}

describe('Buffer Security', () => {
  const SAFE_IMAGE_BUFFER = new URL('../../fixtures/assets/pixelift.png', import.meta.url);
  const fixturesDir = path.dirname(SAFE_IMAGE_BUFFER.pathname);

  describe('Valid Path Handling', () => {
    test('reads actual test image from valid path', async () => {
      const result = await getSourceData(SAFE_IMAGE_BUFFER);
      const buffer = await convertResultToBuffer(result);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('rejects encoded path traversal', async () => {
      const encodedTraversal = path.join(fixturesDir, '..%2F..%2F..%2F..%2Fetc%2Fpasswd');
      await expect(() => getSourceData(encodedTraversal)).rejects.toMatchObject({
        code: 'path-traversal'
      });
    });

    test('rejects relative path traversal', async () => {
      const maliciousPath = path.join(fixturesDir, '../../../../etc/passwd');
      await expect(() => getSourceData(maliciousPath)).rejects.toMatchObject({
        code: 'path-traversal'
      });
    });
  });

  describe('File Handling', () => {
    test('reads actual PNG file correctly', async () => {
      const result = await getSourceData(SAFE_IMAGE_BUFFER);
      const buffer = await convertResultToBuffer(result);
      expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    });
  });
});
