// Shared Merriam-Webster (sd2 — Elementary Dictionary) lookup helper, used by
// both scripts/enrich-wordlists.mjs (re-enrich existing lists) and
// scripts/new-week.mjs (build a brand new week interactively).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const REF = 'sd2';
const AUDIO_BASE = 'https://media.merriam-webster.com/audio/prons/en/us/mp3';

export async function loadDictionaryKey(root) {
  if (process.env.DICTIONARY_API_KEY) return process.env.DICTIONARY_API_KEY.trim();
  try {
    const env = await readFile(join(root, '.env.local'), 'utf8');
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

/** Looks up one word. Returns null if there's no exact-headword entry. */
export async function lookupWord(word, key) {
  const url = `https://www.dictionaryapi.com/api/v3/references/${REF}/json/${encodeURIComponent(word)}?key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${word}: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] === 'string') return null;
  const target = word.toLowerCase();
  // Require an exact headword match — otherwise MW hands back a lemma (e.g.
  // "shapes" -> "shape"), whose audio/pronunciation would be for the wrong form.
  const e = data.find(
    (x) => (x?.meta?.id ?? '').split(':')[0].replace(/\*/g, '').toLowerCase() === target,
  );
  if (!e) return null;
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
