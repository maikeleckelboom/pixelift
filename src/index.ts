import {readFileSync} from "fs";
import {detect} from "./node/detect.ts";
import {DecoderRegistry} from "./decoders/registry.ts";
import {JPEGFactory} from "./decoders/factories/jpeg.ts";
import {SharpFactory} from "./decoders/factories/sharp.ts";

DecoderRegistry.registerFactory(JPEGFactory);
DecoderRegistry.registerFactory(SharpFactory);

export async function decode(buffer: Buffer, format?: string) {
    format ??= detect(buffer);
    const decoder = await DecoderRegistry.getDecoder(format);
    return decoder.decode(buffer);
}

export async function execute() {
    const buffer = readFileSync('./test/assets/test.jpg');
    return await decode(buffer)
}