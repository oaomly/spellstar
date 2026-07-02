// Auto-suggests whether a word should be flagged as "tricky" (a sight word),
// so a parent entering a weekly list never has to decide manually — they just
// confirm the app's suggestion.

import { splitChunks } from './splitChunks';
import { isSightWord } from './sightWords';

export interface TrickySuggestion {
  tricky: boolean;
  reason: string;
}

export function suggestTricky(rawWord: string): TrickySuggestion {
  const word = rawWord.trim().toLowerCase();
  if (!word) return { tricky: false, reason: '' };

  if (isSightWord(word)) {
    return { tricky: true, reason: 'This is a common sight word — hard to sound out, best memorized.' };
  }

  const { lowConfidence } = splitChunks(word);
  if (lowConfidence) {
    return { tricky: true, reason: "This word doesn't sound out cleanly — mark it tricky?" };
  }

  return { tricky: false, reason: 'This word sounds out — great for phonics practice.' };
}
