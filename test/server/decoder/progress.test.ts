import { describe, expect, it, vi } from 'vitest';
import { decode } from '../../../src/server/decoder';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { generateTestImageBuffer } from '../../fixtures/utils/image-test-helpers';
import { createSlowReadableStream } from '../../fixtures/utils/stream-test-helpers';
import { getFixtureAssetPath } from '../../fixtures/utils/asset-helpers';

describe('Decoder - progress tracking', () => {
  it('should track progress on buffer input', async () => {
    const buffer = readFileSync(getFixtureAssetPath('png'));
    const progressSpy = vi.fn();

    const decodedImage = await decode(buffer, {}, progressSpy);

    expect(decodedImage).toMatchObject({
      data: expect.any(Uint8ClampedArray),
      width: expect.any(Number),
      height: expect.any(Number)
    });

    expect(progressSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).toHaveBeenCalledWith({
      loaded: buffer.length,
      total: buffer.length,
      progress: 1.0
    });
  });

  it('should track progress on stream input', async () => {
    const buffer = await generateTestImageBuffer();
    const fileStream = Readable.from(buffer);
    const progressSpy = vi.fn();

    const decodedImage = await decode(fileStream, {}, progressSpy);

    expect(decodedImage.data).toHaveLength(2 * 2 * 4);
    expect(progressSpy).toHaveBeenCalled();

    const lastCallArgs = progressSpy.mock.calls[progressSpy.mock.calls.length - 1];
    const lastCallProgressInfo = lastCallArgs ? lastCallArgs[0] : {};
    expect(lastCallProgressInfo.loaded).toBe(buffer.length);
    expect(lastCallProgressInfo.total).toBe(buffer.length);
    expect(lastCallProgressInfo.progress).toBe(1.0);
  });

  it('should track progress on slow streams with backpressure', async () => {
    const buffer = await generateTestImageBuffer();
    const slowStream = createSlowReadableStream(buffer);

    const progressSpy = vi.fn();
    const decodedImage = await decode(slowStream, {}, progressSpy);

    expect(decodedImage.data).toHaveLength(2 * 2 * 4);
    expect(progressSpy).toHaveBeenCalled();

    expect(progressSpy.mock.calls).toContainEqual([
      expect.objectContaining({
        loaded: buffer.length,
        total: buffer.length,
        progress: 1.0
      })
    ]);
  });
});
