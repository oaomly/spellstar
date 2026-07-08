// One-off asset processor: takes raw photos dropped in img/ (gitignored — your
// camera roll exports can be multi-MB) and produces small, web-ready copies in
// public/img/ (tracked in git, served at /img/<name>.jpg).
//
// Resizes to max width 640px and converts to JPEG (quality 78) using macOS's
// built-in `sips` — no extra dependency needed. Run:  npm run images
//
// After running, set the word's "img" field to "/img/<name>.jpg" in the
// relevant data/wordlists/**/weekN.json file.

import { mkdir, readdir, rm } from 'node:fs/promises';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'img');
const OUT_DIR = join(ROOT, 'public', 'img');
const MAX_WIDTH = 640;
const EXTS = new Set(['.png', '.jpg', '.jpeg']);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  let files;
  try {
    files = await readdir(SRC_DIR);
  } catch {
    console.log(`No img/ folder found at ${SRC_DIR} — nothing to do.`);
    return;
  }
  const images = files.filter((f) => EXTS.has(extname(f).toLowerCase()));
  if (images.length === 0) {
    console.log('img/ has no .png/.jpg/.jpeg files to process.');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  for (const file of images) {
    const name = basename(file, extname(file));
    const src = join(SRC_DIR, file);
    const tmp = join(OUT_DIR, `${name}.png`);
    const out = join(OUT_DIR, `${name}.jpg`);

    // Resize first (sips can't resize+reformat reliably in one pass), then convert.
    await run('sips', ['-Z', String(MAX_WIDTH), src, '--out', tmp]);
    await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '78', tmp, '--out', out]);
    await rm(tmp, { force: true });

    console.log(`✓ public/img/${name}.jpg  ← set "img": "/img/${name}.jpg" in the word list JSON`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
