// Serverless proxy for Google Speech-to-Text (voice spelling in Speed Spell).
// Reuses the owner's GOOGLE_VISION_KEY env var — the same key, with the
// Speech-to-Text API also enabled. The key lives ONLY here, never in the browser.
//
// Mirrors vision-ocr.ts: rejects non-POST, oversized bodies, and rate-limits per
// warm instance to bound abuse/billing.

import type { Handler } from '@netlify/functions';

const SPEECH_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
const MAX_BODY_BYTES = 4_000_000; // ~4MB: a few seconds of base64 LINEAR16 audio
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;

// Single letters + spoken letter-names, to bias STT toward a spelled-out word.
const LETTER_HINTS = [
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  'ay', 'bee', 'see', 'dee', 'ee', 'ef', 'gee', 'aitch', 'eye', 'jay', 'kay',
  'el', 'em', 'en', 'oh', 'pee', 'cue', 'ar', 'ess', 'tee', 'you', 'vee',
  'double-u', 'ex', 'why', 'zee',
];

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
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const key = process.env.GOOGLE_VISION_KEY;
  if (!key) {
    return json(503, { error: 'Speech not configured' });
  }

  if (!event.body || event.body.length > MAX_BODY_BYTES) {
    return json(413, { error: 'Payload too large or empty' });
  }

  if (rateLimited()) {
    return json(429, { error: 'Too many requests, try again shortly' });
  }

  let audio: string | undefined;
  let languageCode = 'en-US';
  try {
    const parsed = JSON.parse(event.body);
    audio = parsed.audio;
    if (typeof parsed.languageCode === 'string' && parsed.languageCode) {
      languageCode = parsed.languageCode;
    }
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  if (!audio || typeof audio !== 'string') {
    return json(400, { error: 'Missing audio' });
  }

  try {
    const res = await fetch(`${SPEECH_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode,
          maxAlternatives: 1,
          speechContexts: [{ phrases: LETTER_HINTS, boost: 15 }],
        },
        audio: { content: audio },
      }),
    });
    const data = await res.json();
    return json(res.ok ? 200 : 502, data);
  } catch {
    return json(502, { error: 'Speech request failed' });
  }
};
