import {DecoderRegistry} from "./decoders/registry.ts";
import {jpegFactory} from "./decoders/factories/jpeg.ts";
import {detect} from "./node/detect.ts";
import {readFileSync} from "fs";

DecoderRegistry.registerFactory(jpegFactory);

export async function decode(buffer: Buffer, format?: string) {
    format ??= detect(buffer);
    const decoder = await DecoderRegistry.getDecoder(format);
    return decoder.decode(buffer);
}

export async function execute() {
    const buffer = readFileSync('./test/assets/test.jpg');
    return await decode(buffer)
}