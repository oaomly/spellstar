// Build-time enrichment: fills bundled word lists with Merriam-Webster data
// (recorded audio URL, pronunciation, definition, usage sentences, part of
// speech) so the deployed default content needs no runtime API key.
//
// The key is read from the environment (or a gitignored .env.local) and is
// NEVER written into the output JSON. Run manually when you add/change words:
//
//   DICTIONARY_API_KEY=xxxx node scripts/enrich-wordlists.mjs
//   (or put DICTIONARY_API_KEY=xxxx in .env.local and run: npm run enrich)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDictionaryKey, lookupWord } from './lib/dictionaryLookup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORDLIST_DIR = join(ROOT, 'data', 'wordlists');

async function* jsonFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(p);
    else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') yield p;
  }
}

async function main() {
  const key = await loadDictionaryKey(ROOT);
  if (!key) {
    console.error('Missing DICTIONARY_API_KEY (set env var or .env.local). Aborting.');
    process.exit(1);
  }
  for await (const file of jsonFiles(WORDLIST_DIR)) {
    const list = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(list.words) || list.words.length === 0) continue;
    let changed = 0;
    for (const w of list.words) {
      try {
        const info = await lookupWord(w.word, key);
        if (!info) {
          console.warn(`  · ${w.word}: no entry (keeping TTS fallback)`);
          continue;
        }
        if (info.pronMw) w.pronMw = info.pronMw;
        if (info.audioUrl) w.audioUrl = info.audioUrl;
        if (info.partOfSpeech) w.partOfSpeech = info.partOfSpeech;
        if (info.usage.length) w.usage = info.usage;
        if ((!w.def || !w.def.trim()) && info.definitions[0]) w.def = info.definitions[0];
        changed++;
      } catch (err) {
        console.warn(`  · ${w.word}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 120)); // be gentle on the API
    }
    await writeFile(file, JSON.stringify(list, null, 2) + '\n');
    console.log(`✓ ${file.replace(ROOT + '/', '')} — enriched ${changed}/${list.words.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
