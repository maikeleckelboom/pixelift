import { beforeAll, describe, expect, test } from 'vitest';
import { setupMediaElementMocks } from '../../fixtures/setup-media-element-mocks';
import { getFileExtension, guessInputMimeType } from '../../../src/shared/file-type';

describe('File Type Utilities', () => {
  beforeAll(() => {
    setupMediaElementMocks();
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
      expect(getFileExtension('data:image/svg+xml;base64,AAA')).toBe('svg');

      // Windows paths
      expect(getFileExtension('C:\\Users\\You\\report.docx')).toBe('docx');

      // Multiple dots and edge filenames
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('my.photo.final.jpeg')).toBe('jpeg');
      expect(getFileExtension('file.')).toBe(undefined);
      expect(getFileExtension('filename')).toBe(undefined);
      expect(getFileExtension('.env')).toBe(undefined);
      expect(getFileExtension('файл.фото')).toBe('фото');
    });
  });

  describe('guessInputMimeType', () => {
    test('handles Blob, File, and browser elements', () => {
      // Blob/File objects
      expect(
        guessInputMimeType(new File([], 'vector.svg', { type: 'image/svg+xml' }))
      ).toBe('image/svg+xml');

      // Image elements
      const img = new globalThis.HTMLImageElement();
      img.src = 'https://cdn.site/img.bmp';
      expect(guessInputMimeType(img)).toBe('image/bmp');

      // Video elements
      const video = new globalThis.HTMLVideoElement();
      video.src = 'https://videos.test/movie.ogv';
      expect(guessInputMimeType(video)).toBe('video/ogg');
    });

    test('determines type from URL, string, and data URIs', () => {
      // URL/string inputs
      expect(guessInputMimeType('https://x.test/a.WEBP?cache=false')).toBe('image/webp');
      expect(guessInputMimeType(new URL('https://x.test/b.MOV#t=10'))).toBe(
        'video/quicktime'
      );
      expect(guessInputMimeType('my.photo.final.jpeg')).toBe('image/jpeg');

      // Data URIs
      expect(guessInputMimeType('data:image/jpeg;base64,AAA')).toBe('image/jpeg');
      expect(guessInputMimeType('data:audio/mp3;base64,AAA')).toBe('audio/mp3');
    });
  });
});
