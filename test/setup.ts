import { vi, beforeAll } from 'vitest';

// If this beforeAll is genuinely needed for other global setup, keep it.
// If it was just an empty placeholder, it can be removed.
// For now, I'll leave it as it was in your original structure, but it's empty.
beforeAll(() => {
  // Global setup for tests, if any, can go here.
  // Currently empty.
});

// --- Mock for HTMLImageElement ---
class PatchedHTMLImageElement {
  src: string;
  width: number; // Common property
  height: number; // Common property
  complete: boolean; // Common property

  constructor() {
    this.src = '';
    this.width = 0;
    this.height = 0;
    this.complete = false; // Or true, depending on what your tests usually need
  }

  // This static property allows `instanceof PatchedHTMLImageElement` (and thus `instanceof HTMLImageElement` after stubbing)
  // to work correctly by defining custom logic for the `instanceof` operator.
  static [Symbol.hasInstance](instance: unknown): instance is PatchedHTMLImageElement {
    return (
      instance !== null &&
      typeof instance === 'object' &&
      'src' in instance && // Check for a distinguishing property
      typeof (instance as { src?: unknown }).src === 'string'
    );
  }
}
vi.stubGlobal('HTMLImageElement', PatchedHTMLImageElement);

// --- Mock for HTMLVideoElement ---
class PatchedHTMLVideoElement {
  src: string;
  currentSrc: string;
  width: number;
  height: number;
  readyState: number; // Common property (e.g., HTMLMediaElement.HAVE_NOTHING is 0)
  HAVE_CURRENT_DATA: number = 2; // Example constant value
  HAVE_ENOUGH_DATA: number = 4; // Example constant value

  constructor(src: string = '', currentSrc?: string) {
    this.src = src;
    this.currentSrc = currentSrc || src;
    this.width = 0;
    this.height = 0;
    this.readyState = 0;
  }

  static [Symbol.hasInstance](instance: unknown): instance is PatchedHTMLVideoElement {
    return (
      instance !== null &&
      typeof instance === 'object' &&
      'currentSrc' in instance && // Check for a distinguishing property
      typeof (instance as { currentSrc?: unknown }).currentSrc === 'string'
    );
  }
}
vi.stubGlobal('HTMLVideoElement', PatchedHTMLVideoElement);

// --- Mock for HTMLCanvasElement ---
class PatchedHTMLCanvasElement {
  width: number;
  height: number;

  constructor() {
    this.width = 0;
    this.height = 0;
  }

  toDataURL(type?: string, _quality?: number): string {
    if (type === 'image/jpeg') {
      return 'data:image/jpeg;base64,jpegmockdata';
    }
    return 'data:image/png;base64,pngmockdata';
  }

  getContext(contextId: string, _options?: number): CanvasRenderingContext2D | null {
    if (contextId === '2d') {
      // Return a mock 2D context. You can expand this with more mocked methods
      // and properties as needed by your tests.
      return {
        canvas: this, // Standard property: a reference back to the canvas
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(0),
          width: 0,
          height: 0
        })),
        fillRect: vi.fn(),
        clearRect: vi.fn()
        // Add other CanvasRenderingContext2D members your tests might use
        // e.g., fillStyle, strokeStyle, beginPath, moveTo, lineTo, stroke, fill, etc.
        // For complex mocks, consider creating a separate mock class for the context.
      } as unknown as CanvasRenderingContext2D; // Cast if providing a partial mock
    }
    return null;
  }

  static [Symbol.hasInstance](instance: unknown): instance is PatchedHTMLCanvasElement {
    return (
      instance !== null &&
      typeof instance === 'object' &&
      'toDataURL' in instance && // Check for distinguishing methods
      typeof (instance as { toDataURL?: unknown }).toDataURL === 'function' &&
      'getContext' in instance &&
      typeof (instance as { getContext?: unknown }).getContext === 'function'
    );
  }
}
vi.stubGlobal('HTMLCanvasElement', PatchedHTMLCanvasElement);

// The file can end here. No need to export the classes unless you intend to
// import them elsewhere for type checking or direct instantiation in tests
// (which is less common when they are globally stubbed).
