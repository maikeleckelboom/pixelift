import { describe, expect, test } from 'vitest';
import { getBuffer } from '../../../src/server/buffer';
import path from 'node:path';

describe('Server Buffer Security', () => {
  const SAFE_IMAGE_BUFFER = new URL('../../__fixtures__/pixelift.png', import.meta.url);
  const fixturesDir = path.dirname(SAFE_IMAGE_BUFFER.pathname);

  describe('Valid Path Handling', () => {
    test('reads actual test image from valid path', async () => {
      const result = await getBuffer(SAFE_IMAGE_BUFFER);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('rejects encoded path traversal', async () => {
      const encodedTraversal = path.join(fixturesDir, '..%2F..%2F..%2F..%2Fetc%2Fpasswd');

      await expect(() => getBuffer(encodedTraversal)).rejects.toMatchObject({
        code: 'path-traversal'
      });
    });

    test('rejects relative path traversal', async () => {
      const maliciousPath = path.join(fixturesDir, '../../../../etc/passwd');

      await expect(() => getBuffer(maliciousPath)).rejects.toMatchObject({
        code: 'path-traversal'
      });
    });
  });

  describe('File Handling', () => {
    test('reads actual PNG file correctly', async () => {
      const buffer = await getBuffer(SAFE_IMAGE_BUFFER);
      expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    });
  });
});
