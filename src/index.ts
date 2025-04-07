import {readFileSync} from "fs";
import {detect} from "./node/detect.ts";
import {DecoderRegistry} from "./node/decoders/registry.ts";
import {JPEGFactory} from "./node/decoders/factories/jpeg.ts";
import {SharpFactory} from "./node/decoders/factories/sharp.ts";

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