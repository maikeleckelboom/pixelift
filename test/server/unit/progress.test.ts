import { expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import type { PixelData } from '../../../src/types';
import type { ProgressCallback, ProgressInfo } from '../../../src/server/types';

const generateTestImageBuffer = async (size: number = 60): Promise<Buffer> => {
  return Buffer.alloc(size, 1);
};

interface MockDecodeOptions {
  expectedTotalSize?: number;
}

const decode = async (
  stream: Readable,
  options: MockDecodeOptions,
  onProgress?: ProgressCallback
): Promise<PixelData> => {
  const chunks: Buffer[] = [];
  const expectedTotalSize = options?.expectedTotalSize;

  return new Promise((resolve, reject) => {
    let loadedBytes = 0;

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      loadedBytes += chunk.length;
      if (onProgress) {
        const total = expectedTotalSize !== undefined ? expectedTotalSize : loadedBytes;
        let progress = 0;
        if (total > 0) {
          progress = loadedBytes / total;
        }
        progress = Math.min(progress, 1.0);

        onProgress({
          loaded: loadedBytes,
          total: total,
          progress: progress
        });
      }
    });

    stream.on('end', () => {
      const finalBuffer = Buffer.concat(chunks);
      if (onProgress) {
        onProgress({
          loaded: loadedBytes,
          total: loadedBytes,
          progress: 1.0
        });
      }
      resolve({
        data: new Uint8ClampedArray(
          finalBuffer.buffer,
          finalBuffer.byteOffset,
          finalBuffer.byteLength
        ),
        width: finalBuffer.length > 0 ? Math.floor(Math.sqrt(finalBuffer.length / 4)) : 0,
        height: finalBuffer.length > 0 ? Math.floor(Math.sqrt(finalBuffer.length / 4)) : 0
      });
    });
    stream.on('error', reject);
  });
};

it('should report progress accurately in multiple chunks', async () => {
  const CHUNK_SIZE = 15;
  const NUM_CHUNKS = 4;
  const TOTAL_BUFFER_SIZE = CHUNK_SIZE * NUM_CHUNKS;

  const originalBuffer = await generateTestImageBuffer(TOTAL_BUFFER_SIZE);
  const chunksArray: Buffer[] = [];
  for (let i = 0; i < NUM_CHUNKS; i++) {
    chunksArray.push(originalBuffer.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  const stream = Readable.from(chunksArray);
  const progressSpy = vi.fn();

  const decodedImage = await decode(
    stream,
    { expectedTotalSize: TOTAL_BUFFER_SIZE },
    progressSpy
  );

  expect(decodedImage.data.length).toBe(TOTAL_BUFFER_SIZE);
  expect(progressSpy).toHaveBeenCalled();

  const calls = progressSpy.mock.calls;
  expect(calls.length).toBe(NUM_CHUNKS + 1);

  let expectedLoadedBytes = 0;
  for (let i = 0; i < NUM_CHUNKS; i++) {
    const callArgs = calls[i]?.[0] as ProgressInfo;
    expectedLoadedBytes += CHUNK_SIZE;

    expect(callArgs.loaded).toBe(expectedLoadedBytes);
    expect(callArgs.total).toBe(TOTAL_BUFFER_SIZE);
    expect(callArgs.progress).toBeCloseTo(expectedLoadedBytes / TOTAL_BUFFER_SIZE);
    if (i < NUM_CHUNKS - 1) {
      expect(callArgs.progress).toBeLessThan(1.0);
    } else {
      expect(callArgs.progress).toBeCloseTo(1.0);
    }
  }

  const lastCallArgs = calls[NUM_CHUNKS]?.[0] as ProgressInfo;
  expect(lastCallArgs).toEqual(
    expect.objectContaining({
      loaded: TOTAL_BUFFER_SIZE,
      total: TOTAL_BUFFER_SIZE,
      progress: 1.0
    })
  );

  for (let i = 0; i < calls.length - 1; i++) {
    const currentCallLoaded = (calls[i]?.[0] as ProgressInfo).loaded;
    const nextCallLoaded = (calls[i + 1]?.[0] as ProgressInfo).loaded;
    expect(nextCallLoaded).toBeGreaterThanOrEqual(currentCallLoaded);
  }
});

it('should report progress consistently for a single buffer/chunk stream', async () => {
  const SINGLE_BUFFER_SIZE = 50;

  const singleBuffer = await generateTestImageBuffer(SINGLE_BUFFER_SIZE);
  const stream = Readable.from([singleBuffer]);
  const progressSpy = vi.fn();

  const decodedImage = await decode(
    stream,
    { expectedTotalSize: SINGLE_BUFFER_SIZE },
    progressSpy
  );

  expect(decodedImage.data.length).toBe(SINGLE_BUFFER_SIZE);
  expect(progressSpy).toHaveBeenCalled();
  const calls = progressSpy.mock.calls;

  expect(calls.length).toBe(1 + 1);

  const firstCallArgs = calls[0]?.[0] as ProgressInfo;
  expect(firstCallArgs).toEqual(
    expect.objectContaining({
      loaded: SINGLE_BUFFER_SIZE,
      total: SINGLE_BUFFER_SIZE,
      progress: 1.0
    })
  );

  const secondCallArgs = calls[1]?.[0] as ProgressInfo;
  expect(secondCallArgs).toEqual(
    expect.objectContaining({
      loaded: SINGLE_BUFFER_SIZE,
      total: SINGLE_BUFFER_SIZE,
      progress: 1.0
    })
  );
});
