// Align a word's LETTERS to its SOUNDS (IPA phonemes). English spelling is not
// one-letter-one-sound: "cookie" is k·ʊ·k·iː across six letters, "make" has a
// silent e. Given the word and its IPA phonemes, this finds the grapheme
// segmentation that best matches the phonemes, via a monotonic DP.
//
// Each result pair is one grapheme (1-3 letters) mapped to one IPA phoneme;
// silent letters are merged onto the preceding grapheme with an empty phoneme.

import { VOWELS } from './rules';

export interface AlignPair {
  grapheme: string;
  ipa: string; // '' means silent (no sound)
}

export interface Alignment {
  pairs: AlignPair[];
  /** false when the DP had to fall back on weak/mismatched correspondences. */
  confident: boolean;
}

const IPA_VOWELS = new Set([
  'æ', 'ɛ', 'ɪ', 'ɑ', 'ʌ', 'ə', 'ʊ', 'ɔ', 'i', 'u', 'eɪ', 'aɪ', 'oʊ', 'aʊ', 'ɔɪ', 'ɚ', 'ɝ',
]);

// Plausible IPA phoneme(s) for common graphemes. Cost 0 when a pair matches here.
const GRAPHEME_IPA: Record<string, string[]> = {
  sh: ['ʃ'], ch: ['tʃ'], th: ['θ', 'ð'], ck: ['k'], ng: ['ŋ'], ph: ['f'], wh: ['w', 'h'], qu: ['k'],
  gh: ['f', 'ɡ'], kn: ['n'], wr: ['r'],
  ee: ['i'], ea: ['i', 'ɛ', 'eɪ'], oo: ['ʊ', 'u'], oa: ['oʊ'], ai: ['eɪ'], ay: ['eɪ'],
  igh: ['aɪ'], ow: ['aʊ', 'oʊ'], ou: ['aʊ', 'u', 'ʌ'], oi: ['ɔɪ'], oy: ['ɔɪ'], ie: ['i', 'aɪ'],
  ew: ['u', 'ju'], au: ['ɔ'], aw: ['ɔ'], ue: ['u', 'ju'], ey: ['i', 'eɪ'],
  ar: ['ɑ', 'ɑr'], or: ['ɔ', 'ɔr'], er: ['ɚ', 'ər'], ir: ['ɚ', 'ər'], ur: ['ɚ', 'ər'],
  a: ['æ', 'ə', 'ɑ', 'eɪ', 'ɔ'], e: ['ɛ', 'i', 'ə'], i: ['ɪ', 'aɪ', 'ə'],
  o: ['ɑ', 'oʊ', 'ɔ', 'ə', 'ʊ'], u: ['ʌ', 'ə', 'ʊ', 'u', 'ju'], y: ['j', 'aɪ', 'ɪ', 'i'],
  b: ['b'], c: ['k', 's'], d: ['d'], f: ['f'], g: ['ɡ', 'dʒ'], h: ['h'], j: ['dʒ'],
  k: ['k'], l: ['l'], m: ['m'], n: ['n'], p: ['p'], r: ['r'], s: ['s', 'z'], t: ['t'],
  v: ['v'], w: ['w'], x: ['k', 'z'], z: ['z'],
};

const SILENT_COST = 0.9;
const MAX_GRAPHEME = 3;

function isVowelLetters(g: string): boolean {
  return [...g].some((c) => VOWELS.has(c) || c === 'y');
}

function pairCost(grapheme: string, ipa: string): number {
  const known = GRAPHEME_IPA[grapheme];
  if (known && known.includes(ipa)) return 0;
  const gVowel = isVowelLetters(grapheme);
  const pVowel = IPA_VOWELS.has(ipa);
  if (gVowel === pVowel) return 0.5; // same category, unknown correspondence
  return 2; // category mismatch
}

/**
 * Align letters to phonemes. Returns one pair per grapheme; silent letters are
 * folded onto the previous grapheme (their ipa is '').
 */
export function alignLettersToSounds(word: string, phonemes: string[]): Alignment {
  const letters = word.trim().toLowerCase();
  const n = letters.length;
  const m = phonemes.length;

  if (n === 0 || m === 0) {
    return { pairs: letters ? [{ grapheme: letters, ipa: '' }] : [], confident: false };
  }

  // dp[i][j] = best cost aligning first i letters to first j phonemes.
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  // back[i][j] = [prevI, prevJ, graphemeLen, silent]
  const back: (null | [number, number, number, boolean])[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(null),
  );
  dp[0][0] = 0;

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] === Infinity) continue;
      // Consume a grapheme of length L mapping to phoneme j.
      if (j < m) {
        for (let L = 1; L <= MAX_GRAPHEME && i + L <= n; L++) {
          const g = letters.slice(i, i + L);
          // prefer known multi-letter graphemes: small bonus baked into pairCost table
          const cost = dp[i][j] + pairCost(g, phonemes[j]) + (L - 1) * 0.05;
          if (cost < dp[i + L][j + 1]) {
            dp[i + L][j + 1] = cost;
            back[i + L][j + 1] = [i, j, L, false];
          }
        }
      }
      // Consume one letter as silent (no phoneme).
      if (i < n) {
        const cost = dp[i][j] + SILENT_COST;
        if (cost < dp[i + 1][j]) {
          dp[i + 1][j] = cost;
          back[i + 1][j] = [i, j, 1, true];
        }
      }
    }
  }

  if (dp[n][m] === Infinity) {
    // No valid monotonic alignment; degrade gracefully to a 1:1 best effort.
    const pairs: AlignPair[] = [];
    const k = Math.max(n, m);
    for (let x = 0; x < k; x++) pairs.push({ grapheme: letters[x] ?? '', ipa: phonemes[x] ?? '' });
    return { pairs, confident: false };
  }

  // Backtrack. We walk end -> start, so a silent letter is seen before the
  // grapheme it should attach to; hold silent letters and fold them onto the
  // next real grapheme (which precedes them in the word).
  const rev: AlignPair[] = [];
  let ci = n;
  let cj = m;
  const totalCost = dp[n][m];
  let pendingSilent = '';
  while (ci > 0 || cj > 0) {
    const b = back[ci][cj];
    if (!b) break;
    const [pi, pj, L, silent] = b;
    const g = letters.slice(pi, pi + L);
    if (silent) {
      pendingSilent = g + pendingSilent;
    } else {
      rev.push({ grapheme: g + pendingSilent, ipa: phonemes[pj] });
      pendingSilent = '';
    }
    ci = pi;
    cj = pj;
  }
  if (pendingSilent) {
    if (rev.length) rev[rev.length - 1].grapheme = pendingSilent + rev[rev.length - 1].grapheme;
    else rev.push({ grapheme: pendingSilent, ipa: '' });
  }
  rev.reverse();
  const confident = totalCost / Math.max(1, m) < 0.6;
  return { pairs: rev, confident };
}
