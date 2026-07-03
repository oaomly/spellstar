'use client';

// Client-side dictionary lookup for words a parent adds. Uses the visitor's own
// Merriam-Webster key (direct to MW) when provided, else the Netlify proxy that
// holds the owner's key. Returns a parsed entry or null (word not found).

import { parseDictionaryResponse, type DictionaryEntry } from './parseEntry';

const PROXY = '/.netlify/functions/dictionary';
const MW = 'https://www.dictionaryapi.com/api/v3/references/sd2/json';

export async function lookupWord(word: string, ownKey?: string): Promise<DictionaryEntry | null> {
  const w = word.trim().toLowerCase();
  if (!w) return null;

  let raw: unknown;
  if (ownKey && ownKey.trim()) {
    const r = await fetch(`${MW}/${encodeURIComponent(w)}?key=${encodeURIComponent(ownKey.trim())}`);
    if (!r.ok) throw new Error(`lookup ${r.status}`);
    raw = await r.json();
  } else {
    const r = await fetch(`${PROXY}?word=${encodeURIComponent(w)}`);
    if (!r.ok) throw new Error(`lookup ${r.status}`);
    raw = await r.json();
  }
  return parseDictionaryResponse(raw, w);
}
