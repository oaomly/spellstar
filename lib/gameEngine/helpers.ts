import type { Word } from '../data/types';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a shuffled question set from the list — all words by default, or up to `max`. */
export function buildQuestionSet(words: Word[], max = words.length): Word[] {
  return shuffle(words).slice(0, Math.min(max, words.length));
}

/** Pick `count` distractor words different from `correct`. */
export function pickDistractors(words: Word[], correct: Word, count: number): Word[] {
  return shuffle(words.filter((w) => w.id !== correct.id)).slice(0, count);
}

/** Words that have usable phonics chunks (not tricky, at least 2 chunks). */
export function phonicsWords(words: Word[]): Word[] {
  return words.filter((w) => !w.tricky && w.chunks.length >= 2);
}

/** All distinct chunk texts across the list, for building sound distractors. */
export function allChunkTexts(words: Word[]): string[] {
  const set = new Set<string>();
  phonicsWords(words).forEach((w) => w.chunks.forEach((c) => set.add(c.text)));
  return [...set];
}
