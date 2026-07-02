// Standard early-grade sight words (Dolch pre-primer/primer/first + common Fry).
// These are the "tricky" words that don't decode cleanly and must be memorized.
// Lowercased Set for O(1) lookup. Extend freely.

export const SIGHT_WORDS = new Set<string>([
  // Dolch pre-primer
  'a', 'and', 'away', 'big', 'blue', 'can', 'come', 'down', 'find', 'for',
  'funny', 'go', 'help', 'here', 'i', 'in', 'is', 'it', 'jump', 'little',
  'look', 'make', 'me', 'my', 'not', 'one', 'play', 'red', 'run', 'said',
  'see', 'the', 'three', 'to', 'two', 'up', 'we', 'where', 'yellow', 'you',
  // Dolch primer
  'all', 'am', 'are', 'at', 'ate', 'be', 'black', 'brown', 'but', 'came',
  'did', 'do', 'eat', 'four', 'get', 'good', 'have', 'he', 'into', 'like',
  'must', 'new', 'no', 'now', 'on', 'our', 'out', 'please', 'pretty', 'ran',
  'ride', 'saw', 'say', 'she', 'so', 'soon', 'that', 'there', 'they', 'this',
  'too', 'under', 'want', 'was', 'well', 'went', 'what', 'white', 'who', 'will',
  'with', 'yes',
  // Dolch first grade
  'after', 'again', 'an', 'any', 'as', 'ask', 'by', 'could', 'every', 'fly',
  'from', 'give', 'going', 'had', 'has', 'her', 'him', 'his', 'how', 'just',
  'know', 'let', 'live', 'may', 'of', 'old', 'once', 'open', 'over', 'put',
  'round', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were',
  'when',
  // Common Fry irregulars often taught in grade 1
  'because', 'been', 'friend', 'people', 'their', 'would', 'should', 'many',
  'water', 'other', 'mother', 'father', 'buy', 'eye', 'money', 'love',
]);

export function isSightWord(word: string): boolean {
  return SIGHT_WORDS.has(word.trim().toLowerCase());
}
