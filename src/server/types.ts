import type { CommonDecoderOptions } from '../types';
import type { Readable } from 'node:stream';

export type ServerInput = string | URL | Buffer | BufferSource | Readable | ReadableStream;

export interface ServerOptions extends CommonDecoderOptions {
  decoder?: 'sharp';
}

/**
 * Progress information for streaming data
 */
export interface ProgressData {
  /** Number of bytes processed so far */
  loaded: number;
  /** Total bytes to process (if known) */
  total: number | undefined;
  /** Progress as a value between 0-1 (if total is known) */
  progress: number | undefined;
}

/**
 * Callback function for tracking progress
 */
export type ProgressCallback = (info: ProgressData) => void;
