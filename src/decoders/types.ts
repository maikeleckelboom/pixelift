export interface PixelData {
    data: Uint8Array;
    width: number;
    height: number;
}

export interface Decoder {
    decode(buffer: Uint8Array): Promise<PixelData>;
}

export interface DecoderFactory {
    readonly name: string;
    readonly formats: string[];
    readonly priority: number; // Higher = better
    readonly requires?: string[]; // Package dependencies
    create(): Promise<Decoder>;
}