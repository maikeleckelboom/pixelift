import { pixelift } from 'pixelift/server';
import * as fs from 'fs';

const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

async function run(): Promise<void> {
  for (const format of SUPPORTED_FORMATS) {
    const originalPath = `./test/assets/pixelift.${format}`;
    const url = new URL(originalPath, import.meta.url);

    console.log(`Processing ${format}, preparing output: ${originalPath}...`);

    try {
      const buffer = fs.readFileSync(url);
      const { data } = await pixelift(buffer);
      fs.writeFileSync(
        `./test/assets/txt/pixelift.${format}.txt`,
        data.toString(),
        'utf-8'
      );
    } catch (error) {
      console.error('❌ Error during processing:', error);
    }
  }
}

run().then(() => console.log('✅ All formats processed successfully.'));
