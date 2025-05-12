import { vi } from 'vitest';

export function mockBrowserEnvironment() {
  class MockHTMLVideoElement {
    currentSrc: string;

    constructor() {
      this.currentSrc = '';
    }
  }

  Object.defineProperty(MockHTMLVideoElement, Symbol.hasInstance, {
    value: (obj: unknown): obj is MockHTMLVideoElement =>
      obj !== null &&
      typeof obj === 'object' &&
      'currentSrc' in obj &&
      typeof (obj as { currentSrc: unknown }).currentSrc === 'string'
  });

  class MockHTMLCanvasElement {
    toDataURL() {
      return 'data:image/png;base64,...';
    }
  }

  Object.defineProperty(MockHTMLCanvasElement, Symbol.hasInstance, {
    value: (obj: unknown): obj is MockHTMLCanvasElement =>
      obj !== null &&
      typeof obj === 'object' &&
      'toDataURL' in obj &&
      typeof (obj as { toDataURL: unknown }).toDataURL === 'function'
  });

  class MockHTMLImageElement {
    src: string;

    constructor() {
      this.src = '';
    }
  }

  Object.defineProperty(MockHTMLImageElement, Symbol.hasInstance, {
    value: (obj: unknown): obj is MockHTMLImageElement =>
      obj !== null &&
      typeof obj === 'object' &&
      'src' in obj &&
      typeof (obj as { src: unknown }).src === 'string'
  });

  vi.stubGlobal('HTMLVideoElement', MockHTMLVideoElement);
  vi.stubGlobal('HTMLCanvasElement', MockHTMLCanvasElement);
  vi.stubGlobal('HTMLImageElement', MockHTMLImageElement);
}
