type DecodeJob = {
  blob: Blob;
  resolve: (result: ImageBitmap) => void;
  reject: (error: Error) => void;
};

export class BrowserDecodeQueue {
  private queue: DecodeJob[] = [];
  private active = 0;

  constructor(private readonly maxConcurrent = 2) {}

  enqueue(blob: Blob): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      this.queue.push({ blob, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.active++;

      this.decode(job.blob)
        .then(job.resolve)
        .catch(job.reject)
        .finally(() => {
          this.active--;
          this.processQueue();
        });
    }
  }

  private async decode(blob: Blob): Promise<ImageBitmap> {
    const mime = blob.type.startsWith('image/') ? blob.type : 'image/png';
    const decoder = new ImageDecoder({
      data: blob.stream(),
      type: mime
    });

    await decoder.tracks.ready;

    const { image: frame } = await decoder.decode({ frameIndex: 0 });

    try {
      const bitmap = await createImageBitmap(frame, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none'
      });
      return bitmap;
    } finally {
      frame.close(); // Important: prevent memory leaks
    }
  }
}
