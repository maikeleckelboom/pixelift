export function isWebWorker(): boolean {
  return (
    typeof importScripts === 'function' &&
    typeof postMessage === 'function' &&
    typeof window === 'undefined'
  );
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isServer(): boolean {
  return typeof process !== 'undefined' && typeof process.versions === 'object';
}
