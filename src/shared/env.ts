export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isWebWorker(): boolean {
  return (
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope &&
    typeof importScripts === 'function'
  );
}

export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node != null;
}

export function detectRuntime(): 'browser' | 'worker' | 'node' {
  if (isBrowser()) return 'browser';
  if (isWebWorker()) return 'worker';
  if (isNode()) return 'node';
  throw new Error('Unknown runtime environment');
}
