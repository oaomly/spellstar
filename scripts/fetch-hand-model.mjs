// Self-hosts the MediaPipe hand-tracking assets for the Finger Match game, so
// the deployed site has NO external runtime dependency:
//   - copies the tasks-vision WASM runtime from node_modules -> public/mediapipe/wasm/
//   - downloads the hand_landmarker model -> public/mediapipe/hand_landmarker.task
//
// Run after `npm install`:  npm run hand-model
// (Commit public/mediapipe/ so Netlify serves it. ~10MB total.)

import { mkdir, readdir, copyFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WASM_SRC = join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const WASM_DEST = join(ROOT, 'public', 'mediapipe', 'wasm');
const MODEL_DEST = join(ROOT, 'public', 'mediapipe', 'hand_landmarker.task');
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

async function copyWasm() {
  await mkdir(WASM_DEST, { recursive: true });
  let files;
  try {
    files = await readdir(WASM_SRC);
  } catch {
    console.error(`Missing ${WASM_SRC}. Run \`npm install\` first.`);
    process.exit(1);
  }
  for (const f of files) {
    await copyFile(join(WASM_SRC, f), join(WASM_DEST, f));
  }
  console.log(`✓ copied ${files.length} WASM files -> public/mediapipe/wasm/`);
}

async function fetchModel() {
  try {
    const s = await stat(MODEL_DEST);
    if (s.size > 1_000_000) {
      console.log('✓ hand_landmarker.task already present — skipping download');
      return;
    }
  } catch {
    /* not there yet */
  }
  console.log('… downloading hand_landmarker.task (~7MB)');
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`model download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(MODEL_DEST), { recursive: true });
  await writeFile(MODEL_DEST, buf);
  console.log(`✓ saved public/mediapipe/hand_landmarker.task (${(buf.length / 1e6).toFixed(1)}MB)`);
}

await copyWasm();
await fetchModel();
console.log('Done. Commit public/mediapipe/ so the game works on the deployed site.');
