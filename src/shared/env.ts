export function isNodeJs(): boolean {
  return typeof process !== 'undefined' && typeof process.versions === 'object';
}

export function isWebWorker(): boolean {
  return (
    typeof importScripts === 'function' &&
    typeof postMessage === 'function' &&
    typeof window === 'undefined'
  );
}

export function isBrowserMainThread(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && !isWebWorker();
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isServer(): boolean {
  return isNodeJs();
}
