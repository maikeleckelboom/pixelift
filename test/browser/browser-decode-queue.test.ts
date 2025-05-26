import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDecodeQueue } from '@/browser/decoders/browser-decode-queue.ts';

// Types needed for tests
type Task<T> = (signal: AbortSignal) => Promise<T>;
type DecodeResult<T> =
  | { status: 'resolved'; value: T }
  | { status: 'rejected'; error: unknown };

// Helper function to simulate decode work with configurable timing and result
function createDecodeFunction<T>(result: T, delay: number = 100) {
  return async function decode(signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException('AbortError', 'AbortError'));

      const timeout = setTimeout(() => resolve(result), delay);

      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('AbortError', 'AbortError'));
      });
    });
  };
}

// Helper function to safely resolve or reject a promise
async function safeAwait<T>(promise: Promise<T>): Promise<DecodeResult<T>> {
  try {
    const value = await promise;
    return { status: 'resolved', value };
  } catch (error) {
    return { status: 'rejected', error };
  }
}

describe('BrowserDecodeQueue', () => {
  // Store tasks to clean up after each test
  const pendingTasks: Promise<unknown>[] = [];
  const abortControllers: AbortController[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    pendingTasks.length = 0;
    abortControllers.length = 0;
  });

  afterEach(async () => {
    // Abort any controllers that might still be active
    abortControllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });

    // Make sure all timers are cleared
    vi.runAllTimers();

    // Wait for any pending tasks to resolve or reject
    await Promise.allSettled(pendingTasks);

    vi.restoreAllMocks();
  });

  // Helper to track tasks for cleanup
  function trackTask<T>(promise: Promise<T>): Promise<T> {
    pendingTasks.push(promise);
    return promise;
  }

  function createController(): AbortController {
    const controller = new AbortController();
    abortControllers.push(controller);
    return controller;
  }

  it('should process an enqueued job successfully', async () => {
    const queue = new BrowserDecodeQueue<string>(3);
    const controller = createController();
    const decodeImage = createDecodeFunction('decodedData');

    const resultPromise = trackTask(queue.enqueue(decodeImage, controller.signal, 2000));
    await vi.runAllTimersAsync();

    const result = await resultPromise;
    expect(result).toBe('decodedData');
  });

  it('should handle multiple jobs in sequence', async () => {
    const queue = new BrowserDecodeQueue<string>(1); // Concurrency of 1
    const controller = createController();

    const decodeImage1 = createDecodeFunction('result1', 100);
    const decodeImage2 = createDecodeFunction('result2', 100);
    const decodeImage3 = createDecodeFunction('result3', 100);

    const promise1 = trackTask(queue.enqueue(decodeImage1, controller.signal, 2000));
    const promise2 = trackTask(queue.enqueue(decodeImage2, controller.signal, 2000));
    const promise3 = trackTask(queue.enqueue(decodeImage3, controller.signal, 2000));

    await vi.runAllTimersAsync();

    const results = await Promise.all([promise1, promise2, promise3]);
    expect(results).toEqual(['result1', 'result2', 'result3']);
  });

  it('should process jobs in parallel up to concurrency limit', async () => {
    const queue = new BrowserDecodeQueue<number>(2); // Concurrency of 2
    const controller = createController();

    // Create spy functions to track execution
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();

    const decode1: Task<number> = async (signal) => {
      spy1();
      return createDecodeFunction(1, 200)(signal);
    };

    const decode2: Task<number> = async (signal) => {
      spy2();
      return createDecodeFunction(2, 200)(signal);
    };

    const decode3: Task<number> = async (signal) => {
      spy3();
      return createDecodeFunction(3, 200)(signal);
    };

    // Enqueue all jobs
    const promise1 = trackTask(queue.enqueue(decode1, controller.signal, 2000));
    const promise2 = trackTask(queue.enqueue(decode2, controller.signal, 2000));
    const promise3 = trackTask(queue.enqueue(decode3, controller.signal, 2000));

    // First two jobs should start immediately
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(0); // Third job should wait

    // Advance time to complete first two jobs
    await vi.advanceTimersByTimeAsync(200);

    // Now the third job should have started
    expect(spy3).toHaveBeenCalledTimes(1);

    // Complete all remaining tasks
    await vi.runAllTimersAsync();

    const results = await Promise.all([promise1, promise2, promise3]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should respect the abort signal and cancel processing', async () => {
    const queue = new BrowserDecodeQueue<string>(3);
    const controller = createController();
    const decodeImage = createDecodeFunction('decodedData', 500);

    const resultPromise = queue.enqueue(decodeImage, controller.signal, 2000);
    const resultHandler = trackTask(safeAwait(resultPromise));

    // Advance time but not enough to complete the job
    await vi.advanceTimersByTimeAsync(100);

    // Abort the operation
    controller.abort();

    // Run any remaining timers
    await vi.runAllTimersAsync();

    // Check that the promise rejects with an AbortError
    const result = await resultHandler;
    expect(result.status).toBe('rejected');

    if (result.status === 'rejected') {
      const error = result.error;
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('AbortError');
    }
  });

  it('should handle timeout and reject the promise', async () => {
    const queue = new BrowserDecodeQueue<string>(3);
    const controller = createController();
    // Create a decode function that takes longer than the timeout
    const decodeImage = createDecodeFunction('decodedData', 3000);

    const resultPromise = queue.enqueue(decodeImage, controller.signal, 1000); // 1 second timeout
    const resultHandler = trackTask(safeAwait(resultPromise));

    // Advance time to trigger timeout but not complete the job
    await vi.advanceTimersByTimeAsync(1100);

    // Run any remaining timers
    await vi.runAllTimersAsync();

    // Check that the promise rejects with a timeout error
    const result = await resultHandler;
    expect(result.status).toBe('rejected');

    if (result.status === 'rejected') {
      const error = result.error;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/timeout/i);
    }
  });

  it('should handle rejected decode functions', async () => {
    const queue = new BrowserDecodeQueue<string>(3);
    const controller = createController();

    const failingDecode: Task<string> = async (signal) => {
      return new Promise((_, reject) => {
        if (signal.aborted) return reject(new DOMException('AbortError', 'AbortError'));
        setTimeout(() => reject(new Error('Decode failed')), 100);
      });
    };

    const resultPromise = queue.enqueue(failingDecode, controller.signal, 2000);
    const resultHandler = trackTask(safeAwait(resultPromise));

    await vi.runAllTimersAsync();

    const result = await resultHandler;
    expect(result.status).toBe('rejected');

    if (result.status === 'rejected') {
      const error = result.error;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Decode failed');
    }
  });

  it('should handle multiple aborted jobs correctly', async () => {
    const queue = new BrowserDecodeQueue<string>(1); // Serial processing
    const controller1 = createController();
    const controller2 = createController();
    const controller3 = createController();

    const decodeImage = createDecodeFunction('decodedData', 200);

    const promise1 = trackTask(queue.enqueue(decodeImage, controller1.signal, 2000));
    const promise2 = queue.enqueue(decodeImage, controller2.signal, 2000);
    const promise2Handler = trackTask(safeAwait(promise2));
    const promise3 = trackTask(queue.enqueue(decodeImage, controller3.signal, 2000));

    // Abort the second job before it starts processing
    controller2.abort();

    // Let the first job complete
    await vi.advanceTimersByTimeAsync(200);

    // The first result should resolve
    const result1 = await promise1;
    expect(result1).toBe('decodedData');

    // The second should reject with AbortError
    const result2 = await promise2Handler;
    expect(result2.status).toBe('rejected');

    if (result2.status === 'rejected') {
      const error = result2.error;
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('AbortError');
    }

    // Complete the third job
    await vi.advanceTimersByTimeAsync(200);
    const result3 = await promise3;
    expect(result3).toBe('decodedData');
  });
});
