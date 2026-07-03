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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORDLIST_DIR = join(ROOT, 'data', 'wordlists');
const REF = 'sd2'; // Merriam-Webster Elementary Dictionary
const AUDIO_BASE = 'https://media.merriam-webster.com/audio/prons/en/us/mp3';

async function loadKey() {
  if (process.env.DICTIONARY_API_KEY) return process.env.DICTIONARY_API_KEY.trim();
  try {
    const env = await readFile(join(ROOT, '.env.local'), 'utf8');
    const m = env.match(/^DICTIONARY_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    /* no .env.local */
  }
  return null;
}

function audioUrl(filename) {
  let sub;
  if (filename.startsWith('bix')) sub = 'bix';
  else if (filename.startsWith('gg')) sub = 'gg';
  else if (/^[^a-zA-Z]/.test(filename)) sub = 'number';
  else sub = filename[0];
  return `${AUDIO_BASE}/${sub}/${filename}.mp3`;
}

function stripMarkup(t) {
  return String(t)
    .replace(/\{[a-z_]+\|[^}]*\}/gi, '')
    .replace(/\{\/?[a-z_]+\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectUsage(node, out) {
  if (Array.isArray(node)) {
    if (node[0] === 'vis' && Array.isArray(node[1])) {
      for (const v of node[1]) if (v && v.t) out.push(stripMarkup(v.t));
    } else for (const it of node) collectUsage(it, out);
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) collectUsage(v, out);
  }
}

async function lookup(word, key) {
  const url = `https://www.dictionaryapi.com/api/v3/references/${REF}/json/${encodeURIComponent(word)}?key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${word}: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] === 'string') return null;
  const target = word.toLowerCase();
  const e =
    data.find((x) => (x?.meta?.id ?? '').split(':')[0].replace(/\*/g, '').toLowerCase() === target) ??
    data[0];
  const prs = e?.hwi?.prs?.[0];
  const usage = [];
  collectUsage(e?.def, usage);
  return {
    partOfSpeech: e?.fl ?? undefined,
    pronMw: prs?.mw || undefined,
    audioUrl: prs?.sound?.audio ? audioUrl(prs.sound.audio) : undefined,
    definitions: (e?.shortdef ?? []).map(stripMarkup).filter(Boolean),
    usage: usage.slice(0, 3),
  };
}

async function* jsonFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(p);
    else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') yield p;
  }
}

async function main() {
  const key = await loadKey();
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
        const info = await lookup(w.word, key);
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
