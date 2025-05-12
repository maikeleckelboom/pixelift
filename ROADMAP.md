# Pixelift Roadmap
Pixelift Roadmap
A not-so-secret roadmap for the Pixelift project, tracking progress and future plans for browser-side decoding and transformation. This is a living document and will evolve as the project progresses.
---

## ✅ Pixelift Browser Path: Refactor & Feature Roadmap

This checklist breaks down completed and planned work for browser-side decoding and transformation in Pixelift.

---

### 🔧 Phase 1: Core Fixes & Refinements (v1.0.0 Scope)

This milestone focuses on robust, efficient decoding of all input types into consistent RGBA data, with foundational support for resizing.

#### ✅ Completed

*   [x] **`ImageBitmap` Input Resizing**: `decode()` now correctly resizes `ImageBitmap` inputs using a canvas matching `options.width/height`.
*   [x] **`ImageData` & `OffscreenCanvas` Resizing**: `convertToBlobUsingCanvas()` now properly resizes `ImageData` (via two-step draw) and `OffscreenCanvas` (via draw to new canvas) inputs based on `options.width/height`.
*   [x] **Robust Blob → `ImageBitmap` Conversion (`createImageBitmapFromBlob`)**:
    *   [x] Attempts direct `createImageBitmap(Blob, imageBitmapOptions)` first for all Blob types.
    *   [x] Reliably falls back to `URL.createObjectURL -> new Image() -> createImageBitmap(Image, imageBitmapOptions)` upon failure (especially for SVGs or other complex formats).
*   [x] **Direct Video Frame Resizing (`createVideoFrameBitmap`)**: Accepts `BrowserOptions` to pass `imageBitmapOptions` to its internal `createImageBitmap(video, ...)` call, enabling native browser resizing from video frames.
*   [x] **Optimized `ImageBitmap` Decoder Path**: `ImageBitmap` inputs to `pixelift()` now directly use the canvas decoder, bypassing unnecessary `Blob` conversion, while fully respecting resize options.
*   [x] **Code Cleanup**: Removed unused files (`strategy.ts`, `webcodecs/image/index.ts`, `webcodecs/video/index.ts`).

#### 🛠️ Final v1.0.0 Tasks

*   [ ] **Logging**: Downgrade or remove development `console.warn`/`console.log` statements for production build.
*   [ ] **API Documentation (JSDoc/TSDoc)**: Ensure all public APIs for v1.0.0 are clearly documented.
*   [ ] **Comprehensive v1.0.0 Testing**:
    *   [ ] Confirm all supported input types decode correctly with/without resize options.
    *   [ ] Verify error handling.
    *   [ ] Establish v1.0.0 performance baseline with final benchmarks.
*   [ ] **(Optional) Configurable Canvas Context**: Consider making canvas settings (e.g., `imageSmoothingQuality`) configurable via `BrowserOptions`. If implemented, update `createCanvasContext` and ensure `options` propagation.

---

### 🎯 Phase 2: Advanced Fitting & Cropping (Target: v1.1)

This minor update introduces finer control over image geometry with `fit` and `crop` options, applied consistently across browser and Node.js paths.

#### 🖼️ `fit` Option (Image Geometry Control)

*   [ ] **Add `options.fit`**: With modes: `'fill'`, `'contain'`, `'cover'`, `'none'`, `'scale-down'`.
    *   [ ] *(Optional)* Add `options.position` for `'contain'` & `'cover'` alignment.
    *   [ ] *(Optional)* Add `options.background` for `'contain'` letterboxing.
*   [ ] **Implement `fit` Logic**:
    *   **Canvas Path**: Update `canvasDecoder.decode()` and `createResizedBlob()` to calculate `drawImage` rectangles based on `fit` mode, ensuring output canvas is `options.width`x`options.height`.
    *   **WebCodecs Path**: Decode frame, convert to `ImageBitmap`, then draw to `OffscreenCanvas` using the same canvas `fit` logic for consistency.
    *   **Node.js (Sharp)**: Map `fit` (and `position`/`background`) to `sharp.resize()` options.

#### ✂️ `crop` Option (Explicit Region Extraction)

*   [ ] **Add `options.crop`**: Define `crop: { x, y, width, height }` (coordinates relative to the original image).
*   [ ] **Implement Consistent Workflow (Order: Crop THEN Resize/Fit)**:
    *   **Canvas Path**: Obtain full-res `ImageBitmap`; use 9-argument `drawImage` to extract crop and apply `fit` to final dimensions simultaneously.
    *   **WebCodecs Path**: Decode frame; convert `VideoFrame` to `ImageBitmap`; apply canvas crop & fit logic.
    *   **Node.js (Sharp) Path**: Implement as `sharpInstance.extract(cropOptions).then(pipeline => pipeline.resize(targetSize, fitOptions))`.

#### 🧪 Testing & Docs for v1.1

