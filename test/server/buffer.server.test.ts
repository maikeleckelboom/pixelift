import { describe, expect, test } from 'vitest';
import { getBuffer } from '../../src/server/buffer';
import { assetsDir, loadAsset, path } from '../fixtures/server-utils';

describe('Server Buffer Security', () => {
  const SAFE_IMAGE_BUFFER = loadAsset('pixelift.png');

  describe('Valid Path Handling', () => {
    test('reads actual test image from valid path', async () => {
      const result = await getBuffer(SAFE_IMAGE_BUFFER);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('rejects encoded path traversal', async () => {
      const encodedTraversal = path.join(assetsDir, '..%2F..%2F..%2F..%2Fetc%2Fpasswd');

      await expect(() => getBuffer(encodedTraversal)).rejects.toMatchObject({
        code: 'path-traversal'
      });
    });

    test('rejects relative path traversal', async () => {
      const maliciousPath = path.join(assetsDir, '../../../../etc/passwd');

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
