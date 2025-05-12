import { describe, test, expect, beforeAll } from 'vitest';
import { getFileType, getFileExtension } from '../../../src/shared/file-type';
import { MIME_MAP } from '../../../src/shared/constants';
import { setupBrowserEnvironment } from '../../fixtures/setup-browser-environment';

describe('File Type Utilities', () => {
  beforeAll(() => {
    setupBrowserEnvironment();
  });

  describe('getFileExtension', () => {
    test('extracts extensions from URLs, paths, and handles edge cases', () => {
      // Basic and URL cases
      expect(getFileExtension('https://example.com/image.jpg')).toBe('jpg');
      expect(getFileExtension(new URL('https://example.com/video.mp4'))).toBe('mp4');
      expect(getFileExtension('file.unknown')).toBe('unknown');

      // Query strings and fragments
      expect(getFileExtension('https://cdn.test.com/photo.png?version=123')).toBe('png');
      expect(getFileExtension('https://site.com/doc.pdf#page=2')).toBe('pdf');

      // Case normalization
      expect(getFileExtension('IMAGE.JPG')).toBe('jpg');
      expect(getFileExtension('video.MP4?auth=true')).toBe('mp4');

      // Data URIs
      expect(getFileExtension('data:image/svg+xml;base64,AAA')).toBe('svg+xml');

      // Windows paths
      expect(getFileExtension('C:\\Users\\You\\report.docx')).toBe('docx');

      // Multiple dots and edge filenames
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('my.photo.final.jpeg')).toBe('jpeg');
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('filename')).toBe('');
      expect(getFileExtension('.env')).toBe('');
      expect(getFileExtension('файл.фото')).toBe('фото');
    });
  });

  describe('getFileType', () => {
    test('prioritizes explicit type option', () => {
      expect(getFileType('something.ext', { type: 'application/x-custom' })).toBe(
        'application/x-custom'
      );
    });

    test('handles Blob, File, and browser elements', () => {
      // Blob/File objects
      expect(getFileType(new Blob([], { type: 'image/png' }))).toBe('image/png');
      expect(getFileType(new File([], 'vector.svg', { type: 'image/svg+xml' }))).toBe(
        'image/svg+xml'
      );
      expect(getFileType(new Blob([]))).toBe('image/png'); // Fallback

      // Canvas and images
      const canvas = new globalThis.HTMLCanvasElement();
      expect(getFileType(canvas)).toBe('image/png');

      const img = new globalThis.HTMLImageElement();
      img.src = 'https://cdn.site/img.bmp';
      expect(getFileType(img)).toBe('image/bmp');

      // Video elements
      const video = new globalThis.HTMLVideoElement();
      video.src = 'https://videos.test/movie.ogv';
      expect(getFileType(video)).toBe('video/ogg');
    });

    test('determines type from URL, string, and data URIs', () => {
      // URL/string inputs
      expect(getFileType('https://x.test/a.WEBP?cache=false')).toBe('image/webp');
      expect(getFileType(new URL('https://x.test/b.MOV#t=10'))).toBe(MIME_MAP.mov);
      expect(getFileType('my.photo.final.jpeg')).toBe('image/jpeg');

      // Data URIs
      expect(getFileType('data:image/jpeg;base64,AAA')).toBe('image/jpeg');
      expect(getFileType('data:audio/mp3;base64,AAA')).toBe('audio/mp3');
    });

    test('falls back for invalid inputs and edge cases', () => {
      // Unsupported inputs
      expect(getFileType({} as never)).toBe('image/png');
      expect(getFileType(null as never)).toBe('image/png');
      expect(getFileType(undefined as never)).toBe('image/png');
      expect(getFileType(123 as never)).toBe('image/png');
      expect(getFileType('')).toBe('image/png');
    });
  });
});
