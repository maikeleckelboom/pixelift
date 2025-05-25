import { isImageBitmapSource } from '@/shared/guards.ts';
import { defineDecoder } from '@/plugin/registry.ts';
import type { PixelData } from '@/types.ts';

export type PendingRequest = {
  resolve: (value: PixelData) => void;
  reject: (reason?: any) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

export const DECODE_TIMEOUT_MS = 30_000;
const WORKER_SCRIPT_PATH = new URL('./worker-script.ts', import.meta.url).href;

let worker: Worker | null = null;
const pendingRequests = new Map<number, PendingRequest>();
let nextRequestId = 0;

function getWorker() {
  if (!worker) {
    worker = new Worker(WORKER_SCRIPT_PATH, { type: 'module' });
    worker.onmessage = (event: MessageEvent) => {
      const { id, result, error } = event.data;
      const request = pendingRequests.get(id);
      if (!request) return;
      clearTimeout(request.timeoutId);
      pendingRequests.delete(id);
      if (error) request.reject(new Error(error));
      else request.resolve(result);
    };
    worker.onerror = (event) => {
      console.error('Worker error:', event.message);
    };
  }
  return worker;
}

export const offscreenCanvasWorkerDecoder = defineDecoder<ImageBitmapSource>({
  name: 'offscreen-canvas-worker',
  priority: 20,
  metadata: {
    version: '1.0.0',
    supportedEnvs: ['browser', 'web-worker'],
    description: 'Decode ImageBitmapSource in a dedicated worker with OffscreenCanvas'
  },

  async canHandle(input) {
    return isImageBitmapSource(input);
  },

  async decode(source) {
    const worker = getWorker();
    const id = nextRequestId++;

    return new Promise<PixelData>((resolve, reject) => {
      const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Worker decode timed out'));
      }, DECODE_TIMEOUT_MS);

      pendingRequests.set(id, { resolve, reject, timeoutId });

      try {
        const transferables = source instanceof ImageBitmap ? [source] : [];

        worker.postMessage({ id, input: source }, transferables);
      } catch (postErr) {
        clearTimeout(timeoutId);
        pendingRequests.delete(id);
        reject(
          new Error(`Failed to post message to worker: ${(postErr as Error).message}`)
        );
      }
    });
  }
});
