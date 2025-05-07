import { pixelift } from 'pixelift/server';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname);
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

const FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;

async function updateSnapshots(): Promise<void> {
  for (const format of FORMATS) {
    console.log(`Updating reference for ${format}...`);
    try {
      const imagePath = path.join(FIXTURES_DIR, `pixelift.${format}`);
      const buffer = fs.readFileSync(imagePath);
      const { data } = await pixelift(buffer);

      const outputPath = path.join(SNAPSHOTS_DIR, `pixelift.${format}.txt`);
      fs.writeFileSync(outputPath, data.toString(), 'utf8');

      console.log(`✅ Updated ${format}`);
    } catch (error) {
      console.error(`❌ Error updating ${format}:`, error);
    }
  }
}

updateSnapshots().then(() => console.log('All references updated successfully!'));
