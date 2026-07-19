// 3-tier speech-to-text resolver for the voice-spelling game — mirrors
// lib/ocr/recognize.ts:
//   (1) visitor's own key  -> call Google Speech directly from the browser
//   (2) bundled default    -> POST to the Netlify proxy (owner's key)
//   (3) neither            -> throw 'no-stt' so the UI shows a "needs key" note
//
// The owner's key (same GOOGLE_VISION_KEY, which also has the Speech-to-Text API
// enabled) never reaches the client — it lives only in the Netlify function.

import { LETTER_HINTS } from './parseSpelledLetters';

const SPEECH_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
const PROXY_ENDPOINT = '/.netlify/functions/speech-to-text';

export type SttMode = 'own-key' | 'proxy';

function googleConfig(languageCode: string) {
  return {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: languageCode || 'en-US',
    maxAlternatives: 1,
    // Bias recognition toward letters + letter-names (child spelling out loud).
    speechContexts: [{ phrases: LETTER_HINTS, boost: 15 }],
  };
}

function extractTranscript(json: unknown): string {
  try {
    const r = (json as { results?: { alternatives?: { transcript?: string }[] }[] }).results;
    return (r?.[0]?.alternatives?.[0]?.transcript ?? '').trim();
  } catch {
    return '';
  }
}

/** base64 = 16 kHz mono LINEAR16 PCM (from lib/stt/recorder). */
export async function recognizeSpeech(
  base64: string,
  opts: { languageCode: string; ownKey?: string; allowProxy: boolean },
): Promise<{ transcript: string; mode: SttMode }> {
  // Tier 1: visitor's own key, called directly.
  if (opts.ownKey && opts.ownKey.trim()) {
    const res = await fetch(`${SPEECH_ENDPOINT}?key=${encodeURIComponent(opts.ownKey.trim())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: googleConfig(opts.languageCode), audio: { content: base64 } }),
    });
    if (!res.ok) throw new Error(`speech ${res.status}`);
    return { transcript: extractTranscript(await res.json()), mode: 'own-key' };
  }

  // Tier 2: owner's proxy (only for bundled default content).
  if (opts.allowProxy) {
    const res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, languageCode: opts.languageCode }),
    });
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    return { transcript: extractTranscript(await res.json()), mode: 'proxy' };
  }

  // Tier 3: no speech recognition available.
  throw new Error('no-stt');
}
