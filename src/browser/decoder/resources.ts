export class ResourceManager {
  private bitmaps: ImageBitmap[] = [];
  private streams: ReadableStream[] = [];

  trackBitmap(bitmap: ImageBitmap) {
    if (!this.bitmaps.includes(bitmap)) {
      this.bitmaps.push(bitmap);
    }
  }

  trackStream(stream: ReadableStream) {
    if (!this.streams.includes(stream)) {
      this.streams.push(stream);
    }
  }

  closeAll() {
    try {
      this.bitmaps.forEach((bitmap) => bitmap.close());
      this.streams.forEach((stream) => stream.cancel());
    } catch {
      /* Error */
    } finally {
      this.bitmaps = [];
      this.streams = [];
    }
  }
}
