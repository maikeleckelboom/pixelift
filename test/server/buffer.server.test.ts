import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getBuffer } from '../../src/server/buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../../test/assets');
const SAFE_IMAGE = path.join(FIXTURES_DIR, 'pixelift.png');

describe('Server Buffer Security', () => {
  describe('Valid Path Handling', () => {
    test('reads actual test image from valid path', async () => {
      const result = await getBuffer(SAFE_IMAGE);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Path Traversal Prevention', () => {
    // test/server/buffer.server.test.ts
    test('rejects encoded path traversal', async () => {
      const encodedTraversal = path.join(
        FIXTURES_DIR,
        '..%2F..%2F..%2F..%2Fetc%2Fpasswd' // ../../../../etc/passwd
      );

      await expect(() => getBuffer(encodedTraversal)).rejects.toThrow(
        /Path traversal attempt detected/
      );
    });

    test('rejects relative path traversal', async () => {
      const maliciousPath = path.join(
        FIXTURES_DIR,
        '../../../../etc/passwd' // Go up 4 levels from test/assets
      );

      await expect(() => getBuffer(maliciousPath)).rejects.toThrow(
        /Path traversal attempt detected/
      );
    });
  });

  describe('File Handling', () => {
    test('reads actual PNG file correctly', async () => {
      const buffer = await getBuffer(SAFE_IMAGE);
      // Verify PNG header signature
      expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    });
  });
});
