import type { ServerInput, ServerOptions } from '@/server';
import type { PixelData } from '@/types';
import { detectEnvironment } from '@/shared/env.ts';
import { getDecoders } from '@/plugin/registry.ts';

export async function decode(
  input: ServerInput,
  options?: ServerOptions
): Promise<PixelData> {
  const environment = detectEnvironment();

  const decoders = getDecoders().filter(
    (d) => !d.metadata?.supportedEnvs || d.metadata.supportedEnvs.includes(environment)
  );

  if (decoders.length === 0) {
    throw new Error(`No decoders registered for current runtime "${environment}"`);
  }
  
  return {
    data: new Uint8ClampedArray(),
    width: 0,
    height: 0
  };
}
