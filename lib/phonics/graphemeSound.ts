// Two ways to voice a grapheme in the lesson:
//   1. SOUND (phonics)   — the phoneme, e.g. "a" -> /æ/  ("aah"),  "b" -> /b/ ("buh")
//   2. LETTER NAME (spell)— the name of the letter, e.g. "a" -> "ay", "b" -> "bee"
//
// Browser TTS can't emit perfect isolated phonemes, so SOUND mode uses tuned
// approximations that clearly read as sounds (not letter names). For authentic,
// recorded phoneme audio (Jolly-Phonics style), drop mp3s into
// /public/audio/phonemes/<grapheme>.mp3 and add the grapheme key to
// PHONEME_AUDIO below — playback prefers the clip and needs no code change.

export const PHONEME_AUDIO_BASE = '/audio/phonemes';

// Graphemes that have a bundled recorded clip. Empty by default (TTS fallback).
// Add e.g. 'a', 'sh', 'ee' here once you place the matching mp3 files.
export const PHONEME_AUDIO = new Set<string>();

interface SoundHint {
  say: string;
  rate?: number;
}

// Phoneme approximations for TTS. Rate is intentionally slow to stretch the sound.
export const GRAPHEME_SOUND: Record<string, SoundHint> = {
  // single consonants
  b: { say: 'buh', rate: 0.7 },
  c: { say: 'kuh', rate: 0.7 },
  d: { say: 'duh', rate: 0.7 },
  f: { say: 'fff', rate: 0.5 },
  g: { say: 'guh', rate: 0.7 },
  h: { say: 'huh', rate: 0.7 },
  j: { say: 'juh', rate: 0.7 },
  k: { say: 'kuh', rate: 0.7 },
  l: { say: 'lll', rate: 0.5 },
  m: { say: 'mmm', rate: 0.5 },
  n: { say: 'nnn', rate: 0.5 },
  p: { say: 'puh', rate: 0.7 },
  q: { say: 'kwuh', rate: 0.7 },
  r: { say: 'rrr', rate: 0.5 },
  s: { say: 'sss', rate: 0.5 },
  t: { say: 'tuh', rate: 0.7 },
  v: { say: 'vvv', rate: 0.5 },
  w: { say: 'wuh', rate: 0.7 },
  x: { say: 'ks', rate: 0.6 },
  y: { say: 'yuh', rate: 0.7 },
  z: { say: 'zzz', rate: 0.5 },
  // short vowels
  a: { say: 'aah', rate: 0.5 },
  e: { say: 'eh', rate: 0.5 },
  i: { say: 'ih', rate: 0.5 },
  o: { say: 'oh', rate: 0.5 },
  u: { say: 'uh', rate: 0.5 },
  // consonant digraphs
  sh: { say: 'shh', rate: 0.5 },
  ch: { say: 'chuh', rate: 0.7 },
  th: { say: 'thh', rate: 0.5 },
  wh: { say: 'wuh', rate: 0.7 },
  ph: { say: 'fff', rate: 0.5 },
  ck: { say: 'kuh', rate: 0.7 },
  ng: { say: 'nng', rate: 0.5 },
  qu: { say: 'kwuh', rate: 0.7 },
  // doubled consonants (one sound)
  ss: { say: 'sss', rate: 0.5 },
  ll: { say: 'lll', rate: 0.5 },
  ff: { say: 'fff', rate: 0.5 },
  zz: { say: 'zzz', rate: 0.5 },
  // vowel teams
  ee: { say: 'eee', rate: 0.5 },
  ea: { say: 'eee', rate: 0.5 },
  oo: { say: 'ooo', rate: 0.5 },
  oa: { say: 'oh', rate: 0.5 },
  ai: { say: 'ay', rate: 0.6 },
  ay: { say: 'ay', rate: 0.6 },
  igh: { say: 'eye', rate: 0.6 },
  ow: { say: 'ow', rate: 0.6 },
  ou: { say: 'ow', rate: 0.6 },
  oi: { say: 'oy', rate: 0.6 },
  oy: { say: 'oy', rate: 0.6 },
  // r-controlled
  ar: { say: 'arr', rate: 0.5 },
  or: { say: 'or', rate: 0.5 },
  er: { say: 'er', rate: 0.5 },
  ir: { say: 'er', rate: 0.5 },
  ur: { say: 'er', rate: 0.5 },
};

// Letter names for spell-out mode (forces consistent names across voices).
export const LETTER_NAME: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'ell', m: 'em', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you',
  v: 'vee', w: 'double-you', x: 'ex', y: 'why', z: 'zee',
};

export function letterName(ch: string): string {
  return LETTER_NAME[ch.toLowerCase()] ?? ch;
}
