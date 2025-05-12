import { beforeAll, bench, describe } from 'vitest';
import { getFileType } from '../../../src/shared/file-type';
import { setupBrowserEnvironment } from '../../fixtures/setup-browser-environment';

const BENCH_CONFIG = {
  iterations: 1000,
  warmupIterations: 20,
  time: 10
};

describe('File Type Inference Benchmarks', () => {
  beforeAll(() => {
    setupBrowserEnvironment();
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
        getFileType(complexUrl);
      },
      BENCH_CONFIG
    );

    bench(
      'Data URI parsing',
      () => {
        getFileType(dataUri);
      },
      BENCH_CONFIG
    );

    bench(
      'Pre-typed files',
      () => {
        getFileType(typedFile);
      },
      BENCH_CONFIG
    );
  });

  describe('Browser Elements', () => {
    let videoElement: HTMLVideoElement;
    let canvas: HTMLCanvasElement;

    beforeAll(() => {
      videoElement = document.createElement('video');
      videoElement.src = 'https://example.com/video.ogv';
      canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.fillRect(0, 0, 100, 100);
    });

    bench(
      'Video element analysis',
      () => {
        getFileType(videoElement);
      },
      BENCH_CONFIG
    );

    bench(
      'Canvas conversion',
      () => {
        getFileType(canvas);
      },
      BENCH_CONFIG
    );
  });

  describe('Edge Cases', () => {
    bench(
      'Fallback handling',
      () => {
        getFileType({} as never);
      },
      BENCH_CONFIG
    );
  });
});
