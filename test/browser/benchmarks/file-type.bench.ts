import { beforeAll, bench, describe } from 'vitest';
import { guessInputMimeType } from '../../../src/shared/file-type';
import { setupMediaElementMocks } from '../../fixtures/setup-media-element-mocks';

const BENCH_CONFIG = {
  iterations: 1000,
  warmupIterations: 20,
  time: 10
};

describe('File Type Inference Benchmarks', () => {
  beforeAll(() => {
    setupMediaElementMocks();
  });

  describe('Core Operations', () => {
    const complexUrl =
      'https://cdn.example.com/images/2023/final.prod.v2.export-1.tar.gz?cache=v3';
    const dataUri =
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const typedFile = new File([], 'data.bin', { type: 'application/x-custom' });

    bench(
      'URL parsing',
      () => {
        guessInputMimeType(complexUrl);
      },
      BENCH_CONFIG
    );

    bench(
      'Data URI parsing',
      () => {
        guessInputMimeType(dataUri);
      },
      BENCH_CONFIG
    );

    bench(
      'Pre-typed files',
      () => {
        guessInputMimeType(typedFile);
      },
      BENCH_CONFIG
    );
  });

  describe('Browser Elements', () => {
    let videoElement: HTMLVideoElement;

    beforeAll(() => {
      videoElement = document.createElement('video');
      videoElement.src = 'https://example.com/video.ogv';
    });

    bench(
      'Video element analysis',
      () => {
        guessInputMimeType(videoElement);
      },
      BENCH_CONFIG
    );
  });

  describe('Edge Cases', () => {
    bench(
      'Fallback handling',
      () => {
        guessInputMimeType({} as never);
      },
      BENCH_CONFIG
    );
  });
});
