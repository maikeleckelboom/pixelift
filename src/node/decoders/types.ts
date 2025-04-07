export interface PixelData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}

export interface Decoder {
    decode(buffer: Uint8Array | Buffer, options?: Record<string, unknown>): Promise<PixelData>;
}

export interface DecoderFactory {
    readonly name: string;
    readonly formats: string[];
    readonly priority: number; // Higher = better
    readonly dependencies?: string[]; // Package dependencies
    create(): Promise<Decoder>;
}