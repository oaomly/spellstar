// Rule-based, grapheme-level phonics splitter for grade-1-level words.
// Not IPA — it produces teachable sound chunks (e.g. "shop" -> sh/o/p,
// "star" -> st/ar, "make" -> m/a/ke). Deliberately simple and correctable:
// the WordForm always shows the result for the parent to fix.

import type { PhonicsChunk, ChunkType } from '../data/types';
import {
  VOWELS,
  TRIPLE_BLENDS,
  TRIPLE_DIGRAPHS,
  DIGRAPHS,
  BLENDS,
  VOWEL_TEAMS,
  R_CONTROLLED,
  END_DOUBLES,
  EXCEPTION_WORDS,
} from './rules';

export interface SplitResult {
  chunks: PhonicsChunk[];
  /** True when the splitter had low confidence (exception word or messy fallback). */
  lowConfidence: boolean;
}

function chunk(text: string, type: ChunkType): PhonicsChunk {
  return { text, type };
}

function isVowelChar(c: string): boolean {
  return VOWELS.has(c) || c === 'y';
}

/** Greedy longest-match scan of a lowercase letter run (no magic-e handling). */
function scanGeneral(s: string): PhonicsChunk[] {
  const out: PhonicsChunk[] = [];
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);

    // Word-final doubled consonants (only when they end the run).
    if (rest.length === 2) {
      const two = rest;
      if (END_DOUBLES.includes(two)) {
        out.push(chunk(two, 'consonant'));
        break;
      }
    }

    // 3-letter matches.
    const three = s.substr(i, 3);
    if (three.length === 3) {
      if (TRIPLE_BLENDS.includes(three)) { out.push(chunk(three, 'blend')); i += 3; continue; }
      if (TRIPLE_DIGRAPHS.includes(three)) { out.push(chunk(three, 'digraph')); i += 3; continue; }
      if (R_CONTROLLED.includes(three)) { out.push(chunk(three, 'rControlled')); i += 3; continue; }
      if (VOWEL_TEAMS.includes(three)) { out.push(chunk(three, 'vowelTeam')); i += 3; continue; }
    }

    // 2-letter matches.
    const two = s.substr(i, 2);
    if (two.length === 2) {
      if (R_CONTROLLED.includes(two)) { out.push(chunk(two, 'rControlled')); i += 2; continue; }
      if (VOWEL_TEAMS.includes(two)) { out.push(chunk(two, 'vowelTeam')); i += 2; continue; }
      if (DIGRAPHS.includes(two)) { out.push(chunk(two, 'digraph')); i += 2; continue; }
      if (BLENDS.includes(two)) { out.push(chunk(two, 'blend')); i += 2; continue; }
    }

    // Single letter.
    const c = s[i];
    out.push(chunk(c, isVowelChar(c) ? 'vowel' : 'consonant'));
    i += 1;
  }
  return out;
}

/** Coarse syllable split fallback for messy/multi-syllable words (e.g. "cookie"). */
function syllableFallback(s: string): PhonicsChunk[] {
  // Split before each vowel-group after the first, keeping leading consonants
  // of the next syllable with that syllable.
  const parts: string[] = [];
  let current = '';
  let seenVowelInCurrent = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const vowel = isVowelChar(c);
    if (vowel && seenVowelInCurrent && current && !isVowelChar(current[current.length - 1])) {
      // Start a new syllable: move the trailing consonant(s) of current to the new one.
      const m = current.match(/[^aeiouy]+$/i);
      if (m && m[0].length >= 1 && current.length > m[0].length) {
        const carry = m[0];
        current = current.slice(0, current.length - carry.length);
        parts.push(current);
        current = carry;
      } else {
        parts.push(current);
        current = '';
      }
      seenVowelInCurrent = false;
    }
    current += c;
    if (vowel) seenVowelInCurrent = true;
  }
  if (current) parts.push(current);
  return parts.filter(Boolean).map((p) => chunk(p, 'other'));
}

/**
 * Split a word into teachable phonics chunks.
 */
export function splitChunks(rawWord: string): SplitResult {
  const word = rawWord.trim().toLowerCase();

  if (!word) return { chunks: [], lowConfidence: false };

  // Very short words: one chunk.
  if (word.length <= 2) {
    const type: ChunkType = [...word].every(isVowelChar) ? 'vowel' : 'consonant';
    return { chunks: [chunk(word, word.length === 1 ? type : 'other')], lowConfidence: false };
  }

  // Known irregular word -> low confidence, suggest tricky.
  if (EXCEPTION_WORDS.has(word)) {
    return { chunks: scanGeneral(word), lowConfidence: true };
  }

  // Magic-e pass: trailing consonant + e where a vowel precedes the consonant.
  const magicE = word.match(/^(.*?[aeiou])([bcdfghjklmnpqrstvwxz])e$/i);
  if (magicE) {
    const prefix = magicE[1];
    const silentChunk = chunk(magicE[2] + 'e', 'silentE');
    return { chunks: [...scanGeneral(prefix), silentChunk], lowConfidence: false };
  }

  // General greedy scan.
  const scanned = scanGeneral(word);

  // Count vowel groups to detect likely multi-syllable words.
  const vowelGroups = (word.match(/[aeiouy]+/gi) || []).length;
  if (scanned.length > 5 || vowelGroups >= 3) {
    const fallback = syllableFallback(word);
    if (fallback.length >= 2) {
      return { chunks: fallback, lowConfidence: true };
    }
  }

  return { chunks: scanned, lowConfidence: false };
}
