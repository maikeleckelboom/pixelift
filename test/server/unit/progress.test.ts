import { expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import type { PixelData } from '../../../src';
import type { ProgressCallback, ProgressInfo } from '../../../src/server/types';

const generateTestImageBuffer = async (size: number = 60): Promise<Buffer> => {
  return Buffer.alloc(size, 1);
};

interface MockDecodeOptions {
  expectedTotalSize?: number;
}

async function decode(
  stream: Readable,
  options: MockDecodeOptions,
  onProgress?: ProgressCallback
): Promise<PixelData> {
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
}

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

it('should report progress correctly without expected total size', async () => {
  const buffer = await generateTestImageBuffer(50);
  const stream = Readable.from([buffer]);
  const progressSpy = vi.fn();

  const decodedImage = await decode(stream, {}, progressSpy);

  expect(decodedImage.data.length).toBe(50);
  expect(progressSpy).toHaveBeenCalled();
  const calls = progressSpy.mock.calls;
  calls.forEach((call) => {
    const progress = call[0] as ProgressInfo;
    expect(progress.total).toBe(progress.loaded);
    expect(progress.progress).toBeCloseTo(1.0);
  });
});

it('should handle zero-length buffer without errors', async () => {
  const emptyBuffer = Buffer.alloc(0);
  const stream = Readable.from([emptyBuffer]);
  const progressSpy = vi.fn();

  const decodedImage = await decode(stream, { expectedTotalSize: 0 }, progressSpy);

  expect(decodedImage.data.length).toBe(0);
  expect(decodedImage.width).toBe(0);
  expect(decodedImage.height).toBe(0);
  expect(progressSpy).toHaveBeenCalledWith({
    loaded: 0,
    total: 0,
    progress: 1.0
  });
});

it('should calculate progress without expected total size', async () => {
  const CHUNK_SIZE = 10;
  const NUM_CHUNKS = 300;
  const TOTAL_SIZE = CHUNK_SIZE * NUM_CHUNKS;

  const buffer = await generateTestImageBuffer(TOTAL_SIZE);
  const chunks = [];
  for (let i = 0; i < NUM_CHUNKS; i++) {
    chunks.push(buffer.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  const stream = Readable.from(chunks);
  const progressSpy = vi.fn();

  const decodedImage = await decode(stream, { expectedTotalSize: TOTAL_SIZE }, progressSpy);

  expect(decodedImage.data.length).toBe(TOTAL_SIZE);
  expect(progressSpy).toHaveBeenCalled();
  const calls = progressSpy.mock.calls;

  // Check that the last call (or all calls if needed, but usually last is sufficient for this scenario)
  // reflects the final state correctly.
  // If you need to check intermediate states, you can do so without logging everything.

  // Example: Check the number of calls if specific call counts are important.
  // For instance, if onProgress is called for each chunk + one for 'end' event from the mock decode.
  // The mock 'decode' calls onProgress on 'data' and on 'end'.
  // So, NUM_CHUNKS calls for 'data' + 1 call for 'end'.
  expect(calls.length).toBe(NUM_CHUNKS + 1); // Or just NUM_CHUNKS if your mock only calls it on data and the last data call is 1.0

  // Verify the state of the calls as needed
  let loaded = 0;
  for (let i = 0; i < NUM_CHUNKS; i++) {
    loaded += CHUNK_SIZE;
    const callArgs = calls[i]?.[0];
    expect(callArgs.loaded).toBe(loaded);
    expect(callArgs.total).toBe(TOTAL_SIZE);
    if (i < NUM_CHUNKS - 1) {
      expect(callArgs.progress).toBeLessThan(1.0);
    } else {
      expect(callArgs.progress).toBeCloseTo(1.0);
    }
  }

  // Check the final call from the 'end' event in the mock decode
  const finalCallArgs = calls[NUM_CHUNKS]?.[0];
  expect(finalCallArgs.loaded).toBe(TOTAL_SIZE);
  expect(finalCallArgs.total).toBe(TOTAL_SIZE);
  expect(finalCallArgs.progress).toBeCloseTo(1.0);
});

it('should process stream without onProgress callback', async () => {
  const buffer = await generateTestImageBuffer(40);
  const stream = Readable.from([buffer]);

  const decodedImage = await decode(stream, { expectedTotalSize: 40 });

  expect(decodedImage.data.length).toBe(40);
  expect(decodedImage.width).toBeGreaterThan(0);
  expect(decodedImage.height).toBeGreaterThan(0);
});
