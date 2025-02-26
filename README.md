# Pixelift

[![npm version](https://img.shields.io/npm/v/pixelift)](https://www.npmjs.com/package/pixelift)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-environment pixel data extraction library for images, supporting both Node.js and browser environments. 

**Features:**
- 📸 Unified API for Node.js and browser environments
- 🖼 Supports PNG, JPEG, GIF, and WebP (browser only)
- 🧬 TypeScript-first implementation
- 🌐 Automatic format detection
- 🔄 Conversion utilities between different pixel formats

## Installation

```bash
npm install pixelift
```

[//]: # (**Peer Dependencies &#40;Node.js&#41;:**)
[//]: # (```bash)
[//]: # (npm install sharp)
[//]: # (```)

## Usage

### Basic Example (Node.js)
```typescript
import { pixelift } from 'pixelift';
import fs from 'node:fs/promises';

// From file path
const pixels1 = await pixelift('./image.jpg', { 
  format: 'jpg', 
  formatAsRGBA: true 
});

// From buffer
const buffer = await fs.readFile('./image.png');
const pixels2 = await pixelift(buffer);

console.log(pixels2);
/* Output:
{
  data: Uint8ClampedArray(16384) [ ... ],
  width: 128,
  height: 128,
  channels: 4
}
*/
```

### Browser Example
```typescript
import { pixelift } from 'pixelift';

// From URL
const pixels1 = await pixelift('https://example.com/image.png');

// From File input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const pixels2 = await pixelift(file);

// From ImageBitmap
const image = await createImageBitmap(file);
const pixels3 = await pixelift(image);
```

### Conversion Utilities
```typescript
import { 
  convertToArgbIntArray,
  convertToUint8ClampedArray 
} from 'pixelift';

// Convert pixel data to ARGB integers
const argbArray = convertToArgbIntArray(pixels.data);

// Modify pixels (example: add red tint)
const modified = argbArray.map(color => color | 0xff0000ff);

// Convert back to Uint8ClampedArray
const modifiedData = convertToUint8ClampedArray(modified);
```

## API Reference

### `pixelift(input: NodeInput | BrowserInput, options?: PixeliftOptions): Promise<PixelData>`

**Input Types:**
- Node.js: `string` (file path/URL), `Buffer`
- Browser: `string` (URL), `File`, `ImageBitmap`, `ImageData`, `URL`

**Options:**
- `format`: Force specific format (optional)
- Format-specific options:
    - **JPEG:** `formatAsRGBA` (default: `true`)
    - **GIF:** `frame` (default: 0)
    - **PNG:** `checkCRC`, `skipRescale`

**Return Type:**
```typescript
interface PixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  channels: 3 | 4;
}
```

## Error Handling

Handle specific errors with custom error classes:
```typescript
import { 
  PixeliftError,
  FormatError,
  NetworkError 
} from 'pixelift';

try {
  await pixelift(invalidInput);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof FormatError) {
    console.error('Unsupported format:', error.message);
  }
}
```

## Browser Support

Pixelift works in modern browsers that support:
- `fetch`
- `ImageBitmap`
- `OffscreenCanvas`

**Note:** For WebP support, ensure your system has the necessary codecs installed.

## Node.js Considerations

When using in Node.js:
- File system access requires proper permissions
- Remote URLs are fetched using native HTTP(S) module
- Format detection uses magic numbers in file headers

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Browser tests
npm run test:browser

# Node.js tests
npm run test:node
```

## License
MIT © [Maikel Eckelboom](https://github.com/maikeleckelboom)
