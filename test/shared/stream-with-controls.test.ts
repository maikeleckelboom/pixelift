import { streamWithControls } from '@/shared/stream-with-controls.ts';
import { AbortError } from '@/shared/errors.ts';

async function collectChunks(stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  return reader.read().then(async function process({ done, value }): Promise<Uint8Array[]> {
    if (done) return chunks;
    if (value) chunks.push(value);
    return process(await reader.read());
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('streamWithControls', () => {
  it('chunks correctly and enforces maxBytes', async () => {
    const chunks: Uint8Array[] = [];
    const inputData = new Uint8Array(40 * 1024).map((_, i) => i % 256);

    const controller = new AbortController();

    const transformer = streamWithControls({
      maxBytes: 32 * 1024,
      chunkSize: 16 * 1024,
      signal: controller.signal,
      onProgress: (bytes) => {
        expect(bytes).toBeLessThanOrEqual(32 * 1024);
      }
    });

    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(inputData);
        ctrl.close();
      }
    });

    const controlledStream = readable.pipeThrough(transformer);
    const reader = controlledStream.getReader();

    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalBytes += value.byteLength;
      }
      expect.fail('Should throw due to maxBytes exceeded');
    } catch (e) {
      expect(e).toBeInstanceOf(RangeError);
      expect((e as RangeError).message).toContain('maxBytes');
    }

    expect(totalBytes).toBeLessThanOrEqual(32 * 1024);
    expect(chunks.length).toBe(2);
    expect(chunks[0]!.byteLength).toBe(16 * 1024);
  });

  it('chunks correctly, enforces maxBytes, and emits progress', async () => {
    const inputData = new Uint8Array(40 * 1024).map((_, i) => i % 256);
    const progress: number[] = [];

    const transformer = streamWithControls({
      maxBytes: 32768,
      chunkSize: 16384,
      onProgress: (bytes) => progress.push(bytes)
    });

    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(inputData);
        ctrl.close();
      }
    });

    const controlled = readable.pipeThrough(transformer);
    let threw = false;
    try {
      await collectChunks(controlled);
    } catch (e) {
      expect(e).toBeInstanceOf(RangeError);
      expect((e as RangeError).message).toContain('maxBytes');
      threw = true;
    }
    expect(threw).toBe(true);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.at(-1)).toBeLessThanOrEqual(32768);
  });

  it('honors AbortSignal', async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(new Uint8Array(1024));
        ctrl.close();
      }
    });

    const transformer = streamWithControls({
      signal,
      chunkSize: 512
    });

    const stream = readable.pipeThrough(transformer);
    const reader = stream.getReader();

    controller.abort();

    let threw = false;
    try {
      await reader.read();
    } catch (e) {
      expect(e).toBeInstanceOf(AbortError);
      expect((e as AbortError).name).toBe('AbortError');
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('handles empty input gracefully', async () => {
    const empty = new ReadableStream<Uint8Array>({ start: (ctrl) => ctrl.close() });
    const transformer = streamWithControls({ chunkSize: 1024 });
    const chunks = await collectChunks(empty.pipeThrough(transformer));
    expect(chunks).toEqual([]);
  });

  it('aborts mid-stream', async () => {
    const controller = new AbortController();
    let sentChunks = 0;

    const slowStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        await delay(5);
        if (sentChunks++ < 10) {
          controller.enqueue(new Uint8Array(1024));
        } else {
          controller.close();
        }
      }
    });

    const transformed = slowStream.pipeThrough(
      streamWithControls({ signal: controller.signal, chunkSize: 512 })
    );

    const reader = transformed.getReader();
    let threw = false;

    const readLoop = async () => {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
      }
    };

    const reading = readLoop();

    setTimeout(() => controller.abort(), 20);

    try {
      await reading;
    } catch (e) {
      threw = e instanceof AbortError;
    }

    expect(threw).toBe(true);
  });
});
