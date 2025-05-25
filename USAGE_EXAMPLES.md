# Pixelift Real-World Use Cases

## Core Capabilities Demonstrated

- ✅ Cross-environment consistency (Browser/Node.js)
- ✅ Stream handling with progress reporting
- ✅ Large file support
- ✅ Security controls (abort, byte limits)
- ✅ Raw pixel access for domain-specific processing

## 1. Cross-Environment Image Processing

### 1.1 Browser: Progressive Image Loading from API Response

```typescript
import {pixelift} from 'pixelift';

async function loadMedicalScan(url: string) {
    const controller = new AbortController();
    const response = await fetch(url, {
        signal: controller.signal,
        headers: {'Range': 'bytes=0-', 'Accept': 'image/*'}
    });

    const {data, width, height} = await pixelift(response, {
        onProgress: (bytes) => {
            const total = parseInt(response.headers.get('Content-Length') || '0', 10);
            console.log(`Loaded ${bytes}/${total} bytes (${((bytes / total) * 100).toFixed(1)}%)`);
        },
        maxBytes: 2 * 1024 * 1024 * 1024 // 2GB limit
    });

    return new ImageData(data, width, height);
}
```

**Key Features:**

- Handles HTTP Range requests
- Progress reporting for large files
- Security constraints with maxBytes

### 1.2 Node.js: Satellite Imagery Processing

```typescript
import {createReadStream} from 'node:fs';
import {pixelift} from 'pixelift';

async function processGeoTIFF(path: string) {
    const stream = createReadStream(path);
    let processedBytes = 0;

    const {data, width, height} = await pixelift(stream, {
        onProgress: (bytes) => {
            processedBytes = bytes;
            console.log(`Processed ${(bytes / 1024 / 1024).toFixed(1)}MB`);
        },
        chunkSize: 65536 // Optimized for disk I/O
    });

    // Calculate NDVI (requires proper band mapping)
    const ndvi = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        const [nir, red] = [data[i], data[i + 1]];
        ndvi[i / 4] = (nir - red) / (nir + red + 1e-6);
    }

    return ndvi;
}
```

**Key Features:**

- Node.js Readable stream support
- Chunk size optimization
- Scientific data processing

## 2. Security-Critical Processing

### 2.1 Document Validation Pipeline

```typescript
import {pixelift} from 'pixelift';

async function validateIDPhoto(source: File | Response) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);

    const {data, width, height} = await pixelift(source, {
        signal: controller.signal,
        maxBytes: 50 * 1024 * 1024,
        onProgress: (bytes) => securityLogger.trace(`Processing ${bytes} bytes`)
    });

    // 1. Check compression artifacts
    const compressionScore = analyzeCompression(data);

    // 2. Validate EXIF metadata
    const exif = await readExif(source);

    // 3. Pixel-level analysis
    const anomalyScore = detectAnomalies(data, width, height);

    return {
        valid: compressionScore < 0.2 &&
            anomalyScore < 0.1 &&
            !exif.software?.includes('GAN')
    };
}
```

**Key Features:**

- AbortController integration
- Byte limit enforcement
- Combined stream + metadata analysis

## 3. Scientific Data Handling

### 3.1 Microscopy Image Analysis (Node.js Stream)

```typescript
import {pipeline} from 'node:stream/promises';
import {pixelift} from 'pixelift';

async function analyzeTiffStack(tiffPaths: string[]) {
    const results = [];

    for (const path of tiffPaths) {
        const stream = createReadStream(path);
        const {data, width, height} = await pixelift(stream, {
            onProgress: (bytes) => {
                console.log(`Processing ${path}: ${bytes} bytes`);
            }
        });

        // Calculate fluorescence intensity
        const intensities = new Float32Array(data.length / 4);
        for (let i = 0; i < data.length; i += 4) {
            intensities[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
        }

        results.push({path, intensities});
    }

    return results;
}
```

**Key Features:**

- Sequential stream processing
- Memory-efficient large file handling
- Scientific measurements

## 4. Universal Stream Handling

### 4.1 Cross-Environment Image Processor

```typescript
import {pixelift} from 'pixelift';

type ImageSource = string | URL | File | Blob | Response | NodeJS.ReadableStream;

async function universalProcessor(source: ImageSource) {
    const {data, width, height} = await pixelift(source, {
        onProgress: (bytes) => {
            const env = typeof window !== 'undefined' ? 'Browser' : 'Node.js';
            console.log(`[${env}] Processed ${bytes} bytes`);
        }
    });

    // Generic processing pipeline
    return {
        dimensions: {width, height},
        histogram: calculateHistogram(data),
        averageColor: calculateAverageColor(data)
    };
}
```

**Key Features:**

- Single API for all environments
- Automatic source type detection
- Progress reporting in any context

## Input Type Support Matrix

| Input Type       | Browser | Node.js | Progress | Abort |
|------------------|---------|---------|----------|-------|
| URL/String       | ✅       | ✅       | ✅        | ✅     |
| File/Blob        | ✅       | ❌       | ✅        | ✅     |
| Response         | ✅       | ✅       | ✅        | ✅     |
| ReadableStream   | ✅       | ✅       | ✅        | ✅     |
| Node.js Readable | ❌       | ✅       | ✅        | ✅     |
| ArrayBuffer      | ✅       | ✅       | ✅        | ✅     |

