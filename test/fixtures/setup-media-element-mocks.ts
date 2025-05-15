import { vi } from 'vitest';

export function setupMediaElementMocks() {
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
  vi.stubGlobal('HTMLVideoElement', MockHTMLVideoElement);
}
