// Runtime dictionary proxy for words a parent adds themselves. Keeps the owner's
// Merriam-Webster key server-side (env var DICTIONARY_API_KEY); returns the raw
// MW JSON, which the client parses with lib/dictionary/parseEntry.
//
// A parent can instead supply their own key in Settings (used directly from the
// browser); this proxy is the fallback for the bundled/default experience.

import type { Handler } from '@netlify/functions';

const REF = 'sd2';
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
let hits: number[] = [];

function rateLimited(): boolean {
  const now = Date.now();
  hits = hits.filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  return false;
}

const json = (statusCode: number, obj: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

export const handler: Handler = async (event) => {
  const word = (event.queryStringParameters?.word ?? '').trim().toLowerCase();
  if (!word || !/^[a-z][a-z '-]{0,40}$/.test(word)) {
    return json(400, { error: 'Invalid or missing word' });
  }

  const key = process.env.DICTIONARY_API_KEY;
  if (!key) return json(503, { error: 'Dictionary not configured' });
  if (rateLimited()) return json(429, { error: 'Too many requests' });

  try {
    const url = `https://www.dictionaryapi.com/api/v3/references/${REF}/json/${encodeURIComponent(
      word,
    )}?key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    return json(res.ok ? 200 : 502, data);
  } catch {
    return json(502, { error: 'Dictionary request failed' });
  }
};
