import { vi } from 'vitest';

vi.stubGlobal(
  'HTMLImageElement',
  class HTMLImageElement {
    src = '';
    width = 0;
    height = 0;
    complete = false;
  }
);

vi.stubGlobal(
  'HTMLVideoElement',
  class HTMLVideoElement {
    src = '';
    currentSrc = '';
    width = 0;
    height = 0;
    readyState = 0;
    HAVE_CURRENT_DATA = 2;
    HAVE_ENOUGH_DATA = 4;
  }
);

vi.stubGlobal(
  'HTMLCanvasElement',
  class HTMLCanvasElement {
    width = 0;
    height = 0;

    toDataURL(type?: string) {
      return type === 'image/jpeg'
        ? 'data:image/jpeg;base64,jpegmockdata'
        : 'data:image/png;base64,pngmockdata';
    }

    getContext(contextId: string) {
      if (contextId === '2d') {
        return {
          canvas: this,
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(0),
            width: 0,
            height: 0
          })),
          fillRect: vi.fn(),
          clearRect: vi.fn()
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    }
  }
);
