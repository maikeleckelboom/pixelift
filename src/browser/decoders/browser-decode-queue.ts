import { AbortError } from '@/shared/errors.ts';

type Task<T> = (signal: AbortSignal) => Promise<T>;

interface EnqueuedTask<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason?: AbortError) => void;
  signal: AbortSignal;
  timeoutMs?: number;
}

export class BrowserDecodeQueue<T> {
  private readonly concurrency: number;
  private running = 0;
  private queue: EnqueuedTask<T>[] = [];

  constructor(concurrency: number) {
    if (concurrency < 1) throw new Error('Concurrency must be >= 1');
    this.concurrency = concurrency;
  }

  enqueue(task: Task<T>, signal?: AbortSignal, timeoutMs?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const abortSignal = signal ?? new AbortController().signal;
      this.queue.push({
        task,
        resolve,
        reject,
        signal: abortSignal,
        timeoutMs
      } as EnqueuedTask<T>);
      this.dequeue();
    });
  }

  private dequeue() {
    if (this.running >= this.concurrency) return;
    const next = this.queue.shift();
    if (!next) return;

    const { task, resolve, reject, signal, timeoutMs } = next;

    if (signal.aborted) {
      reject(new DOMException('AbortError', 'AbortError'));
      this.dequeue();
      return;
    }

    this.running++;

    const taskPromise =
      timeoutMs !== undefined ? this.runWithTimeout(task, signal, timeoutMs) : task(signal);

    taskPromise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.dequeue();
      });
  }

  private runWithTimeout(
    task: Task<T>,
    signal: AbortSignal,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`timeout: Task timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      task(signal)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);

          // Ensure AbortError is correctly propagated
          if (err instanceof DOMException && err.name === 'AbortError') {
            reject(new DOMException('AbortError', 'AbortError'));
          } else {
            reject(err);
          }
        });
    });
  }
}
