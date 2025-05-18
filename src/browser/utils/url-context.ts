/**
 * Gets the current execution environment's origin URL
 * @returns Origin URL or undefined if unavailable
 */
export function resolveContextOrigin(): string | undefined {
  const globalLocation =
    typeof location !== 'undefined'
      ? location
      : typeof self !== 'undefined'
        ? self.location
        : undefined;

  if (globalLocation) {
    return (
      globalLocation.origin ||
      `${globalLocation.protocol}//${globalLocation.hostname}` +
        (globalLocation.port ? `:${globalLocation.port}` : '')
    );
  }

  return undefined;
}
