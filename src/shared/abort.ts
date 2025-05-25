/**
 * Cross-environment utility to check if the provided `AbortSignal` is aborted and throw a `DOMException` with the name `AbortError` if so.
 * This is needed because Node.js does not yet support `signal.throwIfAborted`.
 *
 * @param {AbortSignal} [signal] - An optional `AbortSignal` instance to monitor for an aborted state.
 * @return {void} This function does not return a value.
 */
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}
