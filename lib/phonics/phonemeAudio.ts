// Access to the bundled Wikimedia phoneme clips (see scripts/fetch-phoneme-audio.mjs
// and public/audio/phonemes/CREDITS.md). Keyed by IPA phoneme, which is exactly
// what the letter->sound aligner produces for each chunk.

import data from '@/data/phoneme-audio.json';

const FILES: Record<string, string> = data.files;
export const PHONEME_AVAILABLE = new Set<string>(data.available);
const DIR = '/audio/phonemes';

export function phonemeClipUrl(ipa: string): string | null {
  const f = FILES[ipa];
  return f ? `${DIR}/${f}.mp3` : null;
}

/** True when every phoneme in the list has a bundled recording. */
export function hasClips(ipaList: string[]): boolean {
  return ipaList.length > 0 && ipaList.every((p) => PHONEME_AVAILABLE.has(p));
}
