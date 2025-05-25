export function isNodeWorker(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      typeof (process as any).type === 'string' &&
      (process as any).type === 'worker'
    );
  } catch {
    return false;
  }
}

export function isNode(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      typeof process.versions.node === 'string' &&
      !isNodeWorker()
    );
  } catch {
    return false;
  }
}

export function isWebWorker(): boolean {
  try {
    return (
      typeof globalThis !== 'undefined' &&
      typeof importScripts === 'function' &&
      typeof Window === 'undefined'
    );
  } catch {
    return false;
  }
}

export function isBrowser(): boolean {
  try {
    const win = typeof window !== 'undefined' ? window : globalThis;
    return typeof win.document !== 'undefined' && typeof importScripts === 'undefined';
  } catch {
    return false;
  }
}

export type PixeliftEnv = 'browser' | 'web-worker' | 'node' | 'node-worker';

export function detectEnvironment(): PixeliftEnv {
  if (isNodeWorker()) return 'node-worker';
  if (isNode()) return 'node';
  if (isWebWorker()) return 'web-worker';
  if (isBrowser()) return 'browser';

  throw new Error(
    [
      'Unable to detect environment.',
      '',
      'Supported environments:',
      '  • Browser',
      '  • Web Worker',
      '  • Node.js',
      '  • Node Worker',
      '',
      'If you are using a custom environment, please ensure it is compatible with Pixelift.'
    ].join('\n')
  );
}
