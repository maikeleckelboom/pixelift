import { describe, expect, it } from 'vitest';
import { decode } from '../../../src/server/decoder';
import { createReadStream, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { generateTestImageBuffer } from '../../fixtures/utils/image-test-helpers';
import {
  createSlowReadableStream,
  createNeverEndingStream
} from '../../fixtures/utils/stream-test-helpers';
import { getFixtureAssetPath } from '../../fixtures/utils/shared-asset-helpers';

describe('Decoder - streaming input handling', () => {
  it('should decode real NodeJS file stream', async () => {
    const fileStream = createReadStream(getFixtureAssetPath('png')); // Using asset helper
    const decodedImage = await decode(fileStream);

    expect(decodedImage).toMatchObject({
      data: expect.any(Uint8ClampedArray),
      width: expect.any(Number),
      height: expect.any(Number)
    });
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });

  it('should decode Web ReadableStream input when Node.js stream is provided', async () => {
    const buffer = readFileSync(getFixtureAssetPath('png')); // Using asset helper

    const nodeStream = Readable.from(buffer);
    const decodedImage = await decode(nodeStream);

    expect(decodedImage.data.length).toBe(decodedImage.width * decodedImage.height * 4);
  }, 0);

  it('should handle slow streams with backpressure', async () => {
    const buffer = await generateTestImageBuffer();
    const slowStream = createSlowReadableStream(buffer);

    const decodedImage = await decode(slowStream);
    expect(decodedImage.data).toHaveLength(2 * 2 * 4); // Assuming default 2x2 image from helper
  }, 0);

  it('should abort processing mid-stream', async () => {
    const buffer = await generateTestImageBuffer();
    const neverEndingStreamInstance = createNeverEndingStream(buffer);

    const abortController = new AbortController();

    const decodePromise = decode(neverEndingStreamInstance, {
      signal: abortController.signal
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    abortController.abort();

    await expect(decodePromise).rejects.toThrow(
      'Operation aborted cause: Operation aborted'
    );

    expect(neverEndingStreamInstance.destroyed).toBe(true);
  });

  it('should decode Web ReadableStream input directly', async () => {
    const buffer = readFileSync(getFixtureAssetPath('png'));

    const webStream = Readable.toWeb(
      Readable.from(buffer)
    ) as unknown as ReadableStream<Uint8Array>;

    const decodedImage = await decode(webStream);
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });
}, 0);