*   [ ] **Unit Tests**: Cover all `fit` and `crop` variations with diverse inputs and options.
*   [ ] **Consistency Tests**: Extend `decode-consistency` and snapshot tests for `fit`/`crop` across all environments.
*   [ ] **Performance Benchmarks**: Benchmark new `fit` and `crop` operations.
*   [ ] **API Documentation**: Update JSDoc/TSDoc for new options, behaviors, and order of operations.
*   [ ] **Code Samples**: Illustrate `fit`, `crop`, and combined usage.

---

### 🚀 Phase 3: Advanced Color & Pixel Formats (Target: v2.0)

This major version aims to introduce high-fidelity pixel output, including wider color gamuts and higher bit depths, by leveraging advanced capabilities of WebCodecs and Sharp.

#### 🎨 Core Feature: High-Fidelity Output

*   [ ] **Evolve `PixelData` & `PixeliftOptions` (as `PixelData`, `PixeliftOptionsV2`)**:
    *   [ ] `PixelData.data`: Support `Uint16Array`, `Float32Array`.
    *   [ ] `PixelData` fields: Add `bitDepth: number`, `isFloat: boolean`, `colorModel: string` (e.g., `'RGB'`, `'RGBA'`), `colorSpace: string` (e.g., `'srgb'`, `'display-p3'`).
    *   [ ] `PixeliftOptionsV2`: Add `targetColorSpace` and `targetFormat` (e.g., `'uint8'`, `'float16'`, `'float32'`).
*   [ ] **WebCodecs Path Implementation (Primary for Browser High-Fidelity)**:
    *   [ ] Utilize `VideoFrame.copyTo(destination, { format, colorSpace })` to attempt outputting requested `targetFormat` (e.g., map `'float16'` to `RGBAF16` if supported) and `targetColorSpace`.
    *   [ ] Populate `PixelData` accurately based on actual data returned by `copyTo`.
*   [ ] **Canvas Path Implementation (Color Space Aware, 8-bit Data)**:
    *   [ ] Use `options.targetColorSpace` in `canvas.getContext('2d', { colorSpace })` and `context.getImageData({ colorSpace })`.
    *   [ ] `PixelData.data` remains `Uint8ClampedArray`. `PixelData.colorSpace` reflects intent, but pixel data is an 8-bit representation for that space.
*   [ ] **Node.js (Sharp) Implementation**:
    *   [ ] Leverage Sharp's `.raw({ depth })` (e.g., `'ushort'`, `'float'`) and `.toColorspace()` to produce `PixelData` matching `targetFormat` and `targetColorSpace`.
*   [ ] **Documentation & Fallbacks**:
    *   [ ] Clearly document the expected color fidelity, supported direct conversions (especially for WebCodecs), and fallback behaviors (e.g., to 8-bit if a high-fidelity request cannot be met by the browser API).
    *   [ ] Provide guidance on interpreting `PixelData` fields.

#### 🧪 Science Accuracy & Cross-Environment Considerations for v2.0

> Pixelift v2.0 strives to provide **high-fidelity color and pixel decoding** where modern APIs allow, including wide-gamut color spaces and float/high bit-depth pixel data (primarily via WebCodecs in browsers and Sharp on Node.js).
>
> Users should be aware that achieving **absolute decode-consistency for these advanced formats across all environments and input types is challenging** due to:
>
> *   Differences in browser vendor implementations and evolving support for color space APIs (especially `VideoFrame.copyTo()` output formats).
> *   The Canvas 2D API's `getImageData()` inherently returning 8-bit `Uint8ClampedArray` data, regardless of the context's working color space.
>
> Pixelift will prioritize honoring user requests for `targetFormat` and `targetColorSpace` when underlying platform APIs offer a direct and reliable mechanism. Fallback behaviors and achievable fidelity for specific paths will be clearly documented.
>
> ⚠️ *Advanced color and high bit-depth features in the browser path are dependent on the capabilities of WebCodecs and are subject to browser vendor implementation differences and ongoing standards evolution.*

#### 🧪 Testing & Docs for v2.0

*   [ ] **Unit Tests**: For `targetColorSpace` and `targetFormat` requests.
*   [ ] **Consistency Tests**: Extended for color space/format variations.
*   [ ] **Performance Benchmarks**: For high bit-depth / float decoding paths.
*   [ ] **API Documentation**: Detailed JSDoc/TSDoc for all v2.0 color and format options.
*   [ ] **Code Samples**: Demonstrating requests for different output pixel formats and color spaces.

---

### 🧹 Phase 4: General Cleanup & Maintenance (Ongoing)

*   [ ] **Code Review**: Continuous review for clarity, consistency, and best practices.
*   [ ] **Logging**: Ensure appropriate logging levels for production vs. development.
*   [ ] **Options Propagation**: Verify consistent `BrowserOptions` handling.
*   [ ] **Dependency Updates**: Keep dependencies like Sharp, Vitest, etc., up to date.
*   [ ] **Address Community Feedback & Issues**.

---