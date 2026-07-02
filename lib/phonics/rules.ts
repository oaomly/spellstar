// Data-driven rule tables for the phonics splitter.
// Ordered longest-match-first within each group. Extend these tables to teach
// the splitter new patterns without touching the algorithm in splitChunks.ts.

import type { ChunkType } from '../data/types';

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** 3-letter initial consonant blends (onset). */
export const TRIPLE_BLENDS = ['scr', 'spl', 'spr', 'str', 'thr', 'shr', 'squ'];

/** 3-letter digraph/cluster. */
export const TRIPLE_DIGRAPHS = ['tch', 'dge'];

/** Consonant digraphs (one sound, two/three letters). */
export const DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'qu'];

/** Common consonant blends (initial and final) — two letters, two sounds
 *  but taught as a single onset/coda unit. */
export const BLENDS = [
  // initial
  'bl', 'cl', 'fl', 'gl', 'pl', 'sl',
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
  'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'tw',
  // final
  'nd', 'nt', 'nk', 'mp', 'ft', 'lt', 'lk', 'ld', 'ct', 'pt', 'nch', 'lf', 'lp', 'sk',
];

/** Vowel teams. */
export const VOWEL_TEAMS = [
  'igh', 'ee', 'ea', 'oa', 'oo', 'ow', 'ou', 'oi', 'oy', 'ai', 'ay', 'ey', 'aw', 'au', 'ew', 'ie', 'ue',
];

/** R-controlled vowels. */
export const R_CONTROLLED = ['air', 'ear', 'ar', 'or', 'er', 'ir', 'ur', 'oar'];

/** Word-final doubled consonants that collapse to one sound. */
export const END_DOUBLES = ['ll', 'ss', 'ff', 'zz'];

/**
 * Irregular words that don't decode cleanly with the general rules.
 * These should be suggested as tricky (sight) words rather than segmented.
 */
export const EXCEPTION_WORDS = new Set([
  'have', 'give', 'live', 'love', 'come', 'some', 'done', 'gone', 'none',
  'said', 'was', 'were', 'are', 'you', 'your', 'they', 'their', 'there',
  'the', 'of', 'to', 'do', 'who', 'what', 'where', 'when', 'why',
  'one', 'two', 'once', 'could', 'would', 'should', 'friend', 'people',
  'because', 'many', 'any', 'again', 'water', 'other', 'mother', 'father',
  'here', 'been', 'buy', 'eye', 'they', 'know', 'knew',
]);

/** Maps a matched rule group to the chunk type used for coloring/tooltips. */
export function typeForMatch(group: 'digraph' | 'blend' | 'vowelTeam' | 'rControlled'): ChunkType {
  return group;
}
