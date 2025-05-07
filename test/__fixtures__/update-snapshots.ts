import { pixelift } from 'pixelift/server';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname);
const SNAPSHOTS_DIR = path.join(__dirname, '__snapshots__');
const FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

async function updateSnapshots(formats: readonly string[] = FORMATS): Promise<void> {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR);
  }

  let successCount = 0;
  const failed: string[] = [];

  console.log(`${CYAN}${BOLD}🔄 Starting snapshot update...${RESET} \n`);

  for (const fmt of formats) {
    try {
      console.log(`› Processing ${BOLD}${fmt}${RESET}…`);
      const imgPath = path.join(FIXTURES_DIR, `pixelift.${fmt}`);
      const buffer = fs.readFileSync(imgPath);
      const { data } = await pixelift(buffer);
      const outPath = path.join(SNAPSHOTS_DIR, `pixelift.${fmt}.txt`);
      fs.writeFileSync(outPath, data.toString(), 'utf8');

      console.log(`  ${GREEN}✅ Updated ${fmt}${RESET}`);
      successCount++;
    } catch {
      console.log(`  ${RED}❌ Failed  ${fmt}${RESET}`);
      failed.push(fmt);
    }
  }

  if (failed.length) {
    console.log(
      `\n${RED}${BOLD}Completed:${RESET} ${successCount}/${formats.length} succeeded, ` +
        `${failed.length} failed (${failed.join(', ')})`
    );
  } else {
    console.log(
      `\n${GREEN}${BOLD}All ${formats.length} snapshots updated successfully!${RESET}`
    );
  }
}

updateSnapshots().catch((err) => {
  console.error(`${RED}${BOLD}Fatal error:${RESET}`, err);
  process.exit(1);
});
