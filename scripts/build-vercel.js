import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'public');

console.log('[Build] Preparing Vercel deployment output in public/...');

// Ensure public directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

// Copy static entry files and assets
const itemsToCopy = ['index.html', 'demo.html', 'css', 'js', 'assets', 'components', 'lib'];

// Clean stale items in public before copying
itemsToCopy.forEach(item => {
  const dest = path.join(outDir, item);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
});

itemsToCopy.forEach(item => {
  const src = path.join(rootDir, item);
  const dest = path.join(outDir, item);
  if (fs.existsSync(src)) {
    if (fs.lstatSync(src).isDirectory()) {
      copyFolderSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`[Build] Copied ${item} -> public/${item}`);
  }
});

console.log('[Build] Vercel static build completed successfully!');
