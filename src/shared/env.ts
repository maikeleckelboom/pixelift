export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isWebWorker(): boolean {
  return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}
