import { vi } from 'vitest';

export function mockMediaElements() {
  class MockHTMLImageElement {
    src: string;

    constructor() {
      this.src = '';
    }
  }

  vi.stubGlobal('HTMLImageElement', MockHTMLImageElement);

  Object.defineProperty(MockHTMLImageElement, Symbol.hasInstance, {
    value: (obj: unknown): obj is MockHTMLImageElement =>
      obj !== null &&
      typeof obj === 'object' &&
      'src' in obj &&
      typeof (obj as { src: unknown }).src === 'string'
  });

  class MockHTMLVideoElement {
    currentSrc: string;
    src: string;

    constructor(src: string = '', currentSrc?: string) {
      this.src = src;
      this.currentSrc = currentSrc || src;
    }
  }
  Object.defineProperty(MockHTMLVideoElement, Symbol.hasInstance, {
    value: (obj: unknown): obj is MockHTMLVideoElement =>
      obj !== null &&
      typeof obj === 'object' &&
      'currentSrc' in obj &&
      typeof (obj as { currentSrc: unknown }).currentSrc === 'string'
  });
  vi.stubGlobal('HTMLVideoElement', MockHTMLVideoElement);
}
