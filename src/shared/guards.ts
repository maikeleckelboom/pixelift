import type { ServerInput } from '../server';
import type { BrowserInput } from '../browser';
import type { DecodedBrowserInput, EncodedBrowserInput } from '../browser/types';

/**
 * Determines if the provided input is either a string or an instance of URL.
 *
 * @param {unknown} input - The value to be checked.
 * @return {boolean} Returns true if the input is a string or a URL, otherwise false.
 */
export function isStringOrURL(input: unknown): input is string | URL {
  return typeof input === 'string' || input instanceof URL;
}

/**
 * Determines if the provided error is a DOMException with the name 'AbortError'.
 *
 * @param {unknown} error - The error to evaluate.
 * @return {boolean} Returns true if the error is a DOMException with the name 'AbortError', otherwise false.
 */
export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Determines if the provided input is a media element.
 *
 * @param {unknown} input - The input to be checked.
 * @return {boolean} Returns true if the input is an instance of HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement; otherwise, false.
 */
export function isMediaElement(
  input: unknown
): input is HTMLImageElement | HTMLVideoElement | HTMLCanvasElement {
  return (
    (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement)
  );
}

/**
 * Determines if the given input is raw data, which can be a string, URL, Blob, or BufferSource.
 *
 * @param {unknown} input - The input to be checked.
 * @return {boolean} Returns `true` if the input is a string, URL, Blob, or BufferSource; otherwise `false`.
 */
export function isRawData(input: unknown): input is string | URL | Blob | BufferSource {
  return (
    isStringOrURL(input) ||
    input instanceof Blob ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input)
  );
}

/**
 * Determines if the given input is a renderable graphic element such as an HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, or SVGElement.
 *
 * @param {unknown} input - The value to be evaluated.
 * @return {boolean} Returns true if the input is an instance of HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, or SVGElement; otherwise, returns false.
 */
export function isRenderableGraphic(
  input: unknown
): input is HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | SVGElement {
  return (
    isMediaElement(input) ||
    (typeof SVGElement !== 'undefined' && input instanceof SVGElement)
  );
}

/**
 * Determines whether the given input is an encoded input that matches specific criteria.
 *
 * @param {unknown} input - The input to be evaluated.
 * @return {boolean} - Returns true if the input is an EncodedBrowserInput; otherwise, false.
 */
export function isEncodedInput(input: unknown): input is EncodedBrowserInput {
  return (
    isRawData(input) ||
    isRenderableGraphic(input) ||
    (typeof ReadableStream !== 'undefined' && input instanceof ReadableStream) ||
    (typeof Response !== 'undefined' && input instanceof Response)
  );
}

/**
 * Checks if the provided input is a decoded browser-specific input type, such as ImageBitmap, ImageData, VideoFrame, or OffscreenCanvas.
 *
 * @param {unknown} input - The input to evaluate for matching specific decoded browser input types.
 * @return {boolean} Returns true if the input is an instance of one of the supported decoded input types; otherwise, false.
 */
export function isDecodedInput(input: unknown): input is DecodedBrowserInput {
  return (
    (typeof ImageBitmap !== 'undefined' && input instanceof ImageBitmap) ||
    (typeof ImageData !== 'undefined' && input instanceof ImageData) ||
    (typeof VideoFrame !== 'undefined' && input instanceof VideoFrame) ||
    (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas)
  );
}

/**
 * Validates whether the provided input is a valid BrowserInput.
 *
 * @param {unknown} input - The input to be validated as a BrowserInput.
 * @return {boolean} Returns true if the input is a valid BrowserInput, otherwise false.
 */
export function isValidBrowserInput(input: unknown): input is BrowserInput {
  return isEncodedInput(input) || isDecodedInput(input);
}

/**
 * Checks if the provided input is a valid server input.
 *
 * This function determines whether the input is valid by verifying if it is
 * a string, URL, Buffer, ArrayBuffer, or a typed array view.
 *
 * @param {unknown} input - The input value to validate as a server-compatible input.
 * @return {boolean} - Returns `true` if the input is a valid server input; otherwise, `false`.
 */
export function isValidServerInput(input: unknown): input is ServerInput {
  return (
    isStringOrURL(input) ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input)
  );
}
