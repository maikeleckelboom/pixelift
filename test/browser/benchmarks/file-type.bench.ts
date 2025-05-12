import { beforeAll, bench, describe } from 'vitest';
import { getFileType } from '../../../src/shared/file-type';
import { setupBrowserEnvironment } from '../../fixtures/setup-browser-environment';

describe('File Type Inference Benchmarks', () => {
  beforeAll(() => {
    setupBrowserEnvironment();
  });

  describe('String and URL inputs', () => {
    const simpleUrl = 'https://example.com/image.jpg';
    const urlWithQuery = 'https://cdn.site.com/images/large/photo.png?version=2&cache=true';
    const urlObject = new URL('https://example.com/video.mp4');

    bench(
      'Simple string URL',
      () => {
        getFileType(simpleUrl);
      },
      { iterations: 10 }
    );

    bench(
      'URL with query parameters',
      () => {
        getFileType(urlWithQuery);
      },
      { iterations: 10 }
    );

    bench(
      'URL object',
      () => {
        getFileType(urlObject);
      },
      { iterations: 10 }
    );
  });

  describe('Data URIs', () => {
    const pngDataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const textDataUri = 'data:text/plain;charset=utf-8,Hello%20World!';

    bench(
      'PNG data URI',
      () => {
        getFileType(pngDataUri);
      },
      { iterations: 10 }
    );

    bench(
      'Text data URI',
      () => {
        getFileType(textDataUri);
      },
      { iterations: 10 }
    );
  });

  describe('Blob inputs', () => {
    const pngBlob = new Blob(['<png-content>'], { type: 'image/png' });
    const textBlob = new Blob(['text content'], { type: 'text/plain' });
    const emptyBlob = new Blob([]);

    bench(
      'Blob with image/png type',
      () => {
        getFileType(pngBlob);
      },
      { iterations: 10 }
    );

    bench(
      'Blob with text/plain type',
      () => {
        getFileType(textBlob);
      },
      { iterations: 10 }
    );

    bench(
      'Empty Blob (no type)',
      () => {
        getFileType(emptyBlob);
      },
      { iterations: 10 }
    );
  });

  describe('HTML Elements', () => {
    const createElements = () => {
      let videoElement: HTMLVideoElement;
      let imageElement: HTMLImageElement;
      let canvasElement: HTMLCanvasElement;
      if (typeof document !== 'undefined') {
        videoElement = document.createElement('video');
        videoElement.src = 'https://videos.test/sample.webm';
        imageElement = document.createElement('img');
        imageElement.src = 'https://images.test/sample.avif';
        canvasElement = document.createElement('canvas');
      } else {
        videoElement = new globalThis.HTMLVideoElement();
        imageElement = new globalThis.HTMLImageElement();
        imageElement.src = 'https://images.test/sample.avif';
        canvasElement = new globalThis.HTMLCanvasElement();
      }
      return { videoElement, imageElement, canvasElement };
    };
    const { videoElement, imageElement, canvasElement } = createElements();

    bench(
      'HTMLVideoElement',
      () => {
        getFileType(videoElement);
      },
      { iterations: 10 }
    );

    bench(
      'HTMLImageElement',
      () => {
        getFileType(imageElement);
      },
      { iterations: 10 }
    );

    bench(
      'HTMLCanvasElement',
      () => {
        getFileType(canvasElement);
      },
      { iterations: 10 }
    );
  });

  describe('Type option override', () => {
    const imageUrl = 'https://example.com/image.jpg';

    bench(
      'With type option',
      () => {
        getFileType(imageUrl, { type: 'application/x-custom' });
      },
      { iterations: 10 }
    );

    bench(
      'Without type option (baseline)',
      () => {
        getFileType(imageUrl);
      },
      { iterations: 10 }
    );
  });

  describe('Edge cases', () => {
    bench(
      'Empty string',
      () => {
        getFileType('');
      },
      { iterations: 10 }
    );

    bench(
      'Object fallback',
      () => {
        getFileType({} as never);
      },
      { iterations: 10 }
    );

    bench(
      'No extension',
      () => {
        getFileType('filename-without-extension');
      },
      { iterations: 10 }
    );

    bench(
      'Multiple dots',
      () => {
        getFileType('file.with.multiple.dots.jpeg');
      },
      { iterations: 10 }
    );
  });
});
