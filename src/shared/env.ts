export type PixeliftEnv = 'browser' | 'web-worker' | 'node' | 'node-worker';

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
      typeof Window === 'undefined' // web workers have no Window constructor
    );
  } catch {
    return false;
  }
}

export function isBrowser(): boolean {
  try {
    const win = typeof window !== 'undefined' ? window : globalThis;
    return (
      typeof win.document !== 'undefined' && typeof importScripts === 'undefined' // exclude web workers
    );
  } catch {
    return false;
  }
}

export function detectEnvironment(): PixeliftEnv {
  if (isNodeWorker()) return 'node-worker';
  if (isNode()) return 'node';
  if (isWebWorker()) return 'web-worker';
  if (isBrowser()) return 'browser';

  throw new Error(
    `Unknown runtime environment. Globals: ` +
      `window=${typeof window}, document=${typeof document}, process=${typeof process}, importScripts=${typeof importScripts}`
  );
}
