import type { Decoder, DecoderFactory } from './types.ts';
import { MissingDependencyError } from '../../core';

export class DecoderRegistry {
  private static factories: DecoderFactory[] = [];
  private static decoderCache = new Map<string, Decoder>();

  static registerFactory(factory: DecoderFactory) {
    this.factories.push(factory);
    this.factories.sort((a, b) => b.priority - a.priority);
  }

  static async getDecoderByFormat(format: string): Promise<Decoder> {
    if (this.decoderCache.has(format)) {
      return this.decoderCache.get(format)!;
    }

    const candidates = this.factories.filter(f => f.formats.includes(format));

    for (const factory of candidates) {
      try {
        const decoder = await this.tryCreateDecoder(factory);
        this.decoderCache.set(format, decoder);
        return decoder;
      } catch (error) {
        console.warn(`[Decoder] Skipping ${factory.name}`, error);
      }
    }

    throw new Error(`No decoder available for ${format}`);
  }

  static async getDecoder(decoderName: string): Promise<Decoder> {
    const decoder = this.decoderCache.get(decoderName);
    if (decoder) {
      return decoder;
    }

    const factory = this.factories.find(f => f.name === decoderName);
    if (!factory) {
      throw new Error(`No decoder registered for ${decoderName} format`);
    }

    try {
      return await this.tryCreateDecoder(factory);
    } catch (error) {
      throw new Error(`Failed to create decoder for ${decoderName}: ${error}`);
    }
  }

  private static async tryCreateDecoder(factory: DecoderFactory): Promise<Decoder> {
    if (factory.dependencies) {
      for (const dependency of factory.dependencies) {
        if (!(await this.isInstalled(dependency))) {
          throw new MissingDependencyError({
            name: dependency,
            requiredBy: factory.name,
            installCommand: `npm install ${dependency}`,
          });
        }
      }
    }

    return factory.create();
  }

  private static async isInstalled(pkg: string): Promise<boolean> {
    try {
      await import(pkg);
      return true;
    } catch {
      return false;
    }
  }

  private static async verifyDependencies(deps: string[]): Promise<void> {
    for (const dep of deps) {
      try {
        await import(dep);
      } catch {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }
}