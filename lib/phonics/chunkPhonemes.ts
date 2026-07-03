// Bridges the dictionary pronunciation to the lesson's display chunks: given a
// word's IPA (from Merriam-Webster), align letters -> sounds, then attribute the
// resulting phonemes to each grapheme chunk shown in the card.

import type { Word } from '../data/types';
import { mwToIpa, mwToIpaTokens } from '../dictionary/mwToIpa';
import { alignLettersToSounds } from './align';

/** Full IPA string for display under the word, e.g. "ˈstɑr". */
export function wordIpa(word: Word): string | undefined {
  if (word.ipa) return word.ipa;
  if (word.pronMw) return mwToIpa(word.pronMw);
  return undefined;
}

/**
 * IPA phoneme(s) for each chunk in `word.chunks`, or null when the word has no
 * pronunciation. Result length matches word.chunks; entries may be '' (e.g. a
 * silent letter) and multi-phoneme chunks (blends) join with a middot.
 */
export function chunkPhonemes(word: Word): (string | null)[] | null {
  const tokens = word.pronMw ? mwToIpaTokens(word.pronMw) : word.ipa ? mwToIpaTokens(word.ipa) : null;
  if (!tokens || tokens.length === 0 || word.chunks.length === 0) return null;

  const { pairs } = alignLettersToSounds(word.word, tokens);

  // Position each alignment pair by its starting letter offset.
  let off = 0;
  const segs = pairs.map((p) => {
    const start = off;
    off += p.grapheme.length;
    return { start, ipa: p.ipa };
  });

  const out: (string | null)[] = [];
  let cOff = 0;
  for (const ch of word.chunks) {
    const cs = cOff;
    const ce = cOff + ch.text.length;
    cOff = ce;
    const ips = segs.filter((s) => s.start >= cs && s.start < ce).map((s) => s.ipa).filter(Boolean);
    out.push(ips.length ? ips.join('·') : '');
  }
  return out;
}
