import type { PixelDecoder } from '@/types.ts';

let workerPromise: Promise<Worker> | null = null;

function createWorker(): Promise<Worker> {
  workerPromise ??= new Promise((resolve) => {
    const worker = new Worker(new URL('./worker-script.ts', import.meta.url), {
      type: 'module'
    });
    resolve(worker);
  });
  return workerPromise;
}

export const workerDecoder: PixelDecoder = {
  name: 'worker',
  priority: 100,
  metadata: {
    runtimes: ['browser'],
    description: 'Offloads decoding to Web Worker using canvas'
  },

  async canHandle(input) {
    return typeof Worker !== 'undefined' && !!input;
  },

  async decode(input, options) {
    const worker = await createWorker();
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const { result, error, id: eventId } = event.data;
        if (eventId !== id) return;
        worker.removeEventListener('message', handleMessage);
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ id, input, options });
    });
  }
};
