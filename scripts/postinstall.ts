import { execSync } from 'node:child_process';

// Check if we're in the server installation context
const isServerInstall =
  process.env.npm_package_json?.includes('/node_modules/pixelift/') &&
  process.argv.includes('--omit=dev');

if (isServerInstall) {
  try {
    // Check if sharp is already installed
    const sharpPath = require.resolve('sharp');
    console.log('✔ sharp already installed:', sharpPath);
  } catch {
    console.log('⌛ Installing sharp for server-side functionality...');
    execSync('npm install sharp@0.34.1 --no-save --omit=dev', {
      stdio: 'inherit'
    });
  }
}
