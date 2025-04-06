import type {Decoder, DecoderFactory} from "./types.ts";

export class DecoderRegistry {
    private static factories: DecoderFactory[] = [];
    private static decoderCache = new Map<string, Decoder>();

    static registerFactory(factory: DecoderFactory) {
        this.factories.push(factory);
        // Sort by priority descending
        this.factories.sort((a, b) => b.priority - a.priority);
    }

    static async getDecoder(format: string): Promise<Decoder> {
        // Check cache first
        if (this.decoderCache.has(format)) {
            return this.decoderCache.get(format)!;
        }

        // Find all candidates for format
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

    private static async tryCreateDecoder(factory: DecoderFactory): Promise<Decoder> {
        if (factory.requires) {
            for (const dep of factory.requires) {
                if (!(await this.isInstalled(dep))) {
                    throw new Error(`Missing dependency: ${dep}`);
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