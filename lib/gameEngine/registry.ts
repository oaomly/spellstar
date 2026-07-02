import type { GameId } from '../data/types';

export interface GameMeta {
  id: GameId;
  title: string;
  icon: string;
  desc: string;
  /** Whether this game leans on phonics chunk data. */
  phonics?: boolean;
  /** Minimum words needed to play. */
  minWords: number;
}

export const GAMES: GameMeta[] = [
  { id: 'picture-match', title: 'Picture Match', icon: '🖼️', desc: 'See a picture, choose the right spelling', minWords: 2 },
  { id: 'unscramble', title: 'Unscramble', icon: '🔀', desc: 'Rearrange the letters to spell the word', minWords: 1 },
  { id: 'word-match', title: 'Word Match', icon: '🔗', desc: 'Match words to their meanings', minWords: 2 },
  { id: 'fill-blank', title: 'Fill the Blank', icon: '✏️', desc: 'Complete the sentence with the right word', minWords: 2 },
  { id: 'listen-write', title: 'Listen & Write', icon: '🎧', desc: 'Hear the word, then write it', minWords: 1 },
  { id: 'hangman', title: 'Hangman', icon: '🪤', desc: 'Guess the word letter by letter', minWords: 1 },
  { id: 'sound-hunt', title: 'Sound Hunt', icon: '👂', desc: 'Hear a sound, find the matching chunk', phonics: true, minWords: 1 },
  { id: 'word-builder', title: 'Word Builder', icon: '🧱', desc: 'Build the word from its sound blocks', phonics: true, minWords: 1 },
  { id: 'speed-spell', title: 'Speed Spell', icon: '⚡', desc: 'Type the word before time runs out', minWords: 1 },
  { id: 'memory-match', title: 'Memory Match', icon: '🃏', desc: 'Flip cards to match word and picture', minWords: 2 },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export const GAME_IDS = GAMES.map((g) => g.id);
